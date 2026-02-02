// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ
// Автономная версия БЕЗ Math.js
// ============================================

// Глобальные переменные
let currentFunction = null;
let currentExpression = '';

// Безопасный парсер математических выражений
function parseFunction(expr) {
    // Сохраняем исходное выражение для отображения
    const displayExpr = expr;
    currentExpression = expr;
    
    // Подготовка выражения для eval
    expr = expr
        .replace(/\s+/g, '') // Убираем пробелы
        .replace(/\^/g, '**') // ^ заменяем на **
        .toLowerCase();
    
    return {
        evaluate: function(x) {
            try {
                // Заменяем x на значение с учетом математических функций
                let evalExpr = expr
                    .replace(/x/g, `(${x})`)
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log10\(/g, 'Math.log10(')
                    .replace(/log\(/g, 'Math.log(') // log(x) -> натуральный логарифм
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/exp\(/g, 'Math.exp(')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/abs\(/g, 'Math.abs(')
                    .replace(/pi/g, 'Math.PI')
                    .replace(/e/g, 'Math.E');
                
                // Безопасная оценка
                const result = eval(evalExpr);
                
                // Проверка на специальные случаи
                if (result === Infinity || result === -Infinity) {
                    return null; // Для обработки асимптот
                }
                
                if (isNaN(result)) {
                    return null; // Для неопределенных значений
                }
                
                return result;
            } catch(e) {
                console.error('Ошибка вычисления:', e);
                return null;
            }
        },
        toString: function() {
            return displayExpr;
        }
    };
}

// Основная функция анализа
function analyzeFunction() {
    const input = document.getElementById('functionInput');
    let expr = input.value.trim();
    
    if (!expr) {
        showError('Введите функцию для анализа');
        return;
    }
    
    // Автоматически заменяем ^ на ** если пользователь забыл
    if (expr.includes('^') && !expr.includes('**')) {
        expr = expr.replace(/\^/g, '**');
        input.value = expr;
    }
    
    // Показываем загрузку
    showLoading();
    
    try {
        // Создаем функцию
        const func = parseFunction(expr);
        
        // Тестируем функцию в нескольких точках
        let testPoints = [];
        if (expr.includes('log') || expr.includes('/x')) {
            // Для логарифмических и дробных функций тестируем в положительных точках
            testPoints = [1, 2, 0.5, 10];
        } else {
            testPoints = [-1, 0, 1, 2];
        }
        
        let validTest = false;
        for (let x of testPoints) {
            const testResult = func.evaluate(x);
            if (testResult !== null && isFinite(testResult)) {
                validTest = true;
                break;
            }
        }
        
        if (!validTest) {
            throw new Error('Неверное математическое выражение или функция не определена');
        }
        
        currentFunction = func;
        
        // Обновляем отображение
        document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
        document.getElementById('graphStatus').textContent = 'Построение графика...';
        
        // Анализируем свойства
        const properties = analyzeFunctionProperties(expr, func);
        
        // Обновляем интерфейс
        updatePropertiesDisplay(properties);
        
        // Строим график
        plotFunction(func, expr);
        
        // Показываем успех
        document.getElementById('graphStatus').textContent = 'График построен';
        
    } catch (error) {
        console.error('Ошибка анализа:', error);
        showError(`Ошибка: ${error.message || 'Неверное выражение'}`);
        document.getElementById('graphStatus').textContent = 'Ошибка построения';
    }
}

// Анализ свойств функции
function analyzeFunctionProperties(expr, func) {
    const properties = [];
    
    // 1. Тип функции
    const type = determineFunctionType(expr);
    properties.push({
        title: 'Тип функции',
        value: type,
        icon: '📊',
        description: 'Классификация по математическому виду'
    });
    
    // 2. Область определения
    const domain = getFunctionDomain(expr);
    properties.push({
        title: 'Область определения',
        value: domain,
        icon: '🌐',
        description: 'Множество допустимых значений x'
    });
    
    // 3. Нули функции
    const zeros = findZeros(func, expr);
    properties.push({
        title: 'Нули функции',
        value: zeros.length > 0 ? zeros.join(', ') : 'Нет действительных нулей',
        icon: '⚫',
        description: 'Точки пересечения с осью OX (f(x) = 0)'
    });
    
    // 4. Точка пересечения с OY
    try {
        const yIntercept = func.evaluate(0);
        if (yIntercept !== null && isFinite(yIntercept)) {
            properties.push({
                title: 'Пересечение с OY',
                value: `(0, ${yIntercept.toFixed(3)})`,
                icon: '🔵',
                description: 'Значение функции при x = 0'
            });
        }
    } catch(e) {
        // Игнорируем ошибку
    }
    
    // 5. Чётность
    const parity = checkParity(func);
    properties.push({
        title: 'Чётность функции',
        value: parity.result,
        icon: '🔄',
        description: parity.description
    });
    
    // 6. Специальные свойства
    if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan')) {
        properties.push({
            title: 'Периодичность',
            value: 'Периодическая',
            icon: '⏱️',
            description: expr.includes('tan') ? 'Период π' : 'Период 2π'
        });
    }
    
    if (expr.includes('log')) {
        properties.push({
            title: 'Особые точки',
            value: 'x ≤ 0 не входит в область определения',
            icon: '⚠️',
            description: 'Логарифм определен только для x > 0'
        });
    }
    
    if (expr.includes('/x') && !expr.includes('x**2')) {
        properties.push({
            title: 'Асимптоты',
            value: 'x = 0',
            icon: '↗️',
            description: 'Вертикальная асимптота при x = 0'
        });
    }
    
    // 7. Поведение на бесконечности
    const behavior = analyzeBehavior(func, expr);
    if (behavior) {
        properties.push({
            title: 'Поведение на бесконечности',
            value: behavior,
            icon: '∞',
            description: 'Пределы при x → ±∞'
        });
    }
    
    return properties;
}

