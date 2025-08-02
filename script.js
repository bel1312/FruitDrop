class FruitGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.grid = [];
        this.projectile = null;
        this.particles = [];
        this.currentFruit = 'apple';
        this.fruitTypes = ['apple', 'orange', 'banana', 'grape', 'cherry'];
        this.fruitColors = {
            apple: '#c0392b',
            orange: '#e67e22',
            banana: '#f1c40f',
            grape: '#3498db',
            cherry: '#27ae60'
        };
        this.fruitSize = 25;
        this.cols = 15;
        this.rows = 20;
        this.dropTimer = 0;
        this.dropInterval = 600;
        this.gameOver = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.activeColors = 3;
        this.colorUpgradeScore = 100;
        this.deathLine = this.canvas.height - 120;
        this.gameTime = 0;
        this.colorCarrier = null;
        this.particles = [];
        this.animatingFruits = [];
        
        this.init();
    }
    
    init() {
        this.canvas.addEventListener('click', (e) => this.shoot(e));
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        this.initGrid();
        this.updateCurrentFruit();
        this.gameLoop();
    }
    
    initGrid() {
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                if (row < 5 && Math.random() < 0.7) {
                    this.grid[row][col] = {
                        type: this.fruitTypes[Math.floor(Math.random() * this.activeColors)],
                        x: this.getX(row, col),
                        y: this.getY(row)
                    };
                } else {
                    this.grid[row][col] = null;
                }
            }
        }
    }
    
    getX(row, col) {
        const offset = (row % 2) * this.fruitSize;
        return col * this.fruitSize * 2 + this.fruitSize + offset;
    }
    
    getY(row) {
        return row * this.fruitSize * 1.7 + this.fruitSize;
    }
    
    updateCurrentFruit() {
        this.currentFruit = this.fruitTypes[Math.floor(Math.random() * this.activeColors)];
        const fruitElement = document.getElementById('currentFruit');
        fruitElement.className = `fruit ${this.currentFruit}`;
        fruitElement.style.background = `radial-gradient(circle at 30% 30%, ${this.lightenColor(this.fruitColors[this.currentFruit], 20)}, ${this.fruitColors[this.currentFruit]})`;
    }
    
    shoot(e) {
        if (this.gameOver || this.projectile) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (y > this.canvas.height - 100) {
            this.updateCurrentFruit();
            return;
        }
        
        const angle = Math.atan2(y - (this.canvas.height - 50), x - this.canvas.width / 2);
        this.projectile = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            type: this.currentFruit
        };
        
        this.updateCurrentFruit();
    }
    
    drawFruit(x, y, type, scale = 1, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        const size = this.fruitSize * scale;
        
        // Base fruit with realistic gradient
        const gradient = this.ctx.createRadialGradient(
            x - size/2.5, y - size/2.5, 0,
            x, y, size * 1.2
        );
        gradient.addColorStop(0, this.lightenColor(this.fruitColors[type], 50));
        gradient.addColorStop(0.2, this.lightenColor(this.fruitColors[type], 30));
        gradient.addColorStop(0.6, this.fruitColors[type]);
        gradient.addColorStop(1, this.darkenColor(this.fruitColors[type], 40));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Fruit-specific details
        if (type === 'apple') {
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(x - 2*scale, y - size - 3*scale, 4*scale, 6*scale);
            this.ctx.fillStyle = '#32CD32';
            this.ctx.beginPath();
            this.ctx.ellipse(x + 3*scale, y - size, 6*scale, 3*scale, Math.PI/4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Animated highlight
        const time = Date.now() * 0.003;
        const highlightIntensity = 0.4 + Math.sin(time) * 0.2;
        const highlight = this.ctx.createRadialGradient(
            x - size/2, y - size/2, 0,
            x - size/3, y - size/3, size/2
        );
        highlight.addColorStop(0, `rgba(255, 255, 255, ${highlightIntensity})`);
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlight;
        this.ctx.beginPath();
        this.ctx.arc(x - size/3, y - size/3, size/3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Secondary shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(x + size/3, y + size/4, size/8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bottom shadow with depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size/2, size/2, size/6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    createExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                color: color,
                life: 40,
                maxLife: 40,
                size: Math.random() * 8 + 3
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.5;
            particle.vx *= 0.98;
            particle.life--;
            
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
            
            return particle.life > 0;
        });
    }
    
    updateAnimatingFruits() {
        this.animatingFruits = this.animatingFruits.filter(fruit => {
            fruit.vy += 0.8;
            fruit.y += fruit.vy;
            fruit.life--;
            
            const alpha = Math.max(0, fruit.life / 60);
            this.drawFruit(fruit.x, fruit.y, fruit.type, 1, alpha);
            
            return fruit.life > 0 && fruit.y < this.canvas.height + 50;
        });
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)).toString(16).slice(1);
    }
    
    findMatches(row, col, type, visited = new Set()) {
        const key = `${row},${col}`;
        if (visited.has(key) || !this.grid[row] || !this.grid[row][col] || this.grid[row][col].type !== type) {
            return [];
        }
        
        visited.add(key);
        let matches = [{row, col}];
        
        const neighbors = this.getNeighbors(row, col);
        neighbors.forEach(({r, c}) => {
            matches = matches.concat(this.findMatches(r, c, type, visited));
        });
        
        return matches;
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const isEven = row % 2 === 0;
        
        const offsets = isEven ? 
            [[-1,-1], [-1,0], [0,-1], [0,1], [1,-1], [1,0]] :
            [[-1,0], [-1,1], [0,-1], [0,1], [1,0], [1,1]];
        
        offsets.forEach(([dr, dc]) => {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                neighbors.push({r, c});
            }
        });
        
        return neighbors;
    }
    
    removeMatches(matches) {
        // Create explosion effects
        matches.forEach(({row, col}) => {
            const fruit = this.grid[row][col];
            this.createExplosion(fruit.x, fruit.y, this.fruitColors[fruit.type]);
            this.grid[row][col] = null;
        });
        
        this.score += matches.length * 10;
        document.getElementById('score').textContent = this.score;
        
        // Delay floating fruit removal to prevent random disappearances
        setTimeout(() => this.removeFloatingFruits(), 100);
    }
    
    removeFloatingFruits() {
        const connected = new Set();
        
        // Mark all fruits connected to top row
        for (let col = 0; col < this.cols; col++) {
            if (this.grid[0][col]) {
                this.markConnected(0, col, connected);
            }
        }
        
        // Animate falling fruits
        const toRemove = [];
        for (let row = 1; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] && !connected.has(`${row},${col}`)) {
                    const fruit = this.grid[row][col];
                    this.animatingFruits.push({
                        x: fruit.x,
                        y: fruit.y,
                        type: fruit.type,
                        vy: 0,
                        life: 60
                    });
                    toRemove.push({row, col});
                }
            }
        }
        
        // Remove from grid
        toRemove.forEach(({row, col}) => {
            this.grid[row][col] = null;
        });
        
        if (toRemove.length > 0) {
            this.score += toRemove.length * 5;
            document.getElementById('score').textContent = this.score;
        }
    }
    
    markConnected(row, col, connected) {
        const key = `${row},${col}`;
        if (connected.has(key) || !this.grid[row] || !this.grid[row][col]) return;
        
        connected.add(key);
        const neighbors = this.getNeighbors(row, col);
        neighbors.forEach(({r, c}) => {
            this.markConnected(r, c, connected);
        });
    }
    
    dropGrid() {
        for (let row = this.rows - 1; row > 0; row--) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = this.grid[row - 1][col];
                if (this.grid[row][col]) {
                    this.grid[row][col].y = this.getY(row);
                }
            }
        }
        
        for (let col = 0; col < this.cols; col++) {
            if (Math.random() < 0.6) {
                this.grid[0][col] = {
                    type: this.fruitTypes[Math.floor(Math.random() * this.activeColors)],
                    x: this.getX(0, col),
                    y: this.getY(0)
                };
            } else {
                this.grid[0][col] = null;
            }
        }
    }
    
    update() {
        if (this.gameOver) return;
        
        this.gameTime++;
        this.dropTimer++;
        if (this.dropTimer >= this.dropInterval) {
            this.dropGrid();
            this.dropTimer = 0;
        }
        
        // Spawn color carrier after 3 minutes
        if (this.gameTime === 10800 && this.activeColors < this.fruitTypes.length && !this.colorCarrier) {
            this.spawnColorCarrier();
        }
        
        // Update color carrier
        if (this.colorCarrier) {
            this.updateColorCarrier();
        }
        
        if (this.projectile) {
            this.projectile.x += this.projectile.vx;
            this.projectile.y += this.projectile.vy;
            
            if (this.projectile.x <= this.fruitSize || this.projectile.x >= this.canvas.width - this.fruitSize) {
                this.projectile.vx *= -1;
                this.projectile.x = Math.max(this.fruitSize, Math.min(this.canvas.width - this.fruitSize, this.projectile.x));
            }
            
            let hit = false;
            for (let row = 0; row < this.rows && !hit; row++) {
                for (let col = 0; col < this.cols && !hit; col++) {
                    if (this.grid[row][col]) {
                        const dx = this.projectile.x - this.grid[row][col].x;
                        const dy = this.projectile.y - this.grid[row][col].y;
                        if (Math.sqrt(dx * dx + dy * dy) < this.fruitSize * 1.8) {
                            this.attachFruit(row, col);
                            return;
                        }
                    }
                }
            }
            
            if (this.projectile.y <= this.fruitSize) {
                this.attachFruit(0, Math.floor(this.projectile.x / (this.fruitSize * 2)));
                return;
            }
        }
        
        this.checkGameOver();
    }
    
    attachFruit(nearRow, nearCol) {
        let bestRow = -1, bestCol = -1;
        let minDist = Infinity;
        
        // Find the closest empty position
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col]) {
                    const x = this.getX(row, col);
                    const y = this.getY(row);
                    const dist = Math.sqrt((this.projectile.x - x) ** 2 + (this.projectile.y - y) ** 2);
                    
                    // Check if this position has at least one neighbor
                    const neighbors = this.getNeighbors(row, col);
                    const hasNeighbor = neighbors.some(({r, c}) => this.grid[r] && this.grid[r][c]) || row === 0;
                    
                    if (hasNeighbor && dist < minDist) {
                        minDist = dist;
                        bestRow = row;
                        bestCol = col;
                    }
                }
            }
        }
        
        if (bestRow === -1) {
            this.projectile = null;
            return;
        }
        
        this.grid[bestRow][bestCol] = {
            type: this.projectile.type,
            x: this.getX(bestRow, bestCol),
            y: this.getY(bestRow)
        };
        
        const matches = this.findMatches(bestRow, bestCol, this.projectile.type);
        if (matches.length >= 3) {
            this.removeMatches(matches);
        }
        
        this.projectile = null;
    }
    
    checkGameOver() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] && this.grid[row][col].y >= this.deathLine) {
                    this.gameOver = true;
                    return;
                }
            }
        }
    }
    
    spawnColorCarrier() {
        this.colorCarrier = {
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: -50,
            vy: 1.5,
            zigzagTimer: 0,
            type: this.fruitTypes[this.activeColors],
            size: 30
        };
    }
    
    updateColorCarrier() {
        this.colorCarrier.y += this.colorCarrier.vy;
        this.colorCarrier.zigzagTimer++;
        
        // Zigzag across full width
        const zigzagRange = this.canvas.width - 100;
        this.colorCarrier.x = 50 + (Math.sin(this.colorCarrier.zigzagTimer * 0.05) + 1) * zigzagRange / 2;
        
        // Check collision with projectile
        if (this.projectile) {
            const dx = this.projectile.x - this.colorCarrier.x;
            const dy = this.projectile.y - this.colorCarrier.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.fruitSize + this.colorCarrier.size) {
                this.createExplosion(this.colorCarrier.x, this.colorCarrier.y, this.fruitColors[this.colorCarrier.type]);
                this.colorCarrier = null;
                this.projectile = null;
                this.score += 50;
                document.getElementById('score').textContent = this.score;
                return;
            }
        }
        
        // Check if reached death line
        if (this.colorCarrier.y >= this.deathLine) {
            this.activeColors++;
            this.colorCarrier = null;
        }
        
        // Remove if off screen
        if (this.colorCarrier.y > this.canvas.height + 50) {
            this.colorCarrier = null;
        }
    }
    
    drawGuideline() {
        if (this.projectile || this.mouseY > this.canvas.height - 100) return;
        
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 50;
        let angle = Math.atan2(this.mouseY - startY, this.mouseX - startX);
        
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        
        let x = startX;
        let y = startY;
        let vx = Math.cos(angle) * 8;
        let vy = Math.sin(angle) * 8;
        
        for (let i = 0; i < 100; i++) {
            const nextX = x + vx;
            const nextY = y + vy;
            
            if (nextX <= this.fruitSize || nextX >= this.canvas.width - this.fruitSize) {
                vx *= -1;
            }
            
            this.ctx.moveTo(x, y);
            x = Math.max(this.fruitSize, Math.min(this.canvas.width - this.fruitSize, nextX));
            y = nextY;
            this.ctx.lineTo(x, y);
            
            if (y <= this.fruitSize) break;
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw guideline
        this.drawGuideline();
        
        // Draw death line
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.deathLine);
        this.ctx.lineTo(this.canvas.width, this.deathLine);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw grid
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    this.drawFruit(this.grid[row][col].x, this.grid[row][col].y, this.grid[row][col].type);
                }
            }
        }
        
        // Draw projectile
        if (this.projectile) {
            this.drawFruit(this.projectile.x, this.projectile.y, this.projectile.type);
        }
        
        // Draw particles
        this.updateParticles();
        
        // Draw animating fruits
        this.updateAnimatingFruits();
        
        // Draw color carrier with glow
        if (this.colorCarrier) {
            const glowSize = 1.3 + Math.sin(Date.now() * 0.01) * 0.2;
            this.ctx.shadowColor = this.fruitColors[this.colorCarrier.type];
            this.ctx.shadowBlur = 20;
            this.drawFruit(this.colorCarrier.x, this.colorCarrier.y, this.colorCarrier.type, glowSize);
            this.ctx.shadowBlur = 0;
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

new FruitGame();