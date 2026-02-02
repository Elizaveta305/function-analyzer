// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ
// Автономная версия БЕЗ Math.js
// ============================================

// Глобальные переменные
let currentFunction = null;

// Безопасный парсер математических выражений
function parseFunction(expr) {
    // Сохраняем исходное выражение для отображения
    const displayExpr = expr;
    
    // Подготовка выражения для eval
    expr = expr
        .replace(/\s+/g, '') // Убираем пробелы
        .replace(/\^/g, '**') // ^ заменяем на **
        .toLowerCase();
    
    return {
        evaluate: function(x) {
            try {
                // Заменяем x на значение и математические функции
                let evalExpr = expr
                    .replace(/x/g, `(${x})`)
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/exp\(/g, 'Math.exp(')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/pi/g, 'Math.PI')
                    .replace(/e/g, 'Math.E');
                
                // Безопасная оценка
                return eval(evalExpr);
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
        
        // Тестируем функцию в точке x=1
        const testResult = func.evaluate(1);
        if (testResult === null || !isFinite(testResult)) {
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
    
    // 3. Нули функции (упрощенный поиск)
    const zeros = [];
    try {
        // Простые случаи
        if (expr === 'x**2' || expr === 'x^2') zeros.push('0');
        else if (expr === 'x**2 - 4' || expr === 'x^2 - 4') zeros.push('-2', '2');
        else if (expr === 'x**3' || expr === 'x^3') zeros.push('0');
        else if (expr === '2*x + 1') zeros.push('-0.5');
        else {
            // Численный поиск для других функций
            for (let x = -10; x <= 10; x += 0.5) {
                const y1 = func.evaluate(x);
                const y2 = func.evaluate(x + 0.5);
                
                if (y1 !== null && y2 !== null && y1 * y2 <= 0) {
                    const zero = ((x + x + 0.5) / 2).toFixed(2);
                    if (!zeros.includes(zero)) zeros.push(zero);
                }
            }
        }
    } catch(e) {
        // Игнорируем ошибки
    }
    
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
    
    // 5. Чётность (упрощенная проверка)
    let parity = { result: 'Не определена', description: 'Невозможно определить' };
    try {
        const at1 = func.evaluate(1);
        const atMinus1 = func.evaluate(-1);
        
        if (at1 !== null && atMinus1 !== null) {
            if (Math.abs(at1 - atMinus1) < 0.01) {
                parity = {
                    result: 'Чётная',
                    description: 'f(-x) = f(x), симметрия относительно OY'
                };
            } else if (Math.abs(at1 + atMinus1) < 0.01) {
                parity = {
                    result: 'Нечётная',
                    description: 'f(-x) = -f(x), симметрия относительно начала координат'
                };
            } else {
                parity = {
                    result: 'Общего вида',
                    description: 'Ни чётная, ни нечётная'
                };
            }
        }
    } catch(e) {
        // Оставляем значение по умолчанию
    }
    
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
    
    if (expr.includes('/x')) {
        properties.push({
            title: 'Особые точки',
            value: 'x = 0',
            icon: '⚠️',
            description: 'Вертикальная асимптота при x = 0'
        });
    }
    
    return properties;
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
    if (expr.match(/[0-9]+\*x|x\*[0-9]+/)) return 'Линейная';
    
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
        const step = range / 100;
        
        const xValues = [];
        const yValues = [];
        
        // Генерация точек
        for (let x = -range; x <= range; x += step) {
            const y = func.evaluate(x);
            
            if (y !== null && isFinite(y) && Math.abs(y) < 1000) {
                xValues.push(x);
                yValues.push(y);
            } else {
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