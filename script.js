// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 8.1)
// 11 свойств + название типа + асимптоты + sqrt(x)
// ============================================

let currentFunction = null;
let currentExpression = '';
let currentType = 'unknown';

// ============================================================================
// ЯДРО: Парсер с хелпером для котангенса
// ============================================================================
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                let cleanExpr = expr.replace(/\s+/g, '').replace(/\^/g, '**');
                
                // 🔧 Хелпер для котангенса (защита от деления на ноль)
                const __COT__ = (x) => {
                    const s = Math.sin(x);
                    return Math.abs(s) < 1e-10 ? NaN : Math.cos(x) / s;
                };
                
                // Заменяем cot( на __COT__(
                cleanExpr = cleanExpr.replace(/cot\(/g, '__COT__(');

                // Заменяем все функции на плейсхолдеры
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
                
                // Восстанавливаем стандартные функции Math.*
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
                
                // Выполняем с передачей __COT__ в контекст
                const result = new Function('__COT__', 'return ' + cleanExpr)(__COT__);
                
                if (!isFinite(result) || isNaN(result)) return null;
                return result;
            } catch(e) {
                console.error('Ошибка:', e.message);
                return null;
            }
        },
        toString: function() {
            return displayExpr;
        }
    };
}

// ============================================================================
// ОПРЕДЕЛЕНИЕ ТИПА ФУНКЦИИ
// ============================================================================
function getFunctionType(expr) {
    let clean = expr.toLowerCase()
        .replace(/\s/g, '')
        .replace(/y=/g, '')
        .replace(/f\(x\)=/g, '')
        .replace(/\*\*/g, '^')
        .replace(/\*/g, '');
    
    if (clean === 'x') return 'linear_origin';
    if (clean === 'x^2') return 'quadratic_origin';
    if (clean === 'x^3') return 'cubic_origin';
    if (clean === '1/x') return 'inverse';
    if (clean === 'sqrt(x)' || clean === '√(x)') return 'sqrt';
    
    if (clean.includes('tan(')) return 'tan';
    if (clean.includes('cot(')) return 'cot';
    if (clean.includes('sin(')) return 'sin';
    if (clean.includes('cos(')) return 'cos';
    if (clean.includes('exp(')) return 'exp';
    if (clean.includes('log(') || clean.includes('ln(')) return 'log';
    if (clean.includes('sqrt(')) return 'sqrt';
    
    if (clean.includes('x^2')) return 'quadratic_general';
    if (clean.includes('x^3')) return 'cubic_general';
    if (clean.includes('/x')) return 'rational';
    if (clean.includes('x')) return 'polynomial';
    
    return 'unknown';
}

// ============================================================================
// ПОЛУЧЕНИЕ ЧИТАЕМОГО НАЗВАНИЯ ТИПА ФУНКЦИИ
// ============================================================================
function getFunctionTypeName(type) {
    const names = {
        'linear_origin': 'Линейная функция',
        'quadratic_origin': 'Квадратичная функция (парабола)',
        'cubic_origin': 'Кубическая функция',
        'inverse': 'Обратная пропорциональность',
        'sqrt': 'Функция квадратного корня',
        'tan': 'Тангенс',
        'cot': 'Котангенс',
        'sin': 'Синус',
        'cos': 'Косинус',
        'exp': 'Показательная функция (экспонента)',
        'log': 'Логарифмическая функция',
        'quadratic_general': 'Квадратичная функция',
        'cubic_general': 'Кубическая функция',
        'rational': 'Дробно-рациональная функция',
        'polynomial': 'Полиномиальная функция',
        'unknown': 'Сложная / комбинированная функция'
    };
    return names[type] || 'Функция';
}

