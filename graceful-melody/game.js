/**
 * Graceful Melody - Game Logic
 * Copyright (c) 2025 Adromir
 * License: MIT
 */

// --- Constants & Config ---
const CONFIG = {
	hitZoneY: 650,
	hitZoneHeight: 50,
	perfectThreshold: 30,
	goodThreshold: 60,
	missThreshold: 90,
	lanes: 6,
	keys: ['s', 'd', 'f', 'j', 'k', 'l']
};

// Difficulty settings removed - now intrinsic to songs

// --- Audio Engine ---
class AudioEngine {
	constructor() {
		this.ctx = null;
		this.frequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
	}

	init() {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		this.ctx = new AudioContext();
	}

	// Play primary melody note
	playNote(laneIndex, isHold = false) {
		if (!this.ctx) return;
		if (this.ctx.state === 'suspended') this.ctx.resume();

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(this.frequencies[laneIndex % this.frequencies.length], this.ctx.currentTime);

		const now = this.ctx.currentTime;
		const duration = isHold ? 1.5 : 0.6;

		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

		const filter = this.ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 800;

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start();
		osc.stop(now + duration + 0.1);
	}

	// Play background chord (softer, sine/triangle mix)
	playChord(chordIndices) {
		if (!this.ctx) return;
		if (this.ctx.state === 'suspended') this.ctx.resume();

		const now = this.ctx.currentTime;
		const duration = 3.0; // Long sustained pad

		chordIndices.forEach(idx => {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'sine'; // Soft sound
			osc.frequency.setValueAtTime(this.frequencies[idx % this.frequencies.length], now);

			// Softer volume envelope
			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(0.05, now + 0.5); // Slow attack
			gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

			osc.connect(gain);
			gain.connect(this.ctx.destination);

			osc.start();
			osc.stop(now + duration + 0.1);
		});
	}


}

// --- Visual Objects ---
class Particle {
	constructor(x, y, type = 'spark') {
		this.x = x; this.y = y;
		this.vx = (Math.random() - 0.5) * 10;
		this.vy = (Math.random() - 0.5) * 10;
		this.life = 1.0;
		this.type = type;
		this.size = Math.random() * 4 + 1;
	}
	update() {
		this.x += this.vx; this.y += this.vy;
		this.life -= 0.03; this.vy += 0.2;
	}
	draw(ctx) {
		ctx.globalAlpha = Math.max(0, this.life);
		ctx.globalCompositeOperation = 'lighter';
		// Azure & Gold Palette
		if (this.type === 'gold') ctx.fillStyle = '#ffd700'; // Perfect
		else if (this.type === 'jade') ctx.fillStyle = '#e6f1ff'; // Good (Silver)
		else ctx.fillStyle = '#c0c0c0'; // Default/Silver

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalCompositeOperation = 'source-over';
		ctx.globalAlpha = 1.0;
	}
}

class Note {
	constructor(lane, x, spawnY, type, length) {
		this.lane = lane; this.x = x; this.y = spawnY;
		this.type = type; this.length = length;
		this.active = true; this.isHolding = false;
	}
	update(speed) {
		this.y += speed;
	}
	draw(ctx) {
		const headY = this.y;
		const tailY = this.y - this.length;

		// Hold Tail
		if (this.type === 'hold') {
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			const grad = ctx.createLinearGradient(0, tailY, 0, headY);
			grad.addColorStop(0, "rgba(255, 215, 0, 0)");
			grad.addColorStop(1, "rgba(255, 215, 0, 0.6)"); // Gold glow for holds
			ctx.fillStyle = grad;
			ctx.fillRect(this.x - (this.isHolding ? 12 : 9), tailY, (this.isHolding ? 24 : 18), headY - tailY);
			ctx.restore();
		}

		// Note Head
		const radius = 22;
		const grad3d = ctx.createRadialGradient(this.x - 7, headY - 7, 2, this.x, headY, radius);

		if (this.type === 'hold') {
			// Gold for Hold Notes
			grad3d.addColorStop(0, '#fff8e1');
			grad3d.addColorStop(0.3, '#ffd700');
			grad3d.addColorStop(1, '#b8860b');
		} else {
			// Silver for Tap Notes
			grad3d.addColorStop(0, '#ffffff');
			grad3d.addColorStop(0.3, '#e6f1ff');
			grad3d.addColorStop(1, '#708090');
		}

		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		ctx.beginPath(); ctx.arc(this.x + 4, headY + 8, radius, 0, Math.PI * 2); ctx.fill();

		ctx.fillStyle = grad3d;
		ctx.beginPath(); ctx.arc(this.x, headY, radius, 0, Math.PI * 2); ctx.fill();

		ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
		ctx.beginPath(); ctx.arc(this.x, headY, radius * 0.7, 0, Math.PI * 2); ctx.stroke();
	}
}

