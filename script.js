// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ (Версия 5.2 - Final Fix)
// Исправлен cot(x) и улучшена отрисовка тангенсоид
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
                let cleanExpr = expr
                    .replace(/\s+/g, '') 
                    .replace(/\^/g, '**'); 

                // ЭТАП 1: Специальная обработка COT перед остальными
                // Заменяем cot(x) на (cos(x)/sin(x)) НАПРЯМУЮ, чтобы избежать проблем со скобками
                // Используем цикл, чтобы заменить все вхождения, если их несколько (хотя вряд ли)
                while (cleanExpr.includes('cot(')) {
                    // Находим позицию cot(
                    let start = cleanExpr.indexOf('cot(');
                    // Ищем соответствующую закрывающую скобку. 
                    // Для простоты школьных функций считаем, что внутри одна пара скобок или вложенность простая.
                    // Но надежнее использовать замену через регулярку для простых случаев cot(что-то)
                    // Регулярка: cot\(([^)]+)\) -> (cos($1)/sin($1))
                    cleanExpr = cleanExpr.replace(/cot\(([^)]+)\)/g, '(Math.cos($1)/Math.sin($1))');
                }

                // ЭТАП 2: Остальные функции → временные метки
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

                // ЭТАП 3: Константы и переменная
                cleanExpr = cleanExpr.replace(/\bpi\b/gi, 'Math.PI');
                cleanExpr = cleanExpr.replace(/\be\b/g, 'Math.E'); 
                cleanExpr = cleanExpr.replace(/\bx\b/g, `(${xVal})`); 
                
                // ЭТАП 4: Восстановление функций
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
                
                const result = new Function('return ' + cleanExpr)();
                
                if (!isFinite(result) || isNaN(result)) return null;
                return result;
            } catch(e) {
                // console.error("Ошибка вычисления:", e.message, "Выражение:", expr);
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
            const lower = expr.toLowerCase();
            
            // Подбираем тестовые точки
            let testPoints = [];
            if (lower.includes('tan') || lower.includes('cot')) {
                testPoints = [0.1, 0.5, 1.0, 2.0]; // Избегаем 0 для cot и pi/2 для tan
            } else if (lower.includes('log')) {
                testPoints = [1, 2, Math.E, 10];
            } else {
                testPoints = [-2, -1, 0, 1, 2];
            }
            
            for (let x of testPoints) {
                if (func.evaluate(x) !== null) { isValid = true; break; }
            }
            
            // Если не прошло, пробуем еще
            if (!isValid) {
                for (let x of [0.1, 0.5, 3, 5, -0.5]) {
                    if (func.evaluate(x) !== null) { isValid = true; break; }
                }
            }

            if (!isValid) throw new Error('Функция не определена в стандартной области.');
            
            currentFunction = func;
            document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
            document.getElementById('graphStatus').textContent = 'Глубокий анализ...';
            
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

// --- ПОЛНЫЙ АНАЛИЗ СВОЙСТВ (13 ПУНКТОВ) ---
function analyzeFunctionProperties(expr, func) {
    const props = [];
    const lower = expr.toLowerCase();

    // 1. Область определения
    props.push({ title: '1. Область определения', value: getDomain(expr), icon: '🌐', desc: 'D(f)' });

    // 2. Область значений
    const rangeInfo = findRange(func, expr);
    props.push({ title: '2. Область значений', value: rangeInfo.text, icon: '📏', desc: 'E(f)' });

    // 3. Нули функции
    const zeros = findZeros(func, expr);
    const zerosText = zeros.length > 0 ? zeros.map(z => formatNumber(z)).join(', ') : 'Нет действительных корней';
    props.push({ title: '3. Нули функции', value: zerosText, icon: '⚫', desc: 'f(x) = 0' });

    // 4. Пересечение с OY
    const y0 = func.evaluate(0);
    const hasZeroAtOrigin = zeros.some(z => Math.abs(parseFloat(z)) < 0.01);
    if (y0 !== null && isFinite(y0)) {
        if (Math.abs(y0) > 0.01 || zeros.length === 0) {
            props.push({ title: '4. Пересечение с OY', value: `(0; ${formatNumber(y0)})`, icon: '🔵', desc: 'При x = 0' });
        }
    }

    // 5. Четность
    props.push({ title: '5. Четность', value: checkParity(func).result, icon: '🔄', desc: checkParity(func).desc });

    // 6. Монотонность
    const mono = findMonotonicity(func, expr);
    props.push({ title: '6. Монотонность', value: mono.text, icon: '📈', desc: mono.desc });

    // 7. Промежутки знакопостоянства
    const signs = findSignIntervals(func, expr);
    props.push({ title: '7. Знакопостоянство', value: signs.text, icon: '➕➖', desc: 'Где f(x)>0 и f(x)<0' });

    // 8. Ограниченность
    const bounded = checkBoundedness(func, expr);
    props.push({ title: '8. Ограниченность', value: bounded.text, icon: '🔒', desc: bounded.desc });

    // 9. Наибольшее и наименьшее значение
    const extremes = findGlobalExtremes(func, expr);
    props.push({ title: '9. Наим. и наиб. значение', value: extremes.text, icon: '🏆', desc: 'На промежутке [-10; 10]' });

    // 10. Непрерывность
    const continuity = checkContinuity(func, expr);
    props.push({ title: '10. Непрерывность', value: continuity.text, icon: '〰️', desc: continuity.desc });

    // 11. Выпуклость
    const convex = checkConvexity(func, expr);
    props.push({ title: '11. Выпуклость', value: convex.text, icon: '📉', desc: convex.desc });

    // 12. Периодичность
    if (lower.includes('sin') || lower.includes('cos') || lower.includes('tan') || lower.includes('cot')) {
        let period = '2π';
        if (lower.includes('tan') || lower.includes('cot')) period = 'π';
        props.push({ title: '12. Периодичность', value: `Периодическая (T=${period})`, icon: '⏱️', desc: 'Повторяется через промежуток' });
    } else {
        props.push({ title: '12. Периодичность', value: 'Не периодическая', icon: '⏱️', desc: 'Не имеет периода' });
    }

    // 13. Экстремумы
    const extrema = findLocalExtrema(func, expr);
    if (extrema.length > 0) {
        const extText = extrema.map(e => `${e.type === 'max' ? 'Макс' : 'Мин'} при x=${formatNumber(e.x)}`).join('; ');
        props.push({ title: '13. Локальные экстремумы', value: extText, icon: '🏔️', desc: 'Точки перегиба направления' });
    } else {
        props.push({ title: '13. Локальные экстремумы', value: 'Отсутствуют', icon: '🏔️', desc: 'Нет точек максимума или минимума' });
    }

    return props;
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ АНАЛИЗА ---

function findRange(func, expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('tan') || lower.includes('cot')) return { text: '(-∞; +∞)', desc: 'Все действительные числа' };
    if (expr.includes('x**2') || expr.includes('^2')) return { text: '[0; +∞)', desc: 'Ветви вверх' };
    if (expr.includes('sin') || expr.includes('cos')) return { text: '[-1; 1]', desc: 'Стандартный диапазон' };
    if (expr === '1/x') return { text: '(-∞; 0) ∪ (0; +∞)', desc: 'Все кроме 0' };
    if (lower.includes('exp')) return { text: '(0; +∞)', desc: 'Только положительные' };
    if (lower.includes('log')) return { text: '(-∞; +∞)', desc: 'Все действительные' };

    let min = Infinity, max = -Infinity;
    let hasValue = false;
    const step = 0.1;
    const rangeLimit = 20; 

    for (let x = -rangeLimit; x <= rangeLimit; x += step) {
        const y = func.evaluate(x);
        if (y !== null && isFinite(y)) {
            hasValue = true;
            if (y < min) min = y;
            if (y > max) max = y;
        }
    }
    
    if (!hasValue) return { text: 'Не определено', desc: '' };
    
    const yStart = func.evaluate(-rangeLimit);
    const yEnd = func.evaluate(rangeLimit);
    
    let resText = '';
    if (yEnd !== null && yEnd > 1000) resText = `[${formatNumber(min)}; +∞)`;
    else if (yStart !== null && yStart > 1000) resText = `[${formatNumber(min)}; +∞)`;
    else if (yEnd !== null && yEnd < -1000) resText = `(-∞; ${formatNumber(max)}]`;
    else if (yStart !== null && yStart < -1000) resText = `(-∞; ${formatNumber(max)}]`;
    else resText = `[${formatNumber(min)}; ${formatNumber(max)}]`;
    
    return { text: resText, desc: 'Оценочно на промежутке' };
}

function findMonotonicity(func, expr) {
    let inc = 0, dec = 0;
    const points = [-5, -1, 1, 5];
    
    for (let x of points) {
        // Пропуск точек near асимптот
        if (expr.toLowerCase().includes('tan') || expr.toLowerCase().includes('cot')) {
             if (Math.abs(Math.cos(x)) < 0.2 || Math.abs(Math.sin(x)) < 0.2) continue;
        }
        if (expr.includes('/x') && Math.abs(x) < 0.2) continue;
        
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + 0.1);
        if (y1 !== null && y2 !== null) {
            if (y2 > y1) inc++;
            else if (y2 < y1) dec++;
        }
    }
    
    if (inc > 0 && dec === 0) return { text: 'Возрастает', desc: 'На каждом промежутке непрерывности' };
    if (dec > 0 && inc === 0) return { text: 'Убывает', desc: 'На каждом промежутке непрерывности' };
    return { text: 'Не монотонна', desc: 'Есть промежутки возрастания и убывания' };
}

