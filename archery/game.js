/**
 * Archery Minigame Logic
 * 
 * Mechanics:
 * - Spawn birds at random intervals from left or right.
 * - Click to shoot (remove bird, gain score).
 * - "Focus" ability (Key '1'): Slows down time for 6 seconds. 6s Cooldown.
 */

// Game Configuration
const GAME_DURATION = 60; // seconds

// Tuning: Relaxed for "Easy Mode" feel
// Tuning: High Density (User: "Spawn more birds")
const SPAWN_RATE_MIN = 300;
const SPAWN_RATE_MAX = 800;

// Tuning: Fast, but capped lower than before
const BIRD_SPEED_MIN = 300;
const BIRD_SPEED_MAX = 600;

const ABILITY_DURATION = 6000; // ms
const ABILITY_COOLDOWN = 6000; // ms

// DOM Elements
const gameWorld = document.getElementById('game-world');
const birdsLayer = document.getElementById('birds-layer');
const scoreDisplay = document.getElementById('score-display');
const timeDisplay = document.getElementById('time-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const abilityIcon = document.getElementById('ability-icon');
const cooldownCircle = document.getElementById('cooldown-circle');

// State
let gameState = {
    isPlaying: false,
    score: 0,
    timeRemaining: GAME_DURATION,
    lastTime: 0,
    spawnTimer: 0,
    nextSpawnTime: 1000,
    timeScale: 1.0,
    birds: []
};

let abilityState = {
    active: false,
    onCooldown: false,
    cooldownStartTime: 0
};

class Bird {
    constructor() {
        // Spawn Area
        this.baseY = Math.random() * (gameWorld.clientHeight * 0.5) + 50;
        this.y = this.baseY;
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // Start off-screen
        this.x = this.direction === 1 ? -150 : gameWorld.clientWidth + 150;

        this.speed = (Math.random() * (BIRD_SPEED_MAX - BIRD_SPEED_MIN) + BIRD_SPEED_MIN);

        // Size: The SVG is square 572x572. Let's scale it to a reasonable game size.
        // Base size ~100px-150px visual width
        this.baseSize = 120;
        // Increased Size Variation (0.5x to 1.5x)
        this.sizeScale = Math.random() * 1.0 + 0.5;
        this.currentSize = this.baseSize * this.sizeScale;

        // Flight Pattern
        // Add significant vertical velocity for diagonal/random paths
        this.vy = (Math.random() - 0.5) * this.speed * 0.6; // Vertical component

        this.flightType = Math.random();
        this.sineFreq = Math.random() * 0.005 + 0.002;
        this.sineAmp = Math.random() * 40 + 10;
        this.noiseOffset = Math.random() * 1000;

        // Container Group
        this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.group.setAttribute("cursor", "crosshair");
        this.group.style.pointerEvents = "all";

        // HITBOX: Large Invisible Circle
        const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hitbox.setAttribute("cx", "0");
        hitbox.setAttribute("cy", "0");
        hitbox.setAttribute("r", "100");
        hitbox.setAttribute("fill", "transparent");
        this.group.appendChild(hitbox);

        // Visual Bird Element: External SVG
        // Using <image> to load the external asset
        this.visuals = document.createElementNS("http://www.w3.org/2000/svg", "image");
        this.visuals.setAttributeNS("http://www.w3.org/1999/xlink", "href", "assets/flying_bird.svg");

        // Center the image. Viewbox is square-ish.
        this.visuals.setAttribute("width", this.currentSize);
        this.visuals.setAttribute("height", this.currentSize);
        this.visuals.setAttribute("x", -this.currentSize / 2);
        this.visuals.setAttribute("y", -this.currentSize / 2);

        // Apply slight opacity for ink wash feel
        this.visuals.style.opacity = "0.9";

        this.group.appendChild(this.visuals);

        // Bind click to GROUP
        this.group.addEventListener('mousedown', (e) => {
            if (gameState.isPlaying) {
                this.die(e.clientX, e.clientY);
                e.stopPropagation();
            }
        });

        birdsLayer.appendChild(this.group);
    }

    update(dt) {
        const dtScaled = dt * gameState.timeScale;

        // Move X
        this.x += this.speed * dtScaled * this.direction;

        // Move Y (Vertical Velocity + Sine Wave)
        this.y += this.vy * dtScaled;
        // Add the sine wave offset on top of the linear movement
        const waveOffset = Math.sin(this.x * this.sineFreq + this.noiseOffset) * this.sineAmp;

        // Final Y position for rendering
        const renderY = this.y + waveOffset;

        // Rotation: Tilt based on vertical velocity so they look like they are diving/climbing
        // Simple approximation: tilt proportional to vy
        let rotation = (this.vy / this.speed) * 45;

        // Add the majestic glide wobble
        rotation += Math.sin(Date.now() / 1500) * 5;

        // Transform Group (Position)
        this.group.setAttribute("transform", `translate(${this.x}, ${renderY})`);

        // Transform Visuals (Scale & Rotate)
        // Note: For <image>, we rotate around center (0,0 of the group)
        // Flip if moving left
        const dirScale = this.direction === -1 ? -1 : 1;

        this.visuals.setAttribute("transform",
            `scale(${dirScale}, 1) rotate(${rotation * -this.direction})`
        );
    }

    isOffScreen() {
        if (this.direction === 1) {
            if (this.x > gameWorld.clientWidth + 150) return true;
        } else {
            if (this.x < -150) return true;
        }
        // Also check vertical bounds (give some buffer)
        if (this.y < -200 || this.y > gameWorld.clientHeight + 200) return true;

        return false;
    }

    die(clientX, clientY) {
        gameState.score += 50;
        scoreDisplay.textContent = gameState.score;
        createScorePopup(clientX, clientY, "+50");
        createInkSplatter(clientX, clientY);
        this.remove();
        this.dead = true;
    }

    remove() {
        if (this.group && this.group.parentNode) {
            this.group.parentNode.removeChild(this.group);
        }
    }
}

// Visual Effect: Ink Splatter
function createInkSplatter(x, y) {
    for (let i = 0; i < 5; i++) {
        const drop = document.createElement('div');
        const size = Math.random() * 10 + 5;
        drop.style.width = `${size}px`;
        drop.style.height = `${size}px`;
        drop.style.background = '#000';
        drop.style.borderRadius = '50%';
        drop.style.position = 'absolute';
        drop.style.left = `${x}px`;
        drop.style.top = `${y}px`;
        drop.style.opacity = '0.7';
        drop.style.pointerEvents = 'none';
        drop.style.transition = 'all 0.6s ease-out';
        drop.style.filter = 'blur(0.5px)';

        document.body.appendChild(drop);

        const dx = (Math.random() - 0.5) * 80;
        const dy = (Math.random() - 0.5) * 80;

        requestAnimationFrame(() => {
            drop.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
            drop.style.opacity = '0';
        });

        setTimeout(() => drop.remove(), 600);
    }
}

// UI & Game Loop functions
function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    window.addEventListener('keydown', handleInput);
    window.addEventListener('resize', () => {
        gameWorld.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    });
    window.dispatchEvent(new Event('resize'));
    abilityIcon.addEventListener('click', activateAbility);
}