// --- Main Game Class ---
class Game {
	constructor() {
		this.canvas = document.getElementById('gameCanvas');
		this.ctx = this.canvas.getContext('2d');
		this.audio = new AudioEngine();

		this.songs = [];
		this.currentSong = null;
		// this.currentDifficulty = 'disciple'; // Removed
		this.score = 0;
		this.combo = 0;
		this.maxCombo = 0;
		this.stats = { perfect: 0, good: 0, miss: 0 };

		this.state = 'MENU';
		this.startTime = 0;
		this.pauseTime = 0;
		this.totalPauseDuration = 0;

		this.notes = [];
		this.particles = [];
		this.songSequence = [];
		this.nextNoteIndex = 0;
		// Backing track
		this.backingSequence = [];
		this.nextBackingIndex = 0;

		this.keyState = new Array(6).fill(false);
		this.laneWidth = 0;
		this.laneCenters = [];

		this.loadSongs();
		this.resize();
		this.bindEvents();

		this.switchState('MENU');
	}

	loadSongs() {
		if (typeof SONG_DATA !== 'undefined' && SONG_DATA.songs) {
			this.songs = SONG_DATA.songs;
			this.renderSongList();
		} else {
			console.error("SONG_DATA missing. Check songs.js inclusion.");
			this.songs = [];
		}
	}

	renderSongList() {
		const list = document.getElementById('song-list');
		list.innerHTML = '';

		// Sort songs by difficulty rank
		const diffOrder = { "Novice": 1, "Disciple": 2, "Master": 3, "Grandmaster": 4 };
		this.songs.sort((a, b) => {
			const da = diffOrder[a.difficulty] || 99;
			const db = diffOrder[b.difficulty] || 99;
			return da - db;
		});

		// Random Song Button
		const randomBtn = document.createElement('button');
		randomBtn.className = 'song-btn random-btn';
		randomBtn.innerHTML = `<strong>🎲 Random Song</strong><br><span>Surprise Me!</span>`;
		randomBtn.onclick = () => {
			if (this.songs.length > 0) {
				const randomIndex = Math.floor(Math.random() * this.songs.length);
				this.selectSong(this.songs[randomIndex]);
			}
			randomBtn.blur();
		};
		list.appendChild(randomBtn);

		let currentGroup = "";

		this.songs.forEach(song => {
			// Add Group Header if needed
			if (song.difficulty !== currentGroup) {
				currentGroup = song.difficulty;
				const header = document.createElement('div');
				header.className = 'song-group-header';
				header.textContent = currentGroup;
				list.appendChild(header);
			}

			const btn = document.createElement('button');
			btn.className = 'song-btn';
			btn.innerHTML = `<strong>${song.title}</strong><br><span>${song.subtitle}</span>`;
			btn.onclick = () => {
				this.selectSong(song);
				btn.blur();
			};
			list.appendChild(btn);
		});
	}

	resize() {
		this.canvas.width = 800;
		this.canvas.height = 800;
		this.laneWidth = this.canvas.width / CONFIG.lanes;
		this.laneCenters = Array.from({ length: CONFIG.lanes }, (_, i) => this.laneWidth * i + this.laneWidth / 2);
	}

