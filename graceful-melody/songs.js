/**
 * Graceful Melody - Song Data
 * Note: Stored as JS Object to allow local file execution without CORS errors
 */
const SONG_DATA = {
	"songs": [
		{
			"id": "molihua",
			"title": "Mo Li Hua",
			"subtitle": "Jasmine Flower",
			"description": "A gentle and elegant folk melody.",
			"duration": 90,
			"difficulty_multiplier": 1.0,
			"backing": [
				// Simple harmonic bed (C-G, A-E patterns)
				{ "t": 0, "chord": [0, 3] }, { "t": 4000, "chord": [0, 2, 4] },
				{ "t": 8000, "chord": [1, 3] }, { "t": 12000, "chord": [0, 3, 5] },
				{ "t": 16000, "chord": [2, 4] }, { "t": 20000, "chord": [0, 3] },
				{ "t": 24000, "chord": [1, 4] }, { "t": 28000, "chord": [0, 2, 5] },
				// Loop for duration
				{ "t": 32000, "chord": [0, 3] }, { "t": 36000, "chord": [0, 2, 4] },
				{ "t": 40000, "chord": [1, 3] }, { "t": 44000, "chord": [0, 3, 5] },
				{ "t": 48000, "chord": [2, 4] }, { "t": 52000, "chord": [0, 3] },
				{ "t": 56000, "chord": [1, 4] }, { "t": 60000, "chord": [0, 2, 5] },
				{ "t": 64000, "chord": [0, 3] }, { "t": 68000, "chord": [0, 2, 4] },
				{ "t": 72000, "chord": [1, 3] }, { "t": 76000, "chord": [0, 3, 5] },
				{ "t": 80000, "chord": [2, 4] }, { "t": 84000, "chord": [0, 3] }
			],
			"notes": [
				{ "t": 1000, "l": 2, "type": "tap" }, { "t": 1500, "l": 2, "type": "tap" }, { "t": 2000, "l": 2, "type": "tap" },
				{ "t": 2500, "l": 3, "type": "tap" }, { "t": 3000, "l": 4, "type": "tap" }, { "t": 3500, "l": 5, "type": "tap" },
				{ "t": 4000, "l": 5, "type": "hold", "len": 400 }, { "t": 5000, "l": 4, "type": "tap" },
				{ "t": 5500, "l": 3, "type": "tap" }, { "t": 6000, "l": 4, "type": "tap" }, { "t": 6500, "l": 3, "type": "tap" },
				{ "t": 7000, "l": 2, "type": "tap" }, { "t": 7500, "l": 3, "type": "tap" }, { "t": 8000, "l": 1, "type": "tap" },
				{ "t": 8500, "l": 2, "type": "hold", "len": 500 }, { "t": 10000, "l": 2, "type": "tap" },
				{ "t": 10500, "l": 2, "type": "tap" }, { "t": 11000, "l": 2, "type": "tap" }, { "t": 11500, "l": 3, "type": "tap" },
				{ "t": 12000, "l": 4, "type": "tap" }, { "t": 12500, "l": 5, "type": "tap" }, { "t": 13000, "l": 5, "type": "hold", "len": 400 },
				{ "t": 14500, "l": 3, "type": "tap" }, { "t": 15000, "l": 3, "type": "tap" }, { "t": 15500, "l": 4, "type": "tap" },
				{ "t": 16000, "l": 5, "type": "tap" }, { "t": 16500, "l": 4, "type": "tap" }, { "t": 17000, "l": 3, "type": "tap" },
				{ "t": 17500, "l": 2, "type": "tap" }, { "t": 18000, "l": 3, "type": "tap" }, { "t": 18500, "l": 1, "type": "hold", "len": 600 },
				{ "t": 20000, "l": 3, "type": "tap" }, { "t": 20500, "l": 2, "type": "tap" }, { "t": 21000, "l": 1, "type": "tap" },
				{ "t": 21500, "l": 0, "type": "tap" }, { "t": 22000, "l": 1, "type": "tap" }, { "t": 22500, "l": 2, "type": "hold", "len": 400 },
				{ "t": 24000, "l": 3, "type": "tap" }, { "t": 24500, "l": 4, "type": "tap" }, { "t": 25000, "l": 5, "type": "hold", "len": 500 },
				{ "t": 26500, "l": 4, "type": "tap" }, { "t": 27000, "l": 3, "type": "tap" }, { "t": 27500, "l": 1, "type": "tap" },
				{ "t": 28000, "l": 2, "type": "tap" }, { "t": 28500, "l": 0, "type": "hold", "len": 800 },
				// Repeats to fill time...
				{ "t": 31000, "l": 2, "type": "tap" }, { "t": 31500, "l": 2, "type": "tap" }, { "t": 32000, "l": 2, "type": "tap" },
				{ "t": 32500, "l": 3, "type": "tap" }, { "t": 33000, "l": 4, "type": "hold", "len": 400 },
				{ "t": 35000, "l": 5, "type": "tap" }, { "t": 35500, "l": 4, "type": "tap" }, { "t": 36000, "l": 3, "type": "tap" },
				{ "t": 36500, "l": 1, "type": "tap" }, { "t": 37000, "l": 0, "type": "hold", "len": 1000 }
			]
		},
		{
			"id": "general",
			"title": "General's Orders",
			"subtitle": "Jiang Jun Ling",
			"description": "A forceful, rhythmic martial tune.",
			"duration": 90,
			"difficulty_multiplier": 1.2,
			"backing": [
				{ "t": 0, "chord": [0, 0, 3] }, { "t": 2000, "chord": [0, 3] },
				{ "t": 4000, "chord": [3, 5] }, { "t": 6000, "chord": [0, 2] },
				{ "t": 8000, "chord": [0, 0, 4] }, { "t": 10000, "chord": [1, 3, 5] },
				{ "t": 12000, "chord": [0, 2] }, { "t": 14000, "chord": [3, 5] },
				{ "t": 16000, "chord": [0, 0, 3] }, { "t": 18000, "chord": [0, 3] },
				{ "t": 20000, "chord": [3, 5] }, { "t": 22000, "chord": [0, 2] },
				{ "t": 24000, "chord": [0, 0, 4] }, { "t": 26000, "chord": [1, 3, 5] },
				{ "t": 28000, "chord": [0, 2] }, { "t": 30000, "chord": [3, 5] }
			],
			"notes": [
				{ "t": 1000, "l": 0, "type": "tap" }, { "t": 1200, "l": 0, "type": "tap" }, { "t": 1400, "l": 0, "type": "tap" },
				{ "t": 1800, "l": 2, "type": "tap" }, { "t": 2200, "l": 1, "type": "tap" }, { "t": 2600, "l": 0, "type": "hold", "len": 300 },
				{ "t": 3500, "l": 3, "type": "tap" }, { "t": 3700, "l": 3, "type": "tap" }, { "t": 3900, "l": 3, "type": "tap" },
				{ "t": 4300, "l": 5, "type": "tap" }, { "t": 4700, "l": 4, "type": "tap" }, { "t": 5100, "l": 3, "type": "hold", "len": 300 },
				{ "t": 6000, "l": 0, "type": "tap" }, { "t": 6200, "l": 5, "type": "tap" }, { "t": 6400, "l": 0, "type": "tap" },
				{ "t": 6600, "l": 5, "type": "tap" }, { "t": 7000, "l": 2, "type": "tap" }, { "t": 7200, "l": 3, "type": "tap" },
				{ "t": 7400, "l": 2, "type": "tap" }, { "t": 7600, "l": 1, "type": "tap" }, { "t": 8000, "l": 0, "type": "hold", "len": 600 },
				{ "t": 9500, "l": 1, "type": "tap" }, { "t": 9700, "l": 2, "type": "tap" }, { "t": 9900, "l": 3, "type": "tap" },
				{ "t": 10100, "l": 4, "type": "tap" }, { "t": 10300, "l": 5, "type": "tap" }, { "t": 10500, "l": 4, "type": "tap" },
				{ "t": 10700, "l": 3, "type": "tap" }, { "t": 10900, "l": 2, "type": "tap" }, { "t": 11100, "l": 1, "type": "hold", "len": 400 },
				{ "t": 12000, "l": 0, "type": "tap" }, { "t": 12200, "l": 1, "type": "tap" }, { "t": 12400, "l": 2, "type": "tap" },
				{ "t": 12600, "l": 3, "type": "tap" }, { "t": 12800, "l": 4, "type": "tap" }, { "t": 13000, "l": 5, "type": "tap" },
				{ "t": 13500, "l": 5, "type": "hold", "len": 800 }
			]
		},
		{
			"id": "gaoshan",
			"title": "Gao Shan Liu Shui",
			"subtitle": "High Mountain Flowing Water",
			"description": "Legendary zither piece about friendship and nature.",
			"duration": 90,
			"difficulty_multiplier": 1.1,
			"backing": [
				{ "t": 500, "chord": [0, 4] }, { "t": 4500, "chord": [1, 5] },
				{ "t": 8500, "chord": [0, 2, 4] }, { "t": 12500, "chord": [1, 3, 5] },
				{ "t": 16500, "chord": [0, 3] }, { "t": 20500, "chord": [2, 4] }
			],
			"notes": [
				{ "t": 1000, "l": 5, "type": "tap" }, { "t": 1200, "l": 4, "type": "tap" }, { "t": 1400, "l": 3, "type": "tap" },
				{ "t": 1600, "l": 2, "type": "tap" }, { "t": 1800, "l": 1, "type": "tap" }, { "t": 2000, "l": 0, "type": "hold", "len": 400 },
				{ "t": 3000, "l": 0, "type": "tap" }, { "t": 3200, "l": 1, "type": "tap" }, { "t": 3400, "l": 2, "type": "tap" },
				{ "t": 3600, "l": 3, "type": "tap" }, { "t": 4500, "l": 5, "type": "tap" }, { "t": 4800, "l": 3, "type": "tap" },
				{ "t": 5100, "l": 5, "type": "tap" }, { "t": 5400, "l": 2, "type": "tap" }, { "t": 6000, "l": 1, "type": "hold", "len": 600 },
				{ "t": 7000, "l": 2, "type": "tap" }, { "t": 7200, "l": 4, "type": "tap" }, { "t": 7400, "l": 3, "type": "tap" },
				{ "t": 7600, "l": 5, "type": "tap" }, { "t": 8000, "l": 4, "type": "hold", "len": 400 },
				{ "t": 9000, "l": 0, "type": "tap" }, { "t": 9150, "l": 1, "type": "tap" }, { "t": 9300, "l": 2, "type": "tap" },
				{ "t": 9450, "l": 3, "type": "tap" }, { "t": 9600, "l": 4, "type": "tap" }, { "t": 9750, "l": 5, "type": "tap" },
				{ "t": 10500, "l": 3, "type": "hold", "len": 800 },
				{ "t": 12000, "l": 5, "type": "tap" }, { "t": 12300, "l": 2, "type": "tap" }, { "t": 12600, "l": 4, "type": "tap" },
				{ "t": 12900, "l": 1, "type": "tap" }, { "t": 13500, "l": 0, "type": "hold", "len": 1000 }
			]
		},
		{
			"id": "pingsha",
			"title": "Ping Sha Luo Yan",
			"subtitle": "Wild Geese on Sandbank",
			"description": "Atmospheric melody with long resonating notes.",
			"duration": 90,
			"difficulty_multiplier": 0.9,
			"backing": [
				{ "t": 0, "chord": [0, 4] }, { "t": 6000, "chord": [1, 5] },
				{ "t": 12000, "chord": [2, 4] }, { "t": 18000, "chord": [0, 3] },
				{ "t": 24000, "chord": [1, 3, 5] }, { "t": 30000, "chord": [0, 2, 4] }
			],
			"notes": [
				{ "t": 1000, "l": 2, "type": "hold", "len": 800 }, { "t": 2500, "l": 4, "type": "tap" },
				{ "t": 3000, "l": 3, "type": "tap" }, { "t": 3500, "l": 2, "type": "tap" },
				{ "t": 4000, "l": 1, "type": "hold", "len": 600 }, { "t": 5500, "l": 0, "type": "tap" },
				{ "t": 6000, "l": 1, "type": "tap" }, { "t": 6500, "l": 2, "type": "tap" },
				{ "t": 7000, "l": 3, "type": "hold", "len": 500 }, { "t": 8500, "l": 5, "type": "tap" },
				{ "t": 9000, "l": 4, "type": "tap" }, { "t": 9500, "l": 2, "type": "tap" },
				{ "t": 10000, "l": 4, "type": "hold", "len": 800 }, { "t": 11500, "l": 3, "type": "tap" },
				{ "t": 12000, "l": 1, "type": "tap" }, { "t": 12500, "l": 2, "type": "tap" },
				{ "t": 13000, "l": 0, "type": "hold", "len": 1000 }, { "t": 15000, "l": 2, "type": "tap" },
				{ "t": 15300, "l": 3, "type": "tap" }, { "t": 15600, "l": 4, "type": "tap" },
				{ "t": 16000, "l": 5, "type": "hold", "len": 600 }
			]
		}
	]
};