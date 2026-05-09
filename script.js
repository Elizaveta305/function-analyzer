// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 9.2)
// Исправлены графики тангенса и котангенса
// ============================================

let currentFunction = null;
let currentExpression = '';
let currentType = 'unknown';

// ============================================================================
// ЯДРО: Парсер
// ============================================================================
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                let cleanExpr = expr.replace(/\s+/g, '').replace(/\^/g, '**');
                
                const __COT__ = (x) => {
                    const s = Math.sin(x);
                    return Math.abs(s) < 1e-10 ? NaN : Math.cos(x) / s;
                };
                
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

                cleanExpr = cleanExpr.replace(/\bpi\b/gi, 'Math.PI');
                cleanExpr = cleanExpr.replace(/\be\b/g, 'Math.E'); 
                cleanExpr = cleanExpr.replace(/\bx\b/g, `(${xVal})`); 
                
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
// АНАЛИЗ СДВИГОВ
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
// ОПРЕДЕЛЕНИЕ ТИПА ФУНКЦИИ
// ============================================================================
function getFunctionType(expr) {
    let clean = expr.toLowerCase()
        .replace(/\s/g, '')
        .replace(/y=/g, '')
        .replace(/f\(x\)=/g, '')
        .replace(/\*\*/g, '^')
        .replace(/\*/g, '');
    
    if (clean === 'x') return 'linear';
    if (clean === 'x^2') return 'quadratic';
    if (clean === 'x^3') return 'cubic';
    if (clean === '1/x') return 'inverse';
    
    if (clean.includes('sqrt(')) return 'sqrt';
    if (clean.includes('exp(')) return 'exp';
    if (clean.includes('log(') || clean.includes('ln(')) return 'log';
    if (clean.includes('sin(')) return 'sin';
    if (clean.includes('cos(')) return 'cos';
    if (clean.includes('tan(')) return 'tan';
    if (clean.includes('cot(')) return 'cot';
    
    if (clean.includes('x^2')) return 'quadratic';
    if (clean.includes('x^3')) return 'cubic';
    if (clean.includes('/x')) return 'inverse';
    if (clean.includes('x')) return 'linear';
    
    return 'unknown';
}

// ============================================================================
// НАЗВАНИЕ ТИПА ФУНКЦИИ
// ============================================================================
function getFunctionTypeName(type, shift) {
    const names = {
        'linear': 'Линейная функция',
        'quadratic': 'Квадратичная функция (парабола)',
        'cubic': 'Кубическая функция',
        'inverse': 'Обратная пропорциональность (гипербола)',
        'sqrt': 'Функция квадратного корня',
        'exp': 'Показательная функция (экспонента)',
        'log': 'Логарифмическая функция',
        'sin': 'Синус',
        'cos': 'Косинус',
        'tan': 'Тангенс',
        'cot': 'Котангенс',
        'unknown': 'Сложная / комбинированная функция'
    };
    
    let name = names[type] || 'Функция';
    if (shift.verticalShift !== 0 || shift.horizontalShift !== 0) {
        name += ' (со сдвигом)';
    }
    return name;
}