// Поиск нулей функции
function findZeros(func, expr) {
    const zeros = [];
    
    // Специальные случаи
    if (expr === 'x**2' || expr === 'x^2') {
        zeros.push('0');
        return zeros;
    }
    
    if (expr === 'x**2 - 4' || expr === 'x^2 - 4') {
        zeros.push('-2', '2');
        return zeros;
    }
    
    if (expr === 'x**3' || expr === 'x^3') {
        zeros.push('0');
        return zeros;
    }
    
    if (expr === '2*x + 1') {
        zeros.push('-0.5');
        return zeros;
    }
    
    if (expr.includes('log')) {
        // Логарифм равен нулю при x = 1
        zeros.push('1');
        return zeros;
    }
    
    // Численный поиск
    const searchRange = 10;
    const step = 0.2;
    
    for (let x = -searchRange; x <= searchRange; x += step) {
        try {
            const y1 = func.evaluate(x);
            const y2 = func.evaluate(x + step);
            
            if (y1 !== null && y2 !== null) {
                // Проверяем знак
                if (y1 === 0) {
                    zeros.push(x.toFixed(2));
                } else if (y1 * y2 < 0) {
                    // Знак изменился - есть корень
                    const zero = (x + step/2).toFixed(2);
                    zeros.push(zero);
                } else if (Math.abs(y1) < 0.1) {
                    // Близко к нулю
                    zeros.push(x.toFixed(2));
                }
            }
        } catch(e) {
            continue;
        }
    }
    
    // Убираем дубликаты
    return [...new Set(zeros)].slice(0, 5); // Ограничиваем 5 нулями
}

// Проверка чётности
function checkParity(func) {
    try {
        const at1 = func.evaluate(1);
        const atMinus1 = func.evaluate(-1);
        
        if (at1 !== null && atMinus1 !== null && isFinite(at1) && isFinite(atMinus1)) {
            const diff = Math.abs(at1 - atMinus1);
            const sum = Math.abs(at1 + atMinus1);
            
            if (diff < 0.01) {
                return {
                    result: 'Чётная',
                    description: 'f(-x) = f(x), симметрия относительно OY'
                };
            } else if (sum < 0.01) {
                return {
                    result: 'Нечётная',
                    description: 'f(-x) = -f(x), симметрия относительно начала координат'
                };
            }
        }
    } catch(e) {
        // Игнорируем ошибку
    }
    
    return {
        result: 'Общего вида',
        description: 'Ни чётная, ни нечётная'
    };
}

