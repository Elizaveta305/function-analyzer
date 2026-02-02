// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ
// Исправленная версия
// ============================================

// Глобальные переменные
let currentFunction = null;

// Безопасный парсер математических выражений
function parseFunction(expr) {
    // Сохраняем исходное выражение для отображения
    const displayExpr = expr;
    
    return {
        evaluate: function(x) {
            try {
                // Подготовка выражения
                let evalExpr = expr
                    .replace(/\s+/g, '') // Убираем пробелы
                    .replace(/\^/g, '**') // ^ заменяем на **
                    .toLowerCase();
                
                // Заменяем математические функции и переменную x
                evalExpr = evalExpr
                    .replace(/x/g, `(${x})`)
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/exp\(/g, 'Math.exp(')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/pi/g, 'Math.PI')
                    .replace(/e\*\*x/g, 'Math.exp(x)') // Обработка e^x
                    .replace(/e/g, 'Math.E');
                
                // Обработка неявного умножения: 2x -> 2*x, x2 -> x*2
                evalExpr = evalExpr
                    .replace(/(\d)([a-z\(])/g, '$1*$2')
                    .replace(/([a-z\)])(\d)/g, '$1*$2')
                    .replace(/([a-z\)])\(/g, '$1*(');
                
                // Безопасная оценка
                const result = eval(evalExpr);
                
                // Проверка на бесконечность
                if (!isFinite(result)) {
                    return null;
                }
                
                return result;
            } catch(e) {
                console.error('Ошибка вычисления:', e, 'для выражения:', expr);
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
    
    // Показываем загрузку
    showLoading();
    
    try {
        // Создаем функцию
        const func = parseFunction(expr);
        
        // Тестируем функцию в нескольких точках
        let testPassed = false;
        const testPoints = [-2, -1, 0, 1, 2];
        
        for (const point of testPoints) {
            const result = func.evaluate(point);
            if (result !== null && isFinite(result)) {
                testPassed = true;
                break;
            }
        }
        
        if (!testPassed) {
            throw new Error('Неверное математическое выражение');
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
    const zeros = findFunctionZeros(func, expr);
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
    const parity = checkFunctionParity(func);
    properties.push({
        title: 'Чётность функции',
        value: parity.result,
        icon: '🔄',
        description: parity.description
    });
    
    // 6. Специальные свойства
    const exprLower = expr.toLowerCase();
    if (exprLower.includes('sin') || exprLower.includes('cos')) {
        properties.push({
            title: 'Периодичность',
            value: 'Периодическая',
            icon: '⏱️',
            description: 'Период 2π'
        });
    }
    
    if (exprLower.includes('tan')) {
        properties.push({
            title: 'Периодичность',
            value: 'Периодическая',
            icon: '⏱️',
            description: 'Период π'
        });
    }
    
    if (exprLower.includes('/x') || exprLower.match(/\/\(.*x.*\)/)) {
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
    const cleanExpr = expr.toLowerCase();
    
    if (cleanExpr.includes('x**2') || cleanExpr.includes('x^2')) return 'Квадратичная (парабола)';
    if (cleanExpr.includes('x**3') || cleanExpr.includes('x^3')) return 'Кубическая';
    if (cleanExpr.includes('sin') || cleanExpr.includes('cos') || cleanExpr.includes('tan')) return 'Тригонометрическая';
    if (cleanExpr.includes('exp') || cleanExpr.includes('e**x')) return 'Показательная';
    if (cleanExpr.includes('log') || cleanExpr.includes('ln')) return 'Логарифмическая';
    if (cleanExpr.includes('/x')) return 'Дробно-рациональная';
    if (cleanExpr.match(/[0-9]+\*x|x\*[0-9]+/)) return 'Линейная';
    
    return 'Алгебраическая функция';
}

// Определение области определения
function getFunctionDomain(expr) {
    const cleanExpr = expr.toLowerCase();
    
    if (cleanExpr.includes('/x') || cleanExpr.match(/\/\(.*x.*\)/)) {
        return '(-∞, 0) ∪ (0, +∞)';
    }
    if (cleanExpr.includes('log')) {
        return '(0, +∞)';
    }
    if (cleanExpr.includes('ln')) {
        return '(0, +∞)';
    }
    if (cleanExpr.includes('sqrt')) {
        return '[0, +∞)';
    }
    
    return '(-∞, +∞)';
}

// Поиск нулей функции
function findFunctionZeros(func, expr) {
    const zeros = [];
    
    // Простые известные случаи
    const simpleCases = {
        'x': ['0'],
        'x**2': ['0'],
        'x^2': ['0'],
        'x**2-4': ['-2', '2'],
        'x^2-4': ['-2', '2'],
        'x**3': ['0'],
        'x^3': ['0'],
        '2*x+1': ['-0.5'],
        '2x+1': ['-0.5'],
        'x-1': ['1'],
        'x+1': ['-1']
    };
    
    const cleanExpr = expr.replace(/\s+/g, '').toLowerCase();
    if (simpleCases[cleanExpr]) {
        return simpleCases[cleanExpr];
    }
    
    // Численный поиск нулей
    const step = 0.5;
    for (let x = -10; x <= 10; x += step) {
        try {
            const y1 = func.evaluate(x);
            const y2 = func.evaluate(x + step);
            
            if (y1 !== null && y2 !== null && y1 * y2 <= 0) {
                // Линейная интерполяция для более точного нахождения нуля
                const zero = (x - y1 * (step / (y2 - y1))).toFixed(2);
                if (!zeros.includes(zero)) {
                    zeros.push(zero);
                }
            }
        } catch(e) {
            // Пропускаем точки, где функция не определена
        }
    }
    
    return zeros.slice(0, 5); // Возвращаем не более 5 нулей
}

// Проверка чётности
function checkFunctionParity(func) {
    try {
        const at1 = func.evaluate(1);
        const atMinus1 = func.evaluate(-1);
        
        if (at1 === null || atMinus1 === null) {
            return {
                result: 'Не определена',
                description: 'Невозможно определить'
            };
        }
        
        if (Math.abs(at1 - atMinus1) < 0.01) {
            return {
                result: 'Чётная',
                description: 'f(-x) = f(x), симметрия относительно OY'
            };
        }
        
        if (Math.abs(at1 + atMinus1) < 0.01) {
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
            description: 'Невозможно определить'
        };
    }
}

// Построение графика
function plotFunction(func, expr) {
    try {
        const range = parseInt(document.getElementById('xRange').value) || 10;
        const step = range / 100;
        
        const xValues = [];
        const yValues = [];
        
        // Генерация точек
        for (let x = -range; x <= range; x += step) {
            const y = func.evaluate(x);
            
            if (y !== null && isFinite(y)) {
                xValues.push(x);
                yValues.push(y);
            } else {
                xValues.push(x);
                yValues.push(null);
            }
        }
        
        // Проверяем, есть ли данные для построения
        const validPoints = yValues.filter(y => y !== null).length;
        if (validPoints === 0) {
            throw new Error('Нет данных для построения графика');
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
            },
            connectgaps: false
        };
        
        // Обновление layout
        const layout = {
            title: { text: `f(x) = ${expr}`, font: { size: 16 } },
            xaxis: { 
                title: 'x',
                range: [-range, range],
                gridcolor: '#f0f0f0',
                zeroline: true
            },
            yaxis: { 
                title: 'f(x)',
                gridcolor: '#f0f0f0',
                zeroline: true
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            showlegend: false
        };
        
        Plotly.react('plot', [trace], layout);
        
    } catch(error) {
        console.error('Ошибка построения графика:', error);
        showError('Не удалось построить график. Проверьте функцию.');
    }
}

// Обновление отображения свойств
function updatePropertiesDisplay(properties) {
    const container = document.getElementById('propertiesOutput');
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>Не удалось проанализировать свойства</p>
                <p>Функция может быть слишком сложной</p>
            </div>
        `;
        return;
    }
    
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
                <div class="error-hint">Примеры: x**2, sin(x), exp(x), 2*x+1</div>
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
        plotFunction(currentFunction, currentFunction.toString());
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

// Экспорт для отладки
window.FunctionAnalyzer = {
    analyze: analyzeFunction,
    parseFunction: parseFunction
};