	bindEvents() {
		window.addEventListener('keydown', (e) => {
			// Prevent default for any key during play to stop browser search
			if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
				if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) e.preventDefault();
				if (e.code === 'Space') e.preventDefault(); // Pause key
			}

			if (this.state === 'PLAYING') this.handleInput(e, true);
			this.handleUIKeys(e);
		});
		window.addEventListener('keyup', (e) => {
			if (this.state === 'PLAYING') this.handleInput(e, false);
		});



		// Difficulty buttons removed

		document.getElementById('pause-btn').onclick = (e) => { this.togglePause(); e.target.blur(); };
		document.getElementById('restart-game-btn').onclick = (e) => { this.restart(); e.target.blur(); };
		document.getElementById('quit-btn').onclick = (e) => { this.quit(); e.target.blur(); };

		document.getElementById('restart-btn').onclick = (e) => { this.startCountdown(); e.target.blur(); };
		document.getElementById('menu-btn').onclick = (e) => { this.quit(); e.target.blur(); };

		document.getElementById('portal-btn').onclick = () => window.location.href = '../index.html';
	}

	handleUIKeys(e) {
		// Pause on Space
		if (e.code === 'Space') {
			if (this.state === 'PLAYING' || this.state === 'PAUSED') this.togglePause();
		}
		const key = e.key.toUpperCase();
		console.log(`Key pressed: ${key}, State: ${this.state}`); // Debug log

		if (key === 'ESCAPE') {
			if (this.state === 'PLAYING' || this.state === 'PAUSED') this.togglePause();
		}
		if (key === 'R' && (this.state === 'PAUSED' || this.state === 'END' || this.state === 'PLAYING')) {
			this.restart();
		}
		if (key === 'Q' && (this.state === 'PAUSED' || this.state === 'END' || this.state === 'PLAYING')) {
			console.log("Quitting game via Q key"); // Debug log
			this.quit();
		}
	}

	switchState(newState) {
		this.state = newState;
		const ids = ['start-screen', 'game-over-screen', 'game-controls', 'song-select-section', 'paused-indicator', 'countdown-overlay'];
		ids.forEach(id => document.getElementById(id).classList.add('hidden'));

		switch (newState) {
			case 'MENU':
				document.getElementById('start-screen').classList.remove('hidden');
				document.getElementById('song-select-section').classList.remove('hidden');
				break;

			case 'COUNTDOWN':
				document.getElementById('game-controls').classList.remove('hidden');
				document.getElementById('countdown-overlay').classList.remove('hidden');
				break;
			case 'PLAYING':
				document.getElementById('game-controls').classList.remove('hidden');
				break;
			case 'PAUSED':
				document.getElementById('game-controls').classList.remove('hidden');
				document.getElementById('paused-indicator').style.display = 'block';
				document.getElementById('paused-indicator').classList.remove('hidden');
				break;
			case 'END':
				document.getElementById('game-over-screen').classList.remove('hidden');
				break;
		}
	}

	selectSong(song) {
		this.currentSong = song;
		this.startCountdown();
	}

	startCountdown() {
		// this.currentDifficulty = difficulty; // Removed
		this.switchState('COUNTDOWN');
		this.audio.init();

		this.score = 0; this.combo = 0; this.maxCombo = 0;
		this.stats = { perfect: 0, good: 0, miss: 0 };
		this.notes = []; this.particles = [];
		this.keyState.fill(false);
		this.updateUI();
		document.getElementById('progress-bar').style.width = '0%';

		// Update Song Title Display
		if (this.currentSong) {
			document.getElementById('current-song-display').textContent = this.currentSong.title;
		}

		// Generate Song Sequence
		const targetDuration = 90000;
		let seq = [];
		let backingSeq = [];
		let offset = 0;

		if (this.currentSong) {
			// Find loop point (max note time)
			const maxT = Math.max(...this.currentSong.notes.map(n => n.t)) + 2000;

			// Loop notes and backing track until 90s
			while (offset < targetDuration) {
				// Melody
				this.currentSong.notes.forEach(n => {
					if (n.t + offset <= targetDuration) seq.push({ ...n, t: n.t + offset });
				});
				// Backing
				if (this.currentSong.backing) {
					this.currentSong.backing.forEach(b => {
						if (b.t + offset <= targetDuration) backingSeq.push({ ...b, t: b.t + offset });
					});
				}
				offset += maxT;
			}
		}
		this.songSequence = seq.sort((a, b) => a.t - b.t);
		this.nextNoteIndex = 0;

		this.backingSequence = backingSeq.sort((a, b) => a.t - b.t);
		this.nextBackingIndex = 0;

		const countEl = document.getElementById('countdown-text');
		let count = 3;
		countEl.textContent = count;

		if (this.timer) clearInterval(this.timer);
		this.timer = setInterval(() => {
			count--;
			if (count > 0) countEl.textContent = count;
			else if (count === 0) countEl.textContent = "Start";
			else {
				clearInterval(this.timer);
				this.startPlaying();
			}
		}, 800);
	}

	startPlaying() {
		this.switchState('PLAYING');
		this.startTime = performance.now();
		this.totalPauseDuration = 0;
		this.loop();
	}

	restart() {
		this.startCountdown();
	}

	quit() {
		this.switchState('MENU');
	}

	togglePause() {
		if (this.state === 'PLAYING') {
			this.state = 'PAUSED';
			this.pauseTime = performance.now();
			this.switchState('PAUSED');
			document.getElementById('pause-btn').innerHTML = '<span class="c-icon">►</span><span class="c-label">Resume (Space)</span>';
		} else if (this.state === 'PAUSED') {
			this.state = 'PLAYING';
			this.totalPauseDuration += (performance.now() - this.pauseTime);
			this.switchState('PLAYING');
			document.getElementById('paused-indicator').style.display = 'none';
			document.getElementById('pause-btn').innerHTML = '<span class="c-icon">❚❚</span><span class="c-label">Pause (Space)</span>';
			this.loop();
		}
	}

	spawnNotes(currentTime) {
		const speed = this.currentSong.speed;
		const travelTime = (700 / speed) * (16.66);
		const lookAhead = currentTime + travelTime;

		// Notes
		while (this.nextNoteIndex < this.songSequence.length) {
			const n = this.songSequence[this.nextNoteIndex];
			if (n.t <= lookAhead) {
				const timeUntilHit = n.t - currentTime;
				const framesUntilHit = timeUntilHit / 16.66;
				const spawnY = CONFIG.hitZoneY - (framesUntilHit * speed);
				const len = n.type === 'hold' ? (n.len / 16.66 * speed) : 0;

				this.notes.push(new Note(n.l, this.laneCenters[n.l], spawnY, n.type, len));
				this.nextNoteIndex++;
			} else {
				break;
			}
		}

		// Backing Track (Audio only)
		while (this.nextBackingIndex < this.backingSequence.length) {
			const b = this.backingSequence[this.nextBackingIndex];
			if (b.t <= currentTime) {
				this.audio.playChord(b.chord);
				this.nextBackingIndex++;
			} else {
				break;
			}
		}
	}

	handleInput(e, isDown) {
		const keyIndex = CONFIG.keys.indexOf(e.key.toLowerCase());
		if (keyIndex === -1) return;
		e.preventDefault();
		if (isDown && e.repeat) return;

		if (isDown) {
			this.keyState[keyIndex] = true;
			const note = this.notes.find(n => n.lane === keyIndex && n.active && !n.isHolding && n.y > CONFIG.hitZoneY - 100 && n.y < 800);
			if (note) {
				const diff = Math.abs(note.y - CONFIG.hitZoneY);
				if (diff < CONFIG.missThreshold) {
					if (diff < CONFIG.perfectThreshold) {
						this.stats.perfect++;
						this.addScore(100);
						this.showFeedback("Divine", "#ffd700");
						this.spawnParticles(note.x, CONFIG.hitZoneY, 'gold');
					} else {
						this.stats.good++;
						this.addScore(50);
						this.showFeedback("Good", "#e6f1ff"); // Silver
						this.spawnParticles(note.x, CONFIG.hitZoneY, 'jade');
					}
					this.audio.playNote(note.lane, note.type === 'hold');
					if (note.type === 'tap') note.active = false;
					else note.isHolding = true;
				}
			}
		} else {
			this.keyState[keyIndex] = false;
			const note = this.notes.find(n => n.lane === keyIndex && n.active && n.isHolding);
			if (note) {
				const tailY = note.y - note.length;
				if (tailY < CONFIG.hitZoneY - CONFIG.goodThreshold) {
					this.breakCombo("Lost");
					note.isHolding = false;
				}
			}
		}
	}

	addScore(amount) {
		this.combo++;
		if (this.combo > this.maxCombo) this.maxCombo = this.combo;
		this.score += amount * (1 + this.combo * 0.01);
		this.updateUI();
	}

	breakCombo(text) {
		if (this.combo > 0) {
			this.combo = 0;
			this.showFeedback(text, "#8892b0"); // Silver Dim
			// this.audio.playMissSound(); // Removed
			this.updateUI();
		}
	}

	spawnParticles(x, y, type) {
		for (let i = 0; i < 10; i++) this.particles.push(new Particle(x, y, type));
	}

	showFeedback(text, color) {
		const el = document.getElementById('feedback-text');
		el.textContent = text;
		el.style.backgroundImage = `linear-gradient(180deg, #fff 0%, ${color} 100%)`;
		el.style.opacity = 1;
		el.style.bottom = '250px';
		if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
		this.feedbackTimeout = setTimeout(() => { el.style.opacity = 0; }, 500);
	}

	updateUI() {
		document.getElementById('score').textContent = Math.floor(this.score);
		const c = document.getElementById('combo-display');
		c.textContent = this.combo > 1 ? this.combo + " Combo" : "";
		c.style.transform = this.combo > 1 ? "translate(-50%, -50%) scale(1.1)" : "translate(-50%, -50%) scale(1)";
		setTimeout(() => c.style.transform = "translate(-50%, -50%) scale(1)", 50);
	}

	endGame() {
		this.switchState('END');
		document.getElementById('final-song').textContent = this.currentSong.title;
		document.getElementById('final-diff').textContent = this.currentSong.difficulty;
		document.getElementById('stat-perfect').textContent = this.stats.perfect;
		document.getElementById('stat-good').textContent = this.stats.good;
		document.getElementById('stat-miss').textContent = this.stats.miss;
		document.getElementById('final-score').textContent = Math.floor(this.score);
		document.getElementById('max-combo').textContent = this.maxCombo;

		const key = `score_${this.currentSong.id}`;
		const oldHigh = localStorage.getItem(key) || 0;
		if (this.score > oldHigh) {
			localStorage.setItem(key, Math.floor(this.score));
			document.getElementById('new-record-msg').textContent = "New Record!";
		} else {
			document.getElementById('new-record-msg').textContent = "";
		}
		document.getElementById('final-highscore').textContent = Math.max(oldHigh, Math.floor(this.score));
	}

	loop() {
		if (this.state !== 'PLAYING') return;

		const now = performance.now();
		const time = now - this.startTime - this.totalPauseDuration;

		// Update Progress
		const dur = this.currentSong.duration * 1000;
		const pct = Math.min((time / dur) * 100, 100);
		document.getElementById('progress-bar').style.width = pct + "%";

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (time < dur) {
			this.spawnNotes(time);
		} else if (this.notes.length === 0) {
			this.endGame();
			return;
		}

		// Draw Lanes
		// Draw Bridge (Hit Line) - Glowing Silver
		const grad = this.ctx.createLinearGradient(0, CONFIG.hitZoneY - 5, 0, CONFIG.hitZoneY + 5);
		grad.addColorStop(0, "rgba(230, 241, 255, 0)");
		grad.addColorStop(0.5, "#e6f1ff");
		grad.addColorStop(1, "rgba(230, 241, 255, 0)");
		this.ctx.fillStyle = grad; this.ctx.fillRect(0, CONFIG.hitZoneY - 2, 800, 4);

		// Draw Lanes & Hit Zones (Overlaying Bridge)
		for (let i = 0; i < CONFIG.lanes; i++) {
			const x = this.laneCenters[i];
			const pressed = this.keyState[i];
			// Silver Lanes
			this.ctx.strokeStyle = pressed ? '#e6f1ff' : 'rgba(230, 241, 255, 0.1)';
			this.ctx.lineWidth = pressed ? 3 : 1;
			this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, 800); this.ctx.stroke();

			// Hit Zone Circle (Overlaying Line)
			this.ctx.beginPath(); this.ctx.arc(x, CONFIG.hitZoneY, 28, 0, Math.PI * 2);
			this.ctx.fillStyle = pressed ? 'rgba(230, 241, 255, 0.3)' : 'rgba(0,0,0,0.5)'; // Darker fill to cover line
			this.ctx.fill();
			this.ctx.strokeStyle = pressed ? '#ffffff' : '#8892b0';
			this.ctx.stroke();

			this.ctx.fillStyle = pressed ? '#fff' : '#c0c0c0';
			this.ctx.font = "20px serif"; this.ctx.textAlign = "center";
			this.ctx.fillText(CONFIG.keys[i].toUpperCase(), x, CONFIG.hitZoneY + 5);
		}

		// Update & Draw Notes
		for (let i = this.notes.length - 1; i >= 0; i--) {
			const n = this.notes[i];
			if (n.active) {
				if (n.type === 'hold' && n.isHolding) {
					this.score += 0.5;
					if (n.y - n.length > CONFIG.hitZoneY) {
						n.active = false;
						this.spawnParticles(n.x, CONFIG.hitZoneY, 'gold');
					}
				}
				n.update(this.currentSong.speed);
				n.draw(this.ctx);
				if (!n.isHolding && n.y - n.length > 800) {
					n.active = false;
					this.stats.miss++;
					this.breakCombo("Miss");
				}
			} else {
				this.notes.splice(i, 1);
			}
		}

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.update(); p.draw(this.ctx);
			if (p.life <= 0) this.particles.splice(i, 1);
		}

		requestAnimationFrame(() => this.loop());
	}
}

window.onload = () => new Game();