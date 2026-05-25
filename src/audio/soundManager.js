export class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicIntervalId = null;
        this.musicTimeoutId = null;
        this.musicFilter = null;
        this.musicStep = 0;
    }

    init() {
        if (this.ctx) return;
        // Khởi tạo AudioContext khi người dùng tương tác
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Khởi tạo bộ lọc thông thấp (lowpass) toàn cục cho âm nhạc nền
        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
        this.musicFilter.connect(this.ctx.destination);
    }

    toggleMute() {
        this.muted = !this.muted;
        const btn = document.getElementById('btn-audio-toggle');
        if (btn) {
            btn.textContent = this.muted ? '🔇' : '🔊';
        }
        if (this.muted) {
            this.stopMusic();
        } else if (window.gameEngine && window.gameEngine.state === 'PLAYING') {
            this.startMusic();
        }
        return this.muted;
    }

    startMusic() {
        if (this.muted) return;
        this.init();
        if (this.musicTimeoutId) return;

        this.musicStep = 0;

        const playNext = () => {
            if (this.muted || !this.ctx) {
                this.musicTimeoutId = null;
                return;
            }
            // Đảm bảo chỉ phát nhạc khi game đang chạy hoặc trong màn nâng cấp
            if (window.gameEngine && (window.gameEngine.state === 'PLAYING' || window.gameEngine.state === 'UPGRADE' || window.gameEngine.state === 'SUPER_UPGRADE')) {
                this.playMusicStep();
                
                // Nhịp độ động: mặc định 130ms. Đẩy tempo lên 1.25x khi chiến đấu với Boss (cắt nhỏ thời gian nhịp còn 104ms)
                let stepTime = 130;
                const hasBoss = window.gameEngine.enemies && window.gameEngine.enemies.some(e => e.type === 'boss' && e.hp > 0);
                if (hasBoss || (window.gameEngine.activeBoss && window.gameEngine.activeBoss.hp > 0)) {
                    stepTime = Math.floor(130 / 1.25);
                }
                
                this.musicTimeoutId = setTimeout(playNext, stepTime);
            } else {
                this.stopMusic();
            }
        };

        playNext();
    }

    stopMusic() {
        if (this.musicTimeoutId) {
            clearTimeout(this.musicTimeoutId);
            this.musicTimeoutId = null;
        }
        if (this.musicIntervalId) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
        }
    }

    playMusicStep() {
        const now = this.ctx.currentTime;
        
        // Cập nhật tần số bộ lọc nhạc theo HP của người chơi (muffled khi máu dưới 30%)
        if (window.gameEngine && window.gameEngine.player) {
            const player = window.gameEngine.player;
            const hpRatio = player.hp / player.maxHp;
            const targetFreq = hpRatio < 0.3 ? 380 : 20000;
            if (this.musicFilter) {
                this.musicFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
            }
        } else if (this.musicFilter) {
            this.musicFilter.frequency.setValueAtTime(20000, now);
        }
        
        // 1. Kick drum mỗi 4 nốt (0, 4, 8, 12)
        if (this.musicStep % 4 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
            
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
            osc.connect(gain);
            gain.connect(this.musicFilter || this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        }
        
        // 2. Off-beat hi-hat ở nhịp 2, 6, 10, 14
        if (this.musicStep % 4 === 2) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(8000, now);
            
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            
            osc.connect(gain);
            gain.connect(this.musicFilter || this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.03);
        }

        // 3. Cyber Bass Progression chạy mỗi 2 nốt (0, 2, 4, 6...)
        if (this.musicStep % 2 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // Hợp âm vòng lặp: 8 bước G1 (49Hz), 4 bước Bb1 (58Hz), 4 bước C2 (65Hz)
            let freq = 49.00; // G1
            if (this.musicStep >= 8 && this.musicStep < 12) {
                freq = 58.27; // Bb1
            } else if (this.musicStep >= 12) {
                freq = 65.41; // C2
            }
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            
            // Sử dụng bộ lọc thông thấp (lowpass) để tiếng bass trầm ấm
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(170, now);
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicFilter || this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.12);
        }

        this.musicStep = (this.musicStep + 1) % 16;
    }

    playShoot() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        // Tần số giảm nhanh tạo tiếng súng laser
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playExplosion() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        
        // Thêm chút biến dạng bằng cách sử dụng bộ lọc thông thấp giảm dần tần số
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playPickup() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659, now + 0.07); // Note 2 cao hơn
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(now + 0.15);
    }

    playLevelUp() {
        if (this.muted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // Hợp âm Đô trưởng (C4-E4-G4-C5)
        
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            
            gain.gain.setValueAtTime(0, now + index * 0.08);
            gain.gain.linearRampToValueAtTime(0.1, now + index * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.3);
        });
    }

    playHit() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playPowerup() {
        if (this.muted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        // Chuỗi nốt nhạc tăng dần
        const freqs = [300, 400, 500, 600, 800];
        
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            
            gain.gain.setValueAtTime(0, now + idx * 0.05);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.05 + 0.15);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.15);
        });
    }

    playDash() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playShockwave() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.45);
        
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.Q.value = 10;
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
    }

    playSwordSlash() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playHammerSmash() {
        if (this.muted || !this.ctx) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.35);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.35);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }
}

export const sounds = new SoundManager();
