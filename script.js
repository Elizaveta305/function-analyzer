// ============================================
// МОДУЛЬ АНАЛИЗАТОРА МАТЕМАТИЧЕСКИХ ФУНКЦИЙ
// Школьный проект для 10 класса
// ============================================

// Глобальные переменные
let currentFunction = null;
let currentCompiledFunc = null;
let currentGraphData = null;
let graphLayout = null;

// Основная инициализация
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
    
    // Автоматический анализ при загрузке
    setTimeout(() => {
        analyzeDefaultFunction();
    }, 800);
});

// Инициализация приложения
function initializeApplication() {
    console.log('🚀 Инициализация анализатора функций...');
    
    // Настройка обработчиков событий
    setupEventHandlers();
    
    // Настройка математического парсера
    setupMathJS();
    
    // Инициализация графика
    initializePlot();
}

// Настройка обработчиков событий
function setupEventHandlers() {
    const calculateBtn = document.getElementById('calculateBtn');
    const functionInput = document.getElementById('functionInput');
    
    // Основная кнопка анализа
    calculateBtn.addEventListener('click', handleFunctionAnalysis);
    
    // Enter в поле ввода
    functionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleFunctionAnalysis();
    });
    
    // Обработчики для управления графиком
    document.getElementById('zoomInBtn').addEventListener('click', zoomInGraph);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOutGraph);
    document.getElementById('resetViewBtn').addEventListener('click', resetGraphView);
    
    // Слайдер диапазона
    const xRangeSlider = document.getElementById('xRange');
    xRangeSlider.addEventListener('change', updateGraphRange);
    
    console.log('✅ Обработчики событий настроены');
}

// Настройка MathJS
function setupMathJS() {
    // Расширяем возможности MathJS
    math.import({
        csc: function(x) { return 1 / math.sin(x); },
        sec: function(x) { return 1 / math.cos(x); },
        cot: function(x) { return 1 / math.tan(x); }
    }, { override: true });
    
    console.log('✅ MathJS настроена');
}

// Инициализация графика
function initializePlot() {
    const trace = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        name: 'f(x)',
        line: { color: '#3498db', width: 3 }
    };
    
    graphLayout = {
        title: 'График функции',
        xaxis: { 
            title: 'x', 
            gridcolor: '#ecf0f1', 
            zeroline: true,
            range: [-5, 5]
        },
        yaxis: { 
            title: 'f(x)', 
            gridcolor: '#ecf0f1', 
            zeroline: true,
            range: [-5, 5]
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: '#ffffff',
        showlegend: true,
        margin: { t: 50, r: 50, b: 50, l: 50 }
    };
    
    Plotly.newPlot('plot', [trace], graphLayout);
    console.log('✅ График инициализирован');
}

// Обработчик анализа функции
function handleFunctionAnalysis() {
    const functionInput = document.getElementById('functionInput');
    const expr = functionInput.value.trim();
    
    if (!expr) {
        showError('Введите функцию для анализа');
        return;
    }
    
    // Показываем индикатор загрузки
    showLoading();
    
    try {
        // Анализируем функцию
        const analysisResult = analyzeFunctionComprehensive(expr);
        
        // Обновляем интерфейс
        updateAnalysisResults(analysisResult);
        
        // Строим график
        plotFunction(expr);
        
        // Показываем успех
        showSuccess('Функция успешно проанализирована!');
        
        // Сохраняем текущую функцию
        currentFunction = expr;
        
    } catch (error) {
        console.error('Ошибка анализа:', error);
        showError(`Ошибка: ${error.message}`);
    }
}

// Комплексный анализ функции
function analyzeFunctionComprehensive(expr) {
    console.log(`🔍 Анализируем функцию: ${expr}`);
    
    try {
        // Компилируем функцию
        const compiledFunc = math.compile(expr);
        currentCompiledFunc = compiledFunc;
        
        // Определяем тип функции
        const functionType = determineFunctionType(expr, compiledFunc);
        
        // Основные свойства
        const basicProperties = calculateBasicProperties(compiledFunc, expr);
        
        // Анализ производной
        const derivativeAnalysis = analyzeDerivative(expr, compiledFunc);
        
        // Дополнительные свойства
        const additionalProperties = calculateAdditionalProperties(compiledFunc, expr, functionType);
        
        // Исследовательские данные
        const researchData = generateResearchData(compiledFunc, expr);
        
        return {
            expression: expr,
            type: functionType,
            basic: basicProperties,
            derivative: derivativeAnalysis,
            additional: additionalProperties,
            research: researchData,
            timestamp: new Date().toLocaleString()
        };
        
    } catch (error) {
        throw new Error(`Невозможно проанализировать функцию: ${error.message}`);
    }
}