// ============================================================================
// БАЗОВЫЕ СВОЙСТВА ФУНКЦИЙ
// ============================================================================
const BASE_PROPERTIES = {
    'linear': {
        domain: '(-∞; +∞)',
        range: '(-∞; +)',
        zeros: [0],
        monotonicity: 'Возрастает при x∈(-∞; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        extremes: 'Не имеет (±∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        continuity: 'Непрерывна на всей области',
        bounded: 'Не ограничена',
        asymptotes: 'Нет'
    },
    'quadratic': {
        domain: '(-∞; +∞)',
        range: '[0; +∞)',
        zeros: [0],
        monotonicity: 'Убывает при x∈(-∞; 0), возрастает при x∈(0; +∞)',
        sign: 'f(x)>0 при x∈(-∞; 0)∪(0; +∞); f(x)=0 при x=0',
        extremes: 'min: 0 (при x=0), max: не имеет',
        parity: { result: 'Чётная', desc: 'Симметрия относительно оси OY' },
        continuity: 'Непрерывна на всей области',
        bounded: 'Ограничена снизу',
        asymptotes: 'Нет'
    },
    'cubic': {
        domain: '(-∞; +∞)',
        range: '(-∞; +∞)',
        zeros: [0],
        monotonicity: 'Возрастает при x∈(-∞; +)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        extremes: 'Не имеет (±∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        continuity: 'Непрерывна на всей области',
        bounded: 'Не ограничена',
        asymptotes: 'Нет'
    },
    'inverse': {
        domain: '(-∞; 0) ∪ (0; +∞)',
        range: '(-∞; 0) ∪ (0; +∞)',
        zeros: [],
        monotonicity: 'Убывает при x∈(-∞; 0) и при x∈(0; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        extremes: 'Не имеет (±∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        continuity: 'Разрывна при x=0',
        bounded: 'Не ограничена',
        asymptotes: 'Вертикальная: x=0; Горизонтальная: y=0'
    },
    'sqrt': {
        domain: '[0; +∞)',
        range: '[0; +∞)',
        zeros: [0],
        monotonicity: 'Строго возрастает при x∈[0; +∞)',
        sign: 'f(x)=0 при x=0; f(x)>0 при x∈(0; +∞)',
        extremes: 'min: 0 (при x=0), max: не имеет',
        parity: { result: 'Общего вида', desc: 'Область определения не симметрична' },
        continuity: 'Непрерывна на [0; +∞)',
        bounded: 'Ограничена снизу',
        asymptotes: 'Нет'
    },
    'exp': {
        domain: '(-∞; +∞)',
        range: '(0; +∞)',
        zeros: [],
        monotonicity: 'Возрастает при x∈(-∞; +∞)',
        sign: 'f(x)>0 при всех x',
        extremes: 'min: не имеет, max: не имеет',
        parity: { result: 'Общего вида', desc: 'Нет симметрии' },
        continuity: 'Непрерывна на всей области',
        bounded: 'Ограничена снизу',
        asymptotes: 'Горизонтальная: y=0 (при x→-∞)'
    },
    'log': {
        domain: '(0; +∞)',
        range: '(-∞; +∞)',
        zeros: [1],
        monotonicity: 'Возрастает при x∈(0; +∞)',
        sign: 'f(x)>0 при x∈(1; +∞); f(x)<0 при x∈(0; 1)',
        extremes: 'Не имеет (±∞)',
        parity: { result: 'Общего вида', desc: 'Нет симметрии' },
        continuity: 'Непрерывна на (0; +∞)',
        bounded: 'Не ограничена',
        asymptotes: 'Вертикальная: x=0'
    },
    'sin': {
        domain: '(-∞; +)',
        range: '[-1; 1]',
        zeros: ['0', 'π', '-π', '2π', '-2π'],
        monotonicity: 'Не монотонна (периодическая)',
        sign: 'Периодически меняется знак',
        extremes: 'min: -1, max: 1',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        continuity: 'Непрерывна на всей области',
        bounded: 'Ограничена: -1 ≤ f(x) ≤ 1',
        asymptotes: 'Нет',
        period: '2π'
    },
    'cos': {
        domain: '(-∞; +∞)',
        range: '[-1; 1]',
        zeros: ['π/2', '-π/2', '3π/2', '-3π/2'],
        monotonicity: 'Не монотонна (периодическая)',
        sign: 'Периодически меняется знак',
        extremes: 'min: -1, max: 1',
        parity: { result: 'Чётная', desc: 'Симметрия относительно оси OY' },
        continuity: 'Непрерывна на всей области',
        bounded: 'Ограничена: -1 ≤ f(x) ≤ 1',
        asymptotes: 'Нет',
        period: '2π'
    },
    'tan': {
        domain: 'Все x, кроме π/2 + πn',
        range: '(-∞; +∞)',
        zeros: ['0', 'π', '-π', '2π', '-2π'],
        monotonicity: 'Возрастает на каждом промежутке непрерывности',
        sign: 'Периодически меняется знак',
        extremes: 'Не имеет (±∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        continuity: 'Разрывна при x = π/2 + πn',
        bounded: 'Не ограничена',
        asymptotes: 'Вертикальные: x = π/2 + πn',
        period: 'π'
    },
    'cot': {
        domain: 'Все x, кроме πn',
        range: '(-∞; +∞)',
        zeros: ['π/2', '-π/2', '3π/2', '-3π/2'],
        monotonicity: 'Убывает на каждом промежутке непрерывности',
        sign: 'Периодически меняется знак',
        extremes: 'Не имеет (±∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        continuity: 'Разрывна при x = πn',
        bounded: 'Не ограничена',
        asymptotes: 'Вертикальные: x = πn',
        period: 'π'
    }
};

// ============================================================================
// ПРИМЕНЕНИЕ СДВИГОВ К СВОЙСТВАМ
// ============================================================================
function applyShiftToProperties(baseProps, shift, type) {
    const props = { ...baseProps };
    const v = shift.verticalShift;
    const h = shift.horizontalShift;
    
    // 1. Область определения
    if (h !== 0) {
        if (type === 'sqrt') {
            props.domain = `[${formatNumber(-h)}; +∞)`;
        } else if (type === 'log') {
            props.domain = `(${formatNumber(-h)}; +∞)`;
        } else if (type === 'inverse') {
            props.domain = `(-∞; ${formatNumber(-h)}) ∪ (${formatNumber(-h)}; +∞)`;
        } else if (type === 'tan') {
            props.domain = `Все x, кроме ${formatNumber(Math.PI/2 - h)} + πn`;
        } else if (type === 'cot') {
            props.domain = `Все x, кроме ${formatNumber(-h)} + πn`;
        }
    }
    
    // 2. Область значений
    if (v !== 0) {
        if (type === 'sqrt') {
            props.range = `[${formatNumber(v)}; +∞)`;
        } else if (type === 'exp') {
            props.range = `(${formatNumber(v)}; +∞)`;
        } else if (type === 'sin' || type === 'cos') {
            props.range = `[${formatNumber(-1 + v)}; ${formatNumber(1 + v)}]`;
        } else if (type === 'quadratic') {
            props.range = `[${formatNumber(v)}; +∞)`;
        }
    }
    
    // 3. Нули функции
    if (type === 'sqrt') {
        if (v > 0) {
            props.zeros = [];
        } else if (v === 0) {
            props.zeros = [h !== 0 ? -h : 0];
        } else {
            props.zeros = [formatNumber(Math.pow(-v, 2) - h)];
        }
    } else if (type === 'exp') {
        props.zeros = [];
    } else if (type === 'log') {
        if (v === 0 && h === 0) {
            props.zeros = [1];
        } else {
            const zero = Math.exp(-v) - h;
            props.zeros = [formatNumber(zero)];
        }
    } else if (type === 'sin') {
        if (Math.abs(v) > 1) {
            props.zeros = [];
        } else {
            const baseZero = Math.asin(-v);
            props.zeros = [`${formatNumber(baseZero - h)} + 2πn`, `${formatNumber(Math.PI - baseZero - h)} + 2πn`];
        }
    } else if (type === 'cos') {
        if (Math.abs(v) > 1) {
            props.zeros = [];
        } else {
            const baseZero = Math.acos(-v);
            props.zeros = [`${formatNumber(baseZero - h)} + 2πn`, `${formatNumber(-baseZero - h)} + 2πn`];
        }
    } else if (type === 'tan') {
        const baseZero = Math.atan(-v);
        props.zeros = [`${formatNumber(baseZero - h)} + πn`];
    } else if (type === 'cot') {
        const baseZero = Math.atan(-1/v);
        props.zeros = [`${formatNumber(baseZero - h)} + πn`];
    }
    
    // 4. Монотонность
    if (type === 'sqrt' && h !== 0) {
        props.monotonicity = `Строго возрастает при x∈[${formatNumber(-h)}; +∞)`;
    } else if (type === 'log' && h !== 0) {
        props.monotonicity = `Возрастает при x∈(${formatNumber(-h)}; +∞)`;
    } else if (type === 'quadratic' && h !== 0) {
        props.monotonicity = `Убывает при x∈(-∞; ${formatNumber(-h)}), возрастает при x∈(${formatNumber(-h)}; +∞)`;
    }
    
    // 5. Знакопостоянство
    if (type === 'sqrt' && v !== 0) {
        if (v > 0) {
            props.sign = `f(x)>0 при x∈[${formatNumber(-h)}; +∞)`;
        } else {
            const zero = Math.pow(-v, 2) - h;
            props.sign = `f(x)<0 при x∈[${formatNumber(-h)}; ${formatNumber(zero)}); f(x)>0 при x∈(${formatNumber(zero)}; +∞)`;
        }
    } else if (type === 'exp' && v !== 0) {
        if (v >= 0) {
            props.sign = 'f(x)>0 при всех x';
        } else {
            const zero = Math.log(-v);
            props.sign = `f(x)<0 при x∈(-∞; ${formatNumber(zero)}); f(x)>0 при x∈(${formatNumber(zero)}; +∞)`;
        }
    } else if (type === 'log' && (v !== 0 || h !== 0)) {
        const zero = Math.exp(-v) - h;
        props.sign = `f(x)<0 при x∈(${formatNumber(-h)}; ${formatNumber(zero)}); f(x)>0 при x∈(${formatNumber(zero)}; +∞)`;
    }
    
    // 6. Экстремумы
    if (type === 'sqrt') {
        props.extremes = `min: ${formatNumber(v)} (при x=${formatNumber(-h)}), max: не имеет`;
    } else if (type === 'exp') {
        props.extremes = `min: не имеет (inf = ${formatNumber(v)}), max: не имеет`;
    } else if (type === 'sin' || type === 'cos') {
        props.extremes = `min: ${formatNumber(-1 + v)}, max: ${formatNumber(1 + v)}`;
    } else if (type === 'quadratic') {
        props.extremes = `min: ${formatNumber(v)} (при x=${formatNumber(-h)}), max: не имеет`;
    }
    
    // 7. Четность
    if (v !== 0 || h !== 0) {
        if (type === 'cos' && v !== 0 && h === 0) {
            props.parity = { result: 'Чётная', desc: 'Симметрия относительно оси OY' };
        } else {
            props.parity = { result: 'Общего вида', desc: 'Область определения не симметрична или сдвиг нарушает симметрию' };
        }
    }
    
    // 8. Непрерывность
    if (type === 'sqrt' && h !== 0) {
        props.continuity = `Непрерывна на [${formatNumber(-h)}; +∞)`;
    } else if (type === 'log' && h !== 0) {
        props.continuity = `Непрерывна на (${formatNumber(-h)}; +∞)`;
    }
    
    // 9. Асимптоты
    if (type === 'exp' && v !== 0) {
        props.asymptotes = `Горизонтальная: y=${formatNumber(v)} (при x→-∞)`;
    } else if (type === 'log' && h !== 0) {
        props.asymptotes = `Вертикальная: x=${formatNumber(-h)}`;
    } else if (type === 'inverse' && (h !== 0 || v !== 0)) {
        props.asymptotes = `Вертикальная: x=${formatNumber(-h)}; Горизонтальная: y=${formatNumber(v)}`;
    } else if (type === 'tan' && h !== 0) {
        props.asymptotes = `Вертикальные: x=${formatNumber(Math.PI/2 - h)} + πn`;
    } else if (type === 'cot' && h !== 0) {
        props.asymptotes = `Вертикальные: x=${formatNumber(-h)} + πn`;
    }
    
    return props;
}

// ============================================================================
// ФОРМАТИРОВАНИЕ
// ============================================================================
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    const number = typeof num === 'string' ? parseFloat(num) : Number(num);
    if (isNaN(number)) return String(num);
    if (Math.abs(number) < 0.001) return '0';
    if (Math.abs(number) > 1000) return number > 0 ? '+∞' : '-∞';
    return number.toFixed(1);
}

function formatZeros(zeros, type) {
    if (!zeros || zeros.length === 0) return 'Нет действительных корней';
    return zeros.map(z => {
        if (typeof z === 'string' && (z.includes('π') || z.includes('n'))) return z;
        const num = typeof z === 'string' ? parseFloat(z) : z;
        if (isNaN(num)) return String(z);
        if (Number.isInteger(num)) return String(num);
        return num.toFixed(1);
    }).join(', ');
}

function safeToFixed(value, decimals = 1) {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return String(value);
    return num.toFixed(decimals);
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
            const baseType = getFunctionType(expr);
            currentType = baseType;
            
            const shift = analyzeShift(expr, baseType);
            
            let isValid = false;
            let testPoints = [];
            const h = shift.horizontalShift;
            
            if (baseType === 'log' || baseType === 'sqrt') {
                testPoints = [Math.max(0.1, -h + 0.1), Math.max(0.1, -h + 1), Math.max(0.1, -h + 4)];
            } else if (baseType === 'tan' || baseType === 'cot') {
                testPoints = [0.7 - h, 1.2 - h, 2.3 - h];
            } else {
                testPoints = [-2, -1, 0, 1, 2];
            }
            
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
            
            const baseProps = BASE_PROPERTIES[baseType];
            const properties = baseProps ? applyShiftToProperties(baseProps, shift, baseType) : calculatePropertiesNumerically(func, expr, baseType);
            properties.typeName = getFunctionTypeName(baseType, shift);
            properties.type = baseType;
            updatePropertiesDisplay(properties);
            
            document.getElementById('graphStatus').textContent = 'Построение...';
            plotFunction(func, expr, baseType, shift);
            document.getElementById('graphStatus').textContent = 'Готово';
            
        } catch (error) {
            console.error(error);
            showError(`Ошибка: ${error.message}. Проверьте синтаксис.`);
            document.getElementById('graphStatus').textContent = 'Ошибка';
        }
    }, 50);
}

