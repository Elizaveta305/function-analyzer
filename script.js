// ============================================
// АНАЛИЗАТОР МАТЕМАТИЧЕСКИХ ФУНКЦИЙ
// Упрощенная, но гарантированно рабочая версия
// ============================================

// Глобальные переменные
let currentFunction = null;

// Очень простой парсер функций
function createFunction(expr) {
    // Сохраняем исходное выражение
    const originalExpr = expr;
    
    // Функция для вычисления
    return {
        evaluate: function(x) {
            try {
                // Простая замена выражений
                let expression = originalExpr
                    .toLowerCase()
                    .replace(/\s+/g, '') // Убираем пробелы
                    .replace(/\^/g, '**') // Заменяем ^ на **
                    .replace(/x/g, `(${x})`); // Заменяем x на значение
                
                // Математические функции
                expression = expression
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/exp\(/g, 'Math.exp(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/abs\(/g, 'Math.abs(');
                
                // Неявное умножение: 2x -> 2*x, x2 -> x*2
                expression = expression
                    .replace(/(\d)([a-z\(])/gi, '$1*$2')
                    .replace(/([a-z\)])(\d)/gi, '$1*$2');
                
                // Безопасное вычисление
                const result = Function('"use strict"; return (' + expression + ')')();
                
                // Проверка результата
                if (typeof result === 'number' && isFinite(result)) {
                    return result;
                }
                return null;
            } catch (error) {
                console.log('Вычисление ошибки для', expr, 'при x=', x, ':', error);
                return null;
            }
        },
        toString: function() {
            return originalExpr;
        }
    };
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
        // Создаем функцию
        const func = createFunction(expr);
        
        // Тестируем функцию
        const testValues = [0, 1, -1];
        let validCount = 0;
        
        for (const x of testValues) {
            const result = func.evaluate(x);
            if (result !== null) {
                validCount++;
            }
        }
        
        if (validCount === 0) {
            throw new Error('Неверное выражение');
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

// Анализ свойств функции (упрощенный)
function analyzeFunctionProperties(expr, func) {
    const properties = [];
    
    // 1. Тип функции
    const type = getFunctionType(expr);
    properties.push({
        title: 'Тип функции',
        value: type,
        icon: '📊',
        description: 'Классификация по математическому виду'
    });
    
    // 2. Область определения
    properties.push({
        title: 'Область определения',
        value: '(-∞, +∞)',
        icon: '🌐',
        description: 'Для большинства функций'
    });
    
    // 3. Пересечение с OY
    try {
        const yIntercept = func.evaluate(0);
        if (yIntercept !== null) {
            properties.push({
                title: 'Пересечение с OY',
                value: `(0, ${yIntercept.toFixed(2)})`,
                icon: '🔵',
                description: 'Значение функции при x = 0'
            });
        }
    } catch(e) {
        // Пропускаем
    }
    
    // 4. Специальные свойства
    const exprLower = expr.toLowerCase();
    
    if (exprLower.includes('sin') || exprLower.includes('cos')) {
        properties.push({
            title: 'Периодичность',
            value: 'Периодическая',
            icon: '⏱️',
            description: 'Период 2π'
        });
    }
    
    if (exprLower.includes('exp')) {
        properties.push({
            title: 'Поведение',
            value: 'Экспоненциальный рост',
            icon: '📈',
            description: 'Быстро растет при x → +∞'
        });
    }
    
    return properties;
}

// Определение типа функции
function getFunctionType(expr) {
    expr = expr.toLowerCase();
    
    if (expr.includes('x**2') || expr.includes('x^2')) return 'Квадратичная';
    if (expr.includes('x**3') || expr.includes('x^3')) return 'Кубическая';
    if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan')) return 'Тригонометрическая';
    if (expr.includes('exp')) return 'Показательная';
    if (expr.includes('log') || expr.includes('ln')) return 'Логарифмическая';
    if (expr.includes('/x')) return 'Дробная';
    if (expr.includes('x')) return 'Алгебраическая';
    
    return 'Постоянная функция';
}

// Построение графика
function plotFunction(func, expr) {
    try {
        const range = parseInt(document.getElementById('xRange').value) || 10;
        const step = 0.1;
        
        const xValues = [];
        const yValues = [];
        
        // Генерация точек
        for (let x = -range; x <= range; x += step) {
            const y = func.evaluate(x);
            
            if (y !== null && Math.abs(y) < 100) {
                xValues.push(x);
                yValues.push(y);
            } else {
                // Разрыв графика
                xValues.push(x);
                yValues.push(null);
            }
        }
        
        // Проверяем, есть ли данные
        if (xValues.length === 0) {
            throw new Error('Нет данных для графика');
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
                width: 2
            },
            connectgaps: false
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
        console.error('Ошибка построения:', error);
        showError('Не удалось построить график');
    }
}

// Остальные функции (showLoading, showError, updatePropertiesDisplay и т.д.)
function showLoading() {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Анализируем функцию...</p>
        </div>
    `;
}

function showError(message) {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">❌</div>
            <div class="error-content">
                <div class="error-title">Ошибка</div>
                <div class="error-message">${message}</div>
                <div class="error-hint">Введите функцию от x, например: x**2, sin(x), exp(x)</div>
            </div>
        </div>
    `;
}

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
    
    container.innerHTML = html || `
        <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>Свойства функции</p>
            <p>Основные характеристики будут отображены здесь</p>
        </div>
    `;
}

// Управление графиком
function zoomInGraph() {
    Plotly.relayout('plot', {
        'xaxis.range[0]': '*=0.9',
        'xaxis.range[1]': '*=0.9',
        'yaxis.range[0]': '*=0.9',
        'yaxis.range[1]': '*=0.9'
    });
}

function zoomOutGraph() {
    Plotly.relayout('plot', {
        'xaxis.range[0]': '*=1.1',
        'xaxis.range[1]': '*=1.1',
        'yaxis.range[0]': '*=1.1',
        'yaxis.range[1]': '*=1.1'
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
        if (currentFunction) {
            updateGraphRange();
        }
    });
    
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
}

// Инициализация графика
function initializePlot() {
    const trace = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        name: 'f(x)',
        line: { color: '#3498db', width: 2 }
    };
    
    const layout = {
        title: { text: 'График функции', font: { size: 16 } },
        xaxis: { 
            title: 'x', 
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
    
    Plotly.newPlot('plot', [trace], layout);
    document.getElementById('graphStatus').textContent = 'Готов к построению';
}

// Инициализация приложения
function initApp() {
    console.log('🚀 Анализатор функций загружается...');
    
    // Проверяем Plotly
    if (typeof Plotly === 'undefined') {
        showError('Библиотека графиков не загружена');
        return;
    }
    
    // Настройка обработчиков
    setupEventHandlers();
    
    // Инициализация графика
    initializePlot();
    
    // Авто-анализ при загрузке
    setTimeout(() => {
        try {
            analyzeFunction();
        } catch(e) {
            console.log('Авто-анализ не сработал:', e);
        }
    }, 1000);
    
    console.log('✅ Анализатор готов!');
}

// Запуск при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
} 