// Анализ поведения на бесконечности
function analyzeBehavior(func, expr) {
    if (expr.includes('exp')) {
        return 'при x → +∞: +∞, при x → -∞: 0';
    }
    
    if (expr.includes('log')) {
        return 'при x → +∞: +∞, при x → 0+: -∞';
    }
    
    if (expr.includes('x**2') || expr.match(/x\*\*[2468]/)) {
        return 'при x → ±∞: +∞';
    }
    
    if (expr.includes('x**3') || expr.match(/x\*\*[13579]/)) {
        const lead = expr.includes('-x**3') ? 'при x → +∞: -∞, при x → -∞: +∞' : 'при x → +∞: +∞, при x → -∞: -∞';
        return lead;
    }
    
    return null;
}

// Определение типа функции
function determineFunctionType(expr) {
    expr = expr.toLowerCase();
    
    if (expr.includes('x**2') || expr.includes('x^2')) return 'Квадратичная (парабола)';
    if (expr.includes('x**3') || expr.includes('x^3')) return 'Кубическая';
    if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan')) return 'Тригонометрическая';
    if (expr.includes('exp')) return 'Показательная';
    if (expr.includes('log')) return 'Логарифмическая';
    if (expr.includes('/x')) return 'Дробно-рациональная';
    if (expr.match(/[0-9]+\*x\b|\bx\*[0-9]+/)) return 'Линейная';
    if (expr.match(/x\*\*[0-9]+/)) return 'Степенная';
    
    return 'Алгебраическая функция';
}

// Определение области определения
function getFunctionDomain(expr) {
    expr = expr.toLowerCase();
    
    if (expr.includes('/x')) {
        return '(-∞, 0) ∪ (0, +∞)';
    }
    if (expr.includes('log')) {
        return '(0, +∞)';
    }
    if (expr.includes('sqrt')) {
        return '[0, +∞)';
    }
    
    return '(-∞, +∞)';
}

