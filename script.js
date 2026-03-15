// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 3.0 - FIX)
// Исправлена критическая ошибка с заменой 'e' в 'exp'
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
                    .replace(/\s+/g, '') // 1. Убираем пробелы
                    .replace(/\^/g, '**'); // 2. Степень ^ в **

                // 3. ЗАМЕНА ФУНКЦИЙ (Самое важное: делаем это ПЕРВЫМ)
                // Мы заменяем полные имена функций на Math.функция
                processedExpr = processedExpr
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log10\(/g, 'Math.log10(')
                    .replace(/log\(/g, 'Math.log(') 
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/exp\(/g, 'Math.exp(') // exp( -> Math.exp(
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/abs\(/g, 'Math.abs(');

                // 4. ЗАМЕНА КОНСТАНТ (ОЧЕНЬ ВАЖНО: используем \b для границ слова)
                // Заменяем 'pi' на Math.PI
                processedExpr = processedExpr.replace(/\bpi\b/gi, 'Math.PI');
                
                // Заменяем 'e' на Math.E, ТОЛЬКО если это отдельная буква!
                // \b означает границу слова. 
                // В слове "Math.exp" буква 'e' не имеет границы слева (там точка), поэтому она НЕ заменится.
                // А в выражении "2*e" или "e^x" буква 'e' заменится корректно.
                processedExpr = processedExpr.replace(/\be\b/g, 'Math.E');

                // 5. ЗАМЕНА ПЕРЕМЕННОЙ X
                // Заменяем 'x' только если это отдельная переменная
                processedExpr = processedExpr.replace(/\bx\b/g, `(${xVal})`);
                
                // Выполняем вычисление
                // console.log("Вычисляю выражение:", processedExpr); // Для отладки можно включить
                const result = new Function('return ' + processedExpr)();
                
                if (!isFinite(result) || isNaN(result)) return null;
                return result;
            } catch(e) {
                console.error("Ошибка вычисления:", e.message, "Выражение:", expr);
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
    
    // Небольшая задержка, чтобы интерфейс успел обновиться
    setTimeout(() => {
        try {
            const func = parseFunction(expr);
            
            // Тестовый запуск для проверки валидности
            let isValid = false;
            // Подбираем тестовые точки в зависимости от наличия логарифмов
            const testPoints = expr.toLowerCase().includes('log') ? [1, 2, Math.E, 10] : [-2, -1, 0, 1, 2];
            
            for (let x of testPoints) {
                const val = func.evaluate(x);
                if (val !== null && isFinite(val)) {
                    isValid = true;
                    break;
                }
            }
            
            // Если не прошло по стандартным точкам, пробуем еще несколько для сложных функций
            if (!isValid) {
                const extraPoints = [0.1, 0.5, 3, 5, -0.5];
                for (let x of extraPoints) {
                    if (func.evaluate(x) !== null) {
                        isValid = true;
                        break;
                    }
                }
            }

            if (!isValid) {
                throw new Error('Функция не определена в стандартной области или содержит ошибку синтаксиса.');
            }
            
            currentFunction = func;
            document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
            document.getElementById('graphStatus').textContent = 'Анализ свойств...';
            
            // Запуск анализа свойств
            const properties = analyzeFunctionProperties(expr, func);
            updatePropertiesDisplay(properties);
            
            // Построение графика
            document.getElementById('graphStatus').textContent = 'Построение графика...';
            plotFunction(func, expr);
            document.getElementById('graphStatus').textContent = 'Готово';
            
        } catch (error) {
            console.error(error);
            showError(`Ошибка: ${error.message}. Проверьте синтаксис (например, используйте * для умножения: 2*x).`);
            document.getElementById('graphStatus').textContent = 'Ошибка';
        }
    }, 50);
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
    
    // 2. Область определения
    props.push({
        title: 'Область определения (D(f))',
        value: getDomain(expr),
        icon: '🌐',
        desc: 'Допустимые значения X'
    });
    
    // 3. Нули функции
    const zeros = findZeros(func, expr);
    props.push({
        title: 'Нули функции (f(x)=0)',
        value: zeros.length > 0 ? zeros.join(', ') : 'Нет корней в диапазоне [-10; 10]',
        icon: '⚫',
        desc: 'Пересечение с осью X'
    });
    
    // 4. Пересечение с OY
    const y0 = func.evaluate(0);
    if (y0 !== null && isFinite(y0)) {
        props.push({
            title: 'Пересечение с осью Y',
            value: `(0; ${y0.toFixed(2)})`,
            icon: '🔵',
            desc: 'Значение при x=0'
        });
    }
    
    // 5. Экстремумы
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

// Поиск экстремумов (численный поиск через производную)
function findExtrema(func, expr) {
    const extrema = [];
    const step = 0.1;
    const range = 10;
    
    // Пропускаем поиск для заведомо монотонных или простых функций для скорости
    if (expr === 'x' || expr === '1/x' || expr.toLowerCase().includes('log')) return [];

    for (let x = -range; x < range; x += step) {
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        const y3 = func.evaluate(x + 2 * step);
        
        if (y1 === null || y2 === null || y3 === null) continue;
        
        // Проверка смены знака производной
        const d1 = y2 - y1;
        const d2 = y3 - y2;
        
        if (d1 > 0.001 && d2 < -0.001) {
            extrema.push({ x: x + step, type: 'max' });
        } else if (d1 < -0.001 && d2 > 0.001) {
            extrema.push({ x: x + step, type: 'min' });
        }
    }
    return extrema;
}

// Вспомогательные функции
function determineFunctionType(expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('sin') || lower.includes('cos') || lower.includes('tan')) return 'Тригонометрическая';
    if (lower.includes('exp')) return 'Показательная (экспонента)';
    if (lower.includes('log')) return 'Логарифмическая';
    if (lower.includes('/x')) return 'Дробно-рациональная';
    if (lower.includes('**2') || lower.includes('^2')) return 'Квадратичная';
    if (lower.includes('**3') || lower.includes('^3')) return 'Кубическая';
    return 'Алгебраическая / Смешанная';
}

