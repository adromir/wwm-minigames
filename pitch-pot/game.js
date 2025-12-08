/**
 * Pitch Pot (Touhu) - Refined WWM Style
 * Steady Movement, Stage Progression
 */

// Define the 4 stage varieties as requested
// 1. One Pot, One Pointer (Mouse)
// 2. One Pot, One Pointer (Keyboard)
// 3. One Pot, Two Pointers (Hybrid - Both must be inside)
// 4. Two Pots, Two Pointers (Dual - Corresponding pots, slower)

const STAGE_TYPES = [
    { type: 'mouse', count: 1, label: 'Mouse Focus' },
    { type: 'wasd', count: 1, label: 'Keyboard Focus' },
    { type: 'hybrid', count: 1, label: 'Dual Focus (Hybrid)' },
    { type: 'dual', count: 2, label: 'Split Focus (Dual)' }
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
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', "'", '/'].includes(e.key) ||
                ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }

            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) this.keys[key] = true;
            // Space trigger for keyboard users if they prefer
            if (e.key === ' ' && this.state === 'PLAYING') this.tryTrigger();
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) this.keys[key] = false;
        });

        // UI Buttons
        document.getElementById('start-game-btn').onclick = () => this.startGame();
        // Play Again goes to Menu to allow changing Round Count
        document.getElementById('play-again-btn').onclick = () => this.showMenu();
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

        // Generate Random Stage Config
        // Randomly pick one of the 4 varieties
        const variety = STAGE_TYPES[Math.floor(Math.random() * STAGE_TYPES.length)];

        let potConfigs = [];
        let time = 30;

        switch (variety.type) {
            case 'mouse':
                potConfigs = [{ type: 'mouse', speed: 80 + (index * 8) }];
                time = 30;
                break;
            case 'wasd':
                potConfigs = [{ type: 'wasd', speed: 60 + (index * 8) }];
                time = 30;
                break;
            case 'hybrid':
                // One Pot, Needs BOTH
                potConfigs = [{ type: 'hybrid', speed: 70 + (index * 8) }];
                time = 40;
                break;
            case 'dual':
                // Two Pots, One Mouse One WASD (Slower)
                potConfigs = [
                    { type: 'mouse', speed: 50 + (index * 5) },
                    { type: 'wasd', speed: 50 + (index * 5) }
                ];
                time = 45;
                break;
        }

        this.stageTime = time;
        this.pots = [];
        this.cursors = [];

        // Setup Pots
        potConfigs.forEach((pConfig, i) => {
            this.pots.push(new PitchPot(i, pConfig.type, pConfig.speed));
        });

        // Setup Cursors based on Pot Needs
        const needsMouse = this.pots.some(p => p.type === 'mouse' || p.type === 'hybrid' || p.type === 'dual');
        const needsWasd = this.pots.some(p => p.type === 'wasd' || p.type === 'hybrid' || p.type === 'dual');

        if (needsMouse) this.cursors.push({ x: 400, y: 300, type: 'mouse' });
        if (needsWasd) this.cursors.push({ x: 400, y: 300, type: 'wasd' });


        this.state = 'COUNTDOWN';
        this.updateUI();
        this.showMessage(`Stage ${index + 1}`); // No announcement of type

        // 3-2-1 Countdown
        // Sequence:
        // 0s: "3"
        // 1s: "2"
        // 2s: "1"
        // 3s: "Start!" appears
        // 4s: "Start!" disappears -> Game Begins

        this.showMessage("3");
        setTimeout(() => { if (this.state === 'COUNTDOWN') this.showMessage("2"); }, 1000);
        setTimeout(() => { if (this.state === 'COUNTDOWN') this.showMessage("1"); }, 2000);
        setTimeout(() => { if (this.state === 'COUNTDOWN') this.showMessage("Start!"); }, 3000);

        setTimeout(() => {
            if (this.state === 'COUNTDOWN') {
                this.state = 'PLAYING';
            }
        }, 4000); // Start AFTER 'Start!' message (which lasts 1s)
    }

    showMenu() {
        this.state = 'MENU';
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden'); // Ensure hidden
        document.getElementById('ui-layer').style.visibility = 'hidden';
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    tryTrigger() {
        if (this.state !== 'PLAYING') return;

        // Check completion based on pot types
        // If ALL pots are charged, success
        // If ANY pot is not charged, fail

        const allCharged = this.pots.every(p => p.charge >= 100);

        if (allCharged) {
            this.handleSuccess(this.pots);
        } else {
            this.handleFail(this.pots);
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
        // Always update cursors to allow positioning (even in countdown)
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
        if (this.pots.length > 1) {
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
                        const angle = Math.atan2(dy, dx);
                        const overlap = minDist - dist;
                        const moveX = Math.cos(angle) * overlap * 0.5;
                        const moveY = Math.sin(angle) * overlap * 0.5;

                        p1.x -= moveX;
                        p1.y -= moveY;
                        p2.x += moveX;
                        p2.y += moveY;

                        const nx = dx / dist;
                        const ny = dy / dist;

                        if (!isFinite(nx) || !isFinite(ny)) continue;

                        const dvx = p2.vx - p1.vx;
                        const dvy = p2.vy - p1.vy;
                        const dot = dvx * nx + dvy * ny;

                        if (dot < 0) {
                            p1.vx += nx * dot;
                            p1.vy += ny * dot;
                            p2.vx -= nx * dot;
                            p2.vy -= ny * dot;
                        }
                    }
                }
            }
        }

        // Charging Logic
        try {
            this.pots.forEach(pot => {
                if (pot.completed) return;

                let isCharging = false;

                if (pot.type === 'hybrid') {
                    // Requires BOTH cursors
                    const cMouse = this.cursors.find(c => c.type === 'mouse');
                    const cWasd = this.cursors.find(c => c.type === 'wasd');

                    if (cMouse && cWasd) {
                        const d1 = Math.hypot(cMouse.x - pot.x, cMouse.y - pot.y);
                        const d2 = Math.hypot(cWasd.x - pot.x, cWasd.y - pot.y);
                        if (d1 < 35 && d2 < 35) isCharging = true;
                    }
                } else {
                    // Normal single type check
                    // 'mouse' pot needs 'mouse' cursor
                    // 'wasd' pot needs 'wasd' cursor
                    const cursor = this.cursors.find(c => c.type === pot.type);
                    if (cursor) {
                        const dist = Math.hypot(cursor.x - pot.x, cursor.y - pot.y);
                        if (dist < 35) isCharging = true;
                    }
                }

                if (isCharging) {
                    pot.charge = Math.min(100, pot.charge + (0.15 * dt));
                } else {
                    pot.charge = Math.max(0, pot.charge - (0.3 * dt));
                }
            });

        } catch (err) {
            console.error("Update Error:", err);
        }
    }

    updateUI() {
        document.getElementById('score-display').innerText = 'Score: ' + this.score;
        document.getElementById('time-display').innerText = Math.ceil(this.stageTime);
        document.getElementById('combo-display').innerText = this.combo;
        document.getElementById('stage-display').innerText = this.currentStageIndex + 1;
    }

    endGame(reason, victory = false) {
        this.state = 'GAMEOVER';
        if (this.timerInterval) clearInterval(this.timerInterval);

        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('ui-layer').style.visibility = 'hidden';

        document.getElementById('final-score').innerText = this.score;
        document.getElementById('final-combo').innerText = this.maxCombo;
        document.querySelector('#game-over-screen .screen-title').innerText = reason;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Visibility Rule: Only draw pots/cursors if PLAYING or GAMEOVER
        // Ensure they are hidden during COUNTDOWN
        if (this.state !== 'PLAYING' && this.state !== 'GAMEOVER') return;

        // Draw Pots
        this.pots.forEach(pot => pot.draw(this.ctx));

        // Draw Cursors
        this.cursors.forEach(cursor => {
            this.ctx.beginPath();

            // Distinct Shapes
            // Mouse = Hollow Circle
            // WASD = Hollow Square

            this.ctx.lineWidth = 3;
            // Charge Ring Color

            // First draw the Cursor Indicator
            if (cursor.type === 'mouse') {
                this.ctx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#fff';
                this.ctx.stroke();
                this.ctx.fillStyle = '#ffeb3b'; // Yellow Center
                this.ctx.fill();
            } else {
                // WASD Circle (Same shape, different color)
                this.ctx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#fff';
                this.ctx.stroke();
                this.ctx.fillStyle = '#4fc3f7'; // Light Blue
                this.ctx.fill();
            }

            // Draw Charge Ring (Feedback for nearest/active pot)
            // We search for pots charging THIS cursor or being charged BY this cursor
            const activePot = this.pots.find(p => {
                if (p.completed) return false;
                // Hybrid shares logic, but we can just show ring if ANY charge exists on relevant pot
                if (p.type === 'hybrid' || p.type === cursor.type) {
                    return p.charge > 0;
                }
                return false;
            });

            if (activePot && activePot.charge > 0) {
                this.ctx.beginPath();
                this.ctx.arc(cursor.x, cursor.y, 20, 0, Math.PI * 2 * (activePot.charge / 100));

                // Color depends on type
                const hue = cursor.type === 'mouse' ? '59' : '190'; // Yellow vs Blue

                this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
            }
        });
    }

    loop(timestamp) {
        if (!timestamp) {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        try {
            this.update(dt);
            this.draw();
        } catch (e) {
            console.error("Game Loop Error:", e);
        }
        requestAnimationFrame((t) => this.loop(t));
    }
}


