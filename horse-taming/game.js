// Classes defined first to avoid any hoisting issues
class Prompt {
    constructor(key, game) {
        this.key = key;
        this.game = game;
        this.distance = 0;
        this.speed = 0.25; // pixels per ms

        // W = Up, A = Left, S = Down, D = Right
        this.angle = 0;
        if (key === 'w') this.angle = -Math.PI / 2;
        if (key === 's') this.angle = Math.PI / 2;
        if (key === 'a') this.angle = Math.PI;
        if (key === 'd') this.angle = 0;
    }

    update(dt) {
        this.distance += this.speed * dt;
    }

    draw(ctx) {
        const x = this.game.centerX + Math.cos(this.angle) * this.distance;
        const y = this.game.centerY + Math.sin(this.angle) * this.distance;

        const scale = 0.5 + (this.distance / this.game.ringRadius) * 0.5;
        const alpha = Math.min(1, this.distance / 50); // Fade in

        ctx.save();
        ctx.translate(x, y);

        // Circle background
        ctx.beginPath();
        ctx.arc(0, 0, 25 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`; // Gold
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow Visuals (mapped to WASD)
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();

        ctx.save();
        let rotation = 0;
        // Map WASD keys to visual directions
        if (this.key === 'w') rotation = -Math.PI / 2; // Up
        if (this.key === 's') rotation = Math.PI / 2;  // Down
        if (this.key === 'a') rotation = Math.PI;      // Left
        if (this.key === 'd') rotation = 0;            // Right

        ctx.rotate(rotation);

        // Draw Arrow Shape
        const s = scale * 1.2;
        ctx.moveTo(-10 * s, -10 * s);
        ctx.lineTo(10 * s, 0);
        ctx.lineTo(-10 * s, 10 * s);
        ctx.lineTo(-5 * s, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        ctx.restore();
    }
}

class Particle {
    constructor(cx, cy, type, prompt) {
        // Spawn at the prompt's location if provided
        if (prompt) {
            this.x = cx + Math.cos(prompt.angle) * prompt.distance;
            this.y = cy + Math.sin(prompt.angle) * prompt.distance;
        } else {
            this.x = cx;
            this.y = cy;
        }

        this.type = type;
        this.life = 1.0;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.type === 'fire' ? '#ff3300' : '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error("Canvas not found!");
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // Ensure dimensions
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        this.state = 'START'; // START, PLAYING, END
        this.lastTime = 0;

        // Game Params
        this.ringRadius = 200;
        this.targetRadius = 30;
        this.spawnRate = 1500;
        this.nextSpawn = 0;
        this.prompts = [];
        this.particles = [];

        // Assets
        this.horseImg = new Image();
        this.horseImg.src = 'assets/horse_asset.png';
        this.horseImg.onload = () => console.log("Horse image loaded");
        this.horseImg.onerror = () => console.error("Failed to load horse image");

        // Player Stats
        this.stamina = 100;
        this.progress = 0;
        this.combo = 0;
        this.maxCombo = 0;

        this.bindEvents();

        // Start loop
        requestAnimationFrame(t => this.loop(t));
    }

    bindEvents() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.onclick = () => this.startGame();

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.onclick = () => this.startGame();

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) quitBtn.onclick = () => window.location.href = '../index.html';

        window.addEventListener('keydown', e => this.handleInput(e));
    }

    startGame() {
        console.log("Starting Game...");
        this.state = 'PLAYING';
        this.stamina = 100;
        this.progress = 0;
        this.combo = 0;
        this.prompts = [];
        this.particles = [];
        this.nextSpawn = 0;
        this.maxCombo = 0;

        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.add('hidden');

        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');

        const hud = document.getElementById('hud');
        if (hud) hud.classList.remove('hidden');

        this.updateUI();
    }

    handleInput(e) {
        if (this.state !== 'PLAYING') return;

        const key = e.key.toLowerCase();
        if (!['w', 'a', 's', 'd'].includes(key)) return;

        const prompt = this.prompts[0];

        if (prompt) {
            const promptDist = prompt.distance;
            const targetDist = this.ringRadius;
            const distDiff = Math.abs(promptDist - targetDist);
            const hitThreshold = 25 + this.targetRadius;

            if (distDiff < hitThreshold) {
                if (prompt.key === key) {
                    let quality = 'good';
                    if (distDiff < 10) quality = 'perfect';
                    else if (distDiff < 30) quality = 'great';

                    this.prompts.shift();
                    this.triggerFeedback('hit', prompt, quality);
                } else {
                    this.triggerFeedback('miss');
                    this.prompts.shift();
                }
            } else if (prompt.distance > this.ringRadius + hitThreshold) {
                this.triggerFeedback('miss');
                this.prompts.shift();
            }
        }
    }

    triggerFeedback(type, prompt, quality = 'good') {
        if (type === 'hit') {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            let gain = 1;
            let staminaGain = 1;
            let particleCount = 5;

            if (quality === 'perfect') {
                gain = 3;
                staminaGain = 3;
                particleCount = 15;
            } else if (quality === 'great') {
                gain = 2;
                staminaGain = 2;
                particleCount = 10;
            }

            this.progress = Math.min(100, this.progress + gain + (this.combo * 0.1));
            this.stamina = Math.min(100, this.stamina + staminaGain);

            for (let i = 0; i < particleCount; i++) {
                this.particles.push(new Particle(this.centerX, this.centerY, 'fire', prompt));
            }
        } else {
            this.combo = 0;
            this.stamina = Math.max(0, this.stamina - 10);
        }
        this.updateUI();
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Spawn Prompts
        this.nextSpawn -= dt;
        if (this.nextSpawn <= 0) {
            this.spawnPrompt();
            const difficultyMod = 1 - (this.progress / 200);
            // Randomize interval: Base rate +/- 30%
            const randomVar = 0.7 + Math.random() * 0.6;
            this.nextSpawn = (this.spawnRate * difficultyMod) * randomVar;
        }

        // Update Prompts
        this.prompts.forEach((p, index) => {
            p.update(dt);
            if (p.distance > this.ringRadius + 60) {
                this.prompts.splice(index, 1);
                this.triggerFeedback('miss');
            }
        });

        // Update Particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);

        // Check Game Over
        if (this.stamina <= 0) this.endGame(false);
        if (this.progress >= 100) this.endGame(true);
    }

    spawnPrompt() {
        // Bag system for better distribution
        if (!this.promptBag || this.promptBag.length === 0) {
            this.promptBag = ['w', 'a', 's', 'd', 'w', 'a', 's', 'd'];
            // Shuffle
            for (let i = this.promptBag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.promptBag[i], this.promptBag[j]] = [this.promptBag[j], this.promptBag[i]];
            }
        }

        const key = this.promptBag.pop();
        this.prompts.push(new Prompt(key, this));
    }

    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Horse Silhouette
        if (this.horseImg.complete && this.horseImg.naturalWidth > 0) {
            try {
                this.ctx.save();
                this.ctx.globalAlpha = 0.15; // Reduced opacity to 15%
                this.ctx.globalCompositeOperation = 'screen'; // Blends black background

                const scale = (this.ringRadius * 1.5) / this.horseImg.height;
                const w = this.horseImg.width * scale;
                const h = this.horseImg.height * scale;
                this.ctx.drawImage(this.horseImg, this.centerX - w / 2, this.centerY - h / 2, w, h);
                this.ctx.restore();
            } catch (e) {
                console.warn("Error drawing horse:", e);
            }
        }

        // Draw Ring (Target)
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.ringRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#330000';
        this.ctx.lineWidth = 15;
        this.ctx.stroke();

        // Glowing Ring
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ff3300';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.ringRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ff3300';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw Target Circles (W, A, S, D)
        this.drawTargetCircle(0, -this.ringRadius, 'W');
        this.drawTargetCircle(0, this.ringRadius, 'S');
        this.drawTargetCircle(-this.ringRadius, 0, 'A');
        this.drawTargetCircle(this.ringRadius, 0, 'D');

        // Draw Prompts
        this.prompts.forEach(p => p.draw(this.ctx));

        // Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));
    }

    drawTargetCircle(dx, dy, label) {
        const x = this.centerX + dx;
        const y = this.centerY + dy;

        this.ctx.beginPath();
        this.ctx.arc(x, y, this.targetRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff3300';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = "16px serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(label, x, y);
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;

        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Clamp dt to prevent huge jumps (e.g. tab switching)
        if (dt > 100) dt = 100;

        try {
            this.update(dt);
            this.draw();
        } catch (e) {
            console.error("Game Loop Error:", e);
            // Try to continue? Or stop?
            // If we stop, the game freezes.
        }

        requestAnimationFrame(t => this.loop(t));
    }

    endGame(success) {
        this.state = 'END';
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');

        const title = document.getElementById('end-title');
        const reason = document.getElementById('end-reason');
        const rankSpan = document.getElementById('final-rank');

        let rank = 'Unworthy';

        if (success) {
            title.innerText = "Tamed!";
            title.style.background = "linear-gradient(to bottom, #ffd700, #ff3300)";
            title.style.webkitBackgroundClip = "text";
            reason.innerText = "The spirit of the horse is now yours.";

            // Calculate Rank
            if (this.maxCombo >= 20 && this.stamina >= 80) rank = 'Grandmaster';
            else if (this.maxCombo >= 15 && this.stamina >= 50) rank = 'Master';
            else if (this.maxCombo >= 10) rank = 'Disciple';
            else rank = 'Novice';

        } else {
            title.innerText = "Thrown Off!";
            title.style.background = "linear-gradient(to bottom, #888, #444)";
            title.style.webkitBackgroundClip = "text";
            reason.innerText = "Your stamina failed you.";
            rank = 'Unworthy';
        }

        document.getElementById('final-combo').innerText = this.maxCombo;
        if (rankSpan) {
            rankSpan.innerText = rank;
            // Color rank
            rankSpan.style.color = '#fff';
            if (rank === 'Grandmaster') rankSpan.style.color = '#ffd700'; // Gold
            if (rank === 'Master') rankSpan.style.color = '#c0c0c0'; // Silver
            if (rank === 'Disciple') rankSpan.style.color = '#cd7f32'; // Bronze
            if (rank === 'Novice') rankSpan.style.color = '#888'; // Grey
            if (rank === 'Unworthy') rankSpan.style.color = '#555'; // Dark Grey
        }
    }

    updateUI() {
        const staminaBar = document.getElementById('stamina-bar');
        if (staminaBar) staminaBar.style.width = `${this.stamina}%`;

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = `${this.progress}%`;

        const comboCount = document.getElementById('combo-count');
        if (comboCount) comboCount.innerText = this.combo;

        const comboDisplay = document.getElementById('combo-display');
        if (comboDisplay) {
            if (this.combo > 2) comboDisplay.style.opacity = 1;
            else comboDisplay.style.opacity = 0;
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded, initializing Game");
    try {
        const game = new Game();
    } catch (e) {
        console.error("Failed to init game:", e);
    }
});