function findSignIntervals(func, expr) {
    const zeros = findZeros(func, expr);
    let points = [-10, ...zeros.map(Number), 10];
    points.sort((a,b) => a-b);
    
    let pos = [], neg = [];
    for (let i = 0; i < points.length - 1; i++) {
        let mid = (points[i] + points[i+1]) / 2;
        
        // Пропуск опасных зон
        if (expr.includes('/x') && Math.abs(mid) < 0.1) continue;
        if (expr.toLowerCase().includes('tan') && Math.abs(Math.cos(mid)) < 0.2) continue;
        if (expr.toLowerCase().includes('cot') && Math.abs(Math.sin(mid)) < 0.2) continue;
        
        const val = func.evaluate(mid);
        if (val !== null) {
            if (val > 0) pos.push(`(${points[i].toFixed(1)}; ${points[i+1].toFixed(1)})`);
            else neg.push(`(${points[i].toFixed(1)}; ${points[i+1].toFixed(1)})`);
        }
    }
    
    let res = '';
    if (pos.length > 0) res += `f(x)>0 на: ${pos.join(', ')}. `;
    if (neg.length > 0) res += `f(x)<0 на: ${neg.join(', ')}`;
    if (res === '') res = 'Не определено в диапазоне';
    
    return { text: res.length > 60 ? res.substring(0, 55) + '...' : res, desc: 'Интервалы знака' };
}