class PitchPot {
    constructor(id, type, speed) {
        this.id = id;
        this.type = type; // 'mouse', 'wasd', 'hybrid'
        this.speed = speed;
        this.x = Math.random() * 600 + 100;
        this.y = Math.random() * 400 + 100;

        // Constant Velocity Direction
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * (speed / 1000);
        this.vy = Math.sin(angle) * (speed / 1000);

        this.charge = 0;
        this.completed = false;
    }

    update(dt, speedMod = 1.0) {
        this.x += this.vx * dt * speedMod;
        this.y += this.vy * dt * speedMod;

        // Bounce off walls
        if (this.x < 40 || this.x > 760) this.vx *= -1;
        if (this.y < 40 || this.y > 560) this.vy *= -1;

        // Clamp
        this.x = Math.max(40, Math.min(760, this.x));
        this.y = Math.max(40, Math.min(560, this.y));
    }

    draw(ctx) {
        if (this.completed) return; // Don't draw completed pots

        // Draw Pot Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);

        // Distinct Colors for Pot Type
        if (this.type === 'mouse') ctx.fillStyle = '#5d4037'; // Brown (Standard)
        else if (this.type === 'wasd') ctx.fillStyle = '#455a64'; // Grey (Keyboard)
        else ctx.fillStyle = '#7b1fa2'; // Purple (Hybrid)

        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';

        let label = 'MOUSE';
        if (this.type === 'wasd') label = 'WASD';
        if (this.type === 'hybrid') label = 'BOTH';

        ctx.fillText(label, this.x, this.y + 6);

        // Progress Ring inside Pot
        if (this.charge > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 45, 0, Math.PI * 2 * (this.charge / 100));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }
}

window.onload = () => {
    window.game = new Game();
};
