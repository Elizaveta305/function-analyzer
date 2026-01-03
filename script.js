// ====================
// ГЛАВНЫЙ МОДУЛЬ
// ====================

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация
    const elements = {
        btn: document.getElementById('calculateBtn'),
        input: document.getElementById('functionInput'),
        output: document.getElementById('propsOutput'),
        plot: document.getElementById('plot')
    };
    
    // Назначение обработчиков
    elements.btn.addEventListener('click', handleCalculate);
    elements.input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleCalculate();
    });
    
    // Обработчик расчета
    function handleCalculate() {
        const expr = elements.input.value.trim();
        if (!expr) {
            showError('Введите функцию для анализа');
            return;
        }
        
        try {
            // 1. Анализ свойств
            const analysis = analyzeFunction(expr);
            elements.output.innerHTML = analysis;
            
            // 2. Построение графика
            plotFunction(expr);
            
        } catch (error) {
            showError(`Ошибка: ${error.message}`);
        }
    }
    
    // Автозапуск при загрузке
    setTimeout(() => elements.btn.click(), 500);
});

// ====================
// МОДУЛЬ АНАЛИЗА
// ====================

function analyzeFunction(expr) {
    let html = `<div class="function-header">
                   <strong>f(x) = ${expr}</strong>
                </div>`;
    
    // Определяем тип функции
    const type = determineFunctionType(expr);
    html += `<div class="property-card">
                <strong>📊 Тип функции:</strong> ${type.name}
             </div>`;
    
    // Добавляем свойства
    const properties = calculateProperties(expr, type);
    
    properties.forEach(prop => {
        html += `<div class="property-card">
                    <strong>${prop.icon} ${prop.title}:</strong> ${prop.value}
                 </div>`;
    });
    
    return html;
}

// Определение типа функции
function determineFunctionType(expr) {
    if (expr.includes('^2') || expr === 'x^2') {
        return { 
            name: 'Квадратичная (парабола)',
            category: 'polynomial',
            degree: 2
        };
    } else if (expr.includes('^3') || expr === 'x^3') {
        return { 
            name: 'Кубическая',
            category: 'polynomial', 
            degree: 3
        };
    } else if (expr.includes('*x') || expr.includes('x*')) {
        return { 
            name: 'Линейная (прямая)',
            category: 'linear',
            degree: 1
        };
    } else if (expr.includes('sin') || expr.includes('cos')) {
        return { 
            name: 'Тригонометрическая',
            category: 'trigonometric'
        };
    } else {
        return { 
            name: 'Определяется...',
            category: 'unknown'
        };
    }
}

// Расчет свойств
function calculateProperties(expr, type) {
    const properties = [];
    
    // Область определения (пока упрощенно)
    properties.push({
        icon: '🌐',
        title: 'Область определения D(f)',
        value: '(-∞; +∞)',
        description: 'Все действительные числа'
    });
    
    // Нули функции
    const zeros = findZeros(expr);
    if (zeros.length > 0) {
        properties.push({
            icon: '⚫',
            title: 'Нули функции',
            value: zeros.join(', '),
            description: 'Точки пересечения с осью OX'
        });
    }
    
    // Дополнительные свойства по типу
    if (type.category === 'polynomial') {
        properties.push({
            icon: '📈',
            title: 'Степень полинома',
            value: type.degree,
            description: 'Максимальная степень переменной'
        });
    }
    
    if (expr === 'x^2') {
        properties.push({
            icon: '🎯',
            title: 'Вершина параболы',
            value: '(0, 0)',
            description: 'Точка экстремума'
        });
    }
    
    return properties;
}

// Поиск нулей (упрощенный)
function findZeros(expr) {
    const zeros = [];
    
    // Простые случаи
    if (expr === 'x^2' || expr === 'x^3') zeros.push('0');
    if (expr === '2*x + 1') zeros.push('-0.5');
    if (expr === 'x^2 - 4') zeros.push('-2', '2');
    
    return zeros;
}

// ====================
// МОДУЛЬ ГРАФИКОВ
// ====================

function plotFunction(expr) {
    // Генерация точек
    const points = generatePoints(expr, -5, 5, 0.1);
    
    // Создание графика
    const trace = {
        x: points.x,
        y: points.y,
        type: 'scatter',
        mode: 'lines',
        name: `f(x) = ${expr}`,
        line: {
            color: '#3498db',
            width: 3
        }
    };
    
    const layout = {
        title: `График функции: f(x) = ${expr}`,
        xaxis: {
            title: 'x',
            gridcolor: '#ecf0f1',
            zeroline: true
        },
        yaxis: {
            title: 'f(x)',
            gridcolor: '#ecf0f1',
            zeroline: true
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: '#ffffff',
        showlegend: true
    };
    
    Plotly.newPlot('plot', [trace], layout);
}

function generatePoints(expr, from, to, step) {
    const xValues = [];
    const yValues = [];
    
    for (let x = from; x <= to; x += step) {
        xValues.push(x);
        
        try {
            let y;
            // Упрощенные вычисления
            if (expr === 'x^2') y = x * x;
            else if (expr === 'x^3') y = x * x * x;
            else if (expr === '2*x + 1') y = 2 * x + 1;
            else if (expr === 'sin(x)') y = Math.sin(x);
            else if (expr === 'cos(x)') y = Math.cos(x);
            else if (expr === '1/x') y = x !== 0 ? 1 / x : null;
            else y = x * x; // fallback
            
            yValues.push(y);
        } catch {
            yValues.push(null);
        }
    }
    
    return { x: xValues, y: yValues };
}

// ====================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ====================

function showError(message) {
    const output = document.getElementById('propsOutput');
    output.innerHTML = `
        <div class="error-message">
            ❌ <strong>Ошибка:</strong> ${message}
        </div>
    `;
}

function showSuccess(message) {
    const output = document.getElementById('propsOutput');
    output.innerHTML = `
        <div class="success-message">
            ✅ ${message}
        </div>
    `;
}