function checkBoundedness(func, expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('tan') || lower.includes('cot') || expr === '1/x') return { text: 'Не ограничена', desc: 'Уходит в ±∞' };
    if (expr.includes('sin') || expr.includes('cos')) return { text: 'Ограничена', desc: 'Сверху и снизу' };
    if (expr.includes('x**2') || expr.includes('^2')) return { text: 'Ограничена снизу', desc: 'Есть минимум' };
    if (lower.includes('exp')) return { text: 'Ограничена снизу', desc: 'y > 0' };
    
    const y1 = func.evaluate(-100);
    const y2 = func.evaluate(100);
    if ((y1 !== null && Math.abs(y1) > 1000) || (y2 !== null && Math.abs(y2) > 1000)) {
        return { text: 'Не ограничена', desc: 'Уходит в бесконечность' };
    }
    return { text: 'Ограничена (локально)', desc: 'В рассматриваемом диапазоне' };
}

function findGlobalExtremes(func, expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('tan') || lower.includes('cot') || expr === '1/x') return { text: 'min: -∞, max: +∞', desc: 'Не ограничена' };

    let min = Infinity, max = -Infinity;
    let found = false;
    for (let x = -10; x <= 10; x += 0.1) {
        const y = func.evaluate(x);
        if (y !== null && isFinite(y)) {
            found = true;
            if (y < min) min = y;
            if (y > max) max = y;
        }
    }
    if (!found) return { text: 'Нет данных', desc: '' };
    
    let tMin = (min === -Infinity || min < -1000) ? '-∞' : formatNumber(min);
    let tMax = (max === Infinity || max > 1000) ? '+∞' : formatNumber(max);
    
    return { text: `min: ${tMin}, max: ${tMax}`, desc: 'На отрезке [-10; 10]' };
}