// ============================================================================
// ПРОВЕРКА: Линейная функция?
// ============================================================================
function isLinearFunction(expr) {
    const clean = expr.toLowerCase().replace(/\s/g, '');
    if (/^([+-]?\d*\.?\d*\*)?x([+-]\d*\.?\d+)?$/.test(clean)) return true;
    if (/^x([+-]\d*\.?\d+)?$/.test(clean)) return true;
    if (/^[+-]?\d*\.?\d*\*x$/.test(clean)) return true;
    if (/^[+-]?\d+\.?\d*$/.test(clean)) return 'constant';
    return false;
}

// ============================================================================
// БАЗА ЗНАНИЙ (включая sqrt)
// ============================================================================
const ANALYTICAL_DATA = {
    'linear_origin': {
        range: '(-∞; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Непрерывна на всей области',
        monotonicity: 'Возрастает на всей области',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        domain: '(-∞; +∞)',
        zeros: [0],
        asymptotes: 'Нет'
    },
    'quadratic_origin': {
        range: '[0; +∞)',
        sign: 'f(x)>0 при x∈(-∞; 0)∪(0; +∞); f(x)=0 при x=0',
        bounded: 'Ограничена снизу',
        extremes: 'min: 0 (при x=0), max: +∞',
        continuity: 'Непрерывна на всей области',
        monotonicity: 'Убывает при x<0, возрастает при x>0',
        parity: { result: 'Чётная', desc: 'Симметрия относительно оси OY' },
        domain: '(-∞; +∞)',
        zeros: [0],
        asymptotes: 'Нет'
    },
    'cubic_origin': {
        range: '(-∞; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Непрерывна на всей области',
        monotonicity: 'Возрастает на всей области',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        domain: '(-∞; +∞)',
        zeros: [0],
        asymptotes: 'Нет'
    },
    'inverse': {
        range: '(-∞; 0) ∪ (0; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Разрывна при x=0',
        monotonicity: 'Убывает на (-∞; 0) и на (0; +∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        domain: '(-∞; 0) ∪ (0; +∞)',
        zeros: [],
        asymptotes: 'Вертикальная: x=0; Горизонтальная: y=0'
    },
    'sqrt': {
        range: '[0; +∞)',
        sign: 'f(x)=0 при x=0; f(x)>0 при x∈(0; +∞)',
        bounded: 'Ограничена снизу (y≥0)',
        extremes: 'min: 0 (при x=0), max: не имеет',
        continuity: 'Непрерывна на [0; +∞)',
        monotonicity: 'Строго возрастает на всей области',
        parity: { result: 'Общего вида', desc: 'Область определения не симметрична' },
        domain: '[0; +∞)',
        zeros: [0],
        asymptotes: 'Нет'
    },
    'exp': {
        range: '(0; +∞)',
        sign: 'f(x)>0 при всех x',
        bounded: 'Ограничена снизу (y>0)',
        extremes: 'min: 0 (асимптота), max: +∞',
        continuity: 'Непрерывна на всей области',
        monotonicity: 'Возрастает на всей области',
        parity: { result: 'Общего вида', desc: 'Нет симметрии' },
        domain: '(-∞; +∞)',
        zeros: [],
        asymptotes: 'Горизонтальная: y=0 (при x→-∞)'
    },
    'log': {
        range: '(-∞; +∞)',
        sign: 'f(x)>0 при x∈(1; +∞); f(x)<0 при x∈(0; 1)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Непрерывна на (0; +∞)',
        monotonicity: 'Возрастает на всей области',
        parity: { result: 'Общего вида', desc: 'Нет симметрии' },
        domain: '(0; +∞)',
        zeros: [1],
        asymptotes: 'Вертикальная: x=0'
    },
    'sin': {
        range: '[-1; 1]',
        sign: 'Периодически меняется знак',
        bounded: 'Ограничена: -1 ≤ f(x) ≤ 1',
        extremes: 'min: -1, max: 1',
        continuity: 'Непрерывна на всей области',
        monotonicity: 'Не монотонна (периодическая)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        domain: '(-∞; +∞)',
        zeros: ['0', 'π', '-π', '2π', '-2π'],
        asymptotes: 'Нет',
        period: '2π'
    },
    'cos': {
        range: '[-1; 1]',
        sign: 'Периодически меняется знак',
        bounded: 'Ограничена: -1 ≤ f(x) ≤ 1',
        extremes: 'min: -1, max: 1',
        continuity: 'Непрерывна на всей области',
        monotonicity: 'Не монотонна (периодическая)',
        parity: { result: 'Чётная', desc: 'Симметрия относительно оси OY' },
        domain: '(-∞; +∞)',
        zeros: ['π/2', '-π/2', '3π/2', '-3π/2'],
        asymptotes: 'Нет',
        period: '2π'
    },
    'tan': {
        range: '(-∞; +∞)',
        sign: 'Периодически меняется знак',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Разрывна при x = π/2 + πn',
        monotonicity: 'Возрастает на каждом промежутке непрерывности',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        domain: 'Все x, кроме π/2 + πn',
        zeros: ['0', 'π', '-π', '2π', '-2π'],
        asymptotes: 'Вертикальные: x = π/2 + πn',
        period: 'π'
    },
    'cot': {
        range: '(-∞; +∞)',
        sign: 'Периодически меняется знак',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Разрывна при x = πn',
        monotonicity: 'Убывает на каждом промежутке непрерывности',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        domain: 'Все x, кроме πn',
        zeros: ['π/2', '-π/2', '3π/2', '-3π/2'],
        asymptotes: 'Вертикальные: x = πn',
        period: 'π'
    }
};

