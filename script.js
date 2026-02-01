// ===== ИСПРАВЛЕНИЕ ОШИБКИ math is not defined =====
// Добавь эту строку в самое начало файла!
const math = window.math || {};

// Глобальные переменные
let currentFunction = null;
let currentCompiledFunc = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики
    document.getElementById('calculateBtn').addEventListener('click', analyzeFunction);
    
    // Инициализация графика
    initializePlot();
});

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
        title: 'График функции',
        xaxis: { title: 'x', gridcolor: '#eee' },
        yaxis: { title: 'f(x)', gridcolor: '#eee' },
        plot_bgcolor: '#fafafa',
        paper_bgcolor: '#fff',
        margin: { t: 40, r: 30, b: 50, l: 50 }
    };
    
    Plotly.newPlot('plot', [trace], layout);
}

// Основная функция анализа
function analyzeFunction() {
    const input = document.getElementById('functionInput');
    const expr = input.value.trim();
    
    if (!expr) {
        showError('Введите функцию для анализа');
        return;
    }
    
    try {
        // Компилируем функцию
        currentCompiledFunc = math.compile(expr);
        currentFunction = expr;
        
        // Анализируем свойства
        const properties = getFunctionProperties(expr, currentCompiledFunc);
        
        // Обновляем интерфейс
        updateProperties(properties);
        
        // Строим график
        plotFunction(expr);
        
    } catch (error) {
        showError('Ошибка: ' + error.message);
    }
}

// Получение свойств функции
function getFunctionProperties(expr, compiledFunc) {
    const properties = [];
    
    // 1. Тип функции
    const type = getFunctionType(expr);
    properties.push({
        title: 'Тип функции',
        value: type,
        desc: 'Классификация по виду'
    });
    
    // 2. Область определения
    properties.push({
        title: 'Область определения',
        value: getDomain(expr),
        desc: 'Множество допустимых значений x'
    });
    
    // 3. Нули функции
    const zeros = findZeros(compiledFunc);
    properties.push({
        title: 'Нули функции',
        value: zeros.length > 0 ? zeros.join(', ') : 'Нет действительных нулей',
        desc: 'Точки пересечения с осью OX (f(x)=0)'
    });
    
    // 4. Пересечение с OY
    try {
        const yIntercept = compiledFunc.evaluate({x: 0});
        if (isFinite(yIntercept)) {
            properties.push({
                title: 'Пересечение с OY',
                value: `(0, ${yIntercept.toFixed(3)})`,
                desc: 'Значение при x=0'
            });
        }
    } catch(e) {}
    
    // 5. Чётность
    properties.push({
        title: 'Чётность',
        value: checkParity(compiledFunc),
        desc: 'Симметрия графика'
    });
    
    // 6. Поведение на бесконечности
    properties.push({
        title: 'Поведение при x→∞',
        value: getBehaviorAtInfinity(compiledFunc),
        desc: 'Пределы функции'
    });
    
    return properties;
}

// Определение типа функции
function getFunctionType(expr) {
    expr = expr.toLowerCase();
    
    if (expr.includes('x^2')) return 'Квадратичная (парабола)';
    if (expr.includes('x^3')) return 'Кубическая';
    if (expr.includes('sin') || expr.includes('cos')) return 'Тригонометрическая';
    if (expr.includes('1/') || expr.includes('/x')) return 'Дробно-рациональная';
    if (expr.includes('exp') || expr.includes('e^')) return 'Показательная';
    if (expr.includes('log') || expr.includes('ln')) return 'Логарифмическая';
    if (expr.includes('*x') || expr.match(/^[0-9]*x/)) return 'Линейная';
    
    return 'Алгебраическая';
}

// Область определения
function getDomain(expr) {
    expr = expr.toLowerCase();
    
    if (expr.includes('/x') || expr.match(/\/\(.*x.*\)/)) {
        return '(-∞, 0) ∪ (0, +∞)';
    }
    if (expr.includes('log') || expr.includes('ln')) {
        return '(0, +∞)';
    }
    if (expr.includes('sqrt')) {
        return '[0, +∞)';
    }
    
    return '(-∞, +∞)';
}

