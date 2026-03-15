// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 4.1 - Clean Start)
// Запуск только по действию пользователя
// ============================================

let currentFunction = null;
let currentExpression = '';

// --- ЯДРО: Парсер с временными метками ---
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                let processedExpr = expr
                    .replace(/\s+/g, '') 
                    .replace(/\^/g, '**'); 

                // ЭТАП 1: Функции → временные метки
                processedExpr = processedExpr
                    .replace(/sin\(/g, '__FN_SIN__(')
                    .replace(/cos\(/g, '__FN_COS__(')
                    .replace(/tan\(/g, '__FN_TAN__(')
                    .replace(/log10\(/g, '__FN_LOG10__(')
                    .replace(/log\(/g, '__FN_LOG__(') 
                    .replace(/ln\(/g, '__FN_LN__(')
                    .replace(/exp\(/g, '__FN_EXP__(') 
                    .replace(/sqrt\(/g, '__FN_SQRT__(')
                    .replace(/abs\(/g, '__FN_ABS__(');

                // ЭТАП 2: Константы и переменная
                processedExpr = processedExpr.replace(/\bpi\b/gi, 'Math.PI');
                processedExpr = processedExpr.replace(/\be\b/g, 'Math.E'); 
                processedExpr = processedExpr.replace(/\bx\b/g, `(${xVal})`); 
                
                // ЭТАП 3: Восстановление функций
                processedExpr = processedExpr
                    .replace(/__FN_SIN__\(/g, 'Math.sin(')
                    .replace(/__FN_COS__\(/g, 'Math.cos(')
                    .replace(/__FN_TAN__\(/g, 'Math.tan(')
                    .replace(/__FN_LOG10__\(/g, 'Math.log10(')
                    .replace(/__FN_LOG__\(/g, 'Math.log(') 
                    .replace(/__FN_LN__\(/g, 'Math.log(')
                    .replace(/__FN_EXP__\(/g, 'Math.exp(')
                    .replace(/__FN_SQRT__\(/g, 'Math.sqrt(')
                    .replace(/__FN_ABS__\(/g, 'Math.abs(');
                
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
        showError('Пожалуйста, введите формулу функции');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        try {
            const func = parseFunction(expr);
            
            // Тестовый запуск
            let isValid = false;
            const testPoints = expr.toLowerCase().includes('log') ? [1, 2, Math.E, 10] : [-2, -1, 0, 1, 2];
            
            for (let x of testPoints) {
                const val = func.evaluate(x);
                if (val !== null && isFinite(val)) {
                    isValid = true;
                    break;
                }
            }
            
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
                throw new Error('Функция не определена в стандартной области.');
            }
            
            currentFunction = func;
            document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
            document.getElementById('graphStatus').textContent = 'Анализ...';
            
            const properties = analyzeFunctionProperties(expr, func);
            updatePropertiesDisplay(properties);
            
            document.getElementById('graphStatus').textContent = 'Построение...';
            plotFunction(func, expr);
            document.getElementById('graphStatus').textContent = 'Готово';
            
        } catch (error) {
            console.error(error);
            showError(`Ошибка: ${error.message}. Проверьте синтаксис.`);
            document.getElementById('graphStatus').textContent = 'Ошибка';
        }
    }, 50);
}

// --- АНАЛИЗ СВОЙСТВ ---
function analyzeFunctionProperties(expr, func) {
    const props = [];
    
    // Иконка 📊 оставлена только здесь
    props.push({ title: 'Тип функции', value: determineFunctionType(expr), icon: '📊', desc: 'Классификация' });
    props.push({ title: 'Область определения', value: getDomain(expr), icon: '🌐', desc: 'D(f)' });
    
    const zeros = findZeros(func, expr);
    props.push({ title: 'Нули функции', value: zeros.length > 0 ? zeros.join(', ') : 'Нет в диапазоне', icon: '⚫', desc: 'f(x)=0' });
    
    const y0 = func.evaluate(0);
    if (y0 !== null && isFinite(y0)) {
        props.push({ title: 'Пересечение с Y', value: `(0; ${y0.toFixed(2)})`, icon: '🔵', desc: 'При x=0' });
    }
    
    const extrema = findExtrema(func, expr);
    if (extrema.length > 0) {
        const extStr = extrema.map(e => `${e.type === 'max' ? 'Макс' : 'Мин'} (x=${e.x.toFixed(2)})`).join('; ');
        props.push({ title: 'Экстремумы', value: extStr, icon: '🏔️', desc: 'Локальные точки' });
    }
    
    props.push({ title: 'Чётность', value: checkParity(func).result, icon: '🔄', desc: checkParity(func).desc });

    return props;
}

function findExtrema(func, expr) {
    const extrema = [];
    const step = 0.1;
    const range = 10;
    if (expr === 'x' || expr === '1/x' || expr.toLowerCase().includes('log')) return [];

    for (let x = -range; x < range; x += step) {
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        const y3 = func.evaluate(x + 2 * step);
        
        if (y1 === null || y2 === null || y3 === null) continue;
        
        const d1 = y2 - y1;
        const d2 = y3 - y2;
        
        if (d1 > 0.001 && d2 < -0.001) extrema.push({ x: x + step, type: 'max' });
        else if (d1 < -0.001 && d2 > 0.001) extrema.push({ x: x + step, type: 'min' });
    }
    return extrema;
}

function determineFunctionType(expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('sin') || lower.includes('cos')) return 'Тригонометрическая';
    if (lower.includes('exp')) return 'Показательная';
    if (lower.includes('log')) return 'Логарифмическая';
    if (lower.includes('/x')) return 'Дробно-рациональная';
    if (lower.includes('**2') || lower.includes('^2')) return 'Квадратичная';
    return 'Алгебраическая';
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
    if (expr.toLowerCase().includes('exp')) return [];
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
    if (a === null || b === null) return { result: 'Не определено', desc: '-' };
    if (Math.abs(a - b) < 0.001) return { result: 'Чётная', desc: 'Симметрия Y' };
    if (Math.abs(a + b) < 0.001) return { result: 'Нечётная', desc: 'Симметрия 0' };
    return { result: 'Общего вида', desc: 'Нет симметрии' };
}

// --- ГРАФИК ---
function plotFunction(func, expr) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 300;
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    if (expr.toLowerCase().includes('log')) startX = 0.01;

    for (let x = startX; x <= endX; x += step) {
        if (expr.includes('/x') && Math.abs(x) < 0.05) {
            xVals.push(x); yVals.push(null);
            continue;
        }
        const y = func.evaluate(x);
        if (y !== null && Math.abs(y) < 1000) {
            xVals.push(x); yVals.push(y);
        } else {
            xVals.push(x); yVals.push(null);
        }
    }
    
    const trace = { x: xVals, y: yVals, mode: 'lines', line: { color: '#2c3e50', width: 3 } };
    const layout = {
        margin: { t: 30, r: 20, b: 40, l: 40 },
        xaxis: { title: 'X', zeroline: true, gridcolor: '#eee', range: [startX, endX] },
        yaxis: { title: 'Y', zeroline: true, gridcolor: '#eee' },
        paper_bgcolor: '#fff', plot_bgcolor: '#fff'
    };
    
    Plotly.react('plot', [trace], layout, {displayModeBar: false});
}

// --- UI ---
function updatePropertiesDisplay(props) {
    document.getElementById('propertiesOutput').innerHTML = props.map(p => `
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
        <div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div></div>`;
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', analyzeFunction);
    document.getElementById('functionInput').addEventListener('keypress', e => { if (e.key === 'Enter') analyzeFunction(); });
    
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('functionInput').value = this.dataset.func;
            analyzeFunction();
        });
    });
    
    const slider = document.getElementById('xRange');
    const rangeVal = document.getElementById('rangeValue');
    slider.addEventListener('input', () => rangeVal.textContent = slider.value);
    slider.addEventListener('change', () => { if(currentFunction) plotFunction(currentFunction, currentExpression); });
    
    document.getElementById('zoomInBtn').addEventListener('click', () => Plotly.relayout('plot', {'xaxis.range[0]': '*=0.8', 'xaxis.range[1]': '*=0.8'}));
    document.getElementById('zoomOutBtn').addEventListener('click', () => Plotly.relayout('plot', {'xaxis.range[0]': '*=1.2', 'xaxis.range[1]': '*=1.2'}));
    document.getElementById('resetViewBtn').addEventListener('click', () => { if(currentFunction) plotFunction(currentFunction, currentExpression); });

    // Инициализация пустого графика
    initializePlot();
    
    // АВТОЗАПУСК ОТКЛЮЧЕН. Сайт ждет ввода пользователя.
});

function initializePlot() {
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true}, yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
}