// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 7.0 - FINAL)
// Полная поддержка котангенса + 13 свойств + стабильность
// ============================================

let currentFunction = null;
let currentExpression = '';
let currentType = 'unknown';

// ============================================================================
// ЯДРО: Парсер с хелпером для котангенса (БЕЗОПАСНАЯ ЗАМЕНА)
// ============================================================================
function parseFunction(expr) {
    const displayExpr = expr;
    currentExpression = expr;
    
    return {
        evaluate: function(xVal) {
            try {
                // 1. Базовая очистка
                let cleanExpr = expr.replace(/\s+/g, '').replace(/\^/g, '**');
                
                // 2. Хелпер для котангенса (защищён от деления на ноль)
                const __FN_COT__ = (arg) => {
                    const s = Math.sin(arg);
                    return Math.abs(s) < 1e-10 ? NaN : Math.cos(arg) / s;
                };
                
                // 3. Замена ВСЕХ функций на плейсхолдеры (cot - ПЕРВЫМ!)
                cleanExpr = cleanExpr
                    .replace(/cot\(/g, '__FN_COT__(')
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
                // __FN_COT__ НЕ трогаем - он останется как вызов хелпер-функции
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
                
                // 6. Выполнение с передачей хелпера в контекст
                const result = new Function('__FN_COT__', 'return ' + cleanExpr)(__FN_COT__);
                
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
    
    if (clean.includes('tan(')) return 'tan';
    if (clean.includes('cot(')) return 'cot';
    if (clean.includes('sin(')) return 'sin';
    if (clean.includes('cos(')) return 'cos';
    if (clean.includes('exp(')) return 'exp';
    if (clean.includes('log(') || clean.includes('ln(')) return 'log';
    
    if (clean.includes('x^2')) return 'quadratic_general';
    if (clean.includes('x^3')) return 'cubic_general';
    if (clean.includes('/x')) return 'rational';
    if (clean.includes('x')) return 'polynomial';
    
    return 'unknown';
}

// ============================================================================
// БАЗА ЗНАНИЙ: Аналитические данные для стандартных функций
// ============================================================================
const ANALYTICAL_DATA = {
    'linear_origin': {
        range: '(-∞; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Непрерывна на всей области',
        convexity: { text: 'Не имеет перегибов', desc: 'Линейная функция' },
        monotonicity: 'Возрастает на всей области',
        localExtrema: { text: 'Отсутствуют', desc: 'Функция монотонна' },
        domain: '(-∞; +∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        zeros: [0]
    },
    'quadratic_origin': {
        range: '[0; +∞)',
        sign: 'f(x)>0 при x∈(-∞; 0)∪(0; +∞); f(x)=0 при x=0',
        bounded: 'Ограничена снизу',
        extremes: 'min: 0 (при x=0), max: +∞',
        continuity: 'Непрерывна на всей области',
        convexity: { text: 'Выпукла вниз', desc: 'На всей области (a>0)' },
        monotonicity: 'Убывает при x<0, возрастает при x>0',
        localExtrema: { text: 'Минимум при x=0', desc: 'Единственная точка экстремума' },
        domain: '(-∞; +∞)',
        parity: { result: 'Чётная', desc: 'Симметрия относительно оси OY' },
        zeros: [0]
    },
    'cubic_origin': {
        range: '(-∞; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Непрерывна на всей области',
        convexity: { text: 'Меняет выпуклость', desc: 'Перегиб в точке x=0' },
        monotonicity: 'Возрастает на всей области',
        localExtrema: { text: 'Отсутствуют', desc: 'Функция монотонна' },
        domain: '(-∞; +∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        zeros: [0]
    },
    'inverse': {
        range: '(-∞; 0) ∪ (0; +∞)',
        sign: 'f(x)>0 при x∈(0; +∞); f(x)<0 при x∈(-∞; 0)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Разрывна при x=0',
        convexity: { text: 'Разная на промежутках', desc: 'Выпукла вниз при x>0, вверх при x<0' },
        monotonicity: 'Убывает на (-∞; 0) и на (0; +∞)',
        localExtrema: { text: 'Отсутствуют', desc: 'Нет точек экстремума' },
        domain: '(-∞; 0) ∪ (0; +∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        zeros: []
    },
    'exp': {
        range: '(0; +∞)',
        sign: 'f(x)>0 при x∈(-∞; +∞)',
        bounded: 'Ограничена снизу',
        extremes: 'min: 0 (асимптота), max: +∞',
        continuity: 'Непрерывна на всей области',
        convexity: { text: 'Выпукла вниз', desc: 'На всей области' },
        monotonicity: 'Возрастает на всей области',
        localExtrema: { text: 'Отсутствуют', desc: 'Функция монотонна' },
        domain: '(-∞; +∞)',
        parity: { result: 'Общего вида', desc: 'Нет симметрии' },
        zeros: []
    },
    'log': {
        range: '(-∞; +∞)',
        sign: 'f(x)>0 при x∈(1; +∞); f(x)<0 при x∈(0; 1)',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Непрерывна на (0; +∞)',
        convexity: { text: 'Выпукла вверх', desc: 'На всей области' },
        monotonicity: 'Возрастает на всей области',
        localExtrema: { text: 'Отсутствуют', desc: 'Функция монотонна' },
        domain: '(0; +∞)',
        parity: { result: 'Общего вида', desc: 'Нет симметрии' },
        zeros: [1]
    },
    'sin': {
        range: '[-1; 1]',
        sign: 'Периодически меняется знак',
        bounded: 'Ограничена (сверху и снизу)',
        extremes: 'min: -1, max: 1',
        continuity: 'Непрерывна на всей области',
        convexity: { text: 'Периодически меняется', desc: 'Есть промежутки выпуклости и вогнутости' },
        monotonicity: 'Не монотонна (периодическая)',
        localExtrema: { text: 'Максимумы при π/2+2πn, Минимумы при -π/2+2πn', desc: 'Бесконечное кол-во' },
        domain: '(-∞; +∞)',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        zeros: [0, 3.14, -3.14, 6.28, -6.28]
    },
    'cos': {
        range: '[-1; 1]',
        sign: 'Периодически меняется знак',
        bounded: 'Ограничена (сверху и снизу)',
        extremes: 'min: -1, max: 1',
        continuity: 'Непрерывна на всей области',
        convexity: { text: 'Периодически меняется', desc: 'Есть промежутки выпуклости и вогнутости' },
        monotonicity: 'Не монотонна (периодическая)',
        localExtrema: { text: 'Максимумы при 2πn, Минимумы при π+2πn', desc: 'Бесконечное кол-во' },
        domain: '(-∞; +∞)',
        parity: { result: 'Чётная', desc: 'Симметрия относительно оси OY' },
        zeros: [1.57, -1.57, 4.71, -4.71]
    },
    'tan': {
        range: '(-∞; +∞)',
        sign: 'Периодически меняется знак',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Разрывна при x = π/2 + πn',
        convexity: { text: 'Периодически меняется', desc: 'Есть промежутки выпуклости и вогнутости' },
        monotonicity: 'Не монотонна (периодическая)',
        localExtrema: { text: 'Отсутствуют', desc: 'Нет точек экстремума' },
        domain: 'Все x, кроме π/2 + πn',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        zeros: [0, 3.14, -3.14, 6.28, -6.28]
    },
    'cot': {
        range: '(-∞; +∞)',
        sign: 'Периодически меняется знак',
        bounded: 'Не ограничена',
        extremes: 'Не имеет (±∞)',
        continuity: 'Разрывна при x = πn',
        convexity: { text: 'Периодически меняется', desc: 'Есть промежутки выпуклости и вогнутости' },
        monotonicity: 'Не монотонна (периодическая)',
        localExtrema: { text: 'Отсутствуют', desc: 'Нет точек экстремума' },
        domain: 'Все x, кроме πn',
        parity: { result: 'Нечётная', desc: 'Симметрия относительно начала координат' },
        zeros: [1.57, -1.57, 4.71, -4.71]
    }
};

// ============================================================================
// ОСНОВНАЯ ЛОГИКА: Запуск анализа
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
            
            // Умный выбор тестовых точек
            let isValid = false;
            let testPoints = [];
            
            if (type === 'log') testPoints = [1, 2, Math.E];
            else if (type === 'tan') testPoints = [0.5, 1.0, 2.0];
            else if (type === 'cot') testPoints = [0.7, 1.2, 2.3]; // 🔧 Избегаем 0 и π
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
            document.getElementById('graphStatus').textContent = 'Анализ 13 свойств...';
            
            const properties = analyzeFunctionProperties(expr, func, type);
            updatePropertiesDisplay(properties);
            
            document.getElementById('graphStatus').textContent = 'Построение графика...';
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
// АНАЛИЗ ВСЕХ 13 СВОЙСТВ
// ============================================================================
function analyzeFunctionProperties(expr, func, type) {
    const props = [];
    const data = ANALYTICAL_DATA[type];
    
    // 1. Область определения
    props.push({ title: '1. Область определения', value: data ? data.domain : getDomain(expr, type), icon: '🌐', desc: 'D(f)' });
    
    // 2. Область значений
    props.push({ title: '2. Область значений', value: data ? data.range : calculateRangeNumerically(func), icon: '📏', desc: 'E(f)' });
    
    // 3. Нули функции
    const zeros = data ? data.zeros : findZeros(func, expr, type);
    const zerosText = zeros.length > 0 ? zeros.map(z => formatNumber(z)).join(', ') : 'Нет действительных корней';
    props.push({ title: '3. Нули функции', value: zerosText, icon: '⚫', desc: 'f(x) = 0' });

    // 4. Пересечение с осью OY
    const y0 = func.evaluate(0);
    if (y0 !== null && isFinite(y0) && Math.abs(y0) > 0.01) {
        props.push({ title: '4. Пересечение с OY', value: `(0; ${formatNumber(y0)})`, icon: '🔵', desc: 'При x = 0' });
    }

    // 5. Четность
    const parity = data ? data.parity : checkParity(func, type);
    props.push({ title: '5. Четность', value: parity.result, icon: '🔄', desc: parity.desc });
    
    // 6. Монотонность
    props.push({ title: '6. Монотонность', value: data ? data.monotonicity : calculateMonotonicityNumerically(func), icon: '📈', desc: 'Характер изменения' });
    
    // 7. Знакопостоянство
    props.push({ title: '7. Знакопостоянство', value: data ? data.sign : calculateSignIntervalsNumerically(func, expr), icon: '➕➖', desc: 'Интервалы знака' });
    
    // 8. Ограниченность
    props.push({ title: '8. Ограниченность', value: data ? data.bounded : calculateBoundednessNumerically(func), icon: '🔒', desc: 'Наличие границ' });
    
    // 9. Наим. и наиб. значение
    props.push({ title: '9. Наим. и наиб. значение', value: data ? data.extremes : calculateExtremesNumerically(func), icon: '🏆', desc: 'Экстремумы на ℝ' });
    
    // 10. Непрерывность
    props.push({ title: '10. Непрерывность', value: data ? data.continuity : getContinuityValue(expr, type), icon: '〰️', desc: 'Точки разрыва' });
    
    // 11. Выпуклость
    const convexInfo = data ? data.convexity : calculateConvexityNumerically(func, expr);
    if (convexInfo) {
        props.push({ title: '11. Выпуклость', value: convexInfo.text, icon: '📉', desc: convexInfo.desc });
    }

    // 12. Периодичность
    if (['sin', 'cos', 'tan', 'cot'].includes(type)) {
        const period = (type === 'tan' || type === 'cot') ? 'π' : '2π';
        props.push({ title: '12. Периодичность', value: `Периодическая (T=${period})`, icon: '⏱️', desc: 'Повторяется через промежуток' });
    } else {
        props.push({ title: '12. Периодичность', value: 'Не периодическая', icon: '⏱️', desc: 'Не имеет периода' });
    }

    // 13. Локальные экстремумы
    const extremaInfo = data ? data.localExtrema : calculateLocalExtremaNumerically(func, expr);
    props.push({ title: '13. Локальные экстремумы', value: extremaInfo.text, icon: '🏔️', desc: extremaInfo.desc });

    return props;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ: Форматирование и безопасность
// ============================================================================
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    const number = typeof num === 'string' ? parseFloat(num) : Number(num);
    if (isNaN(number)) return String(num);
    if (Math.abs(number) < 0.001) return '0';
    if (Math.abs(number) > 1000) return number > 0 ? '+∞' : '-∞';
    return number.toFixed(2);
}

function safeToFixed(value, decimals = 2) {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return String(value);
    return num.toFixed(decimals);
}

// ============================================================================
// ЧИСЛЕННЫЕ МЕТОДЫ: Вычисление свойств для неизвестных функций
// ============================================================================
function calculateRangeNumerically(func) {
    let min = Infinity, max = -Infinity;
    for (let x = -20; x <= 20; x += 0.1) {
        const y = func.evaluate(x);
        if (y !== null && isFinite(y)) {
            if (y < min) min = y;
            if (y > max) max = y;
        }
    }
    if (min === Infinity) return 'Не определено';
    let minStr = (min < -1000) ? '-∞' : formatNumber(min);
    let maxStr = (max > 1000) ? '+∞' : formatNumber(max);
    return `[${minStr}; ${maxStr}]`;
}

function calculateSignIntervalsNumerically(func, expr) {
    const zeros = findZeros(func, expr, 'unknown');
    if (zeros.length === 0) {
        const test = func.evaluate(0);
        if (test !== null) return test > 0 ? 'f(x)>0 на всей области' : 'f(x)<0 на всей области';
        return 'Не определено';
    }
    let pos = [], neg = [];
    let points = [-10, ...zeros.map(z => Number(z)), 10];
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

function calculateConvexityNumerically(func, expr) {
    let up = 0, down = 0;
    for (let x of [-5, -2, 2, 5]) {
        if (expr.includes('/x') && Math.abs(x) < 1) continue;
        const y_m = func.evaluate(x - 0.5);
        const y_0 = func.evaluate(x);
        const y_p = func.evaluate(x + 0.5);
        if (y_m !== null && y_0 !== null && y_p !== null) {
            const d2 = y_p - 2*y_0 + y_m;
            if (d2 > 0.01) up++;
            if (d2 < -0.01) down++;
        }
    }
    if (up > 0 && down === 0) return { text: 'Выпукла вниз', desc: 'На analysed промежутках' };
    if (down > 0 && up === 0) return { text: 'Выпукла вверх', desc: 'На analysed промежутках' };
    if (up > 0 && down > 0) return { text: 'Имеет перегибы', desc: 'Меняет направление' };
    return { text: 'Сложная форма', desc: 'Трудно определить' };
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
    if (inc > 0 && dec === 0) return 'Возрастает';
    if (dec > 0 && inc === 0) return 'Убывает';
    return 'Не монотонна';
}

function calculateLocalExtremaNumerically(func, expr) {
    const extrema = [];
    for (let x = -10; x < 10; x += 0.2) {
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + 0.2);
        const y3 = func.evaluate(x + 0.4);
        if (y1 === null || y2 === null || y3 === null) continue;
        const d1 = y2 - y1;
        const d2 = y3 - y2;
        if (d1 > 0.01 && d2 < -0.01) extrema.push({ x: x + 0.2, type: 'max' });
        else if (d1 < -0.01 && d2 > 0.01) extrema.push({ x: x + 0.2, type: 'min' });
    }
    if (extrema.length > 0) {
        const extText = extrema.map(e => `${e.type === 'max' ? 'Макс' : 'Мин'} при x=${formatNumber(e.x)}`).join('; ');
        return { text: extText, desc: 'На промежутке [-10; 10]' };
    }
    return { text: 'Отсутствуют', desc: 'Не найдено на analysed промежутке' };
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ: Домен, нули, четность, непрерывность
// ============================================================================
function getDomain(expr, type) {
    if (type === 'log') return '(0; +∞)';
    if (type === 'inverse' || expr.includes('/x')) return '(-∞; 0) ∪ (0; +∞)';
    if (type === 'tan') return 'Все x, кроме π/2 + πn';
    if (type === 'cot') return 'Все x, кроме πn';
    if (expr.includes('sqrt')) return '[0; +∞)';
    return '(-∞; +∞)';
}

function findZeros(func, expr, type) {
    if (type === 'exp') return [];
    if (type === 'inverse') return [];
    if (type === 'log') return [1];
    if (type === 'tan') return [0, 3.14, -3.14];
    if (type === 'cot') return [1.57, -1.57, 4.71];
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
    if (type === 'tan') return 'Разрывна при π/2 + πn';
    if (type === 'cot') return 'Разрывна при πn';
    return 'Непрерывна (предположительно)';
}

// ============================================================================
// ПОСТРОЕНИЕ ГРАФИКА (с обработкой разрывов для cot)
// ============================================================================
function plotFunction(func, expr, type) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 500;
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    if (type === 'log') startX = 0.01;

    const isTan = (type === 'tan');
    const isCot = (type === 'cot');
    const isInverse = (type === 'inverse');

    for (let x = startX; x <= endX; x += step) {
        let skip = false;
        let y = null;

        // Разрывы для тангенса: при π/2 + πn
        if (isTan) {
            let dist = Math.abs((x - Math.PI/2) % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.15) skip = true;
        } 
        // 🔧 Разрывы для котангенса: при π·n (где sin(x) = 0)
        else if (isCot) {
            let dist = Math.abs(x % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.15) skip = true;
        } 
        // Разрыв для 1/x
        else if (isInverse && Math.abs(x) < 0.05) {
            skip = true;
        }

        if (!skip) y = func.evaluate(x);
        
        // Обрезаем слишком большие значения для масштаба
        if (y !== null && (Math.abs(y) > 100 || !isFinite(y))) y = null;

        if (skip || y === null) {
            xVals.push(x);
            yVals.push(null);  // Разрыв линии
        } else {
            xVals.push(x);
            yVals.push(y);
        }
    }
    
    const trace = { x: xVals, y: yVals, mode: 'lines', line: { color: '#2c3e50', width: 3 } };
    
    // Ограничение по Y для разрывных функций
    let yRange = null;
    if (isTan || isCot || isInverse) yRange = [-10, 10];

    const layout = {
        margin: { t: 30, r: 20, b: 40, l: 40 },
        xaxis: { title: 'X', zeroline: true, gridcolor: '#eee', range: [startX, endX] },
        yaxis: { title: 'Y', zeroline: true, gridcolor: '#eee', range: yRange },
        paper_bgcolor: '#fff',
        plot_bgcolor: '#fff'
    };
    
    Plotly.react('plot', [trace], layout, {displayModeBar: false});
}

// ============================================================================
// UI: Обновление интерфейса
// ============================================================================
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
    document.getElementById('propertiesOutput').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Анализ 13 свойств...</p></div>';
}

function showError(msg) {
    document.getElementById('propertiesOutput').innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div></div>`;
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ: Обработчики событий
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', analyzeFunction);
    document.getElementById('functionInput').addEventListener('keypress', e => { 
        if (e.key === 'Enter') analyzeFunction(); 
    });
    
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('functionInput').value = this.dataset.func;
            analyzeFunction();
        });
    });
    
    const slider = document.getElementById('xRange');
    const rangeVal = document.getElementById('rangeValue');
    slider.addEventListener('input', () => rangeVal.textContent = slider.value);
    slider.addEventListener('change', () => { 
        if(currentFunction) plotFunction(currentFunction, currentExpression, currentType); 
    });
    
    document.getElementById('zoomInBtn').addEventListener('click', () => 
        Plotly.relayout('plot', {'xaxis.range[0]': '*=0.8', 'xaxis.range[1]': '*=0.8'})
    );
    document.getElementById('zoomOutBtn').addEventListener('click', () => 
        Plotly.relayout('plot', {'xaxis.range[0]': '*=1.2', 'xaxis.range[1]': '*=1.2'})
    );
    document.getElementById('resetViewBtn').addEventListener('click', () => { 
        if(currentFunction) plotFunction(currentFunction, currentExpression, currentType); 
    });
    
    initializePlot();
});

function initializePlot() {
    Plotly.newPlot('plot', [{x:[], y:[], mode:'lines'}], {
        xaxis: {title: 'X', zeroline: true}, 
        yaxis: {title: 'Y', zeroline: true},
        margin: {t:30, r:20, b:40, l:40}
    }, {displayModeBar: false});
}