function getDomain(expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('log')) return '(0; +∞)';
    if (lower.includes('sqrt')) return '[0; +∞)';
    if (lower.includes('/x')) return '(-∞; 0) ∪ (0; +∞)';
    return '(-∞; +∞)';
}

function findZeros(func, expr) {
    const zeros = [];
    const step = 0.1;
    
    // Особые случаи для скорости и точности
    if (expr === 'x**2' || expr === 'x^2') return ['0'];
    if (expr.toLowerCase().includes('exp')) return []; // Экспонента > 0
    if (expr === '1/x') return [];
    
    for (let x = -10; x <= 10; x += step) {
        // Пропуск точки разрыва
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
    if (a === null || b === null) return { result: 'Не определено', desc: 'Невозможно проверить симметрию' };
    
    if (Math.abs(a - b) < 0.001) return { result: 'Чётная', desc: 'График симметричен относительно оси Y' };
    if (Math.abs(a + b) < 0.001) return { result: 'Нечётная', desc: 'График симметричен относительно начала координат' };
    return { result: 'Общего вида', desc: 'Нет симметрии' };
}

// --- ОТРИСОВКА ГРАФИКА ---
function plotFunction(func, expr) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 300; 
    
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    // Коррекция для логарифмов
    if (expr.toLowerCase().includes('log')) startX = 0.01;

    for (let x = startX; x <= endX; x += step) {
        // Обработка разрывов (например, 1/x)
        if (expr.includes('/x') && Math.abs(x) < 0.05) {
            xVals.push(x); yVals.push(null);
            continue;
        }
        
        const y = func.evaluate(x);
        
        // Отсекаем слишком большие значения, чтобы график не ломался
        if (y !== null && Math.abs(y) < 1000) {
            xVals.push(x);
            yVals.push(y);
        } else {
            xVals.push(x);
            yVals.push(null); // Разрыв линии графика
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
    
    // Зум и диапазон
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
    // Автозапуск с примером
    setTimeout(analyzeFunction, 500);
});

function initializePlot() {
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true},
        yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
}