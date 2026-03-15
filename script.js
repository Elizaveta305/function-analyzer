// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 2.0)
// Исправлена ошибка с exp(x) и улучшена логика
// ============================================

let currentFunction = null;
let currentExpression = '';

// --- ЯДРО: Безопасный парсер ---
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                let processedExpr = expr
                    .replace(/\s+/g, '') // Убираем пробелы
                    .replace(/\^/g, '**'); // ^ в степень
                
                // 1. ЗАМЕНА ФУНКЦИЙ (до замены x!)
                processedExpr = processedExpr
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log10\(/g, 'Math.log10(')
                    .replace(/log\(/g, 'Math.log(') // ln
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/exp\(/g, 'Math.exp(') // exp
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/abs\(/g, 'Math.abs(')
                    .replace(/pi/gi, 'Math.PI')
                    .replace(/e/gi, 'Math.E');

                // 2. ЗАМЕНА ПЕРЕМЕННОЙ X (Только если x стоит отдельно!)
                // \b означает границу слова. Так мы не сломаем "Math.exp"
                // Заменяем 'x' на значение, но только если это переменная
                processedExpr = processedExpr.replace(/\bx\b/g, `(${xVal})`);
                
                // Выполняем вычисление
                const result = new Function('return ' + processedExpr)();
                
                if (!isFinite(result) || isNaN(result)) return null;
                return result;
            } catch(e) {
                return null;
            }
        },
        toString: function() {
            return displayExpr;
        }
    };
}

// --- ОСНОВНАЯ ЛОГИКА ---
function analyzeFunction() {
    const input = document.getElementById('functionInput');
    let expr = input.value.trim();
    
    if (!expr) {
        showError('Введите формулу функции');
        return;
    }
    
    showLoading();
    
    try {
        const func = parseFunction(expr);
        
        // Тестовый запуск для проверки валидности
        let isValid = false;
        const testPoints = expr.includes('log') ? [1, 2, Math.E] : [-1, 0, 1, 2];
        
        for (let x of testPoints) {
            if (func.evaluate(x) !== null) {
                isValid = true;
                break;
            }
        }
        
        if (!isValid && !expr.includes('sqrt') && !expr.includes('log')) {
             // Если функция сложная, пробуем еще точки
             if (func.evaluate(0.5) !== null) isValid = true;
        }

        if (!isValid) {
            throw new Error('Функция не определена в стандартной области или содержит ошибку синтаксиса.');
        }
        
        currentFunction = func;
        document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
        document.getElementById('graphStatus').textContent = 'Анализ...';
        
        // Запуск анализа свойств
        const properties = analyzeFunctionProperties(expr, func);
        updatePropertiesDisplay(properties);
        
        // Построение графика
        plotFunction(func, expr);
        document.getElementById('graphStatus').textContent = 'Готово';
        
    } catch (error) {
        console.error(error);
        showError(`Ошибка: ${error.message}. Проверьте синтаксис (например, используйте * для умножения).`);
        document.getElementById('graphStatus').textContent = 'Ошибка';
    }
}

// --- АНАЛИЗ СВОЙСТВ ---
function analyzeFunctionProperties(expr, func) {
    const props = [];
    
    // 1. Тип
    props.push({
        title: 'Тип функции',
        value: determineFunctionType(expr),
        icon: '📊',
        desc: 'Классификация'
    });
    
    // 2. Область определения (упрощенно)
    props.push({
        title: 'Область определения (D(f))',
        value: getDomain(expr),
        icon: '🌐',
        desc: 'Допустимые значения X'
    });
    
    // 3. Нули функции (корни)
    const zeros = findZeros(func, expr);
    props.push({
        title: 'Нули функции (f(x)=0)',
        value: zeros.length > 0 ? zeros.join(', ') : 'Нет корней в диапазоне [-10; 10]',
        icon: '⚫',
        desc: 'Пересечение с осью X'
    });
    
    // 4. Пересечение с OY
    const y0 = func.evaluate(0);
    if (y0 !== null) {
        props.push({
            title: 'Пересечение с осью Y',
            value: `(0; ${y0.toFixed(2)})`,
            icon: '🔵',
            desc: 'Значение при x=0'
        });
    }
    
    // 5. Экстремумы (численный поиск)
    const extrema = findExtrema(func, expr);
    if (extrema.length > 0) {
        const extStr = extrema.map(e => `${e.type === 'max' ? 'Макс' : 'Мин'} в x=${e.x.toFixed(2)}`).join('; ');
        props.push({
            title: 'Экстремумы',
            value: extStr,
            icon: '🏔️',
            desc: 'Локальные максимумы и минимумы'
        });
    }
    
    // 6. Четность
    props.push({
        title: 'Чётность',
        value: checkParity(func).result,
        icon: '🔄',
        desc: checkParity(func).desc
    });

    return props;
}

// Поиск экстремумов (через производную численно)
function findExtrema(func, expr) {
    const extrema = [];
    const step = 0.1;
    const range = 10;
    
    // Не ищем экстремумы у простых линейных или разрывных в 0 функциях без нужды
    if (expr === 'x' || expr === '1/x') return [];

    for (let x = -range; x < range; x += step) {
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        const y3 = func.evaluate(x + 2 * step);
        
        if (y1 === null || y2 === null || y3 === null) continue;
        
        // Проверка на смену направления (производная меняет знак)
        const d1 = y2 - y1;
        const d2 = y3 - y2;
        
        if (d1 > 0 && d2 < 0) {
            extrema.push({ x: x + step, type: 'max' });
        } else if (d1 < 0 && d2 > 0) {
            extrema.push({ x: x + step, type: 'min' });
        }
    }
    return extrema;
}