function startGame() {
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.timeRemaining = GAME_DURATION;
    gameState.birds.forEach(b => b.remove());
    gameState.birds = [];
    gameState.timeScale = 1.0;
    scoreDisplay.textContent = "0";
    timeDisplay.textContent = GAME_DURATION;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    abilityState.active = false;
    abilityState.onCooldown = false;
    updateAbilityUI();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState.isPlaying = false;
    finalScoreDisplay.textContent = gameState.score;
    gameOverScreen.classList.remove('hidden');
}

function handleInput(e) {
    if (e.key === '1') {
        activateAbility();
    }
}

function activateAbility() {
    if (!gameState.isPlaying || abilityState.active || abilityState.onCooldown) return;
    abilityState.active = true;
    gameState.timeScale = 0.3;
    document.body.classList.add('slow-motion');
    abilityIcon.classList.add('active');
    setTimeout(() => {
        abilityState.active = false;
        gameState.timeScale = 1.0;
        document.body.classList.remove('slow-motion');
        abilityIcon.classList.remove('active');
        startCooldown();
    }, ABILITY_DURATION);
}

function startCooldown() {
    abilityState.onCooldown = true;
    abilityState.cooldownStartTime = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - abilityState.cooldownStartTime;
        const progress = elapsed / ABILITY_COOLDOWN;
        if (progress >= 1) {
            clearInterval(interval);
            abilityState.onCooldown = false;
            updateAbilityUI(0);
        } else {
            updateAbilityUI(1 - progress);
        }
    }, 50);
}

function updateAbilityUI(percentage = 0) {
    const offset = 175.9 * percentage;
    cooldownCircle.style.strokeDashoffset = offset;
    if (abilityState.onCooldown) {
        abilityIcon.style.opacity = 0.5;
        abilityIcon.style.cursor = "default";
    } else {
        abilityIcon.style.opacity = 1;
        abilityIcon.style.cursor = "pointer";
    }
}

function createScorePopup(x, y, text) {
    const el = document.createElement('div');
    el.classList.add('score-popup');
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function gameLoop(timestamp) {
    if (!gameState.isPlaying) return;
    if (!gameState.lastTime) gameState.lastTime = timestamp;
    const dt = (timestamp - gameState.lastTime) / 1000;
    gameState.lastTime = timestamp;

    gameState.timeRemaining -= dt;
    if (gameState.timeRemaining <= 0) {
        endGame();
        return;
    }
    timeDisplay.textContent = Math.ceil(gameState.timeRemaining);

    gameState.spawnTimer += dt * 1000;
    if (gameState.spawnTimer > gameState.nextSpawnTime) {
        gameState.birds.push(new Bird());
        gameState.spawnTimer = 0;
        gameState.nextSpawnTime = Math.random() * (SPAWN_RATE_MAX - SPAWN_RATE_MIN) + SPAWN_RATE_MIN;
    }

    gameState.birds.forEach(bird => bird.update(dt));
    gameState.birds = gameState.birds.filter(bird => {
        if (bird.dead) return false;
        if (bird.isOffScreen()) {
            bird.remove();
            return false;
        }
        return true;
    });
    requestAnimationFrame(gameLoop);
}

init();
