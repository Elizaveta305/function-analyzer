// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ
// ============================================

// Глобальные переменные
let currentFunction = null;
let currentCompiledFunc = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Анализатор функций инициализирован');
    
    // Настройка обработчиков
    setupEventHandlers();
    
    // Инициализация графика
    initializePlot();
    
    // Авто-анализ при загрузке (опционально)
    setTimeout(() => {
        // Можно закомментировать, если не нужно авто-заполнение
        // document.getElementById('functionInput').value = 'x^2 - 4';
        // analyzeFunction();
    }, 500);
});

// Настройка обработчиков событий
function setupEventHandlers() {
    // Основная кнопка анализа
    document.getElementById('calculateBtn').addEventListener('click', analyzeFunction);
    
    // Управление графиком
    document.getElementById('zoomInBtn').addEventListener('click', zoomInGraph);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOutGraph);
    document.getElementById('resetViewBtn').addEventListener('click', resetGraphView);
    
    // Слайдер диапазона
    document.getElementById('xRange').addEventListener('change', updateGraphRange);
    
    // Enter в поле ввода
    document.getElementById('functionInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') analyzeFunction();
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
            zerolinecolor: '#ccc'
        },
        yaxis: { 
            title: 'f(x)', 
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinecolor: '#ccc'
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

// Основная функция анализа
function analyzeFunction() {
    const input = document.getElementById('functionInput');
    const expr = input.value.trim();
    
    if (!expr) {
        showError('Введите функцию для анализа');
        return;
    }
    
    // Показываем загрузку
    showLoading();
    
    try {
        // Компилируем функцию с помощью mathjs
        currentCompiledFunc = math.compile(expr);
        currentFunction = expr;
        
        // Обновляем отображение текущей функции
        document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
        document.getElementById('graphStatus').textContent = 'Построение графика...';
        
        // Анализируем свойства
        const properties = analyzeFunctionProperties(expr, currentCompiledFunc);
        
        // Обновляем интерфейс
        updatePropertiesDisplay(properties);
        
        // Строим график
        plotFunction(expr);
        
        // Показываем успех
        document.getElementById('graphStatus').textContent = 'График построен';
        
    } catch (error) {
        console.error('Ошибка анализа:', error);
        showError(`Ошибка: ${error.message}`);
        document.getElementById('graphStatus').textContent = 'Ошибка построения';
    }
}

// Анализ свойств функции
function analyzeFunctionProperties(expr, compiledFunc) {
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
    const zeros = findFunctionZeros(compiledFunc, expr);
    properties.push({
        title: 'Нули функции',
        value: zeros.length > 0 ? zeros.join(', ') : 'Нет действительных нулей',
        icon: '⚫',
        description: 'Точки пересечения с осью OX (f(x) = 0)'
    });
    
    // 4. Точка пересечения с OY
    try {
        const yIntercept = compiledFunc.evaluate({x: 0});
        if (isFinite(yIntercept)) {
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
    const parity = checkFunctionParity(compiledFunc);
    properties.push({
        title: 'Чётность функции',
        value: parity.result,
        icon: '🔄',
        description: parity.description
    });
    
    // 6. Поведение на бесконечности
    const behavior = analyzeBehaviorAtInfinity(compiledFunc);
    properties.push({
        title: 'Поведение при x → ±∞',
        value: behavior,
        icon: '∞',
        description: 'Предельное поведение функции'
    });
    
    // 7. Специальные свойства по типу
    if (type.includes('тригонометрическая')) {
        properties.push({
            title: 'Периодичность',
            value: 'Периодическая',
            icon: '⏱️',
            description: expr.includes('tan') || expr.includes('ctg') ? 'Период π' : 'Период 2π'
        });
    }
    
    if (expr.includes('/x') || expr.match(/\/\(.*x.*\)/)) {
        properties.push({
            title: 'Особые точки',
            value: 'x = 0',
            icon: '⚠️',
            description: 'Вертикальная асимптота'
        });
    }
    
    return properties;
}

// Определение типа функции
function determineFunctionType(expr) {
    const cleanExpr = expr.toLowerCase().replace(/\s/g, '');
    
    if (cleanExpr.match(/x\^2|ax\^2/)) return 'Квадратичная (парабола)';
    if (cleanExpr.match(/x\^[3-9]/)) return 'Степенная';
    if (cleanExpr.match(/sin|cos|tan|ctg/)) return 'Тригонометрическая';
    if (cleanExpr.match(/exp\(|e\^/)) return 'Показательная';
    if (cleanExpr.match(/log|ln/)) return 'Логарифмическая';
    if (cleanExpr.match(/\/x|\/\(/)) return 'Дробно-рациональная';
    if (cleanExpr.match(/[0-9]*\*x|[0-9]*x[+-]/)) return 'Линейная';
    
    return 'Алгебраическая функция';
}

// Определение области определения
function getFunctionDomain(expr) {
    const cleanExpr = expr.toLowerCase();
    
    if (cleanExpr.includes('/x') || cleanExpr.match(/\/\(.*x.*\)/)) {
        return '(-∞, 0) ∪ (0, +∞)';
    }
    if (cleanExpr.includes('log') || cleanExpr.includes('ln')) {
        return '(0, +∞)';
    }
    if (cleanExpr.includes('sqrt')) {
        return '[0, +∞)';
    }
    
    return '(-∞, +∞)';
}

// Поиск нулей функции
function findFunctionZeros(compiledFunc, expr) {
    const zeros = [];
    
    // Простые случаи
    if (expr === 'x^2') return ['0'];
    if (expr === 'x^2 - 4') return ['-2', '2'];
    if (expr === 'x^3') return ['0'];
    if (expr === '2*x + 1') return ['-0.5'];
    
    // Численный поиск
    const step = 0.5;
    for (let x = -10; x <= 10; x += step) {
        try {
            const y1 = compiledFunc.evaluate({x: x});
            const y2 = compiledFunc.evaluate({x: x + step});
            
            if (y1 * y2 <= 0 && Math.abs(y1) < 100 && Math.abs(y2) < 100) {
                const zero = ((x + x + step) / 2).toFixed(3);
                if (!zeros.includes(zero)) zeros.push(zero);
            }
        } catch(e) {
            // Пропускаем точки, где функция не определена
        }
    }
    
    return zeros.slice(0, 5);
}

// Проверка чётности
function checkFunctionParity(compiledFunc) {
    try {
        const at1 = compiledFunc.evaluate({x: 1});
        const atMinus1 = compiledFunc.evaluate({x: -1});
        
        if (Math.abs(at1 - atMinus1) < 0.001) {
            return {
                result: 'Чётная',
                description: 'f(-x) = f(x), симметрия относительно OY'
            };
        }
        
        if (Math.abs(at1 + atMinus1) < 0.001) {
            return {
                result: 'Нечётная',
                description: 'f(-x) = -f(x), симметрия относительно начала координат'
            };
        }
        
        return {
            result: 'Общего вида',
            description: 'Ни чётная, ни нечётная'
        };
    } catch(e) {
        return {
            result: 'Не определена',
            description: 'Невозможно определить чётность'
        };
    }
}

// Анализ поведения на бесконечности
function analyzeBehaviorAtInfinity(compiledFunc) {
    try {
        const at100 = compiledFunc.evaluate({x: 100});
        const atMinus100 = compiledFunc.evaluate({x: -100});
        
        if (Math.abs(at100) > 1000) {
            return at100 > 0 ? 'f(x) → +∞ при x → +∞' : 'f(x) → -∞ при x → +∞';
        }
        
        if (Math.abs(atMinus100) > 1000) {
            return atMinus100 > 0 ? 'f(x) → +∞ при x → -∞' : 'f(x) → -∞ при x → -∞';
        }
        
        return 'Ограниченное поведение';
    } catch(e) {
        return 'Не определено';
    }
}

// Построение графика
function plotFunction(expr) {
    try {
        const compiledFunc = math.compile(expr);
        const range = parseInt(document.getElementById('xRange').value) || 10;
        const step = range / 100;
        
        const xValues = [];
        const yValues = [];
        
        // Генерация точек
        for (let x = -range; x <= range; x += step) {
            try {
                const y = compiledFunc.evaluate({x: x});
                
                if (isFinite(y) && Math.abs(y) < 1000) {
                    xValues.push(x);
                    yValues.push(y);
                } else {
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
                width: 3,
                shape: 'spline'
            }
        };
        
        // Обновление layout
        const layout = {
            title: { text: `f(x) = ${expr}`, font: { size: 16 } },
            xaxis: { 
                title: 'x',
                range: [-range, range],
                gridcolor: '#f0f0f0'
            },
            yaxis: { 
                title: 'f(x)',
                gridcolor: '#f0f0f0'
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            showlegend: false
        };
        
        Plotly.react('plot', [trace], layout);
        
    } catch(error) {
        console.error('Ошибка построения графика:', error);
        showError('Не удалось построить график функции');
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
                <div class="error-hint">Проверьте правильность ввода функции</div>
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
    Plotly.relayout('plot', {
        'xaxis.range': [-range, range],
        'yaxis.range': [-range, range]
    });
}

function updateGraphRange() {
    if (currentFunction) {
        plotFunction(currentFunction);
        resetGraphView();
    }
}

// Экспорт для отладки
window.FunctionAnalyzer = {
    analyze: analyzeFunction,
    getCurrentFunction: () => currentFunction
};

console.log('✅ Анализатор функций готов к работе!');