// Вспомогательные функции (типы, домен, корни, четность)
function determineFunctionType(expr) {
    expr = expr.toLowerCase();
    if (expr.includes('sin') || expr.includes('cos')) return 'Тригонометрическая';
    if (expr.includes('exp')) return 'Показательная';
    if (expr.includes('log')) return 'Логарифмическая';
    if (expr.includes('/x')) return 'Дробно-рациональная';
    if (expr.includes('**2') || expr.includes('^2')) return 'Квадратичная';
    if (expr.includes('**3') || expr.includes('^3')) return 'Кубическая';
    return 'Алгебраическая / Смешанная';
}

function getDomain(expr) {
    expr = expr.toLowerCase();
    if (expr.includes('log')) return '(0; +∞)';
    if (expr.includes('sqrt')) return '[0; +∞)';
    if (expr.includes('/x')) return '(-∞; 0) U (0; +∞)';
    return '(-∞; +∞)';
}

function findZeros(func, expr) {
    const zeros = [];
    const step = 0.1;
    // Особые случаи
    if (expr === 'x**2' || expr === 'x^2') return ['0'];
    if (expr.includes('exp')) return []; // Экспонента не равна 0
    if (expr === '1/x') return [];
    
    for (let x = -10; x <= 10; x += step) {
        if (expr.includes('/x') && Math.abs(x) < 0.1) continue;
        
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        
        if (y1 === null || y2 === null) continue;
        
        if (Math.abs(y1) < 0.05) zeros.push(x.toFixed(2));
        else if (y1 * y2 < 0) zeros.push((x + step/2).toFixed(2));
    }
    return [...new Set(zeros)].slice(0, 5);
}

function checkParity(func) {
    const a = func.evaluate(1);
    const b = func.evaluate(-1);
    if (a === null || b === null) return { result: 'Не определено', desc: '' };
    
    if (Math.abs(a - b) < 0.001) return { result: 'Чётная', desc: 'Симметрия относительно OY' };
    if (Math.abs(a + b) < 0.001) return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    return { result: 'Общего вида', desc: 'Нет симметрии' };
}

// --- ОТРИСОВКА ГРАФИКА ---
function plotFunction(func, expr) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 300; // Высокая детализация
    
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    // Коррекция диапазона для логарифмов
    if (expr.toLowerCase().includes('log')) startX = 0.01;

    for (let x = startX; x <= endX; x += step) {
        // Разрывы для 1/x
        if (expr.includes('/x') && Math.abs(x) < 0.05) {
            xVals.push(x); yVals.push(null);
            continue;
        }
        
        const y = func.evaluate(x);
        if (y !== null && Math.abs(y) < 1000) { // Обрезаем слишком большие значения
            xVals.push(x);
            yVals.push(y);
        } else {
            xVals.push(x);
            yVals.push(null); // Разрыв линии
        }
    }
    
    const trace = {
        x: xVals, y: yVals,
        mode: 'lines',
        line: { color: '#2c3e50', width: 3 },
        name: 'f(x)'
    };
    
    const layout = {
        margin: { t: 30, r: 20, b: 40, l: 40 },
        xaxis: { 
            title: 'X', 
            zeroline: true, 
            gridcolor: '#eee',
            range: [startX, endX]
        },
        yaxis: { 
            title: 'Y', 
            zeroline: true, 
            gridcolor: '#eee' 
        },
        paper_bgcolor: '#fff',
        plot_bgcolor: '#fff'
    };
    
    Plotly.react('plot', [trace], layout, {displayModeBar: false});
}

// --- ИНТЕРФЕЙС ---
function updatePropertiesDisplay(props) {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = props.map(p => `
        <div class="property-item">
            <div class="property-icon">${p.icon}</div>
            <div class="property-content">
                <div class="property-title">${p.title}</div>
                <div class="property-value">${p.value}</div>
                <div class="property-desc">${p.desc}</div>
            </div>
        </div>
    `).join('');
}

function showLoading() {
    document.getElementById('propertiesOutput').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Вычисление...</p></div>';
}

function showError(msg) {
    document.getElementById('propertiesOutput').innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-msg">${msg}</div>
        </div>`;
}

// --- СОБЫТИЯ ---
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка анализа
    document.getElementById('calculateBtn').addEventListener('click', analyzeFunction);
    document.getElementById('functionInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') analyzeFunction();
    });
    
    // Примеры
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('functionInput').value = this.dataset.func;
            analyzeFunction();
        });
    });
    
    // Зум
    const slider = document.getElementById('xRange');
    const rangeVal = document.getElementById('rangeValue');
    
    slider.addEventListener('input', () => rangeVal.textContent = slider.value);
    slider.addEventListener('change', () => {
        if(currentFunction) plotFunction(currentFunction, currentExpression);
    });
    
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        Plotly.relayout('plot', {'xaxis.range[0]': '*=0.8', 'xaxis.range[1]': '*=0.8'});
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        Plotly.relayout('plot', {'xaxis.range[0]': '*=1.2', 'xaxis.range[1]': '*=1.2'});
    });
    document.getElementById('resetViewBtn').addEventListener('click', () => {
        if(currentFunction) plotFunction(currentFunction, currentExpression);
    });

    // Старт
    initializePlot();
    setTimeout(analyzeFunction, 500);
});

function initializePlot() {
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true},
        yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
}