// ============================================================================
// ФОРМАТИРОВАНИЕ НУЛЕЙ С ПОДДЕРЖКОЙ π
// ============================================================================
function formatZeros(zeros, type) {
    if (['sin', 'cos', 'tan', 'cot'].includes(type)) {
        return zeros.map(z => {
            if (typeof z === 'string') return z;
            const num = typeof z === 'string' ? parseFloat(z) : z;
            if (isNaN(num)) return String(z);
            if (Math.abs(num) < 0.01) return '0';
            if (Math.abs(num - Math.PI/2) < 0.01) return 'π/2';
            if (Math.abs(num + Math.PI/2) < 0.01) return '-π/2';
            if (Math.abs(num - Math.PI) < 0.01) return 'π';
            if (Math.abs(num + Math.PI) < 0.01) return '-π';
            if (Math.abs(num - 2*Math.PI) < 0.01) return '2π';
            if (Math.abs(num + 2*Math.PI) < 0.01) return '-2π';
            if (Math.abs(num - 3*Math.PI/2) < 0.01) return '3π/2';
            if (Math.abs(num + 3*Math.PI/2) < 0.01) return '-3π/2';
            if (Math.abs(num - Math.PI/4) < 0.01) return 'π/4';
            return formatNumber(num);
        }).join(', ');
    }
    if (!zeros || zeros.length === 0) return 'Нет действительных корней';
    return zeros.map(z => formatNumber(z)).join(', ');
}

// ============================================================================
// ОСНОВНАЯ ЛОГИКА
// ============================================================================
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
            const type = getFunctionType(expr);
            currentType = type;
            
            let isValid = false;
            let testPoints = [];
            
            if (type === 'log' || type === 'sqrt') testPoints = [1, 2, 4];
            else if (type === 'tan' || type === 'cot') testPoints = [0.7, 1.2, 2.3];
            else testPoints = [-2, -1, 0, 1, 2];
            
            for (let x of testPoints) {
                if (func.evaluate(x) !== null) { isValid = true; break; }
            }
            if (!isValid) {
                for (let x of [0.1, 0.5, 3, 5, -0.5]) {
                    if (func.evaluate(x) !== null) { isValid = true; break; }
                }
            }

            if (!isValid) throw new Error('Функция не определена в стандартной области.');
            
            currentFunction = func;
            document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
            document.getElementById('graphStatus').textContent = 'Анализ...';
            
            const properties = analyzeFunctionProperties(expr, func, type);
            updatePropertiesDisplay(properties);
            
            document.getElementById('graphStatus').textContent = 'Построение...';
            plotFunction(func, expr, type);
            document.getElementById('graphStatus').textContent = 'Готово';
            
        } catch (error) {
            console.error(error);
            showError(`Ошибка: ${error.message}. Проверьте синтаксис.`);
            document.getElementById('graphStatus').textContent = 'Ошибка';
        }
    }, 50);
}

