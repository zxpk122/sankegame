// 游戏状态和配置
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // 蛇的初始状态
        this.snake = [
            { x: 10, y: 10 }
        ];
        
        // 移动方向
        this.dx = 0;
        this.dy = 0;
        
        // 食物位置
        this.food = { x: 15, y: 15 };
        
        // 分数和速度
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.baseSpeed = 150; // 基础速度（毫秒）
        this.currentSpeed = this.baseSpeed;
        this.speedLevel = 1;
        
        // 游戏循环ID
        this.gameLoopId = null;
        
        // 粒子系统
        this.particles = [];
        this.maxParticles = 50;
        
        // 音效系统
        this.audioContext = null;
        this.initAudio();
        
        this.init();
    }
    
    init() {
        this.updateDisplay();
        this.setupEventListeners();
        this.drawGame();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 游戏控制按钮
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());
        
        // 速度控制
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => this.setSpeed(parseInt(e.target.value)));
        
        // 方向控制按钮
        document.getElementById('up-btn').addEventListener('click', () => this.changeDirection(0, -1));
        document.getElementById('down-btn').addEventListener('click', () => this.changeDirection(0, 1));
        document.getElementById('left-btn').addEventListener('click', () => this.changeDirection(-1, 0));
        document.getElementById('right-btn').addEventListener('click', () => this.changeDirection(1, 0));
        
        // 触摸控制
        this.setupTouchControls();
    }
    
    // 设置触摸控制
    setupTouchControls() {
        let startX, startY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平滑动
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.changeDirection(1, 0); // 右
                    } else {
                        this.changeDirection(-1, 0); // 左
                    }
                }
            } else {
                // 垂直滑动
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.changeDirection(0, 1); // 下
                    } else {
                        this.changeDirection(0, -1); // 上
                    }
                }
            }
            
            startX = null;
            startY = null;
        });
    }
    
    // 处理键盘输入
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameRunning) {
                    this.startGame();
                } else {
                    this.togglePause();
                }
            }
            return;
        }
        
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                this.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                this.changeDirection(1, 0);
                break;
            case 'Space':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    // 改变移动方向
    changeDirection(newDx, newDy) {
        // 防止反向移动
        if (this.dx === -newDx && this.dy === -newDy) {
            return;
        }
        
        // 防止同时按下相反方向
        if ((this.dx !== 0 && newDx !== 0) || (this.dy !== 0 && newDy !== 0)) {
            return;
        }
        
        // 播放移动音效
        this.playSound(220, 0.05, 'triangle');
        
        this.dx = newDx;
        this.dy = newDy;
    }
    
    // 开始游戏
    startGame() {
        if (this.gameOver) {
            this.resetGame();
        }
        
        this.gameRunning = true;
        this.gamePaused = false;
        
        // 如果蛇还没有移动方向，设置默认方向
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
            this.dy = 0;
        }
        
        // 播放开始音效
        this.playSound(440, 0.1, 'sine');
        
        this.updateButtonStates();
        this.gameLoop();
    }
    
    // 暂停/继续游戏
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        this.updateButtonStates();
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    // 重置游戏
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // 重置蛇的位置和方向
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        
        // 重置分数和速度
        this.score = 0;
        this.speedLevel = 1;
        this.currentSpeed = this.baseSpeed;
        
        // 生成新食物
        this.generateFood();
        
        // 清除游戏循环
        if (this.gameLoopId) {
            clearTimeout(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 隐藏游戏结束界面
        document.getElementById('game-over').classList.add('hidden');
        
        this.updateDisplay();
        this.updateButtonStates();
        this.drawGame();
    }
    
    // 设置游戏速度
    setSpeed(level) {
        this.speedLevel = level;
        this.currentSpeed = this.baseSpeed - (level - 1) * 15;
        if (this.currentSpeed < 50) this.currentSpeed = 50;
        
        document.getElementById('speed-display').textContent = level;
        this.updateDisplay();
    }
    
    // 游戏主循环
    gameLoop() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) {
            return;
        }
        
        this.update();
        this.drawGame();
        
        this.gameLoopId = setTimeout(() => this.gameLoop(), this.currentSpeed);
    }
    
    // 更新游戏状态
    update() {
        // 移动蛇头
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }
        
        // 检查自身碰撞
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            
            // 播放吃食物音效
            this.playSound(660, 0.1, 'square');
            
            // 创建食物被吃掉的粒子效果
            this.createFoodParticles(this.food.x * this.gridSize + this.gridSize/2, 
                                   this.food.y * this.gridSize + this.gridSize/2);
            
            this.generateFood();
            
            // 根据分数自动提升速度
            const newSpeedLevel = Math.floor(this.score / 50) + 1;
            if (newSpeedLevel > this.speedLevel && newSpeedLevel <= 10) {
                this.speedLevel = newSpeedLevel;
                this.currentSpeed = this.baseSpeed - (this.speedLevel - 1) * 15;
                if (this.currentSpeed < 50) this.currentSpeed = 50;
                document.getElementById('speed-slider').value = this.speedLevel;
                document.getElementById('speed-display').textContent = this.speedLevel;
            }
            
            this.updateDisplay();
        } else {
            // 移除尾部
            this.snake.pop();
        }
    }
    
    // 生成食物
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    // 结束游戏
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        
        // 播放游戏结束音效
        this.playGameOverSound();
        
        // 创建游戏结束爆炸效果
        const head = this.snake[0];
        this.createExplosionParticles(head.x * this.gridSize + this.gridSize/2, 
                                    head.y * this.gridSize + this.gridSize/2);
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
        
        // 显示游戏结束界面
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        
        this.updateDisplay();
        this.updateButtonStates();
    }
    
    // 绘制游戏
    drawGame() {
        // 清空画布
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制粒子效果
        this.drawParticles();
    }
    
    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    // 绘制蛇
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            if (index === 0) {
                // 蛇头渐变背景
                const headGradient = this.ctx.createRadialGradient(
                    x + this.gridSize/2, y + this.gridSize/2, 0,
                    x + this.gridSize/2, y + this.gridSize/2, this.gridSize/2
                );
                headGradient.addColorStop(0, '#68d391');
                headGradient.addColorStop(0.7, '#48bb78');
                headGradient.addColorStop(1, '#38a169');
                
                // 蛇头阴影
                this.ctx.shadowColor = 'rgba(72, 187, 120, 0.6)';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
                
                this.ctx.fillStyle = headGradient;
                this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // 蛇头高光
                const highlightGradient = this.ctx.createLinearGradient(x, y, x + this.gridSize/2, y + this.gridSize/2);
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = highlightGradient;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize/2, this.gridSize/2);
                
                // 蛇眼睛
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#2d3748';
                const eyeSize = 3;
                const eyeOffset = 6;
                
                if (this.dx === 1) { // 向右
                    this.ctx.fillRect(x + this.gridSize - eyeOffset, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset, y + 12, eyeSize, eyeSize);
                } else if (this.dx === -1) { // 向左
                    this.ctx.fillRect(x + 3, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 3, y + 12, eyeSize, eyeSize);
                } else if (this.dy === -1) { // 向上
                    this.ctx.fillRect(x + 5, y + 3, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 3, eyeSize, eyeSize);
                } else if (this.dy === 1) { // 向下
                    this.ctx.fillRect(x + 5, y + this.gridSize - eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + this.gridSize - eyeOffset, eyeSize, eyeSize);
                }
            } else {
                // 蛇身渐变
                const alpha = Math.max(1 - (index * 0.08), 0.4);
                const bodyGradient = this.ctx.createRadialGradient(
                    x + this.gridSize/2, y + this.gridSize/2, 0,
                    x + this.gridSize/2, y + this.gridSize/2, this.gridSize/2
                );
                bodyGradient.addColorStop(0, `rgba(104, 211, 145, ${alpha})`);
                bodyGradient.addColorStop(0.8, `rgba(72, 187, 120, ${alpha * 0.8})`);
                bodyGradient.addColorStop(1, `rgba(56, 161, 105, ${alpha * 0.6})`);
                
                // 蛇身阴影
                this.ctx.shadowColor = `rgba(72, 187, 120, ${alpha * 0.4})`;
                this.ctx.shadowBlur = 4;
                this.ctx.shadowOffsetX = 1;
                this.ctx.shadowOffsetY = 1;
                
                this.ctx.fillStyle = bodyGradient;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                
                // 蛇身纹理
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
                this.ctx.fillRect(x + 3, y + 3, this.gridSize - 6, 2);
            }
        });
        
        // 清除阴影设置
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    // 绘制食物
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const time = Date.now() * 0.005;
        
        // 食物脉动效果
        const pulseScale = 1 + Math.sin(time) * 0.1;
        const foodSize = (this.gridSize - 4) * pulseScale;
        const offset = (this.gridSize - foodSize) / 2;
        
        // 食物光晕
        const glowGradient = this.ctx.createRadialGradient(
            x + this.gridSize/2, y + this.gridSize/2, 0,
            x + this.gridSize/2, y + this.gridSize/2, this.gridSize
        );
        glowGradient.addColorStop(0, 'rgba(245, 101, 101, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(245, 101, 101, 0.4)');
        glowGradient.addColorStop(1, 'rgba(245, 101, 101, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(x - 5, y - 5, this.gridSize + 10, this.gridSize + 10);
        
        // 食物主体渐变
        const foodGradient = this.ctx.createRadialGradient(
            x + this.gridSize/2, y + this.gridSize/2, 0,
            x + this.gridSize/2, y + this.gridSize/2, foodSize/2
        );
        foodGradient.addColorStop(0, '#fc8181');
        foodGradient.addColorStop(0.6, '#f56565');
        foodGradient.addColorStop(1, '#e53e3e');
        
        // 食物阴影
        this.ctx.shadowColor = 'rgba(245, 101, 101, 0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillStyle = foodGradient;
        this.ctx.fillRect(x + offset, y + offset, foodSize, foodSize);
        
        // 食物高光
        this.ctx.shadowBlur = 0;
        const highlightGradient = this.ctx.createLinearGradient(
            x + offset, y + offset, 
            x + offset + foodSize/2, y + offset + foodSize/2
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(x + offset + 2, y + offset + 2, foodSize/2, foodSize/2);
        
        // 食物闪烁星星效果
        if (Math.sin(time * 2) > 0.7) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const starSize = 2;
            this.ctx.fillRect(x + this.gridSize/2 - starSize/2, y + 2, starSize, starSize * 2);
            this.ctx.fillRect(x + 2, y + this.gridSize/2 - starSize/2, starSize * 2, starSize);
            this.ctx.fillRect(x + this.gridSize - 4, y + this.gridSize/2 - starSize/2, starSize * 2, starSize);
            this.ctx.fillRect(x + this.gridSize/2 - starSize/2, y + this.gridSize - 4, starSize, starSize * 2);
        }
        
        // 清除阴影设置
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    // 创建粒子
    createParticle(x, y, color, velocity, life) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push({
                x: x,
                y: y,
                vx: velocity.x,
                vy: velocity.y,
                color: color,
                life: life,
                maxLife: life,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    // 创建食物粒子效果
    createFoodParticles(x, y) {
        const colors = ['#fc8181', '#f56565', '#e53e3e', '#fbb6ce', '#f687b3'];
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = Math.random() * 3 + 2;
            this.createParticle(x, y, colors[Math.floor(Math.random() * colors.length)], {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }, 60);
        }
    }
    
    // 创建爆炸粒子效果
    createExplosionParticles(x, y) {
        const colors = ['#68d391', '#48bb78', '#38a169', '#9ae6b4', '#c6f6d5'];
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 3;
            this.createParticle(x, y, colors[Math.floor(Math.random() * colors.length)], {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }, 80);
        }
    }
    
    // 更新粒子
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 应用重力和阻力
            particle.vy += 0.1;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // 减少生命值
            particle.life--;
            
            // 移除死亡粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 绘制粒子
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size * alpha;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            // 绘制粒子光晕
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = size * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
        
        // 更新粒子
        this.updateParticles();
    }
    
    // 初始化音频
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    // 播放音效
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 播放游戏结束音效
    playGameOverSound() {
        if (!this.audioContext) return;
        
        // 播放下降音调序列
        const frequencies = [440, 370, 330, 294, 262];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playSound(freq, 0.3, 'sawtooth');
            }, index * 150);
        });
    }
    
    // 更新显示信息
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('speed-level').textContent = this.speedLevel;
    }
    
    // 更新按钮状态
    updateButtonStates() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.gameRunning && !this.gamePaused) {
            startBtn.textContent = '游戏中';
            startBtn.disabled = true;
            pauseBtn.textContent = '暂停';
            pauseBtn.disabled = false;
        } else if (this.gameRunning && this.gamePaused) {
            startBtn.textContent = '游戏中';
            startBtn.disabled = true;
            pauseBtn.textContent = '继续';
            pauseBtn.disabled = false;
        } else {
            startBtn.textContent = '开始游戏';
            startBtn.disabled = false;
            pauseBtn.textContent = '暂停';
            pauseBtn.disabled = true;
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});