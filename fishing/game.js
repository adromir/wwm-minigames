/**
 * Fishing Minigame - "Jiangnan Angler"
 * Core Logic: State Machine + Physics Loop
 */

const CONFIG = {
    castSpeed: 1, // Slower (was 2)
    tensionDecreaseRate: 0.3,
    tensionIncreaseRate: 0.4,
    fishMoveSpeed: 1.5,
    fishErraticness: 0.05,
    winThreshold: 100,

    // Arc Config
    arcRadius: 120,
    arcTotalLen: 377,
    zoneWidthDeg: 40,

    // Visual Tuning
    rodTipXOffset: 10,
    rodTipYOffset: 295,
};

const STATE = {
    IDLE: 0,
    CASTING: 1,
    WAITING: 2,
    STRUGGLE: 3,
    RESULT: 4
};

let currentState = STATE.IDLE;
let animationFrameId;
let lastTime = 0;

let power = 0;
let powerDirection = 1;
let biteTimer = 0;

let lastNoise = 0;
let fishAngle = 90;
let playerAngle = 90;
// targetFishAngle is unused in stationary mode, but kept for safety
let targetFishAngle = 90;
let progress = 30;
let flipCounter = 0;
let lastFlipDir = 1;

let els = {};

function init() {
    els = {
        canvas: document.getElementById('fishing-canvas'),
        ctx: document.getElementById('fishing-canvas').getContext('2d'),
        screens: {
            start: document.getElementById('start-screen'),
            result: document.getElementById('result-screen')
        },
        ui: {
            instructions: document.getElementById('instructions'),
            powerBar: document.getElementById('power-bar-container'),
            powerFill: document.getElementById('power-bar-fill'),
            struggleUI: document.getElementById('struggle-ui'),
            gaugeZone: document.getElementById('gauge-zone'),
            gaugeTick: document.getElementById('gauge-tick'),
            progressFill: document.getElementById('progress-ring-fill'),
            resultTitle: document.getElementById('result-title'),
            resultDesc: document.getElementById('result-desc'),
            fishDisplay: document.getElementById('fish-display'),
            rod: document.getElementById('rod-display'),
            startIndicator: document.getElementById('start-indicator'),
            fishIconImg: document.querySelector('#fish-icon-center img')
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', resetGame);

    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    els.canvas.width = window.innerWidth;
    els.canvas.height = window.innerHeight;
}

function startGame() {
    els.screens.start.classList.remove('active');
    document.body.classList.add('game-active'); // Hide cursor
    triggerStartIndicator();
    switchState(STATE.CASTING);
}

function resetGame() {
    els.screens.result.classList.remove('active');
    startGame();
}

function switchState(newState) {
    currentState = newState;
    els.ui.powerBar.style.display = 'none';
    if (els.ui.struggleUI) els.ui.struggleUI.style.display = 'none';
    els.ui.rod.classList.remove('rod-shake');
    els.ui.instructions.innerText = "";

    switch (newState) {
        case STATE.CASTING:
            els.ui.powerBar.style.display = 'block';
            els.ui.instructions.innerText = "Hold (Click) to charge cast!";
            power = 0;
            break;
        case STATE.WAITING:
            els.ui.instructions.innerText = "Tap SPACE to lure the fish...";
            // Randomize Taps (1 to 6)
            window.requiredTaps = Math.floor(Math.random() * 6) + 1;
            window.currentTaps = 0;
            window.lureCompleted = false;
            // No timer countdown for bite, bite depends on taps
            break;
        case STATE.STRUGGLE:
            els.ui.struggleUI.style.display = 'flex';
            els.ui.instructions.innerText = "Keep the White Line in the Green Zone!";
            progress = 30;
            // Randomize Zone for this Cast (Stationary but Random Position/Size)
            fishAngle = Math.random() * 100 + 40; // 40 to 140 degrees
            window.currentZoneWidth = Math.random() * 40 + 20; // 20 to 60 degrees width

            playerAngle = 90;
            targetFishAngle = 90;
            break;
        case STATE.RESULT:
            document.body.classList.remove('game-active'); // Show cursor
            els.screens.result.classList.add('active');
            break;
    }
}

function triggerStartIndicator() {
    const ind = els.ui.startIndicator;
    if (ind) {
        ind.classList.remove('animate-start');
        void ind.offsetWidth;
        ind.classList.add('animate-start');
    }
}

let isInputActive = false;

function onMouseDown(e) { if (e.button === 0) handleInputDown(); }
function onMouseUp(e) { if (e.button === 0) handleInputUp(); }

function onMouseMove(e) {
    if (currentState === STATE.STRUGGLE) {
        const w = window.innerWidth;
        const x = Math.max(0, Math.min(w, e.clientX));
        const pct = x / w;
        window.mouseAngle = pct * 180;
    }
}

function onKeyDown(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        // User requested removing Space for Casting
        if (currentState !== STATE.CASTING) {
            if (!e.repeat) handleInputDown();
        }
    }
}
function onKeyUp(e) {
    if (e.code === 'Space') {
        if (currentState !== STATE.CASTING) {
            handleInputUp();
        }
    }
}

function handleInputDown() {
    isInputActive = true;
    if (currentState === STATE.WAITING) handleShake();
}

function handleInputUp() {
    if (!isInputActive) return;
    isInputActive = false;
    if (currentState === STATE.CASTING) {
        if (power > 5) {
            // Cast Feedback
            let text = "Good";
            if (power >= 95) text = "PERFECT!";
            else if (power >= 80) text = "Great!";
            else if (power >= 50) text = "Good";
            else text = "Weak";

            showFloatingText(text);
            switchState(STATE.WAITING);
        }
    }
}

function showFloatingText(text) {
    const el = document.createElement('div');
    el.className = 'cast-feedback';
    el.innerText = text;
    document.querySelector('.ui-layer').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function handleShake() {
    if (window.lureCompleted) return; // Wait for animation

    createRipple();
    els.ui.rod.classList.remove('rod-shake');
    void els.ui.rod.offsetWidth;
    els.ui.rod.classList.add('rod-shake');

    window.currentTaps++;
    if (window.currentTaps >= window.requiredTaps) {
        // Bites!
        window.lureCompleted = true;
        // els.ui.instructions.innerText = "FISH ON!"; // Old way
        // Use Overlay instead
        showFloatingText("FISH ON!");
        els.ui.instructions.innerText = "";

        // Add Delay before Struggle
        window.biteDelayTimer = 1000; // 1s delay
    }
}

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw(dt);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (currentState === STATE.CASTING) {
        if (isInputActive) {
            // Handle Pause at Top
            if (window.castPauseTimer > 0) {
                window.castPauseTimer -= dt;
            } else {
                power += powerDirection * CONFIG.castSpeed;

                if (power >= 100) {
                    power = 100;
                    powerDirection = -1;
                    window.castPauseTimer = 200; // 200ms pause at top
                }
                else if (power <= 0) {
                    power = 0;
                    powerDirection = 1;
                }
            }
        } else {
            power = 0;
            window.castPauseTimer = 0;
        }
        els.ui.powerFill.style.height = power + '%'; // Vertical
    }

    if (currentState === STATE.WAITING && window.lureCompleted) {
        window.biteDelayTimer -= dt;
        if (window.biteDelayTimer <= 0) {
            // Reset style
            els.ui.instructions.style.color = "";
            els.ui.instructions.style.fontSize = "";
            switchState(STATE.STRUGGLE);
        }
    }

    if (currentState === STATE.STRUGGLE) {
        // 1. Green Zone is FIXED/STATIONARY for this round (set in switchState)
        // No modification of fishAngle here.

        // 2. Player Pointer (White Tick)
        // It follows the mouse (window.mouseAngle) BUT has noise added ("Wrestling")

        const time = Date.now() / 1000;
        // Noise: Oscillating Sine waves to create a "wiggling" force
        const noise = Math.sin(time * 5) * 15 + Math.cos(time * 2.3) * 10;

        // --- Fish Wiggle Logic (Restored) ---
        const noiseDelta = noise - lastNoise;
        lastNoise = noise;

        if (els.ui.fishIconImg) {
            // Flip based on direction
            if (Math.abs(noiseDelta) > 0.01) {
                els.ui.fishIconImg.style.transform = noiseDelta > 0 ? 'scaleX(1)' : 'scaleX(-1)';
            }
        } else {
            // Fallback cache if missing
            els.ui.fishIconImg = document.querySelector('#fish-icon-center img');
        }

        if (typeof window.mouseAngle === 'undefined') window.mouseAngle = 90;

        // Final Player Angle = Mouse Input + Noise Force
        playerAngle = window.mouseAngle + noise;

        // 3. Check Overlap
        const halfZone = CONFIG.zoneWidthDeg / 2;
        const diff = Math.abs(playerAngle - fishAngle);
        const inZone = diff < halfZone;

        if (inZone) {
            progress += CONFIG.tensionIncreaseRate;
            els.ui.gaugeZone.style.stroke = "var(--color-jade-highlight)";
        } else {
            progress -= CONFIG.tensionDecreaseRate;
            els.ui.gaugeZone.style.stroke = "rgba(127, 255, 212, 0.4)";
        }
        progress = Math.max(0, Math.min(100, progress));

        // 4. Update UI

        // Zone (Static at fishAngle=90)
        const totalLen = CONFIG.arcTotalLen;
        const zoneLen = (CONFIG.zoneWidthDeg / 180) * totalLen;
        const startAngle = fishAngle - halfZone;
        const startLen = (startAngle / 180) * totalLen;

        if (els.ui.gaugeZone) {
            els.ui.gaugeZone.style.strokeDasharray = `${zoneLen} ${totalLen}`;
            els.ui.gaugeZone.style.strokeDashoffset = -startLen;
        }

        // Tick (Moves with Player Angle)
        const cssRot = playerAngle - 90;
        if (els.ui.gaugeTick) {
            els.ui.gaugeTick.style.transform = `rotate(${cssRot}deg)`;
        }

        const progOffset = 283 - (progress / 100 * 283);
        if (els.ui.progressFill) {
            els.ui.progressFill.style.strokeDashoffset = progOffset;
        }

        if (progress >= 100) winGame();
        else if (progress <= 0) loseGame();
    }
}

function winGame() {
    els.ui.resultTitle.innerText = "Success!";
    els.ui.resultDesc.innerText = "You caught a magnificent fish!";
    els.ui.fishDisplay.innerText = "🐟";
    switchState(STATE.RESULT);
}

function loseGame() {
    els.ui.resultTitle.innerText = "It got away...";
    els.ui.resultDesc.innerText = "The line snapped.";
    els.ui.fishDisplay.innerText = "💨";
    switchState(STATE.RESULT);
}

const particles = [];
function createRipple() {
    particles.push({ x: els.canvas.width / 2, y: els.canvas.height / 2, r: 0, alpha: 1, type: 'ripple' });
}

function draw(dt) {
    const ctx = els.ctx;
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        if (p.type === 'ripple') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.stroke();
            p.r += 2;
            p.alpha -= 0.02;
            if (p.alpha <= 0) particles.splice(i, 1);
        }
    }

    if (currentState === STATE.WAITING || currentState === STATE.STRUGGLE) {
        ctx.beginPath();
        // Tuned Tip Position (Exposed via CONFIG)
        const tipX = els.canvas.width - CONFIG.rodTipXOffset;
        const tipY = els.canvas.height - CONFIG.rodTipYOffset;

        ctx.moveTo(tipX, tipY);
        const bob = Math.sin(Date.now() / 500) * 10;

        // --- Dynamic Line End Logic ---
        // Base center position
        let lineEndX = els.canvas.width / 2;
        let lineEndY = els.canvas.height / 2 + bob;

        if (currentState === STATE.STRUGGLE) {
            // Mouse Right (Angle > 90) -> Line Up (Y decreases)
            // Mouse Left (Angle < 90) -> Line Down (Y increases)
            const mAngle = (typeof window.mouseAngle !== 'undefined') ? window.mouseAngle : 90;
            // Factor: 4 pixels per degree deviation (More pronounced as requested)
            const yOffset = (90 - mAngle) * 4;
            lineEndY += yOffset;

            // X sway with mouse (1 pixel per degree)
            const xOffset = (mAngle - 90) * 1;
            lineEndX += xOffset;
        }

        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

try { init(); } catch (e) { console.error("Init failed:", e); }