// ============================================================================
// АНАЛИЗ 11 СВОЙСТВ + НАЗВАНИЕ ТИПА
// ============================================================================
function analyzeFunctionProperties(expr, func, type) {
    const props = [];
    const data = ANALYTICAL_DATA[type];
    
    // 🔹 Название типа функции (первым пунктом)
    const typeName = getFunctionTypeName(type);
    props.push({ title: 'Тип функции', value: typeName, icon: '📊', desc: 'Классификация' });
    
    // 1. Область определения
    props.push({ title: '1. Область определения', value: data ? data.domain : getDomain(expr, type), icon: '🌐', desc: 'D(f)' });
    
    // 2. Область значений
    props.push({ title: '2. Область значений', value: data ? data.range : calculateRangeNumerically(func, expr), icon: '📏', desc: 'E(f)' });
    
    // 3. Нули функции
    const zeros = data ? data.zeros : findZeros(func, expr, type);
    const zerosText = formatZeros(zeros, type);
    props.push({ title: '3. Нули функции', value: zerosText, icon: '⚫', desc: 'f(x) = 0' });
    
    // 4. Монотонность
    props.push({ title: '4. Монотонность', value: data ? data.monotonicity : calculateMonotonicityNumerically(func), icon: '📈', desc: 'Промежутки возрастания/убывания' });
    
    // 5. Знакопостоянство
    props.push({ title: '5. Знакопостоянство', value: data ? data.sign : calculateSignIntervalsNumerically(func, expr), icon: '➕➖', desc: 'Где функция положительна/отрицательна' });
    
    // 6. Макс и мин значения
    props.push({ title: '6. Наиб. и наим. значения', value: data ? data.extremes : calculateExtremesNumerically(func), icon: '🏆', desc: 'Экстремумы функции' });
    
    // 7. Четность
    const parity = data ? data.parity : checkParity(func, type);
    props.push({ title: '7. Чётность', value: parity.result, icon: '🔄', desc: parity.desc });
    
    // 8. Непрерывность
    props.push({ title: '8. Непрерывность', value: data ? data.continuity : getContinuityValue(expr, type), icon: '〰️', desc: 'Точки разрыва' });
    
    // 9. Ограниченность
    props.push({ title: '9. Ограниченность', value: data ? data.bounded : calculateBoundednessNumerically(func), icon: '🔒', desc: 'Наличие границ' });
    
    // 10. Асимптоты
    props.push({ title: '10. Асимптоты', value: data ? data.asymptotes : findAsymptotes(expr, type), icon: '↗️', desc: 'Линии, к которым стремится график' });
    
    // 11. Периодичность (только для тригонометрии)
    if (['sin', 'cos', 'tan', 'cot'].includes(type)) {
        const period = data ? data.period : (type === 'tan' || type === 'cot' ? 'π' : '2π');
        props.push({ title: '11. Периодичность', value: `Периодическая (T=${period})`, icon: '⏱️', desc: 'Повторяется через промежуток' });
    }

    return props;
}

