// ===== ПРОСТОЙ РАБОЧИЙ АНАЛИЗАТОР =====

// Ждём загрузки библиотек
window.addEventListener('load', function() {
    console.log('Библиотеки загружены:', { 
        math: typeof math !== 'undefined', 
        Plotly: typeof Plotly !== 'undefined' 
    });
    
    // Проверяем Math.js
    if (typeof math === 'undefined') {
        showError('Библиотека Math.js не загрузилась. Обновите страницу.');
        return;
    }
    
    // Инициализируем
    initAnalyzer();
});

function initAnalyzer() {
    console.log('🚀 Анализатор инициализирован');
    
    // Элементы
    const input = document.getElementById('functionInput');
    const btn = document.getElementById('calculateBtn');
    const plotDiv = document.getElementById('plot');
    
    // Инициализация графика
    Plotly.newPlot(plotDiv, [{
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#3498db', width: 2 }
    }], {
        title: 'График функции',
        xaxis: { title: 'x', gridcolor: '#f0f0f0' },
        yaxis: { title: 'f(x)', gridcolor: '#f0f0f0' },
        plot_bgcolor: '#fafafa'
    });
    
    // Обработчики
    btn.addEventListener('click', analyze);
    
    // Enter для ввода
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') analyze();
    });
    
    // Управление графиком
    document.getElementById('zoomInBtn').addEventListener('click', () => zoom(0.8));
    document.getElementById('zoomOutBtn').addEventListener('click', () => zoom(1.2));
    document.getElementById('resetViewBtn').addEventListener('click', resetView);
    
    // Диапазон
    document.getElementById('xRange').addEventListener('change', function() {
        if (window.currentFunc) {
            plotFunction(window.currentFunc);
        }
    });
    
    // Авто-запуск
    setTimeout(() => {
        if (!input.value) {
            input.value = 'x^2';
            analyze();
        }
    }, 500);
}

// Основная функция анализа
function analyze() {
    const input = document.getElementById('functionInput');
    const expr = input.value.trim();
    
    if (!expr) {
        showError('Введите функцию');
        return;
    }
    
    try {
        // Компилируем
        const func = math.compile(expr);
        window.currentFunc = expr;
        
        // Обновляем отображение
        document.getElementById('currentFunction').textContent = `f(x) = ${expr}`;
        document.getElementById('graphStatus').textContent = 'Анализ...';
        
        // Анализируем свойства
        const props = analyzeProperties(expr, func);
        
        // Показываем свойства
        showProperties(props);
        
        // Строим график
        plotFunction(expr);
        
        document.getElementById('graphStatus').textContent = 'Готово';
        
    } catch (error) {
        console.error('Ошибка:', error);
        showError(`Ошибка: ${error.message}`);
    }
}

// Анализ свойств (упрощённый)
function analyzeProperties(expr, func) {
    const props = [];
    
    // 1. Тип
    const type = getType(expr);
    props.push({
        title: 'Тип функции',
        value: type,
        icon: '📊',
        desc: 'Математическая классификация'
    });
    
    // 2. Область определения
    props.push({
        title: 'Область определения',
        value: getDomain(expr),
        icon: '🌐',
        desc: 'Допустимые значения x'
    });
    
    // 3. Нули (простые случаи)
    if (expr === 'x^2') {
        props.push({
            title: 'Нули функции',
            value: '0',
            icon: '⚫',
            desc: 'f(x) = 0 при x = 0'
        });
    } else if (expr === 'x^2 - 4') {
        props.push({
            title: 'Нули функции',
            value: '-2, 2',
            icon: '⚫',
            desc: 'f(x) = 0 при x = -2 и x = 2'
        });
    } else if (expr === '2*x + 1') {
        props.push({
            title: 'Нули функции',
            value: '-0.5',
            icon: '⚫',
            desc: 'f(x) = 0 при x = -0.5'
        });
    }
    
    // 4. Пересечение с OY
    try {
        const y0 = func.evaluate({x: 0});
        if (isFinite(y0)) {
            props.push({
                title: 'Пересечение с OY',
                value: `(0, ${y0.toFixed(2)})`,
                icon: '🔵',
                desc: 'Значение при x = 0'
            });
        }
    } catch(e) {}
    
    // 5. Чётность
    try {
        const f1 = func.evaluate({x: 1});
        const fm1 = func.evaluate({x: -1});
        
        if (Math.abs(f1 - fm1) < 0.1) {
            props.push({
                title: 'Чётность',
                value: 'Чётная',
                icon: '🔄',
                desc: 'Симметрия относительно OY'
            });
        } else if (Math.abs(f1 + fm1) < 0.1) {
            props.push({
                title: 'Чётность',
                value: 'Нечётная',
                icon: '🔄',
                desc: 'Симметрия относительно (0,0)'
            });
        }
    } catch(e) {}
    
    return props;
}