function checkContinuity(func, expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('tan')) return { text: 'Разрывна', desc: 'Разрывы при x = π/2 + πn' };
    if (lower.includes('cot')) return { text: 'Разрывна', desc: 'Разрывы при x = πn' };
    if (expr.includes('/x')) return { text: 'Разрывна', desc: 'Разрыв при x=0' };
    if (lower.includes('log')) return { text: 'Непрерывна', desc: 'На области определения (0; +∞)' };
    return { text: 'Непрерывна', desc: 'На всей области определения' };
}

function checkConvexity(func, expr) {
    let up = 0, down = 0;
    const h = 0.5;
    const points = [-5, -2, 2, 5];
    
    for (let x of points) {
        if (expr.includes('/x') && Math.abs(x) < 1) continue;
        if (expr.toLowerCase().includes('tan') || expr.toLowerCase().includes('cot')) {
             if (Math.abs(Math.cos(x)) < 0.5 || Math.abs(Math.sin(x)) < 0.5) continue;
        }

        const y_m = func.evaluate(x - h);
        const y_0 = func.evaluate(x);
        const y_p = func.evaluate(x + h);
        
        if (y_m !== null && y_0 !== null && y_p !== null) {
            const d2 = y_p - 2*y_0 + y_m;
            if (d2 > 0.01) up++;
            if (d2 < -0.01) down++;
        }
    }
    
    if (up > 0 && down === 0) return { text: 'Выпукла вниз', desc: 'Как парабола x²' };
    if (down > 0 && up === 0) return { text: 'Выпукла вверх', desc: 'Как перевернутая парабола' };
    if (up > 0 && down > 0) return { text: 'Имеет перегибы', desc: 'Меняет направление выпуклости' };
    return { text: 'Сложная форма', desc: 'Трудно определить численно' };
}

function findLocalExtrema(func, expr) {
    const extrema = [];
    const step = 0.2;
    const range = 10;
    const lower = expr.toLowerCase();
    
    // Тангенс, котангенс, синус, косинус, логарифм, 1/x не имеют локальных экстремумов в классическом смысле на всей области
    if (expr === 'x' || expr === '1/x' || lower.includes('log') || lower.includes('tan') || lower.includes('cot') || lower.includes('sin') || lower.includes('cos')) {
        return [];
    }

    for (let x = -range; x < range; x += step) {
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        const y3 = func.evaluate(x + 2 * step);
        
        if (y1 === null || y2 === null || y3 === null) continue;
        
        const d1 = y2 - y1;
        const d2 = y3 - y2;
        
        if (d1 > 0.01 && d2 < -0.01) extrema.push({ x: x + step, type: 'max' });
        else if (d1 < -0.01 && d2 > 0.01) extrema.push({ x: x + step, type: 'min' });
    }
    return extrema;
}