// ============================================================================
// ПОИСК АСИМПТОТ
// ============================================================================
function findAsymptotes(expr, type) {
    const lower = expr.toLowerCase();
    
    if (lower.includes('/x') || type === 'inverse') return 'Вертикальная: x=0';
    if (type === 'tan') return 'Вертикальные: x = π/2 + πn';
    if (type === 'cot') return 'Вертикальные: x = πn';
    if (lower.includes('log')) return 'Вертикальная: x=0';
    if (lower.includes('exp')) return 'Горизонтальная: y=0 (при x→-∞)';
    
    const yInf = currentFunction ? currentFunction.evaluate(1000) : null;
    const yNegInf = currentFunction ? currentFunction.evaluate(-1000) : null;
    
    if (yInf !== null && Math.abs(yInf) < 10 && yNegInf !== null && Math.abs(yNegInf) < 10) {
        if (Math.abs(yInf - yNegInf) < 1) return `Горизонтальная: y≈${formatNumber(yInf)}`;
    }
    
    return 'Нет';
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ: Форматирование
// ============================================================================
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    const number = typeof num === 'string' ? parseFloat(num) : Number(num);
    if (isNaN(number)) return String(num);
    if (Math.abs(number) < 0.001) return '0';
    return number.toFixed(2);
}

function safeToFixed(value, decimals = 1) {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return String(value);
    return num.toFixed(decimals);
}

// ============================================================================
// ЧИСЛЕННЫЕ МЕТОДЫ
// ============================================================================
function calculateRangeNumerically(func, expr) {
    const linearCheck = isLinearFunction(expr);
    if (linearCheck === true) return '(-∞; +∞)';
    if (linearCheck === 'constant') {
        const val = func.evaluate(0);
        return val !== null ? `{${formatNumber(val)}}` : 'Не определено';
    }
    
    const lower = expr.toLowerCase();
    if (lower.includes('sin') || lower.includes('cos')) return '[-1; 1]';
    if (lower.includes('exp')) return '(0; +∞)';
    if (lower.includes('log')) return '(-∞; +∞)';
    if (lower.includes('sqrt')) return '[0; +∞)';
    if (lower.includes('x^2') || lower.includes('x**2') || lower.includes('^2')) return '[0; +∞)';
    
    let min = Infinity, max = -Infinity;
    for (let x = -50; x <= 50; x += 0.1) {
        const y = func.evaluate(x);
        if (y !== null && isFinite(y)) {
            if (y < min) min = y;
            if (y > max) max = y;
        }
    }
    if (min === Infinity) return 'Не определено';
    if (max - min > 1000) return '(-∞; +∞)';
    
    let minStr = (min < -1000) ? '-∞' : formatNumber(min);
    let maxStr = (max > 1000) ? '+∞' : formatNumber(max);
    return `[${minStr}; ${maxStr}]`;
}

function calculateSignIntervalsNumerically(func, expr) {
    const zeros = findZeros(func, expr, 'unknown');
    if (!zeros || zeros.length === 0) {
        const test = func.evaluate(0);
        if (test !== null) return test > 0 ? 'f(x)>0 на всей области' : 'f(x)<0 на всей области';
        return 'Не определено';
    }
    let pos = [], neg = [];
    let points = [-10, ...zeros.map(z => typeof z === 'string' ? 0 : Number(z)).filter(n => !isNaN(n)), 10];
    for (let i = 0; i < points.length - 1; i++) {
        let mid = (points[i] + points[i+1]) / 2;
        const val = func.evaluate(mid);
        if (val !== null) {
            if (val > 0) pos.push(`(${safeToFixed(points[i])}; ${safeToFixed(points[i+1])})`);
            else neg.push(`(${safeToFixed(points[i])}; ${safeToFixed(points[i+1])})`);
        }
    }
    let res = '';
    if (pos.length > 0) res += `f(x)>0 на: ${pos.join(', ')}. `;
    if (neg.length > 0) res += `f(x)<0 на: ${neg.join(', ')}`;
    return res.length > 60 ? res.substring(0, 55) + '...' : res;
}

function calculateBoundednessNumerically(func) {
    for (let x of [-100, 100]) {
        const y = func.evaluate(x);
        if (y !== null && Math.abs(y) > 1000) return 'Не ограничена';
    }
    return 'Ограничена (локально)';
}

function calculateExtremesNumerically(func) {
    let min = Infinity, max = -Infinity;
    for (let x = -10; x <= 10; x += 0.1) {
        const y = func.evaluate(x);
        if (y !== null && isFinite(y)) {
            if (y < min) min = y;
            if (y > max) max = y;
        }
    }
    let minStr = (min < -1000) ? '-∞' : formatNumber(min);
    let maxStr = (max > 1000) ? '+∞' : formatNumber(max);
    return `min: ${minStr}, max: ${maxStr}`;
}

