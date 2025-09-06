// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取游戏元素
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const speedLevelElement = document.getElementById('speedLevel');
    const gameOverMessage = document.getElementById('gameOverMessage');
    
    // 获取按钮元素
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const speedUpBtn = document.getElementById('speedUpBtn');
    const speedDownBtn = document.getElementById('speedDownBtn');
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // 游戏参数
    const gridSize = 20; // 网格大小
    const tileCount = canvas.width / gridSize; // 网格数量
    
    // 游戏变量
    let snake = [];
    let food = {};
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let speedLevel = 1;
    let baseSpeed = 4; // 基础速度
    let speed = baseSpeed;
    let velocityX = 0;
    let velocityY = 0;
    let gameRunning = false;
    let gamePaused = false;
    let gameOver = false;
    let gameLoop;
    
    // 初始化游戏
    function init() {
        // 初始化蛇
        snake = [
            {x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2)}
        ];
        
        // 初始化速度
        velocityX = 0;
        velocityY = 0;
        
        // 初始化分数
        score = 0;
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
        
        // 初始化速度
        speedLevel = 1;
        speed = baseSpeed;
        speedLevelElement.textContent = speedLevel;
        
        // 初始化游戏状态
        gameRunning = false;
        gamePaused = false;
        gameOver = false;
        
        // 隐藏游戏结束信息
        gameOverMessage.classList.add('hidden');
        
        // 生成食物
        generateFood();
        
        // 绘制游戏
        drawGame();
        
        // 设置按钮状态
        updateButtonStates();
    }
    
    // 生成食物
    function generateFood() {
        // 随机生成食物位置
        let foodX, foodY;
        let validPosition = false;
        
        while (!validPosition) {
            foodX = Math.floor(Math.random() * tileCount);
            foodY = Math.floor(Math.random() * tileCount);
            
            // 检查食物是否与蛇身重叠
            validPosition = true;
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === foodX && snake[i].y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        food = {
            x: foodX,
            y: foodY,
            color: getRandomFoodColor() // 随机食物颜色
        };
    }
    
    // 获取随机食物颜色
    function getRandomFoodColor() {
        const colors = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 游戏主循环
    function runGameLoop() {
        if (gameRunning && !gamePaused && !gameOver) {
            updateGame();
            drawGame();
        }
        
        // 控制游戏速度，确保不会太慢
        const delay = Math.min(1000 / speed, 200);
        gameLoop = setTimeout(runGameLoop, delay);
    }
    
    // 更新游戏状态
    function updateGame() {
        // 移动蛇
        const head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            endGame();
            return;
        }
        
        // 检查是否撞到自己
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                endGame();
                return;
            }
        }
        
        // 在蛇头前添加新的头部
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score++;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新的食物
            generateFood();
            
            // 每吃5个食物增加速度
            if (score % 5 === 0 && speedLevel < 10) {
                increaseSpeed();
            }
        } else {
            // 如果没有吃到食物，移除尾部
            snake.pop();
        }
    }
    
    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = '#e8f4f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        drawGrid();
        
        // 绘制蛇
        drawSnake();
        
        // 绘制食物
        drawFood();
        
        // 绘制游戏结束信息
        if (gameOver) {
            gameOverMessage.classList.remove('hidden');
        }
    }
    
    // 绘制网格
    function drawGrid() {
        ctx.strokeStyle = '#d6eaf8';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= tileCount; i++) {
            // 绘制垂直线
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            // 绘制水平线
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }
    
    // 绘制蛇
    function drawSnake() {
        // 绘制蛇身
        for (let i = 1; i < snake.length; i++) {
            const segment = snake[i];
            
            // 渐变颜色，从头到尾逐渐变浅
            const colorIntensity = 1 - (i / snake.length) * 0.6;
            ctx.fillStyle = `rgba(46, 204, 113, ${colorIntensity})`;
            
            // 绘制圆角矩形作为蛇身
            roundRect(
                ctx,
                segment.x * gridSize + 1,
                segment.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2,
                5
            );
        }
        
        // 绘制蛇头（如果蛇存在）
        if (snake.length > 0) {
            const head = snake[0];
            ctx.fillStyle = '#27ae60'; // 蛇头颜色
            
            // 绘制圆角矩形作为蛇头
            roundRect(
                ctx,
                head.x * gridSize + 1,
                head.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2,
                8
            );
            
            // 绘制蛇眼睛
            drawSnakeEyes(head);
        }
    }
    
    // 绘制蛇眼睛
    function drawSnakeEyes(head) {
        const eyeSize = 3;
        const eyeOffset = 5;
        ctx.fillStyle = 'white';
        
        // 根据移动方向确定眼睛位置
        if (velocityX === 1) { // 向右
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityX === -1) { // 向左
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === -1) { // 向上
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === 1) { // 向下
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else { // 默认（游戏开始前）
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制瞳孔
        ctx.fillStyle = 'black';
        if (velocityX === 1) { // 向右
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset + 1, head.y * gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset + 1, head.y * gridSize + gridSize - eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityX === -1) { // 向左
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset - 1, head.y * gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset - 1, head.y * gridSize + gridSize - eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === -1) { // 向上
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset - 1, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset - 1, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === 1) { // 向下
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset + 1, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + gridSize - eyeOffset + 1, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else { // 默认（游戏开始前）
            ctx.beginPath();
            ctx.arc(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(head.x * gridSize + gridSize - eyeOffset, head.y * gridSize + eyeOffset, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制食物
    function drawFood() {
        ctx.fillStyle = food.color;
        
        // 绘制圆形食物
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // 添加高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2 - 2,
            food.y * gridSize + gridSize / 2 - 2,
            gridSize / 5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // 辅助函数：绘制圆角矩形
    function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fill();
    }
    
    // 开始游戏
    function startGame() {
        if (!gameRunning) {
            gameRunning = true;
            gamePaused = false;
            gameOver = false;
            
            // 设置初始方向（向右）
            velocityX = 1;
            velocityY = 0;
            
            // 开始游戏循环
            runGameLoop();
            
            // 更新按钮状态
            updateButtonStates();
        }
    }
    
    // 暂停游戏
    function pauseGame() {
        if (gameRunning && !gameOver) {
            gamePaused = !gamePaused;
            updateButtonStates();
        }
    }
    
    // 重新开始游戏
    function restartGame() {
        // 清除之前的游戏循环
        clearTimeout(gameLoop);
        
        // 重新初始化游戏
        init();
    }
    
    // 结束游戏
    function endGame() {
        gameOver = true;
        gameRunning = false;
        updateButtonStates();
    }
    
    // 更新按钮状态
    function updateButtonStates() {
        startBtn.disabled = gameRunning;
        pauseBtn.disabled = !gameRunning || gameOver;
        pauseBtn.textContent = gamePaused ? '继续' : '暂停';
        speedUpBtn.disabled = speedLevel >= 10;
        speedDownBtn.disabled = speedLevel <= 1;
    }
    
    // 增加速度
    function increaseSpeed() {
        if (speedLevel < 10) {
            speedLevel++;
            speed = baseSpeed + (speedLevel - 1) * 1.5;
            speedLevelElement.textContent = speedLevel;
            updateButtonStates();
        }
    }
    
    // 减少速度
    function decreaseSpeed() {
        if (speedLevel > 1) {
            speedLevel--;
            speed = baseSpeed + (speedLevel - 1) * 1.5;
            speedLevelElement.textContent = speedLevel;
            updateButtonStates();
        }
    }
    
    // 键盘控制
    document.addEventListener('keydown', function(e) {
        // 如果游戏未运行或已暂停或已结束，则不响应方向键
        if (!gameRunning || gamePaused || gameOver) {
            return;
        }
        
        // 方向键控制
        switch(e.key) {
            case 'ArrowUp':
                if (velocityY !== 1) { // 不允许向下移动时向上转向
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY !== -1) { // 不允许向上移动时向下转向
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX !== 1) { // 不允许向右移动时向左转向
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX !== -1) { // 不允许向左移动时向右转向
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
        }
    });
    
    // 按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);
    speedUpBtn.addEventListener('click', increaseSpeed);
    speedDownBtn.addEventListener('click', decreaseSpeed);
    
    // 方向按钮事件监听
    upBtn.addEventListener('click', function() {
        if (!gameRunning || gamePaused || gameOver) {
            return;
        }
        
        if (velocityY !== 1) { // 不允许向下移动时向上转向
            velocityX = 0;
            velocityY = -1;
        }
    });
    
    downBtn.addEventListener('click', function() {
        if (!gameRunning || gamePaused || gameOver) {
            return;
        }
        
        if (velocityY !== -1) { // 不允许向上移动时向下转向
            velocityX = 0;
            velocityY = 1;
        }
    });
    
    leftBtn.addEventListener('click', function() {
        if (!gameRunning || gamePaused || gameOver) {
            return;
        }
        
        if (velocityX !== 1) { // 不允许向右移动时向左转向
            velocityX = -1;
            velocityY = 0;
        }
    });
    
    rightBtn.addEventListener('click', function() {
        if (!gameRunning || gamePaused || gameOver) {
            return;
        }
        
        if (velocityX !== -1) { // 不允许向左移动时向右转向
            velocityX = 1;
            velocityY = 0;
        }
    });
    
    // 添加触摸事件支持
    upBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        upBtn.click();
    });
    
    downBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        downBtn.click();
    });
    
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        leftBtn.click();
    });
    
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        rightBtn.click();
    });
    
    // 初始化游戏
    init();
    
    // 输出调试信息
    console.log('游戏初始化完成');
});