// --- СТАРЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function findZeros(func, expr) {
    const rawZeros = [];
    const step = 0.1;
    const lower = expr.toLowerCase();
    
    if (lower.includes('exp')) return [];
    if (expr === '1/x') return [];
    
    // Аналитические нули для тригонометрии
    if (lower.includes('cot')) return [1.57, -1.57, 4.71, -4.71]; // pi/2 + pi*n
    if (lower.includes('tan')) return [0, 3.14, -3.14, 6.28, -6.28]; // pi*n

    for (let x = -10; x <= 10; x += step) {
        if (expr.includes('/x') && Math.abs(x) < 0.1) continue;
        const y1 = func.evaluate(x);
        const y2 = func.evaluate(x + step);
        if (y1 === null || y2 === null) continue;
        
        if (Math.abs(y1) < 0.05) rawZeros.push(x);
        else if (y1 * y2 < 0) rawZeros.push(x + step/2);
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

function checkParity(func) {
    const a = func.evaluate(1);
    const b = func.evaluate(-1);
    if (a === null || b === null) return { result: 'Не определено', desc: '-' };
    if (Math.abs(a - b) < 0.001) return { result: 'Чётная', desc: 'Симметрия относительно OY' };
    if (Math.abs(a + b) < 0.001) return { result: 'Нечётная', desc: 'Симметрия относительно начала координат' };
    return { result: 'Общего вида', desc: 'Нет симметрии' };
}

function determineFunctionType(expr) {
    const lower = expr.toLowerCase();
    if (lower.includes('tan')) return 'Тангенсоида';
    if (lower.includes('cot')) return 'Котангенсоида';
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
    if (lower.includes('tan')) return 'Все x, кроме π/2 + πn';
    if (lower.includes('cot')) return 'Все x, кроме πn';
    return '(-∞; +∞)';
}

function formatNumber(num) {
    if (Math.abs(num) < 0.001) return '0';
    return Number(num.toFixed(2)).toString();
}

// --- ГРАФИК (ИСПРАВЛЕННЫЙ ДЛЯ TAN/COT) ---
function plotFunction(func, expr) {
    const range = parseInt(document.getElementById('xRange').value);
    const step = range / 500; // Очень мелкий шаг для плавности
    const xVals = [], yVals = [];
    let startX = -range, endX = range;
    
    if (expr.toLowerCase().includes('log')) startX = 0.01;

    const lower = expr.toLowerCase();
    const isTan = lower.includes('tan');
    const isCot = lower.includes('cot');

    for (let x = startX; x <= endX; x += step) {
        let skip = false;
        let y = null;

        // 1. Принудительный разрыв возле асимптот
        if (isTan) {
            // Асимптоты tan: pi/2 + pi*n (~1.57, 4.71...)
            // Проверяем расстояние до ближайшей асимптоты
            let dist = Math.abs((x - Math.PI/2) % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.15) skip = true; // Зона разрыва
        } else if (isCot) {
            // Асимптоты cot: pi*n (~0, 3.14...)
            let dist = Math.abs(x % Math.PI);
            if (dist > Math.PI/2) dist = Math.PI - dist;
            if (dist < 0.15) skip = true; // Зона разрыва
        } else if (expr.includes('/x') && Math.abs(x) < 0.05) {
            skip = true;
        }

        if (!skip) {
            y = func.evaluate(x);
        }

        // 2. Обрезка по Y для визуализации
        // Если значение слишком большое, считаем это разрывом
        if (y !== null && (Math.abs(y) > 100 || !isFinite(y))) {
            y = null;
        }

        if (skip || y === null) {
            xVals.push(x);
            yVals.push(null); // Разрыв линии
        } else {
            xVals.push(x);
            yVals.push(y);
        }
    }
    
    const trace = { x: xVals, y: yVals, mode: 'lines', line: { color: '#2c3e50', width: 3 } };
    
    // Автоматическое ограничение оси Y, чтобы график не сплющивало
    let yRange = null;
    if (isTan || isCot || expr === '1/x') {
        yRange = [-10, 10]; // Фиксируем вид для разрывных функций
    }

    const layout = {
        margin: { t: 30, r: 20, b: 40, l: 40 },
        xaxis: { title: 'X', zeroline: true, gridcolor: '#eee', range: [startX, endX] },
        yaxis: { title: 'Y', zeroline: true, gridcolor: '#eee', range: yRange },
        paper_bgcolor: '#fff',
        plot_bgcolor: '#fff'
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
    document.getElementById('propertiesOutput').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Выполняется полный анализ 13 свойств...</p></div>';
}

function showError(msg) {
    document.getElementById('propertiesOutput').innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div></div>`;
}

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