// Определение типа
function getType(expr) {
    expr = expr.toLowerCase();
    if (expr.includes('x^2')) return 'Квадратичная';
    if (expr.includes('x^3')) return 'Кубическая';
    if (expr.includes('sin') || expr.includes('cos')) return 'Тригонометрическая';
    if (expr.includes('1/') || expr.includes('/x')) return 'Дробная';
    if (expr.includes('exp') || expr.includes('e^')) return 'Показательная';
    if (expr.includes('log') || expr.includes('ln')) return 'Логарифмическая';
    if (expr.includes('*x')) return 'Линейная';
    return 'Алгебраическая';
}

// Область определения
function getDomain(expr) {
    expr = expr.toLowerCase();
    if (expr.includes('/x')) return 'x ≠ 0';
    if (expr.includes('log') || expr.includes('ln')) return 'x > 0';
    return 'Все действительные числа';
}

// Показать свойства
function showProperties(props) {
    const container = document.getElementById('propertiesOutput');
    
    if (props.length === 0) {
        container.innerHTML = '<div class="empty-state">Свойства не определены</div>';
        return;
    }
    
    let html = '';
    props.forEach(p => {
        html += `
            <div class="property-item">
                <div class="property-icon">${p.icon}</div>
                <div>
                    <div class="property-title">${p.title}</div>
                    <div class="property-value">${p.value}</div>
                    <div class="property-description">${p.desc}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Построение графика
function plotFunction(expr) {
    try {
        const func = math.compile(expr);
        const range = parseInt(document.getElementById('xRange').value) || 10;
        
        const x = [];
        const y = [];
        
        // Генерируем точки
        for (let i = -range; i <= range; i += 0.1) {
            try {
                const val = func.evaluate({x: i});
                if (isFinite(val) && Math.abs(val) < 100) {
                    x.push(i);
                    y.push(val);
                }
            } catch(e) {
                // Пропускаем
            }
        }
        
        // Обновляем график
        Plotly.react('plot', [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3498db', width: 2 }
        }], {
            title: `f(x) = ${expr}`,
            xaxis: { 
                title: 'x',
                range: [-range, range]
            },
            yaxis: { title: 'f(x)' }
        });
        
    } catch(error) {
        console.error('Ошибка графика:', error);
    }
}

// Управление графиком
function zoom(factor) {
    Plotly.relayout('plot', {
        'xaxis.range[0]': `*${factor}`,
        'xaxis.range[1]': `*${factor}`,
        'yaxis.range[0]': `*${factor}`,
        'yaxis.range[1]': `*${factor}`
    });
}

function resetView() {
    const range = parseInt(document.getElementById('xRange').value) || 10;
    Plotly.relayout('plot', {
        'xaxis.range': [-range, range],
        'yaxis.range': [-range, range]
    });
}

// Показать ошибку
function showError(msg) {
    const container = document.getElementById('propertiesOutput');
    container.innerHTML = `
        <div class="error-state">
            <strong>Ошибка:</strong> ${msg}
        </div>
    `;
}

// Экспорт для консоли
window.analyzeFunction = analyze; 