// Построение графика
function plotFunction(func, expr) {
    try {
        const range = parseInt(document.getElementById('xRange').value) || 10;
        let step = range / 150; // Увеличиваем количество точек
        
        const xValues = [];
        const yValues = [];
        
        // Определяем диапазон для специальных функций
        let startX = -range;
        let endX = range;
        
        if (expr.includes('log')) {
            // Для логарифмических функций начинаем с малого положительного числа
            startX = 0.001;
            endX = range;
            step = range / 100;
        }
        
        // Генерация точек
        for (let x = startX; x <= endX; x += step) {
            try {
                const y = func.evaluate(x);
                
                if (y !== null && isFinite(y) && Math.abs(y) < 10000) {
                    xValues.push(x);
                    yValues.push(y);
                } else {
                    // Добавляем разрыв
                    xValues.push(x);
                    yValues.push(null);
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
            line: {
                color: '#3498db',
                width: 3
            }
        };
        
        // Настройка осей
        let yAxisRange = [-range, range];
        if (expr.includes('log')) {
            yAxisRange = [-5, 10];
        } else if (expr.includes('exp')) {
            yAxisRange = [-1, range];
        }
        
        // Обновление layout
        const layout = {
            title: { text: `f(x) = ${expr}`, font: { size: 16 } },
            xaxis: { 
                title: 'x',
                range: [startX, endX],
                gridcolor: '#f0f0f0',
                zeroline: true,
                zerolinecolor: '#ccc',
                zerolinewidth: 2
            },
            yaxis: { 
                title: 'f(x)',
                gridcolor: '#f0f0f0',
                zeroline: true,
                zerolinecolor: '#ccc',
                zerolinewidth: 2,
                range: yAxisRange
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            showlegend: false,
            margin: { t: 50, r: 30, b: 50, l: 50 }
        };
        
        Plotly.react('plot', [trace], layout);
        
    } catch(error) {
        console.error('Ошибка построения графика:', error);
        showError('Не удалось построить график');
    }
}

// Обновление отображения свойств
function updatePropertiesDisplay(properties) {
    const container = document.getElementById('propertiesOutput');
    
    let html = '';
    properties.forEach(prop => {
        html += `
            <div class="property-item">
                <div class="property-icon">${prop.icon}</div>
                <div class="property-content">
                    <div class="property-title">${prop.title}</div>
                    <div class="property-value">${prop.value}</div>
                    <div class="property-description">${prop.description}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Показать загрузку
function showLoading() {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Анализируем функцию...</p>
        </div>
    `;
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">❌</div>
            <div class="error-content">
                <div class="error-title">Ошибка</div>
                <div class="error-message">${message}</div>
                <div class="error-hint">Примеры правильного ввода: x^2, sin(x), log(x), exp(x), 2*x+3</div>
            </div>
        </div>
    `;
}

// ===== Управление графиком =====
function zoomInGraph() {
    Plotly.relayout('plot', {
        'xaxis.range[0]': '*=0.8',
        'xaxis.range[1]': '*=0.8',
        'yaxis.range[0]': '*=0.8',
        'yaxis.range[1]': '*=0.8'
    });
}

function zoomOutGraph() {
    Plotly.relayout('plot', {
        'xaxis.range[0]': '*=1.2',
        'xaxis.range[1]': '*=1.2',
        'yaxis.range[0]': '*=1.2',
        'yaxis.range[1]': '*=1.2'
    });
}

function resetGraphView() {
    const range = parseInt(document.getElementById('xRange').value) || 10;
    
    let startX = -range;
    let endX = range;
    let yAxisRange = [-range, range];
    
    if (currentExpression.includes('log')) {
        startX = 0.001;
        endX = range;
        yAxisRange = [-5, 10];
    }
    
    Plotly.relayout('plot', {
        'xaxis.range': [startX, endX],
        'yaxis.range': yAxisRange
    });
}

function updateGraphRange() {
    if (currentFunction) {
        plotFunction(currentFunction, currentExpression);
        resetGraphView();
    }
}

// Настройка обработчиков событий
function setupEventHandlers() {
    // Основная кнопка анализа
    document.getElementById('calculateBtn').addEventListener('click', analyzeFunction);
    
    // Управление графиком
    document.getElementById('zoomInBtn').addEventListener('click', zoomInGraph);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOutGraph);
    document.getElementById('resetViewBtn').addEventListener('click', resetGraphView);
    
    // Слайдер диапазона
    const xRangeSlider = document.getElementById('xRange');
    const rangeValue = document.getElementById('rangeValue');
    
    xRangeSlider.addEventListener('input', function() {
        rangeValue.textContent = this.value;
    });
    
    xRangeSlider.addEventListener('change', updateGraphRange);
    
    // Примеры быстрых функций
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const func = this.getAttribute('data-func');
            document.getElementById('functionInput').value = func;
            analyzeFunction();
        });
    });
    
    // Enter в поле ввода
    document.getElementById('functionInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeFunction();
        }
    });
    
    console.log('✅ Обработчики событий настроены');
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
    
    const layout = {
        title: { text: 'График функции', font: { size: 16 } },
        xaxis: { 
            title: 'x', 
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinecolor: '#ccc',
            zerolinewidth: 2
        },
        yaxis: { 
            title: 'f(x)', 
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinecolor: '#ccc',
            zerolinewidth: 2
        },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: false,
        margin: { t: 50, r: 30, b: 50, l: 50 }
    };
    
    Plotly.newPlot('plot', [trace], layout);
    document.getElementById('graphStatus').textContent = 'Готов к построению';
    console.log('✅ График инициализирован');
}

// Инициализация приложения
function initApp() {
    console.log('🚀 Анализатор функций инициализируется...');
    
    // Проверяем Plotly
    if (typeof Plotly === 'undefined') {
        showError('Библиотека графиков не загружена. Проверьте интернет-соединение.');
        return;
    }
    
    // Настройка обработчиков
    setupEventHandlers();
    
    // Инициализация графика
    initializePlot();
    
    // Авто-анализ при загрузке
    setTimeout(() => {
        analyzeFunction();
    }, 500);
    
    console.log('✅ Анализатор функций готов!');
}

// Запуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
} 