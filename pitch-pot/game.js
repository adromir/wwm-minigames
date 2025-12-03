/**
 * Pitch Pot (Touhu) - Refined WWM Style
 * Steady Movement, Stage Progression
 */

const STAGES = [
    {
        id: 1,
        title: "Stage 1",
        time: 30,
        pots: [{ type: 'mouse', speed: 100 }] // Slow, Single
    },
    {
        id: 2,
        title: "Stage 2",
        time: 25,
        pots: [{ type: 'mouse', speed: 180 }] // Fast, Single
    },
    {
        id: 3,
        title: "Stage 3",
        time: 40,
        pots: [{ type: 'mouse', speed: 90 }, { type: 'wasd', speed: 80 }] // Dual
    }
];

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'MENU';
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;

        this.currentStageIndex = 0;
        this.stageTime = 0;

        // Game Objects
        this.pots = [];
        this.cursors = [];

        // Input State
        this.mouse = { x: 400, y: 300 };
        this.keys = { w: false, a: false, s: false, d: false, space: false };

        this.lastTime = 0;
        this.timerInterval = null;

        this.bindEvents();
        this.showMenu();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    bindEvents() {
        // Mouse Move
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        // Mouse Click (Global Trigger)
        this.canvas.addEventListener('mousedown', () => {
            if (this.state === 'PLAYING') this.tryTrigger();
        });

        // Keyboard (WASD Only)
        window.addEventListener('keydown', (e) => {
            // Prevent default browser actions (like Firefox Quick Find on ' or /)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', "'", '/'].includes(e.key) ||
                ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }

            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) this.keys[key] = true;
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) this.keys[key] = false;
        });

        // UI Buttons
        document.getElementById('start-game-btn').onclick = () => this.startGame();
        document.getElementById('play-again-btn').onclick = () => this.startGame();
        document.getElementById('restart-btn').onclick = () => this.startGame();
        document.getElementById('menu-btn').onclick = () => this.showMenu();
        document.getElementById('back-home-btn').onclick = () => window.location.href = '../index.html';
        document.getElementById('quit-btn').onclick = () => window.location.href = '../index.html';
    }

    startGame() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.currentStageIndex = 0;

        const roundSelect = document.getElementById('round-count');
        this.totalRounds = roundSelect ? parseInt(roundSelect.value) : 3;

        document.getElementById('ui-layer').style.visibility = 'visible';
        this.loadStage(this.currentStageIndex);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.state === 'PLAYING') {
                this.stageTime--;
                if (this.stageTime <= 0) this.endGame("Time's Up!");
                this.updateUI();
            }
        }, 1000);
    }

    loadStage(index) {
        if (index >= this.totalRounds) {
            this.endGame("Victory!", true);
            return;
        }

        // If index exceeds defined stages, generate a random one (or repeat last)
        let config;
        if (index < STAGES.length) {
            config = STAGES[index];
        } else {
            // Generate random stage for extra rounds
            // 50% chance of Dual, 50% Single
            const isDual = Math.random() > 0.5;
            config = {
                id: index + 1,
                title: `Stage ${index + 1}`,
                time: isDual ? 45 : 30,
                pots: isDual
                    ? [{ type: 'mouse', speed: 90 }, { type: 'wasd', speed: 90 }]
                    : [{ type: 'mouse', speed: 150 }]
            };
        }

        this.stageTime = config.time;
        this.pots = [];
        this.cursors = [];

        // Setup Pots & Cursors based on config
        config.pots.forEach((pConfig, i) => {
            this.pots.push(new Pot(i, pConfig.type, pConfig.speed));

            // Ensure we have a cursor for this type
            if (!this.cursors.find(c => c.type === pConfig.type)) {
                this.cursors.push({
                    x: 400,
                    y: 300,
                    type: pConfig.type
                });
            }
        });

        this.state = 'COUNTDOWN';
        this.updateUI();

        // 3-2-1 Countdown
        this.showMessage("3");
        setTimeout(() => { if (this.state === 'COUNTDOWN') this.showMessage("2"); }, 1000);
        setTimeout(() => { if (this.state === 'COUNTDOWN') this.showMessage("1"); }, 2000);
        setTimeout(() => {
            if (this.state === 'COUNTDOWN') {
                this.showMessage("Start!");
                this.state = 'PLAYING';
            }
        }, 3000);
    }

    showMenu() {
        this.state = 'MENU';
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('ui-layer').style.visibility = 'hidden';
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    tryTrigger() {
        if (this.state !== 'PLAYING') return;

        // In Dual Mode (Stage 3), we check if BOTH are charged
        if (this.pots.length > 1) {
            const allCharged = this.pots.every(p => p.charge >= 100);
            if (allCharged) {
                this.handleSuccess(this.pots); // Pass all pots
            } else {
                this.handleFail(this.pots);
            }
        } else {
            // Single Mode
            const pot = this.pots[0];
            if (pot.charge >= 100) {
                this.handleSuccess([pot]);
            } else {
                this.handleFail([pot]);
            }
        }
    }

    handleSuccess(pots) {
        pots.forEach(p => p.completed = true);
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        const points = (100 * pots.length) + (this.combo * 10);
        this.score += points;
        this.showMessage("Hit!", `+${points}`);

        // Check if Stage Complete (All pots completed)
        if (this.pots.every(p => p.completed)) {
            setTimeout(() => {
                this.currentStageIndex++;
                this.loadStage(this.currentStageIndex);
            }, 1000);
        }
    }

    handleFail(pots) {
        this.combo = 0;
        this.showMessage("Too Early!", "Combo Lost");
        pots.forEach(p => p.charge = 0);
        this.updateUI();
    }

    showMessage(text, subtext = "") {
        const el = document.getElementById('message-area');
        el.innerHTML = `<div class="message-text">${text}</div><div class="message-subtext">${subtext}</div>`;

        el.style.display = 'none';
        el.offsetHeight;
        el.style.display = 'block';

        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            el.innerHTML = "";
        }, 1000);
    }

    update(dt) {
        // Always update cursors to allow positioning
        const mouseCursor = this.cursors.find(c => c.type === 'mouse');
        if (mouseCursor) {
            mouseCursor.x = this.mouse.x;
            mouseCursor.y = this.mouse.y;
        }

        const wasdCursor = this.cursors.find(c => c.type === 'wasd');
        if (wasdCursor) {
            const speed = 0.4 * dt;
            if (this.keys.w) wasdCursor.y -= speed;
            if (this.keys.s) wasdCursor.y += speed;
            if (this.keys.a) wasdCursor.x -= speed;
            if (this.keys.d) wasdCursor.x += speed;

            wasdCursor.x = Math.max(0, Math.min(800, wasdCursor.x));
            wasdCursor.y = Math.max(0, Math.min(600, wasdCursor.y));
        }

        if (this.state !== 'PLAYING') return;

        // Update Pots Movement & Collision
        this.pots.forEach(pot => {
            if (!pot.completed) pot.update(dt);
        });

        // Collision Resolution (Simple Elastic)
        for (let i = 0; i < this.pots.length; i++) {
            for (let j = i + 1; j < this.pots.length; j++) {
                const p1 = this.pots[i];
                const p2 = this.pots[j];
                if (p1.completed || p2.completed) continue;

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = 100; // Radius 50 * 2

                if (dist < minDist) {
                    // Resolve Overlap
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDist - dist;
                    const moveX = Math.cos(angle) * overlap * 0.5;
                    const moveY = Math.sin(angle) * overlap * 0.5;

                    p1.x -= moveX;
                    p1.y -= moveY;
                    p2.x += moveX;
                    p2.y += moveY;

                    // Bounce (Swap velocities roughly)
                    // Normal vector
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Relative velocity
                    const dvx = p2.vx - p1.vx;
                    const dvy = p2.vy - p1.vy;

                    // Dot product
                    const dot = dvx * nx + dvy * ny;

                    if (dot < 0) {
                        // Impulse
                        p1.vx += nx * dot;
                        p1.vy += ny * dot;
                        p2.vx -= nx * dot;
                        p2.vy -= ny * dot;
                    }
                }
            }
        }

        // Charging Logic
        if (this.pots.length > 1) {
            // Dual Mode: BOTH must be overlapping
            const p1 = this.pots[0];
            const p2 = this.pots[1];
            const c1 = this.cursors.find(c => c.type === p1.type);
            const c2 = this.cursors.find(c => c.type === p2.type);

            if (p1.completed || p2.completed) return;

            const dist1 = Math.hypot(c1.x - p1.x, c1.y - p1.y);
            const dist2 = Math.hypot(c2.x - p2.x, c2.y - p2.y);

            // Check overlap (Radius 50 + 15 = 65 tolerance)
            if (dist1 < 65 && dist2 < 65) {
                const charge = Math.min(100, p1.charge + (0.15 * dt));
                p1.charge = charge;
                p2.charge = charge; // Sync charge
            } else {
                const charge = Math.max(0, p1.charge - (0.3 * dt));
                p1.charge = charge;
                p2.charge = charge;
            }

        } else if (this.pots.length === 1) {
            // Single Mode
            const pot = this.pots[0];
            if (pot.completed) return;

            const cursor = this.cursors.find(c => c.type === pot.type);
            const dist = Math.hypot(cursor.x - pot.x, cursor.y - pot.y);

            if (dist < 65) {
                pot.charge = Math.min(100, pot.charge + (0.15 * dt));
            } else {
                pot.charge = Math.max(0, pot.charge - (0.3 * dt));
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Pots
        if (this.state === 'PLAYING' || this.state === 'GAMEOVER') {
            this.pots.forEach(pot => {
                if (!pot.completed) pot.draw(this.ctx);
            });
        }

        // Draw Cursors & Charge
        this.cursors.forEach(cursor => {
            // Find linked pot to get charge
            const pot = this.pots.find(p => p.type === cursor.type);
            const charge = pot ? pot.charge : 0;

            // Draw Charge Circle around Cursor
            if (charge > 0) {
                this.ctx.beginPath();
                this.ctx.arc(cursor.x, cursor.y, 25, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (charge / 100)));
                this.ctx.strokeStyle = charge >= 100 ? '#00ff00' : '#ffd700';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
            }

            this.ctx.beginPath();
            if (cursor.type === 'mouse') {
                this.ctx.arc(cursor.x, cursor.y, 15, 0, Math.PI * 2);
                this.ctx.fillStyle = '#c5a059';
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                this.ctx.arc(cursor.x, cursor.y, 15, 0, Math.PI * 2);
                this.ctx.fillStyle = '#4fc3f7';
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
    }

    updateUI() {
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
        document.getElementById('time-display').textContent = this.stageTime;
        document.getElementById('combo-display').textContent = this.combo;
        document.getElementById('stage-display').textContent = this.currentStageIndex + 1;
    }

    endGame(title, isWin = false) {
        this.state = 'GAMEOVER';
        clearInterval(this.timerInterval);
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.querySelector('#game-over-screen .screen-title').textContent = title;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-combo').textContent = this.maxCombo;
    }

    loop(timestamp) {
        if (!timestamp) {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
}

class Pot {
    constructor(id, type, speed) {
        this.id = id;
        this.type = type;
        this.speed = speed;
        this.x = Math.random() * 600 + 100;
        this.y = Math.random() * 400 + 100;

        // Constant Velocity Direction
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * (speed / 1000); // pixels per ms
        this.vy = Math.sin(angle) * (speed / 1000);

        this.charge = 0;
        this.completed = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounce off walls
        if (this.x < 40 || this.x > 760) this.vx *= -1;
        if (this.y < 40 || this.y > 560) this.vy *= -1;

        // Clamp to ensure they don't get stuck
        this.x = Math.max(40, Math.min(760, this.x));
        this.y = Math.max(40, Math.min(560, this.y));
    }

    draw(ctx) {
        // Draw Pot Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'mouse' ? '#5d4037' : '#455a64';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type === 'mouse' ? 'MOUSE' : 'WASD', this.x, this.y + 6);
    }
}

window.onload = () => {
    window.game = new Game();
};
