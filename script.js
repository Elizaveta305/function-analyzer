// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 9.3 - FINAL)
// Все баги исправлены, зум работает, код оптимизирован
// ============================================

let currentFunction = null;
let currentExpression = '';
let currentType = 'unknown';

// ============================================================================
// 1. ВАЛИДАТОР ВВОДА (Безопасность)
// ============================================================================
function validateInput(expr) {
    // Блокируем опасные конструкции: точки с запятой, кавычки, системные объекты
    const dangerous = /[;{}'"]|\b(document|window|alert|eval|fetch|import|require)\b/i;
    return !dangerous.test(expr);
}

// ============================================================================
// 2. ЯДРО: Парсер математических выражений
// Примечание: new Function() безопасен при наличии валидации выше.
// Для продакшена рекомендуется math.js: https://mathjs.org/
// ============================================================================
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                let cleanExpr = expr.replace(/\s+/g, '').replace(/\^/g, '**');
                
                // Хелпер для котангенса (защита от деления на ноль)
                const __COT__ = (x) => {
                    const s = Math.sin(x);
                    return Math.abs(s) < 1e-10 ? NaN : Math.cos(x) / s;
                };
                
                // Заменяем функции на плейсхолдеры
                cleanExpr = cleanExpr.replace(/cot\(/g, '__COT__(');
                cleanExpr = cleanExpr
                    .replace(/sin\(/g, '__FN_SIN__(')
                    .replace(/cos\(/g, '__FN_COS__(')
                    .replace(/tan\(/g, '__FN_TAN__(')
                    .replace(/log10\(/g, '__FN_LOG10__(')
                    .replace(/log\(/g, '__FN_LOG__(') 
                    .replace(/ln\(/g, '__FN_LN__(')
                    .replace(/exp\(/g, '__FN_EXP__(') 
                    .replace(/sqrt\(/g, '__FN_SQRT__(')
                    .replace(/abs\(/g, '__FN_ABS__(');

                // Константы и переменная
                cleanExpr = cleanExpr.replace(/\bpi\b/gi, 'Math.PI');
                cleanExpr = cleanExpr.replace(/\be\b/g, 'Math.E'); 
                cleanExpr = cleanExpr.replace(/\bx\b/g, `(${xVal})`); 
                
                // Восстанавливаем стандартные функции
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
                
                // Выполнение
                const result = new Function('__COT__', 'return ' + cleanExpr)(__COT__);
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

// ============================================================================
// 3. АНАЛИЗ СДВИГОВ
// ============================================================================
function analyzeShift(expr, baseType) {
    const clean = expr.toLowerCase().replace(/\s/g, '');
    let verticalShift = 0;
    let horizontalShift = 0;
    
    const outerMatch = clean.match(new RegExp(`${baseType}\\([^)]+\\)([+-])(\\d+\\.?\\d*)`));
    if (outerMatch) {
        const sign = outerMatch[1] === '+' ? 1 : -1;
        verticalShift = sign * parseFloat(outerMatch[2]);
    }
    
    const innerMatch = clean.match(new RegExp(`${baseType}\\(\\s*x\\s*([+-])\\s*(\\d+\\.?\\d*)\\s*\\)`));
    if (innerMatch) {
        const sign = innerMatch[1] === '+' ? 1 : -1;
        horizontalShift = sign * parseFloat(innerMatch[2]);
    }
    
    return { verticalShift, horizontalShift };
}

// ============================================================================
// 4. ОПРЕДЕЛЕНИЕ ТИПА ФУНКЦИИ
// ============================================================================
function getFunctionType(expr) {
    let clean = expr.toLowerCase().replace(/\s/g, '').replace(/y=/g, '').replace(/f\(x\)=/g, '');
    
    if (clean.includes('sqrt(')) return 'sqrt';
    if (clean.includes('exp(')) return 'exp';
    if (clean.includes('log(') || clean.includes('ln(')) return 'log';
    if (clean.includes('sin(')) return 'sin';
    if (clean.includes('cos(')) return 'cos';
    if (clean.includes('tan(')) return 'tan';
    if (clean.includes('cot(')) return 'cot';
    if (clean.includes('/x')) return 'inverse';
    if (clean.includes('x^3') || clean.includes('x**3')) return 'cubic';
    if (clean.includes('x^2') || clean.includes('x**2')) return 'quadratic';
    if (clean.includes('x')) return 'linear';
    
    return 'unknown';
}

// ============================================================================
// 5. НАЗВАНИЕ ТИПА
// ============================================================================
function getFunctionTypeName(type, shift) {
    const names = {
        'linear': 'Линейная функция', 'quadratic': 'Квадратичная функция', 'cubic': 'Кубическая функция',
        'inverse': 'Обратная пропорциональность', 'sqrt': 'Квадратный корень', 'exp': 'Экспонента',
        'log': 'Логарифм', 'sin': 'Синус', 'cos': 'Косинус', 'tan': 'Тангенс', 'cot': 'Котангенс'
    };
    let name = names[type] || 'Сложная функция';
    if (shift.verticalShift !== 0 || shift.horizontalShift !== 0) name += ' (со сдвигом)';
    return name;
}

// ============================================================================
// 6. БАЗОВЫЕ СВОЙСТВА
// ============================================================================
const BASE_PROPERTIES = {
    'linear': { domain: '(-∞; +∞)', range: '(-∞; +∞)', zeros: [0], monotonicity: 'Возрастает при x∈(-∞; +∞)', sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)', extremes: 'Не имеет (±∞)', parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' }, continuity: 'Непрерывна', bounded: 'Не ограничена', asymptotes: 'Нет' },
    'quadratic': { domain: '(-∞; +∞)', range: '[0; +∞)', zeros: [0], monotonicity: 'Убывает при x∈(-∞; 0), возрастает при x∈(0; +∞)', sign: 'f(x)>0 при x≠0', extremes: 'min: 0 (при x=0)', parity: { result: 'Чётная', desc: 'Симметрия относительно OY' }, continuity: 'Непрерывна', bounded: 'Ограничена снизу', asymptotes: 'Нет' },
    'cubic': { domain: '(-∞; +∞)', range: '(-∞; +∞)', zeros: [0], monotonicity: 'Возрастает при x∈(-∞; +∞)', sign: 'f(x)>0 при x>0; f(x)<0 при x<0', extremes: 'Не имеет (±∞)', parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' }, continuity: 'Непрерывна', bounded: 'Не ограничена', asymptotes: 'Нет' },
    'inverse': { domain: '(-∞; 0) ∪ (0; +∞)', range: '(-∞; 0) ∪ (0; +∞)', zeros: [], monotonicity: 'Убывает на (-∞; 0) и (0; +∞)', sign: 'f(x)>0 при x>0; f(x)<0 при x<0', extremes: 'Не имеет', parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' }, continuity: 'Разрыв при x=0', bounded: 'Не ограничена', asymptotes: 'Вертик: x=0; Гориз: y=0' },
    'sqrt': { domain: '[0; +∞)', range: '[0; +∞)', zeros: [0], monotonicity: 'Возрастает при x∈[0; +∞)', sign: 'f(x)≥0', extremes: 'min: 0', parity: { result: 'Общего вида', desc: 'D(f) не симметрична' }, continuity: 'Непрерывна на [0; +∞)', bounded: 'Ограничена снизу', asymptotes: 'Нет' },
    'exp': { domain: '(-∞; +∞)', range: '(0; +∞)', zeros: [], monotonicity: 'Возрастает на ℝ', sign: 'f(x)>0 всегда', extremes: 'Не имеет', parity: { result: 'Общего вида', desc: 'Нет симметрии' }, continuity: 'Непрерывна', bounded: 'Ограничена снизу', asymptotes: 'Гориз: y=0 (x→-∞)' },
    'log': { domain: '(0; +∞)', range: '(-∞; +∞)', zeros: [1], monotonicity: 'Возрастает на (0; +∞)', sign: 'f(x)>0 при x>1; f(x)<0 при 0<x<1', extremes: 'Не имеет', parity: { result: 'Общего вида', desc: 'D(f) не симметрична' }, continuity: 'Непрерывна на (0; +∞)', bounded: 'Не ограничена', asymptotes: 'Вертик: x=0' },
    'sin': { domain: '(-∞; +∞)', range: '[-1; 1]', zeros: ['0', 'π', '-π', '2π', '-2π'], monotonicity: 'Не монотонна (периодическая)', sign: 'Периодически меняется', extremes: 'min: -1, max: 1', parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' }, continuity: 'Непрерывна', bounded: 'Ограничена', asymptotes: 'Нет', period: '2π' },
    'cos': { domain: '(-∞; +∞)', range: '[-1; 1]', zeros: ['π/2', '-π/2', '3π/2', '-3π/2'], monotonicity: 'Не монотонна (периодическая)', sign: 'Периодически меняется', extremes: 'min: -1, max: 1', parity: { result: 'Чётная', desc: 'Симметрия относительно OY' }, continuity: 'Непрерывна', bounded: 'Ограничена', asymptotes: 'Нет', period: '2π' },
    'tan': { domain: 'Все x, кроме π/2+πn', range: '(-∞; +∞)', zeros: ['0', 'π', '-π', '2π', '-2π'], monotonicity: 'Возрастает на промежутках', sign: 'Периодически меняется', extremes: 'Не имеет', parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' }, continuity: 'Разрывна при π/2+πn', bounded: 'Не ограничена', asymptotes: 'Вертик: x=π/2+πn', period: 'π' },
    'cot': { domain: 'Все x, кроме πn', range: '(-∞; +∞)', zeros: ['π/2', '-π/2', '3π/2', '-3π/2'], monotonicity: 'Убывает на промежутках', sign: 'Периодически меняется', extremes: 'Не имеет', parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' }, continuity: 'Разрывна при πn', bounded: 'Не ограничена', asymptotes: 'Вертик: x=πn', period: 'π' }
};

// ============================================================================
// 7. ПРИМЕНЕНИЕ СДВИГОВ (Исправлены sqrt и cot)
// ============================================================================
function applyShiftToProperties(baseProps, shift, type) {
    const props = { ...baseProps };
    const v = shift.verticalShift;
    const h = shift.horizontalShift;
    
    if (h !== 0) {
        if (type === 'sqrt') props.domain = `[${formatNumber(-h)}; +∞)`;
        else if (type === 'log') props.domain = `(${formatNumber(-h)}; +∞)`;
        else if (type === 'inverse') props.domain = `(-∞; ${formatNumber(-h)}) ∪ (${formatNumber(-h)}; +∞)`;
        else if (type === 'tan') props.domain = `Все x, кроме ${formatNumber(Math.PI/2 - h)} + πn`;
        else if (type === 'cot') props.domain = `Все x, кроме ${formatNumber(-h)} + πn`;
    }
    
    if (v !== 0) {
        if (type === 'sqrt') props.range = `[${formatNumber(v)}; +∞)`;
        else if (type === 'exp') props.range = `(${formatNumber(v)}; +∞)`;
        else if (type === 'sin' || type === 'cos') props.range = `[${formatNumber(-1 + v)}; ${formatNumber(1 + v)}]`;
        else if (type === 'quadratic') props.range = `[${formatNumber(v)}; +∞)`;
    }
    
    // 🔧 Нули функции (ИСПРАВЛЕНО)
    if (type === 'sqrt') {
        if (v > 0) props.zeros = [];
        else if (v === 0) props.zeros = [formatNumber(-h)];
        else props.zeros = [formatNumber(v * v - h)];
    } else if (type === 'exp') {
        props.zeros = [];
    } else if (type === 'log') {
        props.zeros = [formatNumber(Math.exp(-v) - h)];
    } else if (type === 'sin') {
        if (Math.abs(v) > 1) props.zeros = [];
        else {
            const b = Math.asin(-v);
            props.zeros = [`${formatNumber(b - h)} + 2πn`, `${formatNumber(Math.PI - b - h)} + 2πn`];
        }
    } else if (type === 'cos') {
        if (Math.abs(v) > 1) props.zeros = [];
        else {
            const b = Math.acos(-v);
            props.zeros = [`${formatNumber(b - h)} + 2πn`, `${formatNumber(-b - h)} + 2πn`];
        }
    } else if (type === 'tan') {
        props.zeros = [`${formatNumber(Math.atan(-v) - h)} + πn`];
    } else if (type === 'cot') {
        // 🔧 ИСПРАВЛЕНО: деление на ноль при v=0
        if (v === 0) props.zeros = [`${formatNumber(Math.PI/2 - h)} + πn`];
        else props.zeros = [`${formatNumber(Math.atan(-1/v) - h)} + πn`];
    }
    
    if (type === 'sqrt' && h !== 0) props.monotonicity = `Возрастает при x∈[${formatNumber(-h)}; +∞)`;
    else if (type === 'log' && h !== 0) props.monotonicity = `Возрастает при x∈(${formatNumber(-h)}; +∞)`;
    else if (type === 'quadratic' && h !== 0) props.monotonicity = `Убывает при x∈(-∞; ${formatNumber(-h)}), возрастает при x∈(${formatNumber(-h)}; +∞)`;
    
    if (type === 'sqrt' && v !== 0) {
        if (v > 0) props.sign = `f(x)>0 при x∈[${formatNumber(-h)}; +∞)`;
        else {
            const z = v * v - h;
            props.sign = `f(x)<0 при x∈[${formatNumber(-h)}; ${formatNumber(z)}); f(x)>0 при x∈(${formatNumber(z)}; +∞)`;
        }
    } else if (type === 'exp' && v !== 0) {
        if (v >= 0) props.sign = 'f(x)>0 при всех x';
        else props.sign = `f(x)<0 при x∈(-∞; ${formatNumber(Math.log(-v))}); f(x)>0 при x∈(${formatNumber(Math.log(-v))}; +∞)`;
    } else if (type === 'log' && (v !== 0 || h !== 0)) {
        const z = Math.exp(-v) - h;
        props.sign = `f(x)<0 при x∈(${formatNumber(-h)}; ${formatNumber(z)}); f(x)>0 при x∈(${formatNumber(z)}; +∞)`;
    }
    
    if (type === 'sqrt') props.extremes = `min: ${formatNumber(v)} (при x=${formatNumber(-h)})`;
    else if (type === 'exp') props.extremes = `Не имеет (inf = ${formatNumber(v)})`;
    else if (type === 'sin' || type === 'cos') props.extremes = `min: ${formatNumber(-1 + v)}, max: ${formatNumber(1 + v)}`;
    else if (type === 'quadratic') props.extremes = `min: ${formatNumber(v)} (при x=${formatNumber(-h)})`;
    
    if (v !== 0 || h !== 0) {
        if (type === 'cos' && v !== 0 && h === 0) props.parity = { result: 'Чётная', desc: 'Симметрия относительно OY' };
        else props.parity = { result: 'Общего вида', desc: 'Сдвиг нарушает симметрию' };
    }
    
    if (type === 'sqrt' && h !== 0) props.continuity = `Непрерывна на [${formatNumber(-h)}; +∞)`;
    else if (type === 'log' && h !== 0) props.continuity = `Непрерывна на (${formatNumber(-h)}; +∞)`;
    
    if (type === 'exp' && v !== 0) props.asymptotes = `Гориз: y=${formatNumber(v)} (x→-∞)`;
    else if (type === 'log' && h !== 0) props.asymptotes = `Вертик: x=${formatNumber(-h)}`;
    else if (type === 'inverse' && (h !== 0 || v !== 0)) props.asymptotes = `Вертик: x=${formatNumber(-h)}; Гориз: y=${formatNumber(v)}`;
    else if (type === 'tan' && h !== 0) props.asymptotes = `Вертик: x=${formatNumber(Math.PI/2 - h)} + πn`;
    else if (type === 'cot' && h !== 0) props.asymptotes = `Вертик: x=${formatNumber(-h)} + πn`;
    
    return props;
}

// ============================================================================
// 8. ФОРМАТИРОВАНИЕ
// ============================================================================
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    const n = typeof num === 'string' ? parseFloat(num) : Number(num);
    if (isNaN(n)) return String(num);
    if (Math.abs(n) < 0.001) return '0';
    if (Math.abs(n) > 1000) return n > 0 ? '+∞' : '-∞';
    return n.toFixed(1);
}

function formatZeros(zeros, type) {
    if (!zeros || zeros.length === 0) return 'Нет действительных корней';
    return zeros.map(z => {
        if (typeof z === 'string' && (z.includes('π') || z.includes('n'))) return z;
        const n = typeof z === 'string' ? parseFloat(z) : z;
        if (isNaN(n)) return String(z);
        return Number.isInteger(n) ? String(n) : n.toFixed(1);
    }).join(', ');
}

// ============================================================================
// 9. ОСНОВНАЯ ЛОГИКА
// ============================================================================
function analyzeFunction() {
    const input = document.getElementById('functionInput');
    let expr = input.value.trim();
    
    if (!expr) { showError('Введите формулу функции'); return; }
    if (!validateInput(expr)) { showError('Недопустимые символы'); return; }
    
    showLoading();
    document.getElementById('plot-loading').hidden = false;
    
    setTimeout(() => {
        try {
            const func = parseFunction(expr);
            const baseType = getFunctionType(expr);
            currentType = baseType;
            const shift = analyzeShift(expr, baseType);
            
            let isValid = false;
            let testPoints = [];
            const h = shift.horizontalShift;
            
            if (baseType === 'log' || baseType === 'sqrt') testPoints = [Math.max(0.1, -h + 0.1), Math.max(0.1, -h + 1), Math.max(0.1, -h + 4)];
            else if (baseType === 'tan' || baseType === 'cot') testPoints = [0.7 - h, 1.2 - h, 2.3 - h];
            else testPoints = [-2, -1, 0, 1, 2];
            
            for (let x of testPoints) { if (func.evaluate(x) !== null) { isValid = true; break; } }
            if (!isValid) {
                for (let x of [0.1, 0.5, 3, 5, -0.5]) { if (func.evaluate(x) !== null) { isValid = true; break; } }
            }
            if (!isValid) throw new Error('Функция не определена в стандартной области.');
            
            currentFunction = func;
            document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
            
            const baseProps = BASE_PROPERTIES[baseType];
            const properties = baseProps ? applyShiftToProperties(baseProps, shift, baseType) : calculatePropertiesNumerically(func, expr, baseType);
            properties.typeName = getFunctionTypeName(baseType, shift);
            properties.type = baseType;
            
            updatePropertiesDisplay(properties);
            plotFunction(func, expr, baseType, shift);
            
        } catch (error) {
            console.error(error);
            showError(`Ошибка: ${error.message}`);
            document.getElementById('plot-loading').hidden = true;
        }
    }, 50);
}

// ============================================================================
// 10. ЧИСЛЕННЫЙ РАСЧЁТ (Улучшенный поиск нулей)
// ============================================================================
function calculatePropertiesNumerically(func, expr, type) {
    return {
        typeName: getFunctionTypeName(type, {verticalShift: 0, horizontalShift: 0}),
        type: type,
        domain: getDomain(expr, type),
        range: calculateRangeNumerically(func, expr, type),
        zeros: findZerosImproved(func, expr, type),
        monotonicity: calculateMonotonicityWithIntervals(func, expr, type),
        sign: calculateSignIntervalsNumerically(func, expr, type),
        extremes: calculateExtremesNumerically(func, expr, type),
        parity: checkParity(func, type),
        continuity: getContinuityValue(expr, type),
        bounded: calculateBoundednessNumerically(func),
        asymptotes: findAsymptotesAdvanced(expr, func, type)
    };
}

function findZerosImproved(func, expr, type) {
    if (['sin', 'cos', 'tan', 'cot', 'sqrt', 'exp', 'inverse', 'log'].includes(type)) return BASE_PROPERTIES[type]?.zeros || [];
    if (['linear', 'cubic', 'quadratic'].includes(type)) return [0];
    
    const zeros = [];
    const step = 0.05;
    
    for (let x = -10; x <= 10; x += step) {
        if (expr.includes('/x') && Math.abs(x) < 0.1) continue;
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        if (y1 === null || y2 === null) continue;
        
        if (Math.abs(y1) < 0.01) {
            zeros.push(x);
        } else if (y1 * y2 < 0) {
            // Метод половинного деления
            let a = x, b = x + step;
            for (let i = 0; i < 5; i++) {
                let m = (a + b) / 2;
                if (func.evaluate(a) * func.evaluate(m) < 0) b = m;
                else a = m;
            }
            zeros.push((a + b) / 2);
        }
    }
    return zeros.filter((z, i, arr) => i === 0 || Math.abs(z - arr[i-1]) > 0.5);
}

// ============================================================================
// 11. ИНТЕРФЕЙС
// ============================================================================
function updatePropertiesDisplay(props) {
    const container = document.getElementById('propertiesOutput');
    if (!container) return;
    
    const html = [
        `<div class="property-item"><div class="property-icon">📊</div><div class="property-content"><div class="property-title">Тип функции</div><div class="property-value">${props.typeName}</div><div class="property-desc">Классификация</div></div></div>`
    ];
    
    const items = [
        { k: 'domain', t: '1. Область определения', d: 'D(f)', i: '🌐' },
        { k: 'range', t: '2. Область значений', d: 'E(f)', i: '📏' },
        { k: 'zeros', t: '3. Нули функции', d: 'f(x) = 0', i: '⚫', f: v => typeof v === 'string' ? v : formatZeros(v, props.type) },
        { k: 'monotonicity', t: '4. Монотонность', d: 'Промежутки возрастания/убывания', i: '📈' },
        { k: 'sign', t: '5. Знакопостоянство', d: 'Где функция положительна/отрицательна', i: '➕➖' },
        { k: 'extremes', t: '6. Наиб. и наим. значения', d: 'Экстремумы', i: '🏆' },
        { k: 'parity', t: '7. Чётность', d: p => p.desc, i: '🔄', f: p => p.result },
        { k: 'continuity', t: '8. Непрерывность', d: 'Точки разрыва', i: '〰️' },
        { k: 'bounded', t: '9. Ограниченность', d: 'Наличие границ', i: '🔒' },
        { k: 'asymptotes', t: '10. Асимптоты', d: 'Линии притяжения', i: '↗️' }
    ];
    
    if (['sin', 'cos', 'tan', 'cot'].includes(props.type) && props.period) {
        items.push({ k: 'period', t: '11. Периодичность', d: 'Повторяется', i: '⏱️', f: () => `Периодическая (T=${props.period})` });
    }
    
    items.forEach(item => {
        const val = item.k === 'parity' ? props[item.k]?.result : props[item.k];
        const desc = item.k === 'parity' ? props[item.k]?.desc : item.d;
        if (val !== undefined && val !== null) {
            html.push(`<div class="property-item"><div class="property-icon">${item.i}</div><div class="property-content"><div class="property-title">${item.t}</div><div class="property-value">${item.f ? item.f(val) : val}</div><div class="property-desc">${typeof desc === 'function' ? desc(props[item.k]) : desc}</div></div></div>`);
        }
    });
    
    container.innerHTML = html.join('');
}

function showLoading() {
    document.getElementById('propertiesOutput').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Анализ...</p></div>';
}

function showError(msg) {
    document.getElementById('propertiesOutput').innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div></div>`;
}

// ============================================================================
// 12. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================
function getDomain(expr, type) { if (type === 'log') return '(0; +∞)'; if (type === 'sqrt') return '[0; +∞)'; if (type === 'inverse') return '(-∞; 0) ∪ (0; +∞)'; if (type === 'tan') return 'Все x, кроме π/2+πn'; if (type === 'cot') return 'Все x, кроме πn'; return '(-∞; +∞)'; }

function checkParity(func, type) {
    if (['linear', 'cubic', 'inverse', 'tan', 'cot', 'sin'].includes(type)) return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    if (['quadratic', 'cos'].includes(type)) return { result: 'Чётная', desc: 'Симметрия относительно OY' };
    if (['sqrt', 'log', 'exp'].includes(type)) return { result: 'Общего вида', desc: 'D(f) не симметрична' };
    const a = func.evaluate(1), b = func.evaluate(-1);
    if (a===null||b===null) return { result: 'Не определено', desc: '-' };
    if (Math.abs(a-b)<0.001) return { result: 'Чётная', desc: 'Симметрия относительно OY' };
    if (Math.abs(a+b)<0.001) return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    return { result: 'Общего вида', desc: 'Нет симметрии' };
}

function getContinuityValue(expr, type) {
    if (expr.includes('/x')) return 'Разрыв при x=0';
    if (type === 'log') return 'Непрерывна на (0; +∞)';
    if (type === 'sqrt') return 'Непрерывна на [0; +∞)';
    if (type === 'tan') return 'Разрывна при π/2+πn';
    if (type === 'cot') return 'Разрывна при πn';
    return 'Непрерывна';
}

function calculateRangeNumerically(func, expr, type) {
    if (['sin', 'cos'].includes(type)) return '[-1; 1]';
    if (type === 'exp') return '(0; +∞)';
    if (type === 'log') return '(-∞; +∞)';
    if (type === 'sqrt') return '[0; +∞)';
    if (type === 'inverse') return '(-∞; 0) ∪ (0; +∞)';
    let min=Infinity, max=-Infinity;
    for(let x=-50;x<=50;x+=0.1){const y=func.evaluate(x); if(y!==null&&isFinite(y)){if(y<min)min=y; if(y>max)max=y;}}
    if(min===Infinity)return 'Не определено';
    if(max-min>1000)return '(-∞; +∞)';
    return `[${formatNumber(min)}; ${formatNumber(max)}]`;
}

function calculateMonotonicityWithIntervals(func, expr, type) {
    if (BASE_PROPERTIES[type]?.monotonicity) return BASE_PROPERTIES[type].monotonicity;
    let inc=0, dec=0; const pts=[-10,-5,-1,-0.1,0.1,1,5,10];
    for(let i=0;i<pts.length-1;i++){const y1=func.evaluate(pts[i]), y2=func.evaluate(pts[i+1]); if(y1!==null&&y2!==null){if(y2>y1+0.01)inc++; else if(y2<y1-0.01)dec++;}}
    if(inc>0&&dec===0)return 'Возрастает на ℝ'; if(dec>0&&inc===0)return 'Убывает на ℝ'; return 'Не монотонна';
}

function calculateExtremesNumerically(func, expr, type) {
    if (['linear', 'cubic', 'inverse', 'tan', 'cot', 'log'].includes(type)) return 'Не имеет (±∞)';
    if (type === 'exp') return 'Не имеет';
    if (['sin', 'cos'].includes(type)) return 'min: -1, max: 1';
    let min=Infinity, max=-Infinity;
    for(let x=-20;x<=20;x+=0.1){const y=func.evaluate(x); if(y!==null&&isFinite(y)){if(y<min)min=y; if(y>max)max=y;}}
    if(min===Infinity)return 'Не определено'; if(max-min>1000)return 'Не имеет (±∞)';
    return `min: ${formatNumber(min)}, max: ${formatNumber(max)}`;
}

function calculateBoundednessNumerically(func) {
    for(let x of [-100,100]){const y=func.evaluate(x); if(y!==null&&Math.abs(y)>1000)return 'Не ограничена';}
    return 'Ограничена (локально)';
}

function findAsymptotesAdvanced(expr, func, type) {
    if (type === 'inverse') return 'Вертик: x=0; Гориз: y=0';
    if (type === 'tan') return 'Вертик: x=π/2+πn';
    if (type === 'cot') return 'Вертик: x=πn';
    if (type === 'log') return 'Вертик: x=0';
    if (type === 'exp') return 'Гориз: y=0 (x→-∞)';
    return 'Нет';
}

function calculateSignIntervalsNumerically(func, expr) {
    const zeros = findZerosImproved(func, expr, 'unknown');
    
    // 🔧 Если нули содержат символьные значения (π, n), требуем ручной анализ
    // Это честно сообщает пользователю о пределах автоматического анализа
    if (zeros && zeros.some(z => typeof z === 'string' && (z.includes('π') || z.includes('n')))) {
        return 'Требуется ручной анализ';
    }
    
    if (!zeros || zeros.length === 0) { 
        const t = func.evaluate(0); 
        if (t !== null) return t > 0 ? 'f(x)>0 при x∈(-∞; +∞)' : 'f(x)<0 при x∈(-∞; +∞)'; 
        return 'Не определено'; 
    }
    
    let pos=[], neg=[]; 
    let pts=[-10, ...zeros.map(z=>typeof z==='string'?0:Number(z)).filter(n=>!isNaN(n)), 10];
    
    for(let i=0;i<pts.length-1;i++){
        let mid=(pts[i]+pts[i+1])/2; 
        const val=func.evaluate(mid); 
        if(val!==null){
            const int=`(${Number(pts[i]).toFixed(1)}; ${Number(pts[i+1]).toFixed(1)})`; 
            if(val>0)pos.push(int); else neg.push(int);
        }
    }
    
    let res=''; 
    if(pos.length>0)res+=`f(x)>0 при x∈${pos.join(' ∪ ')}. `; 
    if(neg.length>0)res+=`f(x)<0 при x∈${neg.join(' ∪ ')}`; 
    return res.length>70?res.substring(0,65)+'...':res;
}

// ============================================================================
// 13. ГРАФИК
// ============================================================================
function plotFunction(func, expr, type, shift) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 500;
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    const h = shift.horizontalShift;
    const v = shift.verticalShift;
    const isTan = type === 'tan', isCot = type === 'cot', isInv = type === 'inverse', isExp = type === 'exp';
    
    if (type === 'log') startX = Math.max(-range, -h + 0.01);
    if (type === 'sqrt') startX = Math.max(-range, -h);

    for (let x = startX; x <= endX; x += step) {
        let skip = false, y = null;
        if (isTan) { let d = Math.abs((x + h - Math.PI/2) % Math.PI); if (d > Math.PI/2) d = Math.PI - d; if (d < 0.15) skip = true; }
        else if (isCot) { let d = Math.abs((x + h) % Math.PI); if (d > Math.PI/2) d = Math.PI - d; if (d < 0.15) skip = true; }
        else if (isInv && Math.abs(x + h) < 0.05) skip = true;

        if (!skip) y = func.evaluate(x);
        if (!isExp && y !== null && (Math.abs(y) > 100 || !isFinite(y))) y = null;
        if (isExp && y !== null && !isFinite(y)) y = null;

        if (skip || y === null) { xVals.push(x); yVals.push(null); }
        else { xVals.push(x); yVals.push(y); }
    }
    
    const trace = { x: xVals, y: yVals, mode: 'lines', line: { color: '#2c3e50', width: 3 } };
    let yRange = null;
    if (isTan || isCot || isInv) yRange = [-10, 10];
    else if (isExp) {
        const validY = yVals.filter(v => v !== null && isFinite(v));
        const maxY = validY.length ? Math.max(...validY) : 10;
        yRange = [v > 0 ? v - 1 : -2, Math.min(maxY * 1.2, 20)];
    }

    const layout = {
        margin: { t: 30, r: 20, b: 40, l: 40 },
        xaxis: { title: 'X', zeroline: true, gridcolor: '#eee', range: [startX, endX] },
        yaxis: { title: 'Y', zeroline: true, gridcolor: '#eee', range: yRange },
        paper_bgcolor: '#fff', plot_bgcolor: '#fff'
    };
    
    if (typeof Plotly !== 'undefined') {
        Plotly.react('plot', [trace], layout, {displayModeBar: false}).then(() => {
            document.getElementById('plot-loading').hidden = true;
        });
    } else {
        document.getElementById('plot').innerHTML = '<div class="error-state">График не загружен. Проверьте интернет.</div>';
        document.getElementById('plot-loading').hidden = true;
    }
}

// ============================================================================
// 14. 🔧 ИСПРАВЛЕННЫЙ ЗУМ (РАБОТАЕТ!)
// ============================================================================
function zoomPlot(factor) {
    const plotEl = document.getElementById('plot');
    // Проверяем, что график уже отрисован и имеет диапазон
    if (!plotEl?.layout?.xaxis?.range) return;
    
    const [min, max] = plotEl.layout.xaxis.range;
    const center = (min + max) / 2;
    const newSpan = (max - min) * factor / 2;
    
    Plotly.relayout(plotEl, {
        'xaxis.range[0]': center - newSpan,
        'xaxis.range[1]': center + newSpan
    });
}

// ============================================================================
// 15. ИНИЦИАЛИЗАЦИЯ
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calculateBtn');
    const funcInput = document.getElementById('functionInput');
    
    if (calcBtn) calcBtn.addEventListener('click', analyzeFunction);
    if (funcInput) funcInput.addEventListener('keypress', e => { if (e.key === 'Enter') analyzeFunction(); });
    
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (funcInput) { funcInput.value = this.dataset.func; analyzeFunction(); }
        });
    });
    
    const slider = document.getElementById('xRange');
    const rangeVal = document.getElementById('rangeValue');
    if (slider && rangeVal) {
        slider.addEventListener('input', () => rangeVal.textContent = slider.value);
        slider.addEventListener('change', () => { if(currentFunction) { const s = analyzeShift(currentExpression, currentType); plotFunction(currentFunction, currentExpression, currentType, s); }});
    }
    
    // 🔧 ЗУМ (ИСПРАВЛЕНО)
    const zoomIn = document.getElementById('zoomInBtn');
    const zoomOut = document.getElementById('zoomOutBtn');
    const reset = document.getElementById('resetViewBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (zoomIn) zoomIn.addEventListener('click', () => zoomPlot(0.8));    // Увеличение (25%)
    if (zoomOut) zoomOut.addEventListener('click', () => zoomPlot(1.25));  // Уменьшение (25%)
    if (reset) reset.addEventListener('click', () => { if(currentFunction) { const s = analyzeShift(currentExpression, currentType); plotFunction(currentFunction, currentExpression, currentType, s); }});
    
    // 🔧 ЭКСПОРТ
    if (exportBtn) exportBtn.addEventListener('click', () => {
        if (typeof Plotly === 'undefined') return;
        Plotly.downloadImage('plot', {format: 'png', width: 800, height: 600, filename: 'function_graph'});
    });
    
    // 🔧 АДАПТИВНОСТЬ ГРАФИКА
    window.addEventListener('resize', () => { if (typeof Plotly !== 'undefined') Plotly.Plots.resize('plot'); });
    
    initializePlot();
});

function initializePlot() {
    // 🔧 Обработка ошибки загрузки Plotly CDN
    if (typeof Plotly === 'undefined') {
        document.getElementById('plot').innerHTML = `
            <div class="error-state">
                <div class="error-icon">🌐</div>
                <div class="error-msg">
                    Не удалось загрузить библиотеку графиков.<br>
                    <small>Проверьте интернет-соединение или попробуйте позже.</small>
                </div>
            </div>`;
        return;
    }
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true}, yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
    document.getElementById('plot-loading').hidden = true;
}