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

const DIFFICULTY_SETTINGS = {
	novice: { speed: 4, label: "Novice", mult: 0.8, duration: 90 },
	disciple: { speed: 6, label: "Disciple", mult: 1.0, duration: 90 },
	master: { speed: 8, label: "Master", mult: 1.2, duration: 90 },
	grandmaster: { speed: 10, label: "Grandmaster", mult: 1.5, duration: 90 }
};

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
	
	playMissSound() {
		if (!this.ctx) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(60, this.ctx.currentTime);
		gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
		
		osc.connect(gain);
		gain.connect(this.ctx.destination);
		osc.start();
		osc.stop(this.ctx.currentTime + 0.2);
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
		ctx.fillStyle = this.type === 'gold' ? '#ffd700' : (this.type === 'jade' ? '#64ffda' : '#fff');
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
			grad.addColorStop(0, "rgba(0, 191, 165, 0)");
			grad.addColorStop(1, "rgba(0, 191, 165, 0.8)");
			ctx.fillStyle = grad;
			ctx.fillRect(this.x - (this.isHolding?12:9), tailY, (this.isHolding?24:18), headY - tailY);
			ctx.restore();
		}

		// Note Head
		const radius = 22;
		const grad3d = ctx.createRadialGradient(this.x - 7, headY - 7, 2, this.x, headY, radius);
		grad3d.addColorStop(0, this.isHolding ? '#fff8e1' : '#e0f2f1');
		grad3d.addColorStop(0.3, this.isHolding ? '#ffd700' : '#00bfa5');
		grad3d.addColorStop(1, this.isHolding ? '#e65100' : '#004d40');

		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		ctx.beginPath(); ctx.arc(this.x+4, headY+8, radius, 0, Math.PI*2); ctx.fill(); 
		
		ctx.fillStyle = grad3d;
		ctx.beginPath(); ctx.arc(this.x, headY, radius, 0, Math.PI*2); ctx.fill(); 
		
		ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
		ctx.beginPath(); ctx.arc(this.x, headY, radius*0.7, 0, Math.PI*2); ctx.stroke(); 
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
		this.currentDifficulty = 'disciple';
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
		this.songs.forEach(song => {
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
		this.laneCenters = Array.from({length: CONFIG.lanes}, (_, i) => this.laneWidth * i + this.laneWidth / 2);
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

		document.getElementById('back-to-songs').onclick = (e) => { this.switchState('MENU'); e.target.blur(); };
		
		document.querySelectorAll('.diff-btn').forEach(btn => {
			btn.onclick = () => {
				this.startCountdown(btn.getAttribute('data-diff'));
				btn.blur();
			};
		});

		document.getElementById('pause-btn').onclick = (e) => { this.togglePause(); e.target.blur(); };
		document.getElementById('restart-game-btn').onclick = (e) => { this.restart(); e.target.blur(); };
		document.getElementById('quit-btn').onclick = (e) => { this.quit(); e.target.blur(); };
		
		document.getElementById('restart-btn').onclick = (e) => { this.startCountdown(this.currentDifficulty); e.target.blur(); };
		document.getElementById('menu-btn').onclick = (e) => { this.quit(); e.target.blur(); };
	}

	handleUIKeys(e) {
		// Pause on Space
		if (e.code === 'Space') {
			if (this.state === 'PLAYING' || this.state === 'PAUSED') this.togglePause();
		}
		const key = e.key.toUpperCase();
		if (key === 'ESCAPE') {
			if (this.state === 'PLAYING' || this.state === 'PAUSED') this.togglePause(); 
			else if (this.state === 'DIFF_SELECT') this.switchState('MENU');
		}
		if (key === 'R' && (this.state === 'PAUSED' || this.state === 'END' || this.state === 'PLAYING')) {
			this.restart();
		}
		if (key === 'Q' && (this.state === 'PAUSED' || this.state === 'END')) {
			this.quit();
		}
	}

	switchState(newState) {
		this.state = newState;
		const ids = ['start-screen', 'game-over-screen', 'game-controls', 'song-select-section', 'difficulty-select-section', 'paused-indicator', 'countdown-overlay'];
		ids.forEach(id => document.getElementById(id).classList.add('hidden'));

		switch (newState) {
			case 'MENU':
				document.getElementById('start-screen').classList.remove('hidden');
				document.getElementById('song-select-section').classList.remove('hidden');
				break;
			case 'DIFF_SELECT':
				document.getElementById('start-screen').classList.remove('hidden');
				document.getElementById('difficulty-select-section').classList.remove('hidden');
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
		this.switchState('DIFF_SELECT');
	}

	startCountdown(difficulty) {
		this.currentDifficulty = difficulty;
		this.switchState('COUNTDOWN');
		this.audio.init(); 
		
		this.score = 0; this.combo = 0; this.maxCombo = 0;
		this.stats = { perfect: 0, good: 0, miss: 0 };
		this.notes = []; this.particles = [];
		this.keyState.fill(false);
		this.updateUI();
		document.getElementById('progress-bar').style.width = '0%';
		
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
		this.songSequence = seq.sort((a,b) => a.t - b.t);
		this.nextNoteIndex = 0;
		
		this.backingSequence = backingSeq.sort((a,b) => a.t - b.t);
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
		this.startCountdown(this.currentDifficulty);
	}

	quit() {
		this.switchState('MENU');
	}

	togglePause() {
		if (this.state === 'PLAYING') {
			this.state = 'PAUSED';
			this.pauseTime = performance.now();
			this.switchState('PAUSED');
			document.getElementById('pause-btn').innerHTML = '<span class="c-icon">►</span><span class="c-label">Resume</span>';
		} else if (this.state === 'PAUSED') {
			this.state = 'PLAYING';
			this.totalPauseDuration += (performance.now() - this.pauseTime);
			this.switchState('PLAYING');
			document.getElementById('paused-indicator').style.display = 'none';
			document.getElementById('pause-btn').innerHTML = '<span class="c-icon">❚❚</span><span class="c-label">Pause</span>';
			this.loop();
		}
	}

	spawnNotes(currentTime) {
		const diffSettings = DIFFICULTY_SETTINGS[this.currentDifficulty];
		const speed = diffSettings.speed;
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
						this.showFeedback("Good", "#00bfa5");
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
			this.showFeedback(text, "#b0bec5");
			this.audio.playMissSound();
			this.updateUI();
		}
	}

	spawnParticles(x, y, type) {
		for(let i=0; i<10; i++) this.particles.push(new Particle(x, y, type));
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
		document.getElementById('final-diff').textContent = DIFFICULTY_SETTINGS[this.currentDifficulty].label;
		document.getElementById('stat-perfect').textContent = this.stats.perfect;
		document.getElementById('stat-good').textContent = this.stats.good;
		document.getElementById('stat-miss').textContent = this.stats.miss;
		document.getElementById('final-score').textContent = Math.floor(this.score);
		document.getElementById('max-combo').textContent = this.maxCombo;
		
		const key = `score_${this.currentSong.id}_${this.currentDifficulty}`;
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
		const dur = DIFFICULTY_SETTINGS[this.currentDifficulty].duration * 1000;
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
		const diff = DIFFICULTY_SETTINGS[this.currentDifficulty];
		for(let i=0; i<CONFIG.lanes; i++) {
			const x = this.laneCenters[i];
			const pressed = this.keyState[i];
			this.ctx.strokeStyle = pressed ? '#a7ffeb' : 'rgba(255,255,255,0.1)';
			this.ctx.lineWidth = pressed ? 3 : 2;
			this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, 800); this.ctx.stroke();
			
			this.ctx.beginPath(); this.ctx.arc(x, CONFIG.hitZoneY, 28, 0, Math.PI*2);
			this.ctx.fillStyle = pressed ? 'rgba(0,191,165,0.3)' : 'rgba(0,0,0,0.3)';
			this.ctx.fill(); this.ctx.stroke();
			
			this.ctx.fillStyle = pressed ? '#fff' : '#8d6e63';
			this.ctx.font = "20px serif"; this.ctx.textAlign = "center";
			this.ctx.fillText(CONFIG.keys[i].toUpperCase(), x, CONFIG.hitZoneY+5);
		}
		
		// Draw Bridge
		const grad = this.ctx.createLinearGradient(0, CONFIG.hitZoneY-5, 0, CONFIG.hitZoneY+5);
		grad.addColorStop(0, "#5d4037"); grad.addColorStop(0.5, "#d4af37"); grad.addColorStop(1, "#3e2723");
		this.ctx.fillStyle = grad; this.ctx.fillRect(0, CONFIG.hitZoneY-4, 800, 8);

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
				n.update(diff.speed);
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