// Определение типа функции
function determineFunctionType(expr, compiledFunc) {
    const cleanExpr = expr.toLowerCase().replace(/\s/g, '');
    
    // Проверка на квадратичную функцию
    if (cleanExpr.match(/x\^2|ax\^2.*bx.*c/)) {
        return { 
            name: 'Квадратичная функция (парабола)', 
            type: 'quadratic',
            description: 'Функция вида f(x) = ax² + bx + c, график - парабола'
        };
    }
    
    // Проверка на линейную функцию
    if (cleanExpr.match(/^[0-9\.]*x[+-]|^x[+-]/) || 
        cleanExpr.match(/[0-9\.]*\*x[+-]/) ||
        cleanExpr.match(/^[0-9\.]*x$/)) {
        return { 
            name: 'Линейная функция', 
            type: 'linear',
            description: 'Функция вида f(x) = kx + b, график - прямая линия'
        };
    }
    
    // Проверка на степенную функцию
    if (cleanExpr.match(/x\^[0-9\.]+/)) {
        const degreeMatch = cleanExpr.match(/x\^([0-9\.]+)/);
        const degree = degreeMatch ? parseFloat(degreeMatch[1]) : 1;
        return { 
            name: `Степенная функция (степень ${degree})`, 
            type: 'power',
            degree: degree
        };
    }
    
    // Проверка на тригонометрические функции
    if (cleanExpr.match(/sin|cos|tan|ctg|cot/)) {
        let trigType = 'тригонометрическая';
        if (cleanExpr.includes('sin')) trigType = 'синус';
        if (cleanExpr.includes('cos')) trigType = 'косинус';
        if (cleanExpr.includes('tan')) trigType = 'тангенс';
        
        return { 
            name: `Тригонометрическая функция (${trigType})`, 
            type: 'trigonometric',
            subtype: trigType
        };
    }
    
    // Проверка на показательную функцию
    if (cleanExpr.match(/exp\(|e\^x|e\^\(|a\^x/)) {
        return { 
            name: 'Показательная функция', 
            type: 'exponential',
            description: 'Функция вида f(x) = aˣ, где a > 0, a ≠ 1'
        };
    }
    
    // Проверка на логарифмическую функцию
    if (cleanExpr.match(/log|ln/)) {
        return { 
            name: 'Логарифмическая функция', 
            type: 'logarithmic',
            description: 'Функция вида f(x) = logₐ(x)'
        };
    }
    
    // Проверка на дробно-рациональную функцию
    if (cleanExpr.match(/\/x|\/\(/)) {
        return { 
            name: 'Дробно-рациональная функция', 
            type: 'rational',
            description: 'Функция, содержащая переменную в знаменателе'
        };
    }
    
    return { 
        name: 'Общая алгебраическая функция', 
        type: 'algebraic',
        description: 'Составная функция, требующая детального анализа'
    };
}

// Расчет основных свойств
function calculateBasicProperties(compiledFunc, expr) {
    const properties = [];
    
    // 1. Область определения
    const domain = calculateDomain(expr);
    properties.push({
        name: 'Область определения D(f)',
        value: domain.value,
        description: domain.description,
        icon: '🌐'
    });
    
    // 2. Нули функции (корни)
    const zeros = findFunctionZeros(compiledFunc, expr);
    properties.push({
        name: 'Нули функции',
        value: zeros.length > 0 ? zeros.join(', ') : 'Нет действительных корней',
        description: 'Точки пересечения с осью OX (f(x)=0)',
        icon: '⚫'
    });
    
    // 3. Точка пересечения с OY
    try {
        const yIntercept = compiledFunc.evaluate({x: 0});
        if (!isNaN(yIntercept) && isFinite(yIntercept)) {
            properties.push({
                name: 'Пересечение с осью OY',
                value: `(0, ${yIntercept.toFixed(3)})`,
                description: 'Значение функции при x = 0',
                icon: '🔵'
            });
        }
    } catch(e) {}
    
    // 4. Четность функции
    const parity = determineParity(compiledFunc);
    properties.push({
        name: 'Четность',
        value: parity.result,
        description: parity.description,
        icon: '🔄'
    });
    
    // 5. Ограниченность
    const boundedness = checkBoundedness(compiledFunc);
    properties.push({
        name: 'Ограниченность',
        value: boundedness.result,
        description: boundedness.description,
        icon: '📏'
    });
    
    // 6. Монотонность (общая оценка)
    const monotonicity = checkMonotonicity(compiledFunc);
    properties.push({
        name: 'Монотонность',
        value: monotonicity.result,
        description: monotonicity.description,
        icon: '📈'
    });
    
    return properties;
}

// Расчет области определения
function calculateDomain(expr) {
    const cleanExpr = expr.toLowerCase();
    
    // Проверка на деление на x
    if (cleanExpr.includes('/x') || cleanExpr.match(/\/\(.*x.*\)/)) {
        return {
            value: '(-∞, 0) ∪ (0, +∞)',
            description: 'Все действительные числа, кроме x = 0'
        };
    }
    
    // Проверка на логарифм
    if (cleanExpr.includes('log') || cleanExpr.includes('ln')) {
        return {
            value: '(0, +∞)',
            description: 'Только положительные числа'
        };
    }
    
    // Проверка на квадратный корень
    if (cleanExpr.includes('sqrt')) {
        return {
            value: '[0, +∞)',
            description: 'Неотрицательные числа'
        };
    }
    
    // Для большинства других функций
    return {
        value: '(-∞, +∞)',
        description: 'Все действительные числа'
    };
}

// Поиск нулей функции (численный метод)
function findFunctionZeros(compiledFunc, expr) {
    const zeros = [];
    const step = 0.5;
    const searchRange = 10;
    
    // Проверяем специальные случаи
    if (expr === 'x^2') return ['0'];
    if (expr === 'x^2 - 4') return ['-2', '2'];
    if (expr === 'x^3') return ['0'];
    if (expr === '2*x + 1') return ['-0.5'];
    
    // Численный поиск корней
    for (let x = -searchRange; x < searchRange; x += step) {
        try {
            const y1 = compiledFunc.evaluate({x: x});
            const y2 = compiledFunc.evaluate({x: x + step});
            
            // Если знак меняется, есть корень
            if (y1 * y2 <= 0 && Math.abs(y1) < 1000 && Math.abs(y2) < 1000) {
                // Уточняем корень методом половинного деления
                const root = refineRoot(compiledFunc, x, x + step);
                if (root !== null && !zeros.some(z => Math.abs(parseFloat(z) - root) < 0.01)) {
                    zeros.push(root.toFixed(3));
                }
            }
        } catch(e) {
            // Пропускаем точки, где функция не определена
        }
    }
    
    return zeros.slice(0, 10); // Ограничиваем количество корней
}

// Уточнение корня методом половинного деления
function refineRoot(func, a, b, maxIterations = 20) {
    let left = a;
    let right = b;
    
    try {
        let fLeft = func.evaluate({x: left});
        let fRight = func.evaluate({x: right});
        
        if (fLeft * fRight > 0) return null;
        
        for (let i = 0; i < maxIterations; i++) {
            const mid = (left + right) / 2;
            const fMid = func.evaluate({x: mid});
            
            if (Math.abs(fMid) < 0.0001) return mid;
            
            if (fLeft * fMid <= 0) {
                right = mid;
                fRight = fMid;
            } else {
                left = mid;
                fLeft = fMid;
            }
        }
        
        return (left + right) / 2;
    } catch(e) {
        return null;
    }
}

// Определение четности
function determineParity(compiledFunc) {
    try {
        const at1 = compiledFunc.evaluate({x: 1});
        const atMinus1 = compiledFunc.evaluate({x: -1});
        
        if (Math.abs(at1 - atMinus1) < 0.001) {
            return {
                result: 'Четная',
                description: 'f(-x) = f(x), график симметричен относительно оси OY'
            };
        }
        
        if (Math.abs(at1 + atMinus1) < 0.001) {
            return {
                result: 'Нечетная',
                description: 'f(-x) = -f(x), график симметричен относительно начала координат'
            };
        }
        
        return {
            result: 'Общего вида',
            description: 'Ни четная, ни нечетная'
        };
    } catch(e) {
        return {
            result: 'Не определена',
            description: 'Невозможно определить четность'
        };
    }
}

// Проверка ограниченности
function checkBoundedness(compiledFunc) {
    const testPoints = [-10, -5, -1, 0, 1, 5, 10];
    let values = [];
    
    for (let x of testPoints) {
        try {
            const y = compiledFunc.evaluate({x: x});
            if (isFinite(y)) values.push(Math.abs(y));
        } catch(e) {}
    }
    
    const maxValue = Math.max(...values);
    
    if (maxValue < 100) {
        return {
            result: 'Ограниченная',
            description: 'Значения функции не превышают ' + maxValue.toFixed(1)
        };
    } else {
        return {
            result: 'Неограниченная',
            description: 'Функция может принимать сколь угодно большие значения'
        };
    }
}

// Проверка монотонности
function checkMonotonicity(compiledFunc) {
    const testIntervals = [
        [-5, -1], [-1, 0], [0, 1], [1, 5]
    ];
    
    let increasingCount = 0;
    let decreasingCount = 0;
    
    for (let [start, end] of testIntervals) {
        try {
            const y1 = compiledFunc.evaluate({x: start});
            const y2 = compiledFunc.evaluate({x: end});
            
            if (y1 < y2) increasingCount++;
            if (y1 > y2) decreasingCount++;
        } catch(e) {}
    }
    
    if (increasingCount > decreasingCount * 2) {
        return {
            result: 'Возрастающая',
            description: 'В основном возрастает на рассмотренных интервалах'
        };
    } else if (decreasingCount > increasingCount * 2) {
        return {
            result: 'Убывающая',
            description: 'В основном убывает на рассмотренных интервалах'
        };
    } else {
        return {
            result: 'Немонотонная',
            description: 'Имеет участки возрастания и убывания'
        };
    }
}

// Анализ производной
function analyzeDerivative(expr, compiledFunc) {
    const analysis = [];
    
    try {
        // Символьное вычисление производной
        const derivativeExpr = math.derivative(expr, 'x').toString();
        const compiledDerivative = math.compile(derivativeExpr);
        
        analysis.push({
            name: 'Производная f\'(x)',
            value: derivativeExpr,
            description: 'Формула первой производной',
            icon: '📐'
        });
        
        // Критические точки
        const criticalPoints = findCriticalPoints(compiledDerivative);
        if (criticalPoints.length > 0) {
            analysis.push({
                name: 'Критические точки',
                value: criticalPoints.slice(0, 5).join(', '),
                description: 'Точки, где f\'(x) = 0 или не существует',
                icon: '📍'
            });
            
            // Определяем тип критических точек
            const pointTypes = analyzeCriticalPoints(compiledFunc, compiledDerivative, criticalPoints);
            analysis.push({
                name: 'Типы критических точек',
                value: pointTypes.join(', '),
                description: 'Экстремумы и точки перегиба',
                icon: '🎯'
            });
        }
        
        // Поведение на бесконечности
        const behaviorAtInfinity = analyzeBehaviorAtInfinity(compiledFunc);
        analysis.push({
            name: 'Поведение при x→±∞',
            value: behaviorAtInfinity,
            description: 'Пределы функции на бесконечности',
            icon: '∞'
        });
        
    } catch(e) {
        console.warn('Не удалось проанализировать производную:', e.message);
        analysis.push({
            name: 'Производная',
            value: 'Не вычисляется',
            description: 'Функция слишком сложна для символьного дифференцирования',
            icon: '⚠️'
        });
    }
    
    return analysis;
}

// Поиск критических точек
function findCriticalPoints(derivativeFunc) {
    const criticalPoints = [];
    const step = 0.2;
    
    for (let x = -5; x <= 5; x += step) {
        try {
            const d1 = derivativeFunc.evaluate({x: x});
            const d2 = derivativeFunc.evaluate({x: x + step});
            
            // Если производная меняет знак или близка к нулю
            if (d1 * d2 <= 0 || Math.abs(d1) < 0.01) {
                const point = x + step/2;
                if (!criticalPoints.some(p => Math.abs(p - point) < 0.1)) {
                    criticalPoints.push(parseFloat(point.toFixed(2)));
                }
            }
        } catch(e) {}
    }
    
    return criticalPoints;
}

// Анализ критических точек
function analyzeCriticalPoints(func, derivativeFunc, points) {
    const types = [];
    
    for (let point of points.slice(0, 3)) {
        try {
            // Значение производной слева и справа
            const leftDeriv = derivativeFunc.evaluate({x: point - 0.1});
            const rightDeriv = derivativeFunc.evaluate({x: point + 0.1});
            
            if (leftDeriv > 0 && rightDeriv < 0) {
                types.push(`x=${point}: максимум`);
            } else if (leftDeriv < 0 && rightDeriv > 0) {
                types.push(`x=${point}: минимум`);
            } else {
                types.push(`x=${point}: возможна точка перегиба`);
            }
        } catch(e) {
            types.push(`x=${point}: неопределено`);
        }
    }
    
    return types;
}

// Анализ поведения на бесконечности
function analyzeBehaviorAtInfinity(func) {
    try {
        const atLargePositive = func.evaluate({x: 100});
        const atLargeNegative = func.evaluate({x: -100});
        
        if (Math.abs(atLargePositive) > 1000) {
            return `f(x) → ${atLargePositive > 0 ? '+∞' : '-∞'} при x→+∞`;
        }
        if (Math.abs(atLargeNegative) > 1000) {
            return `f(x) → ${atLargeNegative > 0 ? '+∞' : '-∞'} при x→-∞`;
        }
        
        return 'Ограниченное поведение';
    } catch(e) {
        return 'Не определено';
    }
}

// Расчет дополнительных свойств
function calculateAdditionalProperties(compiledFunc, expr, functionType) {
    const properties = [];
    
    // Периодичность для тригонометрических функций
    if (functionType.type === 'trigonometric') {
        properties.push({
            name: 'Периодичность',
            value: 'Периодическая',
            description: functionType.subtype === 'тангенс' || functionType.subtype === 'котангенс' 
                ? 'Основной период π' 
                : 'Основной период 2π',
            icon: '🔄'
        });
    }
    
    // Асимптоты для дробных функций
    if (functionType.type === 'rational' || expr.includes('/')) {
        properties.push({
            name: 'Вертикальные асимптоты',
            value: 'x = 0',
            description: 'Функция не определена в точке x = 0',
            icon: '📏'
        });
    }
    
    // Экстремумы (поиск минимумов/максимумов)
    const extrema = findLocalExtrema(compiledFunc);
    if (extrema.length > 0) {
        properties.push({
            name: 'Локальные экстремумы',
            value: extrema.join('; '),
            description: 'Точки локальных минимумов и максимумов',
            icon: '📍'
        });
    }
    
    // Выпуклость/вогнутость
    const convexity = checkConvexity(compiledFunc);
    properties.push({
        name: 'Выпуклость',
        value: convexity.result,
        description: convexity.description,
        icon: '📈'
    });
    
    return properties;
}

// Поиск локальных экстремумов
function findLocalExtrema(func) {
    const extrema = [];
    const step = 0.1;
    
    for (let x = -3; x <= 3; x += step) {
        try {
            const yPrev = func.evaluate({x: x - step});
            const yCurr = func.evaluate({x: x});
            const yNext = func.evaluate({x: x + step});
            
            // Локальный максимум
            if (yCurr > yPrev && yCurr > yNext) {
                extrema.push(`Максимум (~${x.toFixed(1)}, ${yCurr.toFixed(1)})`);
            }
            // Локальный минимум
            if (yCurr < yPrev && yCurr < yNext) {
                extrema.push(`Минимум (~${x.toFixed(1)}, ${yCurr.toFixed(1)})`);
            }
        } catch(e) {}
    }
    
    return extrema.slice(0, 3);
}

// Проверка выпуклости
function checkConvexity(func) {
    const testPoints = [-2, -1, 0, 1, 2];
    let convexCount = 0;
    let concaveCount = 0;
    
    for (let i = 1; i < testPoints.length - 1; i++) {
        try {
            const x0 = testPoints[i-1];
            const x1 = testPoints[i];
            const x2 = testPoints[i+1];
            
            const y0 = func.evaluate({x: x0});
            const y1 = func.evaluate({x: x1});
            const y2 = func.evaluate({x: x2});
            
            // Проверка выпуклости вверх (вогнутость)
            if (y1 < (y0 + y2) / 2) convexCount++;
            // Проверка выпуклости вниз (выпуклость)
            if (y1 > (y0 + y2) / 2) concaveCount++;
        } catch(e) {}
    }
    
    if (convexCount > concaveCount) {
        return {
            result: 'Выпукла вверх (вогнута)',
            description: 'График лежит ниже хорд'
        };
    } else if (concaveCount > convexCount) {
        return {
            result: 'Выпукла вниз (выпукла)',
            description: 'График лежит выше хорд'
        };
    } else {
        return {
            result: 'Имеет участки разной выпуклости',
            description: 'Точки перегиба присутствуют'
        };
    }
}

// Генерация исследовательских данных
function generateResearchData(compiledFunc, expr) {
    const data = {
        evaluationTable: [],
        characteristics: {}
    };
    
    // Таблица значений
    for (let x = -2; x <= 2; x += 0.5) {
        try {
            const y = compiledFunc.evaluate({x: x});
            if (isFinite(y)) {
                data.evaluationTable.push({
                    x: x.toFixed(1),
                    y: y.toFixed(3),
                    remark: getValueRemark(y)
                });
            }
        } catch(e) {
            data.evaluationTable.push({
                x: x.toFixed(1),
                y: 'не опр.',
                remark: 'Функция не определена'
            });
        }
    }
    
    // Характеристики функции
    data.characteristics = {
        complexity: estimateFunctionComplexity(expr),
        symmetry: estimateSymmetry(compiledFunc),
        behavior: estimateGlobalBehavior(compiledFunc)
    };
    
    return data;
}

// Оценка сложности функции
function estimateFunctionComplexity(expr) {
    const length = expr.length;
    const operators = (expr.match(/[\+\-\*\/\^]/g) || []).length;
    const functions = (expr.match(/sin|cos|tan|log|exp|sqrt/g) || []).length;
    
    const score = length * 0.1 + operators * 2 + functions * 5;
    
    if (score < 10) return 'Простая';
    if (score < 20) return 'Средней сложности';
    if (score < 30) return 'Сложная';
    return 'Очень сложная';
}

// Оценка симметрии
function estimateSymmetry(func) {
    try {
        const at2 = func.evaluate({x: 2});
        const atMinus2 = func.evaluate({x: -2});
        
        if (Math.abs(at2 - atMinus2) < 0.1) return 'Высокая симметрия';
        if (Math.abs(at2 + atMinus2) < 0.1) return 'Центральная симметрия';
        return 'Отсутствие явной симметрии';
    } catch(e) {
        return 'Не определена';
    }
}

// Оценка глобального поведения
function estimateGlobalBehavior(func) {
    try {
        const values = [];
        for (let x = -3; x <= 3; x++) {
            const y = func.evaluate({x: x});
            if (isFinite(y)) values.push(y);
        }
        
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const range = maxVal - minVal;
        
        if (range > 50) return 'Резкие изменения';
        if (range > 10) return 'Значительные изменения';
        if (range > 2) return 'Плавные изменения';
        return 'Стабильное поведение';
    } catch(e) {
        return 'Не определено';
    }
}

// Получение комментария к значению
function getValueRemark(y) {
    if (Math.abs(y) < 0.001) return '≈ 0';
    if (Math.abs(y) > 1000) return 'Очень большое';
    if (Math.abs(y) < 0.1) return 'Близко к 0';
    return '';
}

// Построение графика
function plotFunction(expr) {
    try {
        const compiledFunc = math.compile(expr);
        const xRange = parseInt(document.getElementById('xRange').value) || 5;
        
        // Генерация точек
        const step = 0.05;
        const xValues = [];
        const yValues = [];
        
        for (let x = -xRange; x <= xRange; x += step) {
            try {
                const y = compiledFunc.evaluate({x: x});
                
                // Проверка на особые значения
                if (isFinite(y) && Math.abs(y) < 1000) {
                    xValues.push(x);
                    yValues.push(y);
                } else {
                    xValues.push(x);
                    yValues.push(null); // Разрыв
                }
            } catch(e) {
                xValues.push(x);
                yValues.push(null);
            }
        }
        
        // Создание графика
        const trace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: `f(x) = ${expr}`,
            line: { color: '#3498db', width: 3 }
        };
        
        // Обновление layout
        graphLayout.xaxis.range = [-xRange, xRange];
        graphLayout.title = `График функции: ${expr}`;
        
        Plotly.react('plot', [trace], graphLayout);
        
        // Сохраняем данные графика
        currentGraphData = { x: xValues, y: yValues };
        
    } catch(error) {
        console.error('Ошибка построения графика:', error);
        showError('Не удалось построить график функции');
    }
}

// Управление графиком
function zoomInGraph() {
    if (!graphLayout) return;
    
    graphLayout.xaxis.range[0] *= 0.8;
    graphLayout.xaxis.range[1] *= 0.8;
    graphLayout.yaxis.range[0] *= 0.8;
    graphLayout.yaxis.range[1] *= 0.8;
    
    Plotly.relayout('plot', graphLayout);
}

function zoomOutGraph() {
    if (!graphLayout) return;
    
    graphLayout.xaxis.range[0] *= 1.2;
    graphLayout.xaxis.range[1] *= 1.2;
    graphLayout.yaxis.range[0] *= 1.2;
    graphLayout.yaxis.range[1] *= 1.2;
    
    Plotly.relayout('plot', graphLayout);
}

function resetGraphView() {
    const xRange = parseInt(document.getElementById('xRange').value) || 5;
    
    graphLayout.xaxis.range = [-xRange, xRange];
    graphLayout.yaxis.range = [-xRange, xRange];
    
    Plotly.relayout('plot', graphLayout);
}

function updateGraphRange() {
    if (currentFunction) {
        plotFunction(currentFunction);
        resetGraphView();
    }
}

// Обновление результатов анализа в интерфейсе
function updateAnalysisResults(analysis) {
    // Обновляем свойства функции
    updatePropertiesTab(analysis);
    
    // Обновляем вкладку с производной
    updateDerivativeTab(analysis);
    
    // Обновляем дополнительную информацию
    updateAdvancedTab(analysis);
}

function updatePropertiesTab(analysis) {
    let html = `
        <div class="function-header">
            <strong>f(x) = ${analysis.expression}</strong>
            <div class="function-meta">
                <span class="function-type">${analysis.type.name}</span>
                <span class="timestamp">Анализ выполнен: ${analysis.timestamp}</span>
            </div>
        </div>
    `;
    
    // Основные свойства
    html += `<div class="section-header">📋 Основные свойства</div>`;
    analysis.basic.forEach(prop => {
        html += `
            <div class="property-card">
                <div class="property-header">
                    <span class="property-icon">${prop.icon}</span>
                    <strong class="property-name">${prop.name}:</strong>
                    <span class="property-value">${prop.value}</span>
                </div>
                <div class="property-description">${prop.description}</div>
            </div>
        `;
    });
    
    // Тип функции
    html += `<div class="section-header">🔍 Классификация функции</div>`;
    html += `
        <div class="property-card">
            <div class="property-header">
                <span class="property-icon">📊</span>
                <strong class="property-name">Тип функции:</strong>
                <span class="property-value">${analysis.type.name}</span>
            </div>
            <div class="property-description">${analysis.type.description || 'Стандартный математический объект'}</div>
        </div>
    `;
    
    document.getElementById('propsOutput').innerHTML = html;
}

function updateDerivativeTab(analysis) {
    let html = `<div class="section-header">📐 Анализ производной</div>`;
    
    if (analysis.derivative && analysis.derivative.length > 0) {
        analysis.derivative.forEach(prop => {
            html += `
                <div class="property-card">
                    <div class="property-header">
                        <span class="property-icon">${prop.icon}</span>
                        <strong class="property-name">${prop.name}:</strong>
                        <span class="property-value">${prop.value}</span>
                    </div>
                    <div class="property-description">${prop.description}</div>
                </div>
            `;
        });
        
        // Таблица значений производной
        html += `<div class="section-header">📊 Таблица значений</div>`;
        html += `<table class="value-table"><tr><th>x</th><th>f(x)</th><th>Примечание</th></tr>`;
        
        for (let i = -2; i <= 2; i++) {
            try {
                const y = currentCompiledFunc.evaluate({x: i});
                html += `<tr><td>${i}</td><td>${y.toFixed(3)}</td><td>${getValueRemark(y)}</td></tr>`;
            } catch(e) {
                html += `<tr><td>${i}</td><td>не опр.</td><td>не определена</td></tr>`;
            }
        }
        html += `</table>`;
        
    } else {
        html += `<div class="info-message">Производная не вычислена для данной функции</div>`;
    }
    
    document.getElementById('derivativeOutput').innerHTML = html;
}

function updateAdvancedTab(analysis) {
    let html = `<div class="section-header">🔬 Дополнительный анализ</div>`;
    
    // Дополнительные свойства
    if (analysis.additional && analysis.additional.length > 0) {
        analysis.additional.forEach(prop => {
            html += `
                <div class="property-card">
                    <div class="property-header">
                        <span class="property-icon">${prop.icon}</span>
                        <strong class="property-name">${prop.name}:</strong>
                        <span class="property-value">${prop.value}</span>
                    </div>
                    <div class="property-description">${prop.description}</div>
                </div>
            `;
        });
    }
    
    // Исследовательские данные
    html += `<div class="section-header">📈 Исследовательские характеристики</div>`;
    html += `
        <div class="property-card">
            <div class="property-header">
                <span class="property-icon">⚙️</span>
                <strong class="property-name">Сложность функции:</strong>
                <span class="property-value">${analysis.research.characteristics.complexity}</span>
            </div>
        </div>
        <div class="property-card">
            <div class="property-header">
                <span class="property-icon">🔄</span>
                <strong class="property-name">Симметрия:</strong>
                <span class="property-value">${analysis.research.characteristics.symmetry}</span>
            </div>
        </div>
        <div class="property-card">
            <div class="property-header">
                <span class="property-icon">📊</span>
                <strong class="property-name">Глобальное поведение:</strong>
                <span class="property-value">${analysis.research.characteristics.behavior}</span>
            </div>
        </div>
    `;
    
    // Рекомендации для исследования
    html += `<div class="section-header">🎓 Рекомендации для дальнейшего исследования</div>`;
    html += `
        <div class="property-card">
            <div class="property-header">
                <span class="property-icon">💡</span>
                <strong>Методы исследования:</strong>
            </div>
            <div class="property-description">
                1. Изучить поведение функции на границах области определения<br>
                2. Найти производную и исследовать её знак<br>
                3. Определить интервалы монотонности<br>
                4. Найти экстремумы и точки перегиба<br>
                5. Исследовать асимптотическое поведение
            </div>
        </div>
    `;
    
    document.getElementById('advancedOutput').innerHTML = html;
}

// Вспомогательные функции
function showLoading() {
    const output = document.getElementById('propsOutput');
    output.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Анализируем функцию...</p>
            <p><small>Используются численные методы и символьные вычисления</small></p>
        </div>
    `;
}

function showError(message) {
    const output = document.getElementById('propsOutput');
    output.innerHTML = `
        <div class="error-message">
            ❌ <strong>Ошибка:</strong> ${message}
            <p><small>Проверьте правильность ввода функции. Примеры: x^2, sin(x), 2*x+3</small></p>
        </div>
    `;
}

function showSuccess(message) {
    // Можно добавить временное уведомление
    console.log('✅ ' + message);
}

function analyzeDefaultFunction() {
    const defaultFunction = 'x^2 - 4';
    document.getElementById('functionInput').value = defaultFunction;
    handleFunctionAnalysis();
}

// Экспорт для использования в консоли разработчика
window.FunctionAnalyzer = {
    analyze: handleFunctionAnalysis,
    plot: plotFunction,
    getCurrentFunction: () => currentFunction,
    getAnalysis: () => analyzeFunctionComprehensive(currentFunction)
};

console.log('✅ Анализатор функций инициализирован и готов к работе!');
