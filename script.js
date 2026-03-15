// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 5.0)
// Реализована безопасная обработка cot(x) через хелпер-функцию
// ============================================

let currentFunction = null;
let currentExpression = '';

// --- ЯДРО: Парсер с хелпером для котангенса ---
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                // 1. Очистка
                let cleanExpr = expr.replace(/\s+/g, '').replace(/\^/g, '**');
                
                // 2. Хелпер для котангенса (защита от деления на ноль)
                // Эта функция будет передана в контекст выполнения
                const __FN_COT__ = (arg) => {
                    const s = Math.sin(arg);
                    // Если синус близок к 0, возвращаем NaN (разрыв)
                    return Math.abs(s) < 1e-10 ? NaN : Math.cos(arg) / s;
                };
                
                // 3. Замена всех функций на плейсхолдеры
                // Важно: cot заменяется ПЕРВЫМ, чтобы не затронуть sin/cos внутри него
                cleanExpr = cleanExpr
                    .replace(/cot\(/g, '__FN_COT__(')   
                    .replace(/sec\(/g, '__FN_SEC__(')   // Добавим и секанс для порядка
                    .replace(/csc\(/g, '__FN_CSC__(')   // И косеканс
                    .replace(/sin\(/g, '__FN_SIN__(')
                    .replace(/cos\(/g, '__FN_COS__(')
                    .replace(/tan\(/g, '__FN_TAN__(')
                    .replace(/log10\(/g, '__FN_LOG10__(')
                    .replace(/log\(/g, '__FN_LOG__(') 
                    .replace(/ln\(/g, '__FN_LN__(')
                    .replace(/exp\(/g, '__FN_EXP__(') 
                    .replace(/sqrt\(/g, '__FN_SQRT__(')
                    .replace(/abs\(/g, '__FN_ABS__(');

                // 4. Замена констант и переменной x
                cleanExpr = cleanExpr.replace(/\bpi\b/gi, 'Math.PI');
                cleanExpr = cleanExpr.replace(/\be\b/g, 'Math.E'); 
                cleanExpr = cleanExpr.replace(/\bx\b/g, `(${xVal})`); 
                
                // 5. Восстановление стандартных функций Math.*
                // __FN_COT__, __FN_SEC__, __FN_CSC__ НЕ заменяем текстом, они останутся как вызовы функций
                cleanExpr = cleanExpr
                    .replace(/__FN_SIN__\(/g, 'Math.sin(')
                    .replace(/__FN_COS__\(/g, 'Math.cos(')
                    .replace(/__FN_TAN__\(/g, 'Math.tan(')
                    .replace(/__FN_LOG10__\(/g, 'Math.log10(')
                    .replace(/__FN_LOG__\(/g, 'Math.log(') 
                    .replace(/__FN_LN__\(/g, 'Math.log(')
                    .replace(/__FN_EXP__\(/g, 'Math.exp(')
                    .replace(/__FN_SQRT__\(/g, 'Math.sqrt(')
                    .replace(/__FN_ABS__\(/g, 'Math.abs(');
                
                // Для секанса и косеканса тоже создадим хелперы "на лету" или заменим?
                // Проще добавить их в аргументы функции, чтобы не усложнять.
                const __FN_SEC__ = (arg) => {
                    const c = Math.cos(arg);
                    return Math.abs(c) < 1e-10 ? NaN : 1 / c;
                };
                const __FN_CSC__ = (arg) => {
                    const s = Math.sin(arg);
                    return Math.abs(s) < 1e-10 ? NaN : 1 / s;
                };

                // 6. Выполнение с передачей хелперов в контекст
                const result = new Function('__FN_COT__', '__FN_SEC__', '__FN_CSC__', 'return ' + cleanExpr)
                               (__FN_COT__, __FN_SEC__, __FN_CSC__);
                
                if (!isFinite(result) || isNaN(result)) return null;
                return result;
            } catch(e) {
                console.warn('Ошибка вычисления:', e.message);
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
            const lowerExpr = expr.toLowerCase();
            
            // Умный выбор тестовых точек в зависимости от типа функции
            let testPoints;
            if (lowerExpr.includes('log')) {
                testPoints = [1, 2, Math.E];
            } else if (lowerExpr.includes('tan')) {
                testPoints = [0.5, 1.0, 2.0]; // Избегаем π/2
            } else if (lowerExpr.includes('cot')) {
                testPoints = [0.7, 1.2, 2.3]; // Избегаем 0 и π
            } else if (lowerExpr.includes('sec') || lowerExpr.includes('csc')) {
                testPoints = [0.5, 1.0, 2.0];
            } else {
                testPoints = [-2, -1, 0, 1, 2];
            }
            
            let isValid = false;
            for (let x of testPoints) {
                const val = func.evaluate(x);
                if (val !== null && isFinite(val)) {
                    isValid = true;
                    break;
                }
            }
            
            // Дополнительная проверка, если первая не прошла
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
    const lower = expr.toLowerCase();
    if (expr === 'x' || expr === '1/x' || lower.includes('log')) return [];

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
    if (lower.includes('cot') || lower.includes('sec') || lower.includes('csc')) return 'Тригонометрическая (обратная)';
    if (lower.includes('sin') || lower.includes('cos')) return 'Тригонометрическая';
    if (lower.includes('exp')) return 'Показательная';
    if (lower.includes('log')) return 'Логарифмическая';
    if (lower.includes('/x')) return 'Дробно-рациональная';
    if (lower.includes('**2') || lower.includes('^2')) return 'Квадратичная';
    return 'Алгебраическая';
}

function getDomain(expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('cot')) return 'x ≠ π·n (где n ∈ Z)';
    if (lower.includes('sec')) return 'x ≠ π/2 + π·n';
    if (lower.includes('csc')) return 'x ≠ π·n';
    if (lower.includes('tan')) return 'x ≠ π/2 + π·n';
    if (lower.includes('log')) return '(0; +∞)';
    if (lower.includes('sqrt')) return '[0; +∞)';
    if (lower.includes('/x')) return '(-∞; 0) ∪ (0; +∞)';
    return '(-∞; +∞)';
}

function findZeros(func, expr) {
    const zeros = [];
    const step = 0.1;
    const lower = expr.toLowerCase();
    
    if (lower.includes('exp')) return [];
    if (expr === '1/x') return [];
    // Котангенс равен 0 при π/2 + πn (~1.57, 4.71...)
    if (lower.includes('cot')) return ['1.57', '-1.57', '4.71']; 
    
    for (let x = -10; x <= 10; x += step) {
        if (expr.includes('/x') && Math.abs(x) < 0.1) continue;
        
        // Пропуск точек разрыва
        if (lower.includes('tan') || lower.includes('sec')) {
             if (Math.abs(Math.cos(x)) < 0.1) continue;
        }
        if (lower.includes('cot') || lower.includes('csc')) {
             if (Math.abs(Math.sin(x)) < 0.1) continue;
        }

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
    const step = range / 400; 
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    const lower = expr.toLowerCase();
    if (lower.includes('log')) startX = 0.01;

    const isCot = lower.includes('cot');
    const isTan = lower.includes('tan');
    const isSec = lower.includes('sec');
    const isCsc = lower.includes('csc');
    const isSimpleDivX = expr.includes('/x') && !lower.includes('sin') && !lower.includes('cos');

    for (let x = startX; x <= endX; x += step) {
        let skip = false;
        
        // Разрыв 1/x
        if (isSimpleDivX && Math.abs(x) < 0.05) skip = true;
        
        // Разрывы тангенса и секанса (cos(x) -> 0)
        if ((isTan || isSec) && Math.abs(Math.cos(x)) < 0.05) skip = true;
        
        // Разрывы котангенса и косеканса (sin(x) -> 0)
        // Используем более надежную проверку расстояния до кратных π
        if (isCot || isCsc) {
            const distToBreak = Math.abs(x % Math.PI);
            const minDist = Math.min(distToBreak, Math.PI - distToBreak);
            if (minDist < 0.15) skip = true; 
        }

        if (skip) {
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

    initializePlot();
});

function initializePlot() {
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true}, yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
}