function calculateMonotonicityNumerically(func) {
    let inc = 0, dec = 0;
    for (let x of [-5, -1, 1, 5]) {
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + 0.1);
        if (y1 !== null && y2 !== null) {
            if (y2 > y1) inc++;
            else if (y2 < y1) dec++;
        }
    }
    if (inc > 0 && dec === 0) return 'Возрастает на всей области';
    if (dec > 0 && inc === 0) return 'Убывает на всей области';
    return 'Не монотонна (меняет характер)';
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ: Домен, нули, четность, непрерывность
// ============================================================================
function getDomain(expr, type) {
    if (type === 'log' || type === 'sqrt') return '[0; +∞)';
    if (type === 'inverse' || expr.includes('/x')) return '(-∞; 0) ∪ (0; +∞)';
    if (type === 'tan') return 'Все x, кроме π/2 + πn';
    if (type === 'cot') return 'Все x, кроме πn';
    if (expr.includes('sqrt')) return '[0; +∞)';
    return '(-∞; +∞)';
}

function findZeros(func, expr, type) {
    if (type === 'sin') return ['0', 'π', '-π', '2π', '-2π'];
    if (type === 'cos') return ['π/2', '-π/2', '3π/2', '-3π/2'];
    if (type === 'tan') return ['0', 'π', '-π', '2π', '-2π'];
    if (type === 'cot') return ['π/2', '-π/2', '3π/2', '-3π/2'];
    if (type === 'sqrt') return [0];
    
    if (type === 'exp') return [];
    if (type === 'inverse') return [];
    if (type === 'log') return [1];
    if (['linear_origin', 'cubic_origin', 'quadratic_origin'].includes(type)) return [0];
    
    const rawZeros = [];
    for (let x = -10; x <= 10; x += 0.1) {
        if (expr.includes('/x') && Math.abs(x) < 0.1) continue;
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + 0.1);
        if (y1 === null || y2 === null) continue;
        if (Math.abs(y1) < 0.05) rawZeros.push(x);
        else if (y1 * y2 < 0) rawZeros.push(x + 0.05);
    }
    const zeros = [];
    if (rawZeros.length > 0) {
        zeros.push(rawZeros[0]);
        for (let i = 1; i < rawZeros.length; i++) {
            if (Math.abs(rawZeros[i] - rawZeros[i-1]) > 0.5) zeros.push(rawZeros[i]);
        }
    }
    return zeros;
}

function checkParity(func, type) {
    if (['linear_origin', 'cubic_origin', 'inverse', 'tan', 'cot', 'sin'].includes(type)) 
        return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    if (['quadratic_origin', 'cos'].includes(type))
        return { result: 'Чётная', desc: 'Симметрия относительно оси OY' };
    if (type === 'sqrt' || type === 'log' || type === 'exp')
        return { result: 'Общего вида', desc: 'Область определения не симметрична' };
    
    const a = func.evaluate(1);
    const b = func.evaluate(-1);
    if (a === null || b === null) return { result: 'Не определено', desc: '-' };
    if (Math.abs(a - b) < 0.001) return { result: 'Чётная', desc: 'Симметрия относительно OY' };
    if (Math.abs(a + b) < 0.001) return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    return { result: 'Общего вида', desc: 'Нет симметрии' };
}

function getContinuityValue(expr, type) {
    if (expr.includes('/x')) return 'Разрывна при x=0';
    if (type === 'log') return 'Непрерывна на (0; +∞)';
    if (type === 'sqrt') return 'Непрерывна на [0; +∞)';
    if (type === 'tan') return 'Разрывна при π/2 + πn';
    if (type === 'cot') return 'Разрывна при πn';
    return 'Непрерывна (предположительно)';
}

// ============================================================================
// ПОСТРОЕНИЕ ГРАФИКА
// ============================================================================
function plotFunction(func, expr, type) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 500;
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    // 🔧 Для sqrt и log начинаем с 0 или малого положительного
    if (type === 'log') startX = 0.01;
    if (type === 'sqrt') startX = 0;

    const isTan = (type === 'tan');
    const isCot = (type === 'cot');
    const isInverse = (type === 'inverse');

    for (let x = startX; x <= endX; x += step) {
        let skip = false;
        let y = null;

        if (isTan) {
            let dist = Math.abs((x - Math.PI/2) % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.15) skip = true;
        } else if (isCot) {
            let dist = Math.abs(x % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.15) skip = true;
        } else if (isInverse && Math.abs(x) < 0.05) {
            skip = true;
        }

        if (!skip) y = func.evaluate(x);
        if (y !== null && (Math.abs(y) > 100 || !isFinite(y))) y = null;

        if (skip || y === null) {
            xVals.push(x);
            yVals.push(null);
        } else {
            xVals.push(x);
            yVals.push(y);
        }
    }
    
    const trace = { x: xVals, y: yVals, mode: 'lines', line: { color: '#2c3e50', width: 3 } };
    
    let yRange = null;
    if (isTan || isCot || isInverse) yRange = [-10, 10];

    const layout = {
        margin: { t: 30, r: 20, b: 40, l: 40 },
        xaxis: { title: 'X', zeroline: true, gridcolor: '#eee', range: [startX, endX] },
        yaxis: { title: 'Y', zeroline: true, gridcolor: '#eee', range: yRange },
        paper_bgcolor: '#fff',
        plot_bgcolor: '#fff'
    };
    
    if (typeof Plotly !== 'undefined') {
        Plotly.react('plot', [trace], layout, {displayModeBar: false});
    }
}

// ============================================================================
// ИНТЕРФЕЙС
// ============================================================================
function updatePropertiesDisplay(props) {
    const container = document.getElementById('propertiesOutput');
    if (!container) return;
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
    const container = document.getElementById('propertiesOutput');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Анализ свойств...</p></div>';
}

function showError(msg) {
    const container = document.getElementById('propertiesOutput');
    if (!container) { alert(msg); return; }
    container.innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div></div>`;
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calculateBtn');
    const funcInput = document.getElementById('functionInput');
    
    if (calcBtn) calcBtn.addEventListener('click', analyzeFunction);
    if (funcInput) funcInput.addEventListener('keypress', e => { if (e.key === 'Enter') analyzeFunction(); });
    
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (funcInput) {
                funcInput.value = this.dataset.func;
                analyzeFunction();
            }
        });
    });
    
    const slider = document.getElementById('xRange');
    const rangeVal = document.getElementById('rangeValue');
    if (slider && rangeVal) {
        slider.addEventListener('input', () => rangeVal.textContent = slider.value);
        slider.addEventListener('change', () => { if(currentFunction) plotFunction(currentFunction, currentExpression, currentType); });
    }
    
    const zoomIn = document.getElementById('zoomInBtn');
    const zoomOut = document.getElementById('zoomOutBtn');
    const resetView = document.getElementById('resetViewBtn');
    
    if (zoomIn && typeof Plotly !== 'undefined') {
        zoomIn.addEventListener('click', () => Plotly.relayout('plot', {'xaxis.range[0]': '*=0.8', 'xaxis.range[1]': '*=0.8'}));
    }
    if (zoomOut && typeof Plotly !== 'undefined') {
        zoomOut.addEventListener('click', () => Plotly.relayout('plot', {'xaxis.range[0]': '*=1.2', 'xaxis.range[1]': '*=1.2'}));
    }
    if (resetView) {
        resetView.addEventListener('click', () => { if(currentFunction) plotFunction(currentFunction, currentExpression, currentType); });
    }
    
    initializePlot();
});

function initializePlot() {
    if (typeof Plotly === 'undefined') return;
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true}, yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
}