// Поиск нулей
function findZeros(func) {
    const zeros = [];
    const step = 0.5;
    
    for (let x = -10; x <= 10; x += step) {
        try {
            const y1 = func.evaluate({x: x});
            const y2 = func.evaluate({x: x + step});
            
            if (y1 * y2 <= 0 && Math.abs(y1) < 100 && Math.abs(y2) < 100) {
                // Простое приближение
                const zero = ((x + x + step) / 2).toFixed(2);
                zeros.push(zero);
            }
        } catch(e) {}
    }
    
    return zeros.slice(0, 5);
}

// Проверка чётности
function checkParity(func) {
    try {
        const f1 = func.evaluate({x: 1});
        const fMinus1 = func.evaluate({x: -1});
        
        if (Math.abs(f1 - fMinus1) < 0.01) return 'Чётная';
        if (Math.abs(f1 + fMinus1) < 0.01) return 'Нечётная';
        return 'Общего вида';
    } catch(e) {
        return 'Не определена';
    }
}

// Поведение на бесконечности
function getBehaviorAtInfinity(func) {
    try {
        const at100 = func.evaluate({x: 100});
        const atMinus100 = func.evaluate({x: -100});
        
        if (Math.abs(at100) > 1000) return 'Неограниченный рост';
        if (Math.abs(atMinus100) > 1000) return 'Неограниченный рост';
        
        return 'Ограниченное поведение';
    } catch(e) {
        return 'Не определено';
    }
}

// Построение графика
function plotFunction(expr) {
    try {
        const func = math.compile(expr);
        const range = parseInt(document.getElementById('xRange').value) || 10;
        const step = range / 100;
        
        const xValues = [];
        const yValues = [];
        
        for (let x = -range; x <= range; x += step) {
            try {
                const y = func.evaluate({x: x});
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
        
        const trace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: `f(x) = ${expr}`,
            line: { color: '#3498db', width: 2 }
        };
        
        const layout = {
            title: `График: f(x) = ${expr}`,
            xaxis: { 
                title: 'x', 
                gridcolor: '#eee',
                range: [-range, range]
            },
            yaxis: { 
                title: 'f(x)', 
                gridcolor: '#eee' 
            },
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fff'
        };
        
        Plotly.react('plot', [trace], layout);
        
    } catch(error) {
        showError('Ошибка построения графика');
    }
}

// Обновление свойств в интерфейсе
function updateProperties(properties) {
    const container = document.getElementById('propertiesOutput');
    
    let html = '';
    properties.forEach(prop => {
        html += `
            <div class="property-card">
                <div class="property-title">${prop.title}</div>
                <div class="property-value">${prop.value}</div>
                <div class="property-desc">${prop.desc}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Показать ошибку
function showError(message) {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = `
        <div class="property-card" style="border-left-color: #e74c3c;">
            <div class="property-title" style="color: #e74c3c;">Ошибка</div>
            <div class="property-value">${message}</div>
            <div class="property-desc">Проверьте правильность ввода функции</div>
        </div>
    `;
}

// Управление графиком
document.getElementById('zoomInBtn').addEventListener('click', function() {
    Plotly.relayout('plot', {
        'xaxis.range[0]': '-=2',
        'xaxis.range[1]': '+=2',
        'yaxis.range[0]': '-=2',
        'yaxis.range[1]': '+=2'
    });
});

document.getElementById('zoomOutBtn').addEventListener('click', function() {
    Plotly.relayout('plot', {
        'xaxis.range[0]': '*=1.2',
        'xaxis.range[1]': '*=1.2',
        'yaxis.range[0]': '*=1.2',
        'yaxis.range[1]': '*=1.2'
    });
});

document.getElementById('resetViewBtn').addEventListener('click', function() {
    const range = parseInt(document.getElementById('xRange').value) || 10;
    Plotly.relayout('plot', {
        'xaxis.range': [-range, range],
        'yaxis.range': [-range, range]
    });
});

// Слайдер диапазона
document.getElementById('xRange').addEventListener('change', function() {
    if (currentFunction) {
        plotFunction(currentFunction);
    }
}); 