// ============================================================================
// ЧИСЛЕННЫЙ РАСЧЁТ
// ============================================================================
function calculatePropertiesNumerically(func, expr, type) {
    return {
        typeName: getFunctionTypeName(type, {verticalShift: 0, horizontalShift: 0}),
        type: type,
        domain: getDomain(expr, type),
        range: calculateRangeNumerically(func, expr, type),
        zeros: findZeros(func, expr, type),
        monotonicity: calculateMonotonicityWithIntervals(func, expr, type),
        sign: calculateSignIntervalsNumerically(func, expr, type),
        extremes: calculateExtremesNumerically(func, expr, type),
        parity: checkParity(func, type),
        continuity: getContinuityValue(expr, type),
        bounded: calculateBoundednessNumerically(func),
        asymptotes: findAsymptotesAdvanced(expr, func, type)
    };
}

// ============================================================================
// ИНТЕРФЕЙС
// ============================================================================
function updatePropertiesDisplay(props) {
    const container = document.getElementById('propertiesOutput');
    if (!container) return;
    
    const html = [];
    
    html.push(`
        <div class="property-item">
            <div class="property-icon">📊</div>
            <div class="property-content">
                <div class="property-title">Тип функции</div>
                <div class="property-value">${props.typeName || 'Функция'}</div>
                <div class="property-desc">Классификация</div>
            </div>
        </div>
    `);
    
    if (props.domain) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">🌐</div>
                <div class="property-content">
                    <div class="property-title">1. Область определения</div>
                    <div class="property-value">${props.domain}</div>
                    <div class="property-desc">D(f)</div>
                </div>
            </div>
        `);
    }
    
    if (props.range) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">📏</div>
                <div class="property-content">
                    <div class="property-title">2. Область значений</div>
                    <div class="property-value">${props.range}</div>
                    <div class="property-desc">E(f)</div>
                </div>
            </div>
        `);
    }
    
    if (props.zeros !== undefined) {
        const zerosText = typeof props.zeros === 'string' ? props.zeros : formatZeros(props.zeros, props.type);
        html.push(`
            <div class="property-item">
                <div class="property-icon">⚫</div>
                <div class="property-content">
                    <div class="property-title">3. Нули функции</div>
                    <div class="property-value">${zerosText}</div>
                    <div class="property-desc">f(x) = 0</div>
                </div>
            </div>
        `);
    }
    
    if (props.monotonicity) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">📈</div>
                <div class="property-content">
                    <div class="property-title">4. Монотонность</div>
                    <div class="property-value">${props.monotonicity}</div>
                    <div class="property-desc">Промежутки возрастания/убывания</div>
                </div>
            </div>
        `);
    }
    
    if (props.sign) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">➕➖</div>
                <div class="property-content">
                    <div class="property-title">5. Знакопостоянство</div>
                    <div class="property-value">${props.sign}</div>
                    <div class="property-desc">Где функция положительна/отрицательна</div>
                </div>
            </div>
        `);
    }
    
    if (props.extremes) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">🏆</div>
                <div class="property-content">
                    <div class="property-title">6. Наиб. и наим. значения</div>
                    <div class="property-value">${props.extremes}</div>
                    <div class="property-desc">Экстремумы функции</div>
                </div>
            </div>
        `);
    }
    
    if (props.parity) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">🔄</div>
                <div class="property-content">
                    <div class="property-title">7. Чётность</div>
                    <div class="property-value">${props.parity.result}</div>
                    <div class="property-desc">${props.parity.desc}</div>
                </div>
            </div>
        `);
    }
    
    if (props.continuity) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">〰️</div>
                <div class="property-content">
                    <div class="property-title">8. Непрерывность</div>
                    <div class="property-value">${props.continuity}</div>
                    <div class="property-desc">Точки разрыва</div>
                </div>
            </div>
        `);
    }
    
    if (props.bounded) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">🔒</div>
                <div class="property-content">
                    <div class="property-title">9. Ограниченность</div>
                    <div class="property-value">${props.bounded}</div>
                    <div class="property-desc">Наличие границ</div>
                </div>
            </div>
        `);
    }
    
    if (props.asymptotes) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">↗️</div>
                <div class="property-content">
                    <div class="property-title">10. Асимптоты</div>
                    <div class="property-value">${props.asymptotes}</div>
                    <div class="property-desc">Линии, к которым стремится график</div>
                </div>
            </div>
        `);
    }
    
    if (props.period && ['sin', 'cos', 'tan', 'cot'].includes(props.type)) {
        html.push(`
            <div class="property-item">
                <div class="property-icon">⏱️</div>
                <div class="property-content">
                    <div class="property-title">11. Периодичность</div>
                    <div class="property-value">Периодическая (T=${props.period})</div>
                    <div class="property-desc">Повторяется через промежуток</div>
                </div>
            </div>
        `);
    }
    
    container.innerHTML = html.join('');
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================
function getDomain(expr, type) {
    if (type === 'log') return '(0; +∞)';
    if (type === 'sqrt') return '[0; +∞)';
    if (type === 'inverse' || expr.includes('/x')) return '(-∞; 0) ∪ (0; +∞)';
    if (type === 'tan') return 'Все x, кроме π/2 + πn';
    if (type === 'cot') return 'Все x, кроме πn';
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
    if (['linear', 'cubic', 'quadratic'].includes(type)) return [0];
    
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
    if (['linear', 'cubic', 'inverse', 'tan', 'cot', 'sin'].includes(type)) 
        return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    if (['quadratic', 'cos'].includes(type))
        return { result: 'Чётная', desc: 'Симметрия относительно оси OY' };
    if (['sqrt', 'log', 'exp'].includes(type))
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

function calculateRangeNumerically(func, expr, type) {
    if (['sin', 'cos'].includes(type)) return '[-1; 1]';
    if (type === 'exp') return '(0; +∞)';
    if (type === 'log') return '(-∞; +∞)';
    if (type === 'sqrt') return '[0; +∞)';
    if (type === 'inverse') return '(-∞; 0) ∪ (0; +∞)';
    
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
    return `[${formatNumber(min)}; ${formatNumber(max)}]`;
}

function calculateMonotonicityWithIntervals(func, expr, type) {
    if (BASE_PROPERTIES[type]?.monotonicity) return BASE_PROPERTIES[type].monotonicity;
    
    let inc = 0, dec = 0;
    const points = [-10, -5, -1, -0.1, 0.1, 1, 5, 10];
    
    for (let i = 0; i < points.length - 1; i++) {
        const y1 = func.evaluate(points[i]);
        const y2 = func.evaluate(points[i+1]);
        if (y1 !== null && y2 !== null) {
            if (y2 > y1 + 0.01) inc++;
            else if (y2 < y1 - 0.01) dec++;
        }
    }
    
    if (inc > 0 && dec === 0) return 'Возрастает при x∈(-∞; +∞)';
    if (dec > 0 && inc === 0) return 'Убывает при x∈(-∞; +∞)';
    return 'Не монотонна (меняет характер)';
}

function calculateExtremesNumerically(func, expr, type) {
    if (['linear', 'cubic', 'inverse', 'tan', 'cot', 'log'].includes(type)) return 'Не имеет (±∞)';
    if (type === 'exp') return 'min: не имеет, max: не имеет';
    if (['sin', 'cos'].includes(type)) return 'min: -1, max: 1';
    
    let min = Infinity, max = -Infinity;
    for (let x = -20; x <= 20; x += 0.1) {
        const y = func.evaluate(x);
        if (y !== null && isFinite(y)) {
            if (y < min) min = y;
            if (y > max) max = y;
        }
    }
    if (min === Infinity) return 'Не определено';
    if (max - min > 1000) return 'Не имеет (±∞)';
    return `min: ${formatNumber(min)}, max: ${formatNumber(max)}`;
}

function calculateBoundednessNumerically(func) {
    for (let x of [-100, 100]) {
        const y = func.evaluate(x);
        if (y !== null && Math.abs(y) > 1000) return 'Не ограничена';
    }
    return 'Ограничена (локально)';
}

function findAsymptotesAdvanced(expr, func, type) {
    if (type === 'inverse') return 'Вертикальная: x=0; Горизонтальная: y=0';
    if (type === 'tan') return 'Вертикальные: x = π/2 + πn';
    if (type === 'cot') return 'Вертикальные: x = πn';
    if (type === 'log') return 'Вертикальная: x=0';
    if (type === 'exp') return 'Горизонтальная: y=0 (при x→-∞)';
    return 'Нет';
}

function calculateSignIntervalsNumerically(func, expr) {
    const zeros = findZeros(func, expr, 'unknown');
    if (!zeros || zeros.length === 0) {
        const test = func.evaluate(0);
        if (test !== null) return test > 0 ? 'f(x)>0 при x∈(-∞; +∞)' : 'f(x)<0 при x∈(-∞; +∞)';
        return 'Не определено';
    }
    let pos = [], neg = [];
    let points = [-10, ...zeros.map(z => typeof z === 'string' ? 0 : Number(z)).filter(n => !isNaN(n)), 10];
    for (let i = 0; i < points.length - 1; i++) {
        let mid = (points[i] + points[i+1]) / 2;
        const val = func.evaluate(mid);
        if (val !== null) {
            const interval = `(${safeToFixed(points[i], 1)}; ${safeToFixed(points[i+1], 1)})`;
            if (val > 0) pos.push(interval);
            else neg.push(interval);
        }
    }
    let res = '';
    if (pos.length > 0) res += `f(x)>0 при x∈${pos.join(' ∪ ')}. `;
    if (neg.length > 0) res += `f(x)<0 при x∈${neg.join(' ∪ ')}`;
    return res.length > 70 ? res.substring(0, 65) + '...' : res;
}

// ============================================================================
// ПОСТРОЕНИЕ ГРАФИКА (ИСПРАВЛЕНО для тангенса и котангенса)
// ============================================================================
function plotFunction(func, expr, type, shift) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 800;  // 🔧 Увеличил количество точек
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    const h = shift.horizontalShift;
    const v = shift.verticalShift;
    
    if (type === 'log') startX = Math.max(-range, -h + 0.01);
    if (type === 'sqrt') startX = Math.max(-range, -h);

    const isTan = (type === 'tan');
    const isCot = (type === 'cot');
    const isInverse = (type === 'inverse');
    const isExp = (type === 'exp');

    for (let x = startX; x <= endX; x += step) {
        let skip = false;
        let y = null;

        // 🔧 Уменьшил зону пропуска с 0.15 до 0.05
        if (isTan) {
            let dist = Math.abs((x + h - Math.PI/2) % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.05) skip = true;
        } else if (isCot) {
            let dist = Math.abs((x + h) % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.05) skip = true;
        } else if (isInverse && Math.abs(x + h) < 0.05) {
            skip = true;
        }

        if (!skip) y = func.evaluate(x);
        
        // 🔧 Увеличил порог отсечения для tan/cot
        if (!isExp && !isTan && !isCot && y !== null && (Math.abs(y) > 100 || !isFinite(y))) y = null;
        if ((isTan || isCot) && y !== null && Math.abs(y) > 500) y = null;
        if (isExp && y !== null && !isFinite(y)) y = null;

        if (skip || y === null) {
            xVals.push(x);
            yVals.push(null);
        } else {
            xVals.push(x);
            yVals.push(y);
        }
    }
    
    const trace = { x: xVals, y: yVals, mode: 'lines', line: { color: '#2c3e50', width: 3 } };
    
    // 🔧 Увеличил Y-диапазон для tan/cot
    let yRange = null;
    if (isTan || isCot) {
        yRange = [-20, 20];
    } else if (isInverse) {
        yRange = [-10, 10];
    } else if (isExp) {
        const validY = yVals.filter(y => y !== null && isFinite(y));
        const maxY = validY.length > 0 ? Math.max(...validY) : 10;
        const minY = v > 0 ? v - 1 : -2;
        yRange = [minY, Math.min(maxY * 1.2, 20)];
    }

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
        slider.addEventListener('change', () => { 
            if(currentFunction) {
                const shift = analyzeShift(currentExpression, currentType);
                plotFunction(currentFunction, currentExpression, currentType, shift);
            }
        });
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
        resetView.addEventListener('click', () => { 
            if(currentFunction) {
                const shift = analyzeShift(currentExpression, currentType);
                plotFunction(currentFunction, currentExpression, currentType, shift);
            }
        });
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