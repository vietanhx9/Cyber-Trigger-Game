// --- CYBER TRIGGER - GAME LOGIC ---

// 1. SOUND MANAGER (Web Audio API Synthesizer)
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicIntervalId = null;
        this.musicStep = 0;
    }

    init() {
        if (this.ctx) return;
        // Khởi tạo AudioContext khi người dùng tương tác
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        if (this.musicIntervalId) return;

        this.musicStep = 0;
        const stepTime = 130; // 130ms mỗi nhịp tương ứng khoảng 115 BPM

        this.musicIntervalId = setInterval(() => {
            if (this.muted || !this.ctx) return;
            // Đảm bảo chỉ phát nhạc khi game đang chạy
            if (window.gameEngine && window.gameEngine.state === 'PLAYING') {
                this.playMusicStep();
            } else {
                this.stopMusic();
            }
        }, stepTime);
    }

    stopMusic() {
        if (this.musicIntervalId) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
        }
    }

    playMusicStep() {
        const now = this.ctx.currentTime;
        
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
            gain.connect(this.ctx.destination);
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
            gain.connect(this.ctx.destination);
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
            gain.connect(this.ctx.destination);
            
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

const sounds = new SoundManager();

// --- 2. VECTOR HELPER CLASS ---
class Vector {
    static dist(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }
    
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
}

// --- 3. ENTITY CLASSES ---

// Player Entity
class Player {
    constructor(x, y, role = 'fighter') {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.role = role;
        
        // Cấu hình chỉ số theo vai trò (RPG Classes)
        switch (role) {
            case 'fighter':
                this.maxHp = 150;
                this.baseSpeed = 3.6;
                this.damage = 22;
                this.fireRate = 380;
                this.color = '#fffb00'; // Vàng neon (neon-yellow)
                this.dashCooldownMax = 2500;
                this.shockwaveCooldownMax = 10000;
                break;
            case 'mage':
                this.maxHp = 80;
                this.baseSpeed = 3.8;
                this.damage = 16;
                this.fireRate = 320;
                this.color = '#b026ff'; // Tím neon (neon-purple)
                this.dashCooldownMax = 2200;
                this.shockwaveCooldownMax = 5000; // Cooldown EMP giảm nửa
                break;
            case 'ranger':
                this.maxHp = 90;
                this.baseSpeed = 3.4;
                this.damage = 10;
                this.fireRate = 220; // Tốc độ bắn rất nhanh
                this.color = '#00f0ff'; // Cyan neon (neon-blue)
                this.dashCooldownMax = 2000;
                this.shockwaveCooldownMax = 10000;
                break;
            case 'assassin':
                this.maxHp = 70;
                this.baseSpeed = 5.2; // Tốc độ di chuyển rất nhanh
                this.damage = 18;
                this.fireRate = 280;
                this.color = '#ff007f'; // Hồng neon (neon-pink)
                this.dashCooldownMax = 1000; // Lướt liên hồi (cooldown 1s)
                this.shockwaveCooldownMax = 12000;
                break;
            default:
                this.maxHp = 100;
                this.baseSpeed = 4;
                this.damage = 15;
                this.fireRate = 300;
                this.color = '#00f0ff';
                this.dashCooldownMax = 2000;
                this.shockwaveCooldownMax = 10000;
                break;
        }

        this.hp = this.maxHp;
        this.speed = this.baseSpeed;
        
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 10; // XP để lên level 2
        
        this.lastShotTime = 0;
        
        this.angle = 0;
        this.magnetRadius = 100; // Bán kính hút vật phẩm
        
        // Cooldowns kỹ năng active
        this.dashCooldown = 0;
        this.shockwaveCooldown = 0;
        
        // Bóng mờ (Ghost trails) phục vụ vẽ Dash né đòn
        this.ghostTrails = [];
        
        // Cấp độ các Nâng cấp (Lưu lại để hiển thị nếu cần)
        this.upgrades = {
            doubleShot: 0,
            maxHp: 0,
            fireRate: 0,
            speed: 0,
            damage: 0,
            magnet: 0,
            hammer360: 0,
            giantFireball: 0,
            dualSlash: 0
        };

        // Trạng thái Power-up tạm thời
        this.powerups = {
            doubleShot: 0, // Thời gian còn lại (ms)
            shield: 0,
            speedBoost: 0
        };

        this.iframe = 0; // Thời gian bất tử sau khi trúng đạn/quái (ms)
        this.color = this.color; // Đồng bộ màu sắc đã chọn

        // Cấp độ vũ khí phụ
        this.subWeapons = {
            orbitingShield: 0,
            homingMissile: 0,
            laserDrone: 0
        };

        // Các biến điều khiển thời gian & trạng thái vũ khí phụ
        this.shieldAngle = 0;
        this.missileTimer = 0;
        this.droneTimer = 0;
        this.droneX = x;
        this.droneY = y;
    }

    update(keys, mouse, canvasWidth, canvasHeight, camera, deltaTime) {
        // Cập nhật thời gian Powerups
        if (this.powerups.doubleShot > 0) this.powerups.doubleShot -= deltaTime;
        if (this.powerups.shield > 0) this.powerups.shield -= deltaTime;
        if (this.powerups.speedBoost > 0) this.powerups.speedBoost -= deltaTime;
        if (this.iframe > 0) this.iframe -= deltaTime;

        // Cập nhật hồi chiêu kỹ năng
        if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
        if (this.shockwaveCooldown > 0) this.shockwaveCooldown -= deltaTime;

        // Xử lý các bóng mờ di chuyển
        if (this.ghostTrails.length > 0) {
            this.ghostTrails.forEach(gt => gt.alpha -= deltaTime / 200); // Mờ dần trong 200ms
            this.ghostTrails = this.ghostTrails.filter(gt => gt.alpha > 0);
        }

        // Tính tốc độ hiện tại (có tính Speed Boost powerup)
        let currentSpeed = this.speed;
        if (this.powerups.speedBoost > 0) {
            currentSpeed *= 1.5;
        }

        // Giảm 30% tốc độ di chuyển khi có động đất đang hoạt động
        if (window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'earthquake') {
            currentSpeed *= 0.7;
        }

        // Di chuyển dựa trên phím nhấn
        let dx = 0;
        let dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Chuẩn hóa vector di chuyển chéo để không bị nhanh hơn
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        this.x += dx * currentSpeed;
        this.y += dy * currentSpeed;

        // Giới hạn trong bản đồ thế giới (World size = 3000x3000px)
        const margin = this.radius + 10;
        this.x = Math.max(margin, Math.min(3000 - margin, this.x));
        this.y = Math.max(margin, Math.min(3000 - margin, this.y));

        // Nhắm bắn xoay theo chuột
        // Lấy tọa độ chuột trên canvas và dịch chuyển tương ứng với camera để ra tọa độ thế giới
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        this.angle = Vector.angle(this.x, this.y, worldMouseX, worldMouseY);
    }

    takeDamage(amount) {
        if (this.iframe > 0) return false;
        
        // Nếu có khiên chắn, khiên sẽ đỡ đòn và giảm thời gian khiên đi
        if (this.powerups.shield > 0) {
            this.powerups.shield = 0; // Hủy khiên sau 1 lần đỡ đòn
            this.iframe = 300; // Cho 0.3 giây bất tử
            sounds.playHit();
            return false;
        }

        this.hp -= amount;
        this.iframe = 500; // 0.5s bất tử sau khi trúng sát thương
        sounds.playHit();
        
        if (this.hp < 0) this.hp = 0;
        return true; // Bị trúng sát thương thật
    }

    addXp(amount) {
        this.xp += amount;
        let leveledUp = false;
        
        while (this.xp >= this.xpNeeded) {
            this.xp -= this.xpNeeded;
            this.level++;
            // Tăng lượng XP yêu cầu cho màn tiếp theo một cách phi tuyến tính
            this.xpNeeded = Math.floor(this.xpNeeded * 1.4) + 5;
            leveledUp = true;
        }
        
        return leveledUp;
    }

    draw(ctx, camera) {
        // Vẽ các bóng mờ Dash (Ghost Trails) trước
        this.ghostTrails.forEach(gt => {
            const sX = gt.x - camera.x;
            const sY = gt.y - camera.y;
            ctx.save();
            ctx.translate(sX, sY);
            ctx.rotate(gt.angle);
            
            // 1. Quầng sáng bóng mờ (Outer Glow)
            ctx.globalAlpha = gt.alpha * 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, -this.radius * 0.8);
            ctx.lineTo(-this.radius * 0.5, 0);
            ctx.lineTo(-this.radius, this.radius * 0.8);
            ctx.closePath();
            ctx.stroke();

            // 2. Viền bóng mờ chính (Solid Core)
            ctx.globalAlpha = gt.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, -this.radius * 0.8);
            ctx.lineTo(-this.radius * 0.5, 0);
            ctx.lineTo(-this.radius, this.radius * 0.8);
            ctx.closePath();
            ctx.stroke();
            
            ctx.restore();
        });

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Hiệu ứng phát sáng neon cho nhân vật (Double-stroke outer glow)
        // 1. Quầng sáng phi thuyền (Outer Glow)
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius * 0.8);
        ctx.closePath();
        ctx.stroke();

        // 2. Thân phi thuyền chính (Solid Core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); // Đầu phi thuyền hướng sang phải (0 rad)
        ctx.lineTo(-this.radius, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Động cơ phản lực neon (vẽ lửa nhỏ phía sau - Double draw)
        // 1. Quầng sáng đuôi (Outer Glow)
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(-this.radius, 0, 10 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Lửa chính (Solid Core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ff007f'; // Lửa hồng neon
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.6, -this.radius * 0.3);
        ctx.lineTo(-this.radius - 10 - Math.random() * 8, 0);
        ctx.lineTo(-this.radius * 0.6, this.radius * 0.3);
        ctx.closePath();
        ctx.fill();

        // Vẽ Vũ khí tương ứng của từng vai trò trực tiếp lên phi thuyền
        const role = this.role || 'fighter';
        if (role === 'assassin') {
            // Sát thủ: Kiếm năng lượng hồng neon
            // 1. Quầng sáng kiếm (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.4);
            ctx.lineTo(this.radius * 1.6, -this.radius * 0.8);
            ctx.stroke();

            // 2. Kiếm chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#ffffff'; // lõi trắng siêu sáng
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.4);
            ctx.lineTo(this.radius * 1.6, -this.radius * 0.8); // Kiếm vươn dài nhọn
            ctx.stroke();
            
            // Tay cầm kiếm trắng sáng
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.4, 3.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (role === 'fighter') {
            // Đấu sĩ: Búa vàng tạ khủng
            // 1. Quầng sáng búa (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#fffb00';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.radius * 1.1, 0);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.rect(this.radius * 1.1, -12, 7, 24);
            ctx.stroke();

            // 2. Búa chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#fffb00';
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            
            // Cán búa
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.radius * 1.1, 0);
            ctx.stroke();
            
            // Đầu búa
            ctx.fillStyle = '#fffb00';
            ctx.beginPath();
            ctx.rect(this.radius * 1.1, -12, 7, 24);
            ctx.fill();
            ctx.stroke();
        } else if (role === 'mage') {
            // Pháp sư: Cầu ma pháp tím phát sáng
            // 1. Quầng sáng cầu phép (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#b026ff';
            ctx.beginPath();
            ctx.arc(this.radius * 0.4, 0, 14, 0, Math.PI * 2);
            ctx.fill();

            // 2. Cầu chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#b026ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.radius * 0.4, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (role === 'ranger') {
            // Xạ thủ: Nòng súng kép dài màu cyan
            // 1. Quầng sáng nòng súng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.2, -this.radius * 0.4);
            ctx.lineTo(this.radius * 1.4, -this.radius * 0.4);
            ctx.moveTo(-this.radius * 0.2, this.radius * 0.4);
            ctx.lineTo(this.radius * 1.4, this.radius * 0.4);
            ctx.stroke();

            // 2. Nòng súng chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            
            // Nòng 1
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.2, -this.radius * 0.4);
            ctx.lineTo(this.radius * 1.4, -this.radius * 0.4);
            ctx.stroke();
            
            // Nòng 2
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.2, this.radius * 0.4);
            ctx.lineTo(this.radius * 1.4, this.radius * 0.4);
            ctx.stroke();
        }

        ctx.restore();

        // Vẽ Khiên Bảo Vệ nếu có active
        if (this.powerups.shield > 0) {
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // 1. Quầng sáng khiên (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#fffb00';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.7, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Viền khiên chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.7, 0, Math.PI * 2);
            ctx.stroke();
            
            // Vẽ các vân khiên xoay tròn nhẹ
            ctx.rotate(Date.now() * 0.002);
            ctx.strokeStyle = 'rgba(255, 251, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI, false);
            ctx.stroke();
            ctx.restore();
        }

        // Vẽ hiệu ứng bất tử nhấp nháy
        if (this.iframe > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
            ctx.restore();
        }
    }
}

// Enemy Entity
class Enemy {
    constructor(x, y, level, type = null) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.shootTimer = Math.random() * 2000; // Timer ngẫu nhiên ban đầu cho quái bắn

        // Xác định loại quái vật
        if (!type) {
            const r = Math.random();
            if (level < 3) {
                this.type = 'runner';
            } else if (level < 5) {
                this.type = r < 0.7 ? 'runner' : (r < 0.9 ? 'tanker' : 'shooter');
            } else {
                // Từ level 5 trở đi xuất hiện Sniper
                if (r < 0.4) this.type = 'runner';
                else if (r < 0.65) this.type = 'shooter';
                else if (r < 0.85) this.type = 'tanker';
                else this.type = 'sniper';
            }
        } else {
            this.type = type;
        }

        // Cài đặt chỉ số cho từng loại quái
        // Chỉ số quái tăng dần theo level game để duy trì độ thử thách
        const mult = 1 + (level - 1) * 0.15;

        switch (this.type) {
            case 'tanker':
                this.radius = 32;
                this.speed = 1.3;
                this.hp = Math.floor(70 * mult);
                this.maxHp = this.hp;
                this.damage = 25;
                this.xpValue = 5;
                this.color = '#b026ff'; // Neon Purple
                break;
            case 'mine':
                this.radius = 12;
                this.speed = 0;
                this.hp = 1;
                this.maxHp = 1;
                this.damage = 20;
                this.xpValue = 0;
                this.color = '#ff9f00'; // Neon Orange for mine flashing
                break;
            case 'shooter':
                this.radius = 18;
                this.speed = 2.0;
                this.hp = Math.floor(35 * mult);
                this.maxHp = this.hp;
                this.damage = 10;
                this.xpValue = 4;
                this.color = '#ff9f00'; // Neon Orange
                break;
            case 'sniper':
                this.radius = 16;
                this.speed = 1.5;
                this.hp = Math.floor(45 * mult);
                this.maxHp = this.hp;
                this.damage = 22;
                this.xpValue = 5;
                this.color = '#ff00ff'; // Neon Magenta
                this.sniperAimTimer = 0;
                break;
            case 'runner':
            default:
                this.radius = 14;
                this.speed = 3.0;
                this.hp = Math.floor(20 * mult);
                this.maxHp = this.hp;
                this.damage = 12;
                this.xpValue = 1;
                this.color = '#ff007f'; // Neon Pink (Runner mặc định)
                break;
        }
    }

    update(player, gameBullets, deltaTime) {
        // Giảm lực đẩy lùi (Knockback) theo thời gian
        this.x += this.knockbackX;
        this.y += this.knockbackY;
        this.knockbackX *= 0.8;
        this.knockbackY *= 0.8;

        if (this.type === 'mine') {
            return;
        }

        this.angle = Vector.angle(this.x, this.y, player.x, player.y);
        const distToPlayer = Vector.dist(this.x, this.y, player.x, player.y);

        // Logic di chuyển cho từng loại quái vật
        if (this.type === 'shooter') {
            // Giữ khoảng cách tầm 250px với người chơi
            if (distToPlayer > 280) {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
            } else if (distToPlayer < 200) {
                this.x -= Math.cos(this.angle) * this.speed;
                this.y -= Math.sin(this.angle) * this.speed;
            } else {
                // Đi vòng quanh nhẹ nhàng
                const tangentAngle = this.angle + Math.PI / 2;
                this.x += Math.cos(tangentAngle) * (this.speed * 0.5);
                this.y += Math.sin(tangentAngle) * (this.speed * 0.5);
            }

            // Tự bắn đạn vào người chơi mỗi 2 giây
            this.shootTimer += deltaTime;
            if (this.shootTimer >= 2000) {
                this.shootTimer = 0;
                this.shootAtPlayer(player, gameBullets);
            }
        } else if (this.type === 'sniper') {
            // Sniper di chuyển giữ khoảng cách 300-450px với player
            if (distToPlayer > 450) {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.sniperAimTimer = Math.max(0, this.sniperAimTimer - deltaTime * 0.5); // Giảm nhắm khi di chuyển
            } else if (distToPlayer < 300) {
                this.x -= Math.cos(this.angle) * this.speed;
                this.y -= Math.sin(this.angle) * this.speed;
                this.sniperAimTimer = Math.max(0, this.sniperAimTimer - deltaTime * 0.5); // Giảm nhắm khi di chuyển
            } else {
                // Đứng yên ngắm bắn
                this.sniperAimTimer += deltaTime;
                if (this.sniperAimTimer >= 1200) {
                    this.sniperAimTimer = 0;
                    this.shootSniperBullet(player, gameBullets);
                }
            }
        } else {
            // Runner và Tanker: đuổi thẳng tới người chơi
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }

        // Giới hạn trong bản đồ thế giới
        this.x = Math.max(this.radius, Math.min(3000 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(3000 - this.radius, this.y));
    }

    shootAtPlayer(player, gameBullets) {
        // Bắn 1 tia đạn đỏ hướng tới người chơi
        const bulletAngle = Vector.angle(this.x, this.y, player.x, player.y);
        const bSpeed = 5;
        const vx = Math.cos(bulletAngle) * bSpeed;
        const vy = Math.sin(bulletAngle) * bSpeed;
        
        gameBullets.push(new Bullet(
            this.x + Math.cos(bulletAngle) * this.radius,
            this.y + Math.sin(bulletAngle) * this.radius,
            vx,
            vy,
            6, // Bán kính đạn nhỏ
            this.damage,
            '#ff3131', // Đỏ neon
            false // Đạn của quái vật
        ));
    }

    shootSniperBullet(player, gameBullets) {
        sounds.playShoot();
        const bulletAngle = Vector.angle(this.x, this.y, player.x, player.y);
        const bSpeed = 16;
        const vx = Math.cos(bulletAngle) * bSpeed;
        const vy = Math.sin(bulletAngle) * bSpeed;
        
        gameBullets.push(new Bullet(
            this.x + Math.cos(bulletAngle) * this.radius,
            this.y + Math.sin(bulletAngle) * this.radius,
            vx,
            vy,
            5,
            this.damage,
            '#ff00ff', // Đạn màu hồng neon
            false // Đạn của quái vật
        ));
    }

    applyKnockback(angle, force) {
        this.knockbackX = Math.cos(angle) * force;
        this.knockbackY = Math.sin(angle) * force;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Vẽ tia laser ngắm bắn của Sniper lên mặt đất trước (Khử shadowBlur)
        if (this.type === 'sniper' && this.sniperAimTimer > 0 && window.gameEngine && window.gameEngine.player) {
            const player = window.gameEngine.player;
            ctx.save();
            
            // 1. Quầng sáng laser (Outer Glow)
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 4 + (this.sniperAimTimer / 1200) * 3.0;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(player.x - camera.x, player.y - camera.y);
            ctx.stroke();

            // 2. Tia laser chính (Solid Core)
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.45 + (this.sniperAimTimer / 1200) * 0.55})`;
            ctx.lineWidth = 1 + (this.sniperAimTimer / 1200) * 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(player.x - camera.x, player.y - camera.y);
            ctx.stroke();
            
            ctx.restore();
        }

        ctx.save();
        ctx.translate(screenX, screenY);

        if (this.type === 'mine') {
            const flash = Math.floor(Date.now() / 150) % 2 === 0;
            const coreColor = flash ? 'rgba(255, 159, 0, 0.45)' : 'rgba(20, 10, 0, 0.9)';

            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2.0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Lõi chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.rotate(this.angle);

        // Định dạng đa giác cho từng loại quái
        ctx.beginPath();
        if (this.type === 'tanker') {
            const r = this.radius;
            ctx.moveTo(r, 0);
            ctx.lineTo(r * 0.5, -r * 0.85);
            ctx.lineTo(-r * 0.5, -r * 0.85);
            ctx.lineTo(-r, 0);
            ctx.lineTo(-r * 0.5, r * 0.85);
            ctx.lineTo(r * 0.5, r * 0.85);
        } else if (this.type === 'shooter') {
            const r = this.radius;
            ctx.moveTo(r * 1.3, 0);
            ctx.lineTo(-r * 0.7, -r);
            ctx.lineTo(-r * 0.3, 0);
            ctx.lineTo(-r * 0.7, r);
        } else if (this.type === 'sniper') {
            const r = this.radius;
            ctx.moveTo(r * 1.6, 0);
            ctx.lineTo(-r * 0.4, -r * 0.4);
            ctx.lineTo(-r * 0.8, -r * 0.9);
            ctx.lineTo(-r * 0.3, 0);
            ctx.lineTo(-r * 0.8, r * 0.9);
            ctx.lineTo(-r * 0.4, r * 0.4);
        } else {
            const r = this.radius;
            ctx.moveTo(r * 1.2, 0);
            ctx.lineTo(-r * 0.8, -r * 0.8);
            ctx.lineTo(-r * 0.4, 0);
            ctx.lineTo(-r * 0.8, r * 0.8);
        }
        ctx.closePath();

        // 1. Quầng sáng viền (Outer Glow Stroke)
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 7.0;
        ctx.stroke();

        // 2. Thân quái chính (Solid Core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(15, 10, 20, 0.8)';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();

        // Vẽ thanh máu mini phía trên quái vật (chỉ khi bị mất máu)
        if (this.hp < this.maxHp) {
            ctx.restore();
            ctx.save();
            ctx.translate(screenX, screenY - this.radius - 12);
            
            const barW = this.radius * 2;
            const barH = 4;
            
            // Nền đen thanh máu
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-barW/2, 0, barW, barH);
            
            // Thanh máu còn lại
            const hpPct = this.hp / this.maxHp;
            ctx.fillStyle = hpPct > 0.4 ? '#39ff14' : '#ff3131';
            ctx.fillRect(-barW/2, 0, barW * hpPct, barH);
        }

        ctx.restore();
    }
}

// Boss Entity (Giant Monster)
class Boss extends Enemy {
    constructor(x, y, bossType = null) {
        super(x, y, 1, 'boss');
        
        const bossTypes = ['yellow_intruder', 'neon_vortex', 'synapse_reaper', 'arch_overseer', 'grid_infection'];
        this.bossType = bossType || bossTypes[Math.floor(Math.random() * bossTypes.length)];
        
        this.bossTimer = 0;
        this.bossState = 'WALK';
        this.stateTimer = 0;
        
        switch (this.bossType) {
            case 'yellow_intruder':
                this.name = 'CYBER INTRUDER';
                this.radius = 65;
                this.speed = 1.0;
                this.maxHp = 1000;
                this.damage = 30;
                this.color = '#fffb00'; // Neon Yellow-Orange
                this.chargeAngle = 0;
                this.chargeSpeed = 16;
                break;
            case 'neon_vortex':
                this.name = 'NEON VORTEX';
                this.radius = 60;
                this.speed = 0.8;
                this.maxHp = 1200;
                this.damage = 25;
                this.color = '#b026ff'; // Neon Purple
                this.shieldAngle = 0;
                this.shieldHitTimer = 0;
                break;
            case 'synapse_reaper':
                this.name = 'SYNAPSE REAPER';
                this.radius = 55;
                this.speed = 2.2;
                this.maxHp = 900;
                this.damage = 35;
                this.color = '#ff007f'; // Neon Pink
                break;
            case 'arch_overseer':
                this.name = 'ARCH OVERSEER';
                this.radius = 75;
                this.speed = 0.6;
                this.maxHp = 1600;
                this.damage = 40;
                this.color = '#00f0ff'; // Neon Cyan
                this.laserAngle = 0;
                this.laserActive = false;
                break;
            case 'grid_infection':
                this.name = 'GRID INFECTION';
                this.radius = 60;
                this.speed = 1.2;
                this.maxHp = 1000;
                this.damage = 28;
                this.color = '#ff9f00'; // Neon Orange
                this.hasSplit = false;
                this.isClone = false;
                break;
        }
        
        this.hp = this.maxHp;
        this.xpValue = 60;
        this.silentDeath = false;
    }

    update(player, gameBullets, deltaTime, gameEngineRef) {
        // Giảm lực đẩy lùi (Boss bị đẩy lùi rất ít)
        this.x += this.knockbackX;
        this.y += this.knockbackY;
        this.knockbackX *= 0.6;
        this.knockbackY *= 0.6;

        this.angle = Vector.angle(this.x, this.y, player.x, player.y);
        this.bossTimer += deltaTime;
        this.stateTimer += deltaTime;

        // Cập nhật hồi chiêu chém khiên cho vortex
        if (this.shieldHitTimer && this.shieldHitTimer > 0) {
            this.shieldHitTimer -= deltaTime;
        }

        // Xử lý cỗ máy trạng thái (Boss State Machine) theo từng Boss Type
        switch (this.bossType) {
            case 'yellow_intruder':
                switch (this.bossState) {
                    case 'WALK':
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        if (this.stateTimer >= 5000) {
                            this.stateTimer = 0;
                            const states = ['CHARGE_PREP', 'BURST', 'SUMMON'];
                            this.bossState = states[Math.floor(Math.random() * states.length)];
                        }
                        break;
                    case 'CHARGE_PREP':
                        this.color = '#ff3131'; 
                        if (this.stateTimer >= 1000) {
                            this.stateTimer = 0;
                            this.bossState = 'CHARGE_DASH';
                            this.chargeAngle = Vector.angle(this.x, this.y, player.x, player.y);
                            sounds.playDash();
                        }
                        break;
                    case 'CHARGE_DASH':
                        this.color = '#ff9f00'; 
                        this.x += Math.cos(this.chargeAngle) * this.chargeSpeed;
                        this.y += Math.sin(this.chargeAngle) * this.chargeSpeed;
                        if (Math.random() < 0.4) {
                            gameEngineRef.particles.push(new Particle(this.x, this.y, '#ff3131'));
                        }
                        if (this.stateTimer >= 1200) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                            this.color = '#fffb00';
                        }
                        break;
                    case 'BURST':
                        if (this.stateTimer % 400 < deltaTime) {
                            this.fireBulletCircle(gameBullets);
                        }
                        if (this.stateTimer >= 2200) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                    case 'SUMMON':
                        if (this.stateTimer >= 1000) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                            this.summonMinions(gameEngineRef);
                        }
                        break;
                }
                break;

            case 'neon_vortex':
                const pullAngle = Vector.angle(player.x, player.y, this.x, this.y);
                const pullDist = Vector.dist(player.x, player.y, this.x, this.y);
                
                switch (this.bossState) {
                    case 'WALK':
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        
                        // Hút nhẹ người chơi
                        if (pullDist < 600) {
                            player.x += Math.cos(pullAngle) * 0.6;
                            player.y += Math.sin(pullAngle) * 0.6;
                        }
                        
                        if (this.stateTimer >= 5000) {
                            this.stateTimer = 0;
                            const states = ['GRAVITY_PULL', 'SHIELD_UP'];
                            this.bossState = states[Math.floor(Math.random() * states.length)];
                        }
                        break;
                        
                    case 'GRAVITY_PULL':
                        // Hút mạnh người chơi
                        if (pullDist < 700) {
                            player.x += Math.cos(pullAngle) * 1.8;
                            player.y += Math.sin(pullAngle) * 1.8;
                        }
                        
                        // Bắn 8 viên đạn tím tỏa tròn di chuyển chậm
                        if (this.stateTimer % 500 < deltaTime) {
                            sounds.playShoot();
                            const bulletCount = 8;
                            const bSpeed = 2.8;
                            for (let i = 0; i < bulletCount; i++) {
                                const angle = (Math.PI * 2 / bulletCount) * i + Math.random() * 0.1;
                                const vx = Math.cos(angle) * bSpeed;
                                const vy = Math.sin(angle) * bSpeed;
                                gameBullets.push(new Bullet(
                                    this.x + Math.cos(angle) * this.radius,
                                    this.y + Math.sin(angle) * this.radius,
                                    vx,
                                    vy,
                                    8,
                                    this.damage * 0.6,
                                    '#b026ff',
                                    false
                                ));
                            }
                        }
                        
                        if (this.stateTimer >= 3000) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                        
                    case 'SHIELD_UP':
                        // Di chuyển nhanh hướng về người chơi
                        this.x += Math.cos(this.angle) * (this.speed * 1.35);
                        this.y += Math.sin(this.angle) * (this.speed * 1.35);
                        
                        if (this.stateTimer >= 4000) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                }
                break;

            case 'synapse_reaper':
                switch (this.bossState) {
                    case 'WALK':
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        
                        if (this.stateTimer >= 4000) {
                            this.stateTimer = 0;
                            const states = ['SWORD_FLURRY', 'BLINK_ATTACK'];
                            this.bossState = states[Math.floor(Math.random() * states.length)];
                        }
                        break;
                        
                    case 'SWORD_FLURRY':
                        // Đuổi theo người chơi tốc độ vừa phải và chém kiếm liên tục
                        this.x += Math.cos(this.angle) * (this.speed * 0.6);
                        this.y += Math.sin(this.angle) * (this.speed * 0.6);
                        
                        if (this.stateTimer % 350 < deltaTime) {
                            this.triggerBossSwordSlash(gameEngineRef);
                        }
                        
                        if (this.stateTimer >= 2400) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                        
                    case 'BLINK_ATTACK':
                        // Đứng yên gồng tàng hình
                        if (this.stateTimer < 1000) {
                            this.speed = 0;
                        } else if (this.stateTimer >= 1000 && this.stateTimer < 1100) {
                            // Dịch chuyển tức thời tới sát người chơi
                            const randAngle = Math.random() * Math.PI * 2;
                            this.x = player.x + Math.cos(randAngle) * 90;
                            this.y = player.y + Math.sin(randAngle) * 90;
                            
                            // Phát tiếng vung kiếm và thực hiện chém tròn 360 độ
                            this.triggerBossCircularSlash(gameEngineRef);
                            this.stateTimer = 1100; // Nhảy qua bước tiếp theo
                        } else if (this.stateTimer >= 1700) { // Đứng yên 0.6s sau chém rồi chạy tiếp
                            this.speed = 2.2;
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                }
                break;

            case 'arch_overseer':
                switch (this.bossState) {
                    case 'WALK':
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        
                        // Bắn 1 tia đạn laser cyan đơn lẻ hướng người chơi mỗi 1s
                        if (this.stateTimer % 1000 < deltaTime) {
                            sounds.playShoot();
                            const bSpeed = 10;
                            const vx = Math.cos(this.angle) * bSpeed;
                            const vy = Math.sin(this.angle) * bSpeed;
                            gameBullets.push(new Bullet(
                                this.x + Math.cos(this.angle) * this.radius,
                                this.y + Math.sin(this.angle) * this.radius,
                                vx,
                                vy,
                                6,
                                this.damage * 0.5,
                                '#00f0ff',
                                false
                            ));
                        }
                        
                        if (this.stateTimer >= 6000) {
                            this.stateTimer = 0;
                            const states = ['LASER_BEAM', 'MISSILE_BARRAGE'];
                            this.bossState = states[Math.floor(Math.random() * states.length)];
                        }
                        break;
                        
                    case 'LASER_BEAM':
                        this.laserAngle += 0.018 * (deltaTime / 16.67);
                        
                        // Kiểm tra va chạm với người chơi mỗi 120ms
                        if (!this.lastLaserDamageTime) this.lastLaserDamageTime = 0;
                        if (Date.now() - this.lastLaserDamageTime > 120) {
                            this.lastLaserDamageTime = Date.now();
                            
                            const checkLaserCollision = (angle) => {
                                const lx = Math.cos(angle);
                                const ly = Math.sin(angle);
                                const px = player.x - this.x;
                                const py = player.y - this.y;
                                const projection = px * lx + py * ly;
                                if (projection > 0 && projection < 800) {
                                    const cx = this.x + lx * projection;
                                    const cy = this.y + ly * projection;
                                    const dist = Vector.dist(player.x, player.y, cx, cy);
                                    return dist < player.radius + 12;
                                }
                                return false;
                            };
                            
                            if (checkLaserCollision(this.laserAngle) || checkLaserCollision(this.laserAngle + Math.PI)) {
                                const damaged = player.takeDamage(10);
                                if (damaged) {
                                    gameEngineRef.triggerScreenShake(5, 100);
                                    gameEngineRef.floatingTexts.push(new FloatingText(player.x, player.y - 20, `-10`, '#ff3131', 18));
                                    gameEngineRef.spawnBloodParticles(player.x, player.y, '#ff3131');
                                }
                            }
                        }
                        
                        if (this.stateTimer >= 4000) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                        
                    case 'MISSILE_BARRAGE':
                        // Phóng tên lửa tầm nhiệt đỏ đuổi mục tiêu
                        if (this.stateTimer % 500 < deltaTime && this.stateTimer < 2500) {
                            gameEngineRef.homingMissiles.push(new HomingMissile(
                                this.x,
                                this.y,
                                player,
                                this.damage * 0.8,
                                true // isEnemyMissile = true
                            ));
                            sounds.playShoot();
                        }
                        
                        if (this.stateTimer >= 3200) {
                            this.stateTimer = 0;
                            this.bossState = 'WALK';
                        }
                        break;
                }
                break;

            case 'grid_infection':
                // Check if hp < 50% to trigger split (only for original boss, not clones)
                if (!this.hasSplit && this.hp < this.maxHp * 0.5 && !this.isClone) {
                    this.hasSplit = true;
                    
                    // Tạo 2 phân thân nhỏ hơn
                    const c1 = new Boss(this.x - 50, this.y, 'grid_infection');
                    c1.isClone = true;
                    c1.hasSplit = true;
                    c1.radius = this.radius * 0.65;
                    c1.maxHp = this.maxHp * 0.35;
                    c1.hp = c1.maxHp;
                    c1.damage = this.damage * 0.5;
                    c1.speed = this.speed * 1.25;
                    c1.xpValue = 15;
                    
                    const c2 = new Boss(this.x + 50, this.y, 'grid_infection');
                    c2.isClone = true;
                    c2.hasSplit = true;
                    c2.radius = this.radius * 0.65;
                    c2.maxHp = this.maxHp * 0.35;
                    c2.hp = c2.maxHp;
                    c2.damage = this.damage * 0.5;
                    c2.speed = this.speed * 1.25;
                    c2.xpValue = 15;
                    
                    gameEngineRef.enemies.push(c1);
                    gameEngineRef.enemies.push(c2);
                    
                    // Nếu boss hiện tại đang là activeBoss, chuyển activeBoss sang clone 1 để thanh máu hiển thị máu clone 1
                    if (gameEngineRef.activeBoss === this) {
                        gameEngineRef.activeBoss = c1;
                    }
                    
                    // Sound & particles
                    sounds.playExplosion();
                    gameEngineRef.spawnBloodParticles(this.x, this.y, '#ff9f00', 15);
                    gameEngineRef.blastRings.push(new BlastRing(this.x, this.y, 100, '#ff9f00'));
                    
                    // Hủy boss gốc nhẹ nhàng
                    this.hp = 0;
                    this.silentDeath = true;
                    return;
                }
                
                switch (this.bossState) {
                    case 'WALK':
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        
                        // Bắn 3 tia đạn cam chùm hướng người chơi mỗi 1.5s
                        if (this.stateTimer % 1500 < deltaTime) {
                            sounds.playShoot();
                            const bSpeed = 6.5;
                            const spread = 0.2; // ~11 độ
                            const angles = [this.angle - spread, this.angle, this.angle + spread];
                            
                            angles.forEach(ang => {
                                const vx = Math.cos(ang) * bSpeed;
                                const vy = Math.sin(ang) * bSpeed;
                                gameBullets.push(new Bullet(
                                    this.x + Math.cos(ang) * this.radius,
                                    this.y + Math.sin(ang) * this.radius,
                                    vx,
                                    vy,
                                    6.5,
                                    this.damage * 0.4,
                                    '#ff9f00',
                                    false
                                ));
                            });
                        }
                        
                        if (this.stateTimer >= 5000) {
                            this.stateTimer = 0;
                            this.bossState = 'MINE_LAYING';
                        }
                        break;
                        
                    case 'MINE_LAYING':
                        // Di chuyển ngẫu nhiên và thả mìn cam nhấp nháy
                        if (!this.mineMoveAngle) {
                            this.mineMoveAngle = Math.random() * Math.PI * 2;
                        }
                        this.x += Math.cos(this.mineMoveAngle) * (this.speed * 1.2);
                        this.y += Math.sin(this.mineMoveAngle) * (this.speed * 1.2);
                        
                        if (this.stateTimer % 800 < deltaTime && this.stateTimer < 2400) {
                            sounds.playPickup(); // Beep drop sound
                            const mine = new Enemy(this.x, this.y, 1, 'mine');
                            gameEngineRef.enemies.push(mine);
                            gameEngineRef.spawnBloodParticles(this.x, this.y, '#ff9f00', 3);
                        }
                        
                        if (this.stateTimer >= 2500) {
                            this.stateTimer = 0;
                            this.mineMoveAngle = null;
                            this.bossState = 'WALK';
                        }
                        break;
                }
                break;
        }

        // Giới hạn trong bản đồ thế giới
        this.x = Math.max(this.radius, Math.min(3000 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(3000 - this.radius, this.y));
    }

    fireBulletCircle(gameBullets) {
        sounds.playShoot();
        const bulletCount = 12;
        const bSpeed = 4.5;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / bulletCount) * i + Math.random() * 0.1;
            const vx = Math.cos(angle) * bSpeed;
            const vy = Math.sin(angle) * bSpeed;
            gameBullets.push(new Bullet(
                this.x + Math.cos(angle) * this.radius,
                this.y + Math.sin(angle) * this.radius,
                vx,
                vy,
                7, // Đạn Boss to hơn
                this.damage * 0.5, // Giảm dame đạn phụ
                '#ff3131',
                false
            ));
        }
    }

    summonMinions(gameEngineRef) {
        sounds.playLevelUp();
        const angles = [0, Math.PI/2, Math.PI, Math.PI*1.5];
        angles.forEach(angle => {
            const sx = this.x + Math.cos(angle) * (this.radius + 30);
            const sy = this.y + Math.sin(angle) * (this.radius + 30);
            const runner = new Enemy(sx, sy, gameEngineRef.player.level, 'runner');
            gameEngineRef.enemies.push(runner);
            // Hiệu ứng điện triệu hồi
            gameEngineRef.spawnBloodParticles(sx, sy, runner.color, 5);
        });
    }

    triggerBossSwordSlash(gameEngineRef) {
        sounds.playSwordSlash();
        const angle = this.angle;
        // Visual pink slash (no damage from the slash entity itself)
        gameEngineRef.swordSlashes.push(new SwordSlash(this.x, this.y, angle, 130, '#ff007f', 0)); 
        
        // Manual damage check on player
        const dist = Vector.dist(this.x, this.y, gameEngineRef.player.x, gameEngineRef.player.y);
        if (dist < 130 + gameEngineRef.player.radius) {
            const angleToPlayer = Math.atan2(gameEngineRef.player.y - this.y, gameEngineRef.player.x - this.x);
            let diff = Math.abs(angleToPlayer - angle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            
            if (diff < Math.PI / 2.5) { // 72 degree cone
                const damaged = gameEngineRef.player.takeDamage(this.damage * 0.6);
                if (damaged) {
                    gameEngineRef.triggerScreenShake(8, 150);
                    gameEngineRef.floatingTexts.push(new FloatingText(gameEngineRef.player.x, gameEngineRef.player.y - 20, `-${Math.floor(this.damage * 0.6)}`, '#ff3131', 18));
                    gameEngineRef.spawnBloodParticles(gameEngineRef.player.x, gameEngineRef.player.y, '#ff3131');
                }
            }
        }
    }

    triggerBossCircularSlash(gameEngineRef) {
        sounds.playShockwave();
        // Visual pink circular wave
        const wave = new HammerWave(this.x, this.y, 0, 160, '#ff007f', 0);
        wave.is360 = true;
        gameEngineRef.hammerWaves.push(wave);
        
        // Apply damage to player
        const dist = Vector.dist(this.x, this.y, gameEngineRef.player.x, gameEngineRef.player.y);
        if (dist < 160 + gameEngineRef.player.radius) {
            const damaged = gameEngineRef.player.takeDamage(this.damage);
            if (damaged) {
                gameEngineRef.triggerScreenShake(12, 250);
                gameEngineRef.floatingTexts.push(new FloatingText(gameEngineRef.player.x, gameEngineRef.player.y - 20, `-${this.damage}`, '#ff3131', 18));
                gameEngineRef.spawnBloodParticles(gameEngineRef.player.x, gameEngineRef.player.y, '#ff3131');
            }
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle + (this.bossState === 'BURST' ? Date.now() * 0.005 : 0));

        // Thiết lập viền vẽ
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;

        if (this.bossType === 'yellow_intruder') {
            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 10;
            ctx.beginPath();
            const spikeCount = 10;
            for (let i = 0; i < spikeCount * 2; i++) {
                const angle = (Math.PI / spikeCount) * i;
                const dist = i % 2 === 0 ? this.radius : this.radius * 0.6;
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // 2. Thân chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(20, 15, 5, 0.95)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < spikeCount * 2; i++) {
                const angle = (Math.PI / spikeCount) * i;
                const dist = i % 2 === 0 ? this.radius : this.radius * 0.6;
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Inner core (Double draw)
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.bossType === 'neon_vortex') {
            const armCount = 6;
            const angleOffset = Date.now() * 0.003;

            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 10;
            ctx.beginPath();
            for (let i = 0; i < armCount; i++) {
                const baseAngle = (Math.PI * 2 / armCount) * i + angleOffset;
                ctx.moveTo(0, 0);
                const cpX = Math.cos(baseAngle + 0.5) * this.radius * 0.7;
                const cpY = Math.sin(baseAngle + 0.5) * this.radius * 0.7;
                const destX = Math.cos(baseAngle + 1.0) * this.radius;
                const destY = Math.sin(baseAngle + 1.0) * this.radius;
                ctx.quadraticCurveTo(cpX, cpY, destX, destY);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Thân chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < armCount; i++) {
                const baseAngle = (Math.PI * 2 / armCount) * i + angleOffset;
                ctx.moveTo(0, 0);
                const cpX = Math.cos(baseAngle + 0.5) * this.radius * 0.7;
                const cpY = Math.sin(baseAngle + 0.5) * this.radius * 0.7;
                const destX = Math.cos(baseAngle + 1.0) * this.radius;
                const destY = Math.sin(baseAngle + 1.0) * this.radius;
                ctx.quadraticCurveTo(cpX, cpY, destX, destY);
            }
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(10, 5, 20, 0.9)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Lõi phát sáng
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.3 * (1 + Math.sin(Date.now() * 0.01) * 0.1), 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.bossType === 'synapse_reaper') {
            const bladeCount = 4;
            const baseRot = Date.now() * 0.004;

            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 10;
            ctx.beginPath();
            for (let i = 0; i < bladeCount; i++) {
                const angle = (Math.PI * 2 / bladeCount) * i + baseRot;
                const tipX = Math.cos(angle) * this.radius * 1.3;
                const tipY = Math.sin(angle) * this.radius * 1.3;
                const leftX = Math.cos(angle - 0.4) * this.radius * 0.5;
                const leftY = Math.sin(angle - 0.4) * this.radius * 0.5;
                const rightX = Math.cos(angle + 0.4) * this.radius * 0.5;
                const rightY = Math.sin(angle + 0.4) * this.radius * 0.5;
                if (i === 0) ctx.moveTo(leftX, leftY);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(rightX, rightY);
            }
            ctx.closePath();
            ctx.stroke();

            // 2. Thân chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(20, 5, 15, 0.95)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < bladeCount; i++) {
                const angle = (Math.PI * 2 / bladeCount) * i + baseRot;
                const tipX = Math.cos(angle) * this.radius * 1.3;
                const tipY = Math.sin(angle) * this.radius * 1.3;
                const leftX = Math.cos(angle - 0.4) * this.radius * 0.5;
                const leftY = Math.sin(angle - 0.4) * this.radius * 0.5;
                const rightX = Math.cos(angle + 0.4) * this.radius * 0.5;
                const rightY = Math.sin(angle + 0.4) * this.radius * 0.5;
                if (i === 0) ctx.moveTo(leftX, leftY);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(rightX, rightY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.bossType === 'arch_overseer') {
            const sideCount = 8;
            const rot = Date.now() * 0.001;

            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 10;
            ctx.beginPath();
            for (let i = 0; i < sideCount; i++) {
                const angle = (Math.PI * 2 / sideCount) * i + rot;
                const px = Math.cos(angle) * this.radius;
                const py = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // 2. Thân chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(5, 15, 20, 0.95)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < sideCount; i++) {
                const angle = (Math.PI * 2 / sideCount) * i + rot;
                const px = Math.cos(angle) * this.radius;
                const py = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < sideCount; i++) {
                const angle = (Math.PI * 2 / sideCount) * i + rot;
                ctx.moveTo(Math.cos(angle) * this.radius * 0.5, Math.sin(angle) * this.radius * 0.5);
                ctx.lineTo(Math.cos(angle) * this.radius * 0.8, Math.sin(angle) * this.radius * 0.8);
            }
            ctx.stroke();
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.28, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.bossType === 'grid_infection') {
            const nodeCount = 5;
            const tRot = Date.now() * 0.002;
            
            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 9;
            ctx.beginPath();
            for (let i = 0; i < nodeCount; i++) {
                const angle = (Math.PI * 2 / nodeCount) * i + tRot;
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * this.radius * 1.1, Math.sin(angle) * this.radius * 1.1);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Thân chính (Solid Core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < nodeCount; i++) {
                const angle = (Math.PI * 2 / nodeCount) * i + tRot;
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * this.radius * 1.1, Math.sin(angle) * this.radius * 1.1);
            }
            ctx.stroke();
            
            for (let i = 0; i < nodeCount; i++) {
                const angle = (Math.PI * 2 / nodeCount) * i + tRot;
                const nx = Math.cos(angle) * this.radius * 1.1;
                const ny = Math.sin(angle) * this.radius * 1.1;
                
                ctx.save();
                ctx.translate(nx, ny);
                ctx.fillStyle = 'rgba(20, 10, 0, 0.9)';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.fillStyle = 'rgba(20, 10, 0, 0.95)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.28, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Vẽ Orbiting Shield của Neon Vortex
        if (this.bossType === 'neon_vortex' && this.bossState === 'SHIELD_UP') {
            const shieldCount = 3;
            const shieldAngle = Date.now() * 0.005;
            for (let i = 0; i < shieldCount; i++) {
                const angle = shieldAngle + (Math.PI * 2 / shieldCount) * i;
                const sx = this.x + Math.cos(angle) * 90;
                const sy = this.y + Math.sin(angle) * 90;
                
                if (this.isInView(sx, sy, 15, camera)) {
                    ctx.save();
                    ctx.translate(sx - camera.x, sy - camera.y);
                    ctx.rotate(Date.now() * 0.01 + i);
                    
                    // 1. Quầng sáng (Outer Glow)
                    ctx.globalAlpha = 0.25;
                    ctx.strokeStyle = '#b026ff';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(15, 0);
                    ctx.lineTo(0, -7);
                    ctx.lineTo(-15, 0);
                    ctx.lineTo(0, 7);
                    ctx.closePath();
                    ctx.stroke();

                    // 2. Viền chính (Solid Core)
                    ctx.globalAlpha = 1.0;
                    ctx.strokeStyle = '#b026ff';
                    ctx.fillStyle = 'rgba(15, 10, 25, 0.85)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(15, 0);
                    ctx.lineTo(0, -7);
                    ctx.lineTo(-15, 0);
                    ctx.lineTo(0, 7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // Vẽ Laser beams của Arch Overseer
        if (this.bossType === 'arch_overseer' && this.bossState === 'LASER_BEAM') {
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // 1. Quầng sáng laser cực dày (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 24;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle) * 800, Math.sin(this.laserAngle) * 800);
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle + Math.PI) * 800, Math.sin(this.laserAngle + Math.PI) * 800);
            ctx.stroke();
            
            // 2. Laser chính (Solid Core)
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 14;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle) * 800, Math.sin(this.laserAngle) * 800);
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle + Math.PI) * 800, Math.sin(this.laserAngle + Math.PI) * 800);
            ctx.stroke();
            
            // 3. Lõi trắng laser (White inner core)
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle) * 800, Math.sin(this.laserAngle) * 800);
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle + Math.PI) * 800, Math.sin(this.laserAngle + Math.PI) * 800);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    // Helper check view
    isInView(x, y, radius, camera) {
        return (
            x + radius > camera.x &&
            x - radius < camera.x + window.innerWidth &&
            y + radius > camera.y &&
            y - radius < camera.y + window.innerHeight
        );
    }
}

// Bullet Entity
class Bullet {
    constructor(x, y, vx, vy, radius, damage, color, isPlayerBullet = true) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.damage = damage;
        this.color = color;
        this.isPlayerBullet = isPlayerBullet;
        this.life = 2000; // Hủy đạn sau 2 giây nếu không trúng gì
        this.trail = []; // Lưu các vị trí cũ để vẽ vết đạn
    }

    update(deltaTime) {
        // Lưu vết đạn
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) {
            this.trail.shift();
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life -= deltaTime;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // Vẽ vết đạn (Trail) nhạt dần
        ctx.lineWidth = this.radius * 0.8;
        ctx.lineCap = 'round';
        for (let i = 0; i < this.trail.length - 1; i++) {
            const ratio = i / this.trail.length;
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = ratio * 0.4;
            
            ctx.beginPath();
            ctx.moveTo(this.trail[i].x - camera.x, this.trail[i].y - camera.y);
            ctx.lineTo(this.trail[i+1].x - camera.x, this.trail[i+1].y - camera.y);
            ctx.stroke();
        }

        // Vẽ viên đạn chính với quầng phát sáng (Double-stroke / Double-fill outer glow)
        // 1. Quầng sáng (Outer Glow)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Lõi đạn chính (Solid Core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff'; // Lõi đạn màu trắng
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

// Sword Slash Entity
class SwordSlash {
    constructor(x, y, angle, radius, color, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.radius = radius;
        this.color = color;
        this.damage = damage;
        this.lifeMax = 180; // Hủy sau 180ms
        this.life = this.lifeMax;
        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        this.life -= deltaTime;
    }

    draw(ctx, camera) {
        const sX = this.x - camera.x;
        const sY = this.y - camera.y;
        ctx.save();
        ctx.translate(sX, sY);
        ctx.rotate(this.angle);

        const alpha = Math.max(0, this.life / this.lifeMax);
        
        // 1. Quầng sáng chém (Outer Glow)
        ctx.globalAlpha = alpha * 0.25;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        // 2. Kiếm sáng chính (Solid Core)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff'; // lõi trắng sáng rực
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        ctx.restore();
    }
}

// Hammer Wave / Ground Shockwave Entity
class HammerWave {
    constructor(x, y, angle, maxRadius, color, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.maxRadius = maxRadius;
        this.radius = 20;
        this.color = color;
        this.damage = damage;
        this.lifeMax = 250; // Hủy sau 250ms
        this.life = this.lifeMax;
        this.hitEnemies = new Set();
        this.is360 = false;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        const progress = 1 - Math.max(0, this.life / this.lifeMax);
        this.radius = 20 + progress * (this.maxRadius - 20);
    }

    draw(ctx, camera) {
        const sX = this.x - camera.x;
        const sY = this.y - camera.y;
        ctx.save();
        ctx.translate(sX, sY);
        ctx.rotate(this.angle);

        const alpha = Math.max(0, this.life / this.lifeMax);
        
        // 1. Quầng sáng chấn động (Outer Glow)
        ctx.globalAlpha = alpha * 0.25;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (this.is360) {
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        } else {
            ctx.arc(0, 0, this.radius, -Math.PI / 4, Math.PI / 4);
        }
        ctx.stroke();

        // 2. Sóng chính (Solid Core)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff'; // lõi trắng
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        if (this.is360) {
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        } else {
            ctx.arc(0, 0, this.radius, -Math.PI / 4, Math.PI / 4);
        }
        ctx.stroke();

        ctx.restore();
    }
}

// Sub-Weapon: Homing Missile (Tên lửa tầm nhiệt tự dẫn)
class HomingMissile {
    constructor(x, y, target, damage, isEnemyMissile = false) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.isEnemyMissile = isEnemyMissile;
        this.speed = isEnemyMissile ? 5.5 : 8;
        this.radius = 6;
        this.angle = target ? Vector.angle(x, y, target.x, target.y) : 0;
        this.life = 4000; // Hủy sau 4 giây bay nếu không trúng gì
        this.color = isEnemyMissile ? '#ff3131' : '#ff9f00'; // Neon Orange cho player, Đỏ cho Boss
        this.trail = [];
    }

    update(enemies, deltaTime, gameEngine) {
        this.life -= deltaTime;
        
        // Lưu vết tên lửa
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) {
            this.trail.shift();
        }

        if (this.isEnemyMissile) {
            this.target = gameEngine.player;
        } else {
            // Tìm mục tiêu mới nếu mục tiêu cũ chết hoặc không còn trong danh sách kẻ địch
            if (!this.target || !enemies.includes(this.target) || this.target.hp <= 0) {
                this.target = this.findNearestEnemy(enemies);
            }
        }

        if (this.target) {
            const targetAngle = Vector.angle(this.x, this.y, this.target.x, this.target.y);
            // Xoay dần hướng bay về phía mục tiêu
            let angleDiff = targetAngle - this.angle;
            
            // Chuẩn hóa góc chênh lệch trong khoảng [-PI, PI]
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            // Tốc độ bẻ lái xoay góc
            this.angle += Math.max(-0.15, Math.min(0.15, angleDiff));
        }

        // Di chuyển
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Sinh hạt lửa khói phản lực
        if (Math.random() < 0.4) {
            gameEngine.particles.push(new Particle(
                this.x - Math.cos(this.angle) * 8, 
                this.y - Math.sin(this.angle) * 8, 
                '#ff3131'
            ));
        }
    }

    findNearestEnemy(enemies) {
        if (enemies.length === 0) return null;
        let nearest = null;
        let minDist = Infinity;
        enemies.forEach(enemy => {
            // Không ngắm bắn Boss nếu Boss đã chết, chỉ ngắm quái còn sống
            if (enemy.hp > 0) {
                const d = Vector.dist(this.x, this.y, enemy.x, enemy.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = enemy;
                }
            }
        });
        return nearest;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();

        // Vẽ vệt khói tên lửa bay (Trail)
        ctx.lineWidth = this.radius * 0.8;
        ctx.lineCap = 'round';
        for (let i = 0; i < this.trail.length - 1; i++) {
            const ratio = i / this.trail.length;
            ctx.strokeStyle = '#ff3131';
            ctx.globalAlpha = ratio * 0.45;
            
            ctx.beginPath();
            ctx.moveTo(this.trail[i].x - camera.x, this.trail[i].y - camera.y);
            ctx.lineTo(this.trail[i+1].x - camera.x, this.trail[i+1].y - camera.y);
            ctx.stroke();
        }

        // Vẽ phi thuyền / tên lửa hướng xoay theo góc
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // 1. Quầng sáng (Outer Glow)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Thân chính (Solid core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;

        // Vẽ hình thoi nhọn giống đầu đạn
        ctx.beginPath();
        ctx.moveTo(this.radius * 1.6, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đuôi lửa phản lực vàng (Double draw)
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#fffb00';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.8, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#fffb00';
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.8, -this.radius * 0.3);
        ctx.lineTo(-this.radius - 8 - Math.random() * 6, 0);
        ctx.lineTo(-this.radius * 0.8, this.radius * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// Item / Powerup Entity
class Item {
    constructor(x, y, type = 'xp', value = 1) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp', 'health', 'double', 'shield', 'magnet'
        this.value = value;
        this.vx = 0;
        this.vy = 0;

        // Định màu sắc theo loại
        switch (type) {
            case 'health':
                this.radius = 8;
                this.color = '#ff3131'; // Red
                break;
            case 'double':
                this.radius = 10;
                this.color = '#00f0ff'; // Blue
                break;
            case 'shield':
                this.radius = 10;
                this.color = '#fffb00'; // Yellow
                break;
            case 'magnet':
                this.radius = 10;
                this.color = '#b026ff'; // Purple
                break;
            case 'chest':
                this.radius = 14;
                this.color = '#fffb00'; // Neon Gold/Yellow
                break;
            case 'xp':
            default:
                this.radius = 6;
                this.color = '#39ff14'; // Green
                break;
        }
    }

    update(player, magnetPowerupActive, deltaTime) {
        const dist = Vector.dist(this.x, this.y, player.x, player.y);
        
        // Bán kính hút: nhân vật hút mạnh hơn nếu có nâng cấp magnet hoặc nhặt được power-up nam châm
        const pullRadius = magnetPowerupActive ? 9999 : player.magnetRadius;

        if (dist < pullRadius) {
            // Lực hút tăng dần khi vật phẩm càng gần người chơi
            const angle = Vector.angle(this.x, this.y, player.x, player.y);
            const speed = Math.max(5, (pullRadius - dist) * 0.15); // Hút nhanh dần đều
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            
            this.x += this.vx;
            this.y += this.vy;
        } else {
            // Hiệu ứng bồng bềnh nhẹ tại chỗ
            this.y += Math.sin(Date.now() * 0.005 + this.x) * 0.1;
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Vẽ quầng sáng neon (Double-stroke / Double-fill outer glow)
        // 1. Quầng sáng (Outer Glow)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Vật phẩm chính (Solid core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        if (this.type === 'xp') {
            // Vẽ tinh thể hình thoi
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius * 0.7, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius * 0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'health') {
            // Vẽ chữ thập cứu thương phát sáng
            ctx.beginPath();
            ctx.rect(-this.radius, -this.radius/3, this.radius*2, this.radius*2/3);
            ctx.rect(-this.radius/3, -this.radius, this.radius*2/3, this.radius*2);
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'chest') {
            // Vẽ rương nâng cấp siêu cấp phát sáng neon vàng (Double glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#fffb00';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(255, 251, 0, 0.25)';
            ctx.strokeStyle = '#fffb00';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.rect(-this.radius, -this.radius * 0.7, this.radius * 2, this.radius * 1.4);
            ctx.fill();
            ctx.stroke();

            // Vẽ lõi rương
            ctx.fillStyle = '#fffb00';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Viền chỉ trang trí
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(this.radius, 0);
            ctx.stroke();
        } else {
            // Vẽ các khối lõi nâng cấp hình tròn xoay nhẹ
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Vẽ ký tự đặc trưng bên trong
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let char = 'P';
            if (this.type === 'double') char = 'x2';
            if (this.type === 'shield') char = 'S';
            if (this.type === 'magnet') char = 'M';
            ctx.fillText(char, 0, 0);
        }

        ctx.restore();
    }
}

// Particle Entity for explosions
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.radius = 2 + Math.random() * 3;
        this.color = color;
        this.alpha = 1.0;
        // Decay nhanh hơn để particle tắt sớm hơn (tiết kiệm render)
        this.decay = 0.030 + Math.random() * 0.025;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.92; // giảm tốc nhẹ
        this.vy *= 0.92;
        this.alpha -= this.decay;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        // Không dùng save/restore & shadowBlur mỗi particle — tốn kém nhất trên Canvas
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Floating Text Entity for damage numbers
class FloatingText {
    constructor(x, y, text, color, size = 16) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.alpha = 1.0;
        this.vy = -1.2; // Tốc độ trôi lên
        this.vx = (Math.random() - 0.5) * 0.6; // Bay xéo nhẹ
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.025; // Biến mất sau ~40 frames
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = `bold ${this.size}px 'Orbitron', sans-serif`;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        ctx.strokeText(this.text, screenX, screenY);
        ctx.fillText(this.text, screenX, screenY);
        ctx.restore();
    }
}

// Mối nguy hiểm thiên tai (Hazards)
class Hazard {
    constructor(x, y, type, damage) {
        this.x = x;
        this.y = y;
        this.type = type; // 'spike', 'fire', 'meteor'
        this.damage = damage;
        this.timer = 0;
        this.isDead = false;
        this.damagedEntities = new Map(); // entity -> nextDamageTime

        switch (type) {
            case 'spike':
                this.radius = 28;
                this.warningTime = 1000;
                this.activeTime = 800;
                this.color = '#39ff14'; // Xanh lá neon
                break;
            case 'fire':
                this.radius = 35;
                this.warningTime = 1200;
                this.activeTime = 1500;
                this.color = '#ff7700'; // Cam neon
                break;
            case 'meteor':
                this.radius = 50;
                this.warningTime = 1200;
                this.activeTime = 0;
                this.color = '#ff3131'; // Đỏ neon
                this.startX = x + 300;
                this.startY = y - 450;
                break;
        }
    }

    update(deltaTime, gameEngine) {
        this.timer += deltaTime;
        const isWarning = this.timer < this.warningTime;
        const isActive = !isWarning && this.timer < (this.warningTime + this.activeTime);
        
        if (this.timer >= (this.warningTime + this.activeTime)) {
            if (this.type === 'meteor' && !this.isDead) {
                this.explode(gameEngine);
            }
            this.isDead = true;
            return;
        }

        if (isActive) {
            this.checkDamage(gameEngine);
        }
    }

    checkDamage(gameEngine) {
        const now = gameEngine.gameTime * 1000;
        
        // Sát thương Player
        const distToPlayer = Vector.dist(this.x, this.y, gameEngine.player.x, gameEngine.player.y);
        if (distToPlayer < this.radius + gameEngine.player.radius) {
            let nextDmg = this.damagedEntities.get(gameEngine.player) || 0;
            if (now >= nextDmg) {
                const damaged = gameEngine.player.takeDamage(this.damage);
                if (damaged) {
                    gameEngine.triggerScreenShake(8, 150);
                    gameEngine.floatingTexts.push(new FloatingText(gameEngine.player.x, gameEngine.player.y - 20, `-${this.damage}`, '#ff3131', 18));
                    gameEngine.spawnBloodParticles(gameEngine.player.x, gameEngine.player.y, '#ff3131');
                }
                this.damagedEntities.set(gameEngine.player, now + 500);
            }
        }

        // Sát thương Enemies
        gameEngine.enemies.forEach((enemy) => {
            if (enemy.hp > 0 && enemy.type !== 'mine') {
                const distToEnemy = Vector.dist(this.x, this.y, enemy.x, enemy.y);
                if (distToEnemy < this.radius + enemy.radius) {
                    let nextDmg = this.damagedEntities.get(enemy) || 0;
                    if (now >= nextDmg) {
                        const enemyDmg = this.type === 'spike' ? Math.floor(this.damage * 1.5) : this.damage;
                        enemy.hp -= enemyDmg;
                        enemy.applyKnockback(Vector.angle(this.x, this.y, enemy.x, enemy.y), 4);
                        gameEngine.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 15, `${enemyDmg}`, this.color, 15));
                        gameEngine.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 4);
                        this.damagedEntities.set(enemy, now + 500);
                    }
                }
            }
        });

        // Xử lý quái chết
        for (let j = gameEngine.enemies.length - 1; j >= 0; j--) {
            const enemy = gameEngine.enemies[j];
            if (enemy.hp <= 0) {
                gameEngine.onEnemyKilled(enemy, j);
            }
        }
    }

    explode(gameEngine) {
        sounds.playExplosion();
        gameEngine.triggerScreenShake(12, 250);
        gameEngine.blastRings.push(new BlastRing(this.x, this.y, this.radius, this.color));
        
        // Sát thương nổ lan Player
        const distToPlayer = Vector.dist(this.x, this.y, gameEngine.player.x, gameEngine.player.y);
        if (distToPlayer < this.radius + gameEngine.player.radius) {
            const damaged = gameEngine.player.takeDamage(this.damage);
            if (damaged) {
                gameEngine.floatingTexts.push(new FloatingText(gameEngine.player.x, gameEngine.player.y - 20, `-${this.damage}`, '#ff3131', 18));
                gameEngine.spawnBloodParticles(gameEngine.player.x, gameEngine.player.y, '#ff3131');
            }
        }

        // Sát thương nổ lan Enemies
        gameEngine.enemies.forEach((enemy) => {
            if (enemy.hp > 0 && enemy.type !== 'mine') {
                const distToEnemy = Vector.dist(this.x, this.y, enemy.x, enemy.y);
                if (distToEnemy < this.radius + enemy.radius) {
                    const enemyDmg = this.damage * 2;
                    enemy.hp -= enemyDmg;
                    enemy.applyKnockback(Vector.angle(this.x, this.y, enemy.x, enemy.y), 10);
                    gameEngine.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 15, `${enemyDmg}`, this.color, 16));
                    gameEngine.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 5);
                }
            }
        });

        // Xử lý quái chết
        for (let j = gameEngine.enemies.length - 1; j >= 0; j--) {
            const enemy = gameEngine.enemies[j];
            if (enemy.hp <= 0) {
                gameEngine.onEnemyKilled(enemy, j);
            }
        }

        // Hiệu ứng hạt
        for (let i = 0; i < 15; i++) {
            gameEngine.particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        const isWarning = this.timer < this.warningTime;
        const progress = this.timer / this.warningTime;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        if (isWarning) {
            // Vòng cảnh báo nhấp nháy phát sáng (Double-stroke)
            const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.08;
            
            // 1. Quầng sáng (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Viền chính (Solid Core)
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Tô nền mờ cảnh báo
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.15 * progress;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Vẽ thiên thạch rơi chéo từ trên không trung xuống (Double-draw)
            if (this.type === 'meteor') {
                ctx.restore();
                ctx.save();
                const mX = this.startX + (this.x - this.startX) * progress - camera.x;
                const mY = this.startY + (this.y - this.startY) * progress - camera.y;
                
                ctx.translate(mX, mY);
                ctx.rotate(Math.atan2(this.y - this.startY, this.x - this.startX));
                
                // 1. Quầng sáng thiên thạch (Outer Glow)
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, 24, 0, Math.PI * 2);
                ctx.fill();

                // 2. Lõi thiên thạch (Solid Core)
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Đuôi lửa thiên thạch
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(-10, -8);
                ctx.lineTo(-35 - Math.random() * 15, 0);
                ctx.lineTo(-10, 8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                ctx.save();
            }
        } else {
            // Trạng thái kích hoạt (Active)
            if (this.type === 'spike') {
                // Vẽ gai năng lượng sắc bén (Double-stroke)
                // 1. Quầng sáng (Outer Glow)
                ctx.globalAlpha = 0.25;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 8;
                ctx.beginPath();
                const spikeCount = 6;
                for (let i = 0; i < spikeCount; i++) {
                    const angle = (Math.PI * 2 / spikeCount) * i;
                    const px = Math.cos(angle) * this.radius;
                    const py = Math.sin(angle) * this.radius;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(px, py);
                    
                    const sideAngle1 = angle + Math.PI * 0.8;
                    const sideAngle2 = angle - Math.PI * 0.8;
                    ctx.lineTo(px + Math.cos(sideAngle1) * 8, py + Math.sin(sideAngle1) * 8);
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + Math.cos(sideAngle2) * 8, py + Math.sin(sideAngle2) * 8);
                }
                ctx.stroke();

                // 2. Viền chính (Solid Core)
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let i = 0; i < spikeCount; i++) {
                    const angle = (Math.PI * 2 / spikeCount) * i;
                    const px = Math.cos(angle) * this.radius;
                    const py = Math.sin(angle) * this.radius;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(px, py);
                    
                    const sideAngle1 = angle + Math.PI * 0.8;
                    const sideAngle2 = angle - Math.PI * 0.8;
                    ctx.lineTo(px + Math.cos(sideAngle1) * 8, py + Math.sin(sideAngle1) * 8);
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + Math.cos(sideAngle2) * 8, py + Math.sin(sideAngle2) * 8);
                }
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'fire') {
                // Cột lửa phun trào
                const opacity = 1 - ((this.timer - this.warningTime) / this.activeTime);
                ctx.globalAlpha = Math.max(0, opacity);
                
                // 1. Quầng sáng cột lửa (Outer Glow)
                ctx.fillStyle = 'rgba(255, 119, 0, 0.25)';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // 2. Thân lửa (Fire Body)
                ctx.fillStyle = '#ff7700';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();

                // 3. Lõi siêu nhiệt (Hot core)
                ctx.fillStyle = '#fffb00';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.35 * (1 + Math.random() * 0.1), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

// Pillar Entity (Chướng ngại vật cứng)
class Pillar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 45;
        this.color = '#475569'; // Sát xi xám đen
        this.neonColor = '#00f0ff'; // Neon xanh cyan phát sáng viền nhẹ
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        // 1. Quầng sáng cột bát giác (Outer Glow)
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = this.neonColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const px = Math.cos(angle) * this.radius;
            const py = Math.sin(angle) * this.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // 2. Thân cột chính (Solid Core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark center
        ctx.strokeStyle = this.neonColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const px = Math.cos(angle) * this.radius;
            const py = Math.sin(angle) * this.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vẽ họa tiết mạch điện bên trong cột
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = this.neonColor;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Explosive Barrel Entity (Thùng thuốc nổ)
class Barrel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.hp = 1; // 1 phát bắn là nổ
        this.color = '#ff3131'; // Neon đỏ cảnh báo nổ
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        // 1. Quầng sáng thùng (Outer Glow)
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Thùng chính (Solid Core)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(20, 10, 10, 0.9)';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;

        // Vẽ thùng hình tròn có vạch sọc chéo báo hiệu nguy hiểm
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vẽ dấu hiệu chéo hoặc chữ X
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.4, -this.radius * 0.4);
        ctx.lineTo(this.radius * 0.4, this.radius * 0.4);
        ctx.moveTo(this.radius * 0.4, -this.radius * 0.4);
        ctx.lineTo(-this.radius * 0.4, this.radius * 0.4);
        ctx.stroke();

        ctx.restore();
    }
}

// Visual Blast Ring for explosions
class BlastRing {
    constructor(x, y, maxRadius, color = '#ff3131') {
        this.x = x;
        this.y = y;
        this.currentRadius = 0;
        this.maxRadius = maxRadius;
        this.speed = 6;
        this.color = color;
        this.alpha = 1.0;
    }

    update(deltaTime) {
        this.currentRadius += this.speed * (deltaTime / 16.67) * 4;
        this.alpha = 1 - (this.currentRadius / this.maxRadius);
        return this.currentRadius >= this.maxRadius; // Trả về true khi nổ xong
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        const alpha = Math.max(0, this.alpha);
        
        // 1. Quầng sáng vụ nổ (Outer Glow)
        ctx.globalAlpha = alpha * 0.25;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Vòng nổ chính (Solid Core)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// --- 4. GAME ENGINE CLASS ---
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'UPGRADE', 'GAMEOVER'
        this.worldSize = 3000;
        
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.particles = [];
        this.floatingTexts = [];
        this.pillars = [];
        this.barrels = [];
        this.blastRings = [];
        this.homingMissiles = []; // Tên lửa tầm nhiệt đang bay
        this.swordSlashes = [];
        this.hammerWaves = [];
        
        // Hệ thống điều khiển Boss định kỳ
        this.bossSpawnInterval = 60; // Xuất hiện Boss mỗi 60 giây
        this.nextBossTime = 60;
        this.bossWarningActive = false;
        this.bossWarningTimer = 0;
        this.activeBoss = null;
        
        // Hệ thống Thiên tai địa hình định kỳ
        this.hazards = [];
        this.nextDisasterTime = 30; // Giây thứ 30 bắt đầu thiên tai đầu tiên
        this.disasterInterval = 60; // Thiên tai cách nhau 60 giây
        this.disasterActive = false;
        this.disasterTimer = 0;
        this.disasterType = ''; // 'earthquake', 'fire_vent', 'meteor_storm'
        this.disasterTickTimer = 0;
        
        // Quá trình nổ chuỗi của Boss
        this.bossDeathTimer = 0;
        this.bossDeathX = 0;
        this.bossDeathY = 0;
        
        this.camera = { x: 0, y: 0, width: 0, height: 0 };
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        
        this.gameTime = 0; // seconds
        this.kills = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // ms between enemy spawn
        
        // Screen Shake
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Magnet power-up state (Global pull)
        this.magnetPowerupTimer = 0;

        // Ghi nhận thời gian cuối cùng cập nhật để tính deltaTime
        this.lastTime = 0;

        // Nâng cấp hiện tại ngẫu nhiên hiển thị
        this.currentUpgradesPool = [];

        // Cache các DOM element thường xuyên được truy cập trong game loop (tránh getElementById mỗi frame)
        this._vignetteEl = null; // Sẽ được gán sau khi DOM sẵn sàng
        this._hudEls = {};
        this._wasLowHp = false;

        this.initResize();
        this.initInput();
        this.initButtons();
        this.loadHighScores();

        // Cache DOM refs sau khi tất cả sự kiện khởi tạo chạy xong
        this._vignetteEl = document.getElementById('low-hp-vignette');
        this._hudEls = {
            level: document.getElementById('hud-level-val'),
            xpFill: document.getElementById('hud-xp-fill'),
            hpText: document.getElementById('hud-hp-text'),
            hpFill: document.getElementById('hud-health-fill'),
            time: document.getElementById('hud-time-val'),
            kills: document.getElementById('hud-kills-val'),
            dashOverlay: document.getElementById('dash-cooldown-overlay'),
            shockwaveOverlay: document.getElementById('shockwave-cooldown-overlay'),
            badge: document.getElementById('active-powerup'),
            badgeName: document.getElementById('powerup-name'),
            badgeTimer: document.getElementById('powerup-timer'),
            bossHpContainer: document.getElementById('boss-hp-container'),
            bossHpFill: document.getElementById('boss-hp-fill'),
            bossHpText: document.getElementById('boss-hp-text'),
            bossWarning: document.getElementById('boss-warning-overlay'),
            bossCountdown: document.getElementById('boss-warning-countdown'),
        };
    }

    initResize() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    initInput() {
        // Phím di chuyển và kỹ năng
        window.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Chặn di chuyển trang web bằng phím mũi tên/space/E khi đang chơi
            if (['space', ' ', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && (this.state === 'PLAYING' || this.state === 'SUPER_UPGRADE')) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            
            if (key === 'p') {
                if (this.state === 'PLAYING') {
                    this.state = 'PAUSED';
                    sounds.stopMusic();
                    const pauseMenu = document.getElementById('pause-menu');
                    if (pauseMenu) pauseMenu.classList.remove('hidden');
                    if (this.bossWarningActive) {
                        const warningOverlay = document.getElementById('boss-warning-overlay');
                        if (warningOverlay) warningOverlay.classList.add('hidden');
                    }
                } else if (this.state === 'PAUSED') {
                    this.state = 'PLAYING';
                    sounds.startMusic();
                    const pauseMenu = document.getElementById('pause-menu');
                    if (pauseMenu) pauseMenu.classList.add('hidden');
                    this.lastTime = performance.now();
                    if (this.bossWarningActive) {
                        const warningOverlay = document.getElementById('boss-warning-overlay');
                        if (warningOverlay) warningOverlay.classList.remove('hidden');
                    }
                }
            }
        });

        // Nhắm & bắn chuột
        window.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', e => {
            if (e.button === 0) { // Click chuột trái
                this.mouse.isDown = true;
                sounds.init(); // Tránh các rào cản Autoplay âm thanh
            }
        });

        window.addEventListener('mouseup', e => {
            if (e.button === 0) {
                this.mouse.isDown = false;
            }
        });

        // Chặn menu chuột phải trong game để tránh gián đoạn trải nghiệm
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    initButtons() {
        // Lựa chọn Vai trò (RPG Classes)
        const roleCards = document.querySelectorAll('.role-card');
        const startBtn = document.getElementById('btn-start-game');
        this.selectedRole = 'fighter'; // Đấu sĩ được active mặc định

        // Thiết lập viền phát sáng mặc định của nút Start theo vai trò mặc định
        if (startBtn) {
            startBtn.className = 'btn-neon neon-yellow-border';
        }

        roleCards.forEach(card => {
            card.addEventListener('click', () => {
                roleCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedRole = card.getAttribute('data-role');
                
                // Thay đổi viền phát sáng của nút Start theo class được chọn
                if (startBtn) {
                    startBtn.className = 'btn-neon';
                    if (this.selectedRole === 'fighter') startBtn.classList.add('neon-yellow-border'); // Vàng gold/yellow
                    else if (this.selectedRole === 'mage') startBtn.classList.add('neon-purple-border'); // Tím
                    else if (this.selectedRole === 'ranger') startBtn.classList.add('neon-blue-border'); // Cyan
                    else if (this.selectedRole === 'assassin') startBtn.classList.add('neon-pink-border'); // Hồng
                }
            });
        });

        // Nút Start
        document.getElementById('btn-start-game').addEventListener('click', () => {
            sounds.init();
            this.startGame();
        });

        // Nút Restart
        document.getElementById('btn-restart-game').addEventListener('click', () => {
            this.startGame();
        });

        // Nút bật/tắt loa nhanh
        document.getElementById('btn-audio-toggle').addEventListener('click', () => {
            sounds.toggleMute();
        });

        // Nút Resume trong Pause Menu
        const resumeBtn = document.getElementById('btn-resume-game');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (this.state === 'PAUSED') {
                    this.state = 'PLAYING';
                    sounds.startMusic();
                    const pauseMenu = document.getElementById('pause-menu');
                    if (pauseMenu) pauseMenu.classList.add('hidden');
                    this.lastTime = performance.now();
                    if (this.bossWarningActive) {
                        const warningOverlay = document.getElementById('boss-warning-overlay');
                        if (warningOverlay) warningOverlay.classList.remove('hidden');
                    }
                }
            });
        }

        // Nút Chọn lại vai trò trong Pause Menu
        const backToMenuBtn = document.getElementById('btn-back-to-menu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.backToMainMenu();
            });
        }
    }

    loadHighScores() {
        this.highScores = JSON.parse(localStorage.getItem('cyber_trigger_scores')) || [];
        this.updateLeaderboardUI();
    }

    saveHighScore() {
        const score = {
            kills: this.kills,
            level: this.player.level,
            time: this.formatTime(this.gameTime),
            timestamp: new Date().toLocaleDateString('vi-VN')
        };

        this.highScores.push(score);
        // Sắp xếp theo số kills giảm dần
        this.highScores.sort((a, b) => b.kills - a.kills);
        // Giữ lại top 5 điểm cao nhất
        this.highScores = this.highScores.slice(0, 5);
        
        localStorage.setItem('cyber_trigger_scores', JSON.stringify(this.highScores));
        this.updateLeaderboardUI();
    }

    updateLeaderboardUI() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        
        list.innerHTML = '';
        if (this.highScores.length === 0) {
            list.innerHTML = '<li style="justify-content:center;">Chưa có điểm cao. Hãy là người đầu tiên!</li>';
            return;
        }

        this.highScores.forEach((score, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${idx + 1}. Level ${score.level} (${score.time}) - ${score.timestamp}</span>
                <span class="lb-score">${score.kills} KILLS</span>
            `;
            list.appendChild(li);
        });
    }

    triggerScreenShake(intensity, duration) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    onEnemyKilled(enemy, enemyIdx) {
        if (enemy.type === 'mine') {
            this.triggerMineExplosion(enemy.x, enemy.y);
            this.enemies.splice(enemyIdx, 1);
            return;
        }

        sounds.playExplosion();
        this.kills++;
        this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 12);
        this.triggerScreenShake(4, 100);

        const isBoss = (enemy instanceof Boss);
        let isLastBoss = false;
        
        if (isBoss) {
            if (enemy.silentDeath) {
                // Do nothing, silent death from split
            } else if (enemy.isClone) {
                const otherClonesAlive = this.enemies.some(e => e instanceof Boss && e.bossType === 'grid_infection' && e.isClone && e !== enemy && e.hp > 0);
                if (!otherClonesAlive) {
                    isLastBoss = true;
                }
            } else {
                isLastBoss = true;
            }
        }

        if (isLastBoss) {
            this.checkEnemyDeath(enemy);
        } else if (isBoss && !enemy.silentDeath) {
            this.spawnCollectable(enemy.x, enemy.y, enemy.xpValue * 1.5);
        } else if (!isBoss) {
            this.spawnCollectable(enemy.x, enemy.y, enemy.xpValue);
        }

        this.enemies.splice(enemyIdx, 1);
    }

    triggerMineExplosion(x, y) {
        sounds.playExplosion();
        this.triggerScreenShake(8, 150);
        const expRadius = 100;
        this.blastRings.push(new BlastRing(x, y, expRadius, '#ff9f00'));
        
        // Sát thương người chơi nếu trong tầm
        const dist = Vector.dist(x, y, this.player.x, this.player.y);
        if (dist < expRadius) {
            const damaged = this.player.takeDamage(20);
            if (damaged) {
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `-20`, '#ff3131', 18));
                this.spawnBloodParticles(this.player.x, this.player.y, '#ff3131');
            }
        }
        
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, '#ff9f00'));
        }
    }

    triggerMissileExplosionForPlayer(x, y, damage) {
        sounds.playExplosion();
        this.triggerScreenShake(8, 200);

        const expRadius = 90;
        this.blastRings.push(new BlastRing(x, y, expRadius, '#ff3131'));

        const dist = Vector.dist(x, y, this.player.x, this.player.y);
        if (dist < expRadius) {
            const damaged = this.player.takeDamage(damage);
            if (damaged) {
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `-${Math.floor(damage)}`, '#ff3131', 18));
                this.spawnBloodParticles(this.player.x, this.player.y, '#ff3131');
            }
        }

        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, '#ff3131'));
        }
    }

    startGame() {
        // Tạo lại các thực thể
        this.player = new Player(this.worldSize / 2, this.worldSize / 2, this.selectedRole);
        
        // Cập nhật màu sắc giao diện theo vai trò được chọn
        const xpLabel = document.querySelector('.xp-label');
        if (xpLabel) {
            xpLabel.style.color = this.player.color;
            xpLabel.style.textShadow = `0 0 5px ${this.player.color}`;
        }
        const xpFill = document.getElementById('hud-xp-fill');
        if (xpFill) {
            xpFill.style.background = `linear-gradient(90deg, ${this.player.color}, #ffffff)`;
            xpFill.style.boxShadow = `0 0 10px ${this.player.color}`;
        }

        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.particles = [];
        this.floatingTexts = [];
        this.pillars = [];
        this.barrels = [];
        this.blastRings = [];
        this.homingMissiles = [];
        this.swordSlashes = [];
        this.hammerWaves = [];
        this.activeShockwave = null;

        // Reset trạng thái Boss định kỳ
        this.nextBossTime = 60;
        this.bossWarningActive = false;
        this.bossWarningTimer = 0;
        this.activeBoss = null;
        this.bossDeathTimer = 0;
        this.bossDeathX = 0;
        this.bossDeathY = 0;

        // Reset trạng thái Thiên tai
        this.hazards = [];
        this.nextDisasterTime = 30;
        this.disasterActive = false;
        this.disasterTimer = 0;
        this.disasterType = '';
        this.disasterTickTimer = 0;

        // Tạo chướng ngại vật Cột Năng lượng ngẫu nhiên (tránh tâm bản đồ)
        for (let i = 0; i < 20; i++) {
            let px = Math.random() * (this.worldSize - 200) + 100;
            let py = Math.random() * (this.worldSize - 200) + 100;
            if (Vector.dist(px, py, this.worldSize / 2, this.worldSize / 2) < 250) {
                i--;
                continue;
            }
            let tooClose = false;
            for (let p of this.pillars) {
                if (Vector.dist(px, py, p.x, p.y) < 150) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) {
                i--;
                continue;
            }
            this.pillars.push(new Pillar(px, py));
        }

        // Tạo Thùng thuốc nổ ngẫu nhiên
        for (let i = 0; i < 15; i++) {
            let bx = Math.random() * (this.worldSize - 200) + 100;
            let by = Math.random() * (this.worldSize - 200) + 100;
            if (Vector.dist(bx, by, this.worldSize / 2, this.worldSize / 2) < 250) {
                i--;
                continue;
            }
            let tooClose = false;
            for (let p of this.pillars) {
                if (Vector.dist(bx, by, p.x, p.y) < 80) {
                    tooClose = true;
                    break;
                }
            }
            for (let b of this.barrels) {
                if (Vector.dist(bx, by, b.x, b.y) < 120) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) {
                i--;
                continue;
            }
            this.barrels.push(new Barrel(bx, by));
        }
        
        // Khởi tạo các hạt bụi vũ trụ neon (space dust stars)
        this.stars = [];
        const starColors = ['#00f0ff', '#ff007f', '#39ff14', '#ffffff', '#b026ff'];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.worldSize,
                y: Math.random() * this.worldSize,
                radius: 0.8 + Math.random() * 1.5,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                alpha: 0.12 + Math.random() * 0.3 // Độ sáng vừa phải làm nền cuốn trôi
            });
        }
        
        this.gameTime = 0;
        this.kills = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1600;
        this.magnetPowerupTimer = 0;
        
        // Reset phím chuột
        this.keys = {};
        this.mouse.isDown = false;
        
        // Chuyển màn hình UI
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('upgrade-menu').classList.add('hidden');
        document.getElementById('super-upgrade-menu').classList.add('hidden');
        document.getElementById('boss-warning-overlay').classList.add('hidden');
        document.getElementById('boss-hp-container').classList.add('hidden');
        document.getElementById('low-hp-vignette').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');

        // Bắt đầu phát nhạc / âm thanh game
        sounds.playLevelUp();
        sounds.startMusic();

        this.state = 'PLAYING';
        this.lastTime = performance.now();
        
        // Gọi game loop
        requestAnimationFrame((time) => this.loop(time));
    }

    gameOver() {
        this.state = 'GAMEOVER';
        
        sounds.stopMusic();
        sounds.playExplosion();
        this.saveHighScore();

        // Cập nhật thống kê màn hình Game Over
        document.getElementById('final-time').textContent = this.formatTime(this.gameTime);
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('final-level').textContent = `Level ${this.player.level}`;

        // Hiển thị UI kết thúc
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('game-over-menu').classList.remove('hidden');
    }

    backToMainMenu() {
        this.state = 'MENU';
        sounds.stopMusic();
        
        // Ẩn tất cả các overlay game khác
        const elementsToHide = [
            'pause-menu',
            'game-hud',
            'game-over-menu',
            'upgrade-menu',
            'super-upgrade-menu',
            'boss-warning-overlay',
            'boss-hp-container',
            'low-hp-vignette'
        ];
        elementsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        
        // Hiện màn hình menu chọn vai trò
        const startMenu = document.getElementById('start-menu');
        if (startMenu) startMenu.classList.remove('hidden');
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // --- GAME LOOP ---
    loop(currentTime) {
        if (this.state !== 'PLAYING' && this.state !== 'UPGRADE' && this.state !== 'SUPER_UPGRADE' && this.state !== 'PAUSED') return;

        let deltaTime = currentTime - this.lastTime;
        // Chặn deltaTime quá lớn khi người dùng tab-out trình duyệt
        if (deltaTime > 100) deltaTime = 16.67; 
        this.lastTime = currentTime;

        if (this.state === 'PLAYING') {
            this.update(deltaTime);
        }
        
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }

    // --- UPDATE STATE LOGIC ---
    update(deltaTime) {
        // Cập nhật viền đỏ Vignette nhấp nháy khi máu thấp dưới 30% (cache ref)
        const isLowHp = this.player.hp / this.player.maxHp < 0.3;
        if (isLowHp !== this._wasLowHp) {
            this._wasLowHp = isLowHp;
            if (this._vignetteEl) {
                if (isLowHp) this._vignetteEl.classList.remove('hidden');
                else this._vignetteEl.classList.add('hidden');
            }
        }

        // Cập nhật bộ đếm thời gian
        this.gameTime += deltaTime / 1000;

        // Xử lý Thiên tai địa hình định kỳ
        if (this.gameTime >= this.nextDisasterTime && !this.disasterActive) {
            this.disasterActive = true;
            this.disasterTimer = 6000; // 6 giây thiên tai
            this.disasterTickTimer = 0;
            
            const types = ['earthquake', 'fire_vent', 'meteor_storm'];
            this.disasterType = types[Math.floor(Math.random() * types.length)];
            this.nextDisasterTime += this.disasterInterval;
            
            // Âm thanh báo động thiên tai
            sounds.playLevelUp();
            
            const disasterNames = {
                'earthquake': 'ĐỘNG ĐẤT / EARTHQUAKE ALERT!',
                'fire_vent': 'LỬA PHUN TRÀO / VOLCANIC ERUPTION!',
                'meteor_storm': 'MƯA ĐÁ CYBER / METEOR STORM!'
            };
            const disasterColors = {
                'earthquake': '#39ff14',
                'fire_vent': '#ff7700',
                'meteor_storm': '#ff3131'
            };
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 60, disasterNames[this.disasterType], disasterColors[this.disasterType], 22));
        }

        if (this.disasterActive) {
            this.disasterTimer -= deltaTime;
            this.disasterTickTimer += deltaTime;

            if (this.disasterType === 'earthquake') {
                this.triggerScreenShake(3, 50);
                if (this.disasterTickTimer >= 1000) {
                    this.disasterTickTimer = 0;
                    // Sinh 3 gai nhọn quanh player/quái
                    for (let k = 0; k < 3; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 200;
                        const hx = this.player.x + Math.cos(angle) * dist;
                        const hy = this.player.y + Math.sin(angle) * dist;
                        this.hazards.push(new Hazard(hx, hy, 'spike', 25));
                    }
                }
            } else if (this.disasterType === 'fire_vent') {
                if (this.disasterTickTimer >= 800) {
                    this.disasterTickTimer = 0;
                    // Sinh 2 cột lửa phun quanh player
                    for (let k = 0; k < 2; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 250;
                        const hx = this.player.x + Math.cos(angle) * dist;
                        const hy = this.player.y + Math.sin(angle) * dist;
                        this.hazards.push(new Hazard(hx, hy, 'fire', 15));
                    }
                }
            } else if (this.disasterType === 'meteor_storm') {
                if (this.disasterTickTimer >= 600) {
                    this.disasterTickTimer = 0;
                    // Sinh 2 meteor quanh player
                    for (let k = 0; k < 2; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 350;
                        const hx = this.player.x + Math.cos(angle) * dist;
                        const hy = this.player.y + Math.sin(angle) * dist;
                        this.hazards.push(new Hazard(hx, hy, 'meteor', 30));
                    }
                }
            }

            if (this.disasterTimer <= 0) {
                this.disasterActive = false;
            }
        }

        // Cập nhật các Mối nguy hiểm (Hazards)
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            this.hazards[i].update(deltaTime, this);
            if (this.hazards[i].isDead) {
                this.hazards.splice(i, 1);
            }
        }

        // Xử lý Cảnh báo Boss & Spawn Boss định kỳ mỗi 60 giây
        if (this.gameTime >= this.nextBossTime && !this.bossWarningActive) {
            this.bossWarningActive = true;
            this.bossWarningTimer = 3000; // 3 giây nhấp nháy còi báo
            this.nextBossTime += this.bossSpawnInterval; // Đặt mốc thời gian tiếp theo
            sounds.playLevelUp(); // Siren warning
        }

        if (this.bossWarningActive) {
            this.bossWarningTimer -= deltaTime;
            const warningOverlay = document.getElementById('boss-warning-overlay');
            if (warningOverlay) {
                warningOverlay.classList.remove('hidden');
                document.getElementById('boss-warning-countdown').textContent = Math.ceil(this.bossWarningTimer / 1000);
            }
            if (this.bossWarningTimer <= 0) {
                if (warningOverlay) warningOverlay.classList.add('hidden');
                this.bossWarningActive = false;
                
                // Spawn Boss ngay gần phi thuyền
                const angle = Math.random() * Math.PI * 2;
                const bx = this.player.x + Math.cos(angle) * 350;
                const by = this.player.y + Math.sin(angle) * 350;
                
                // Chọn ngẫu nhiên loại Boss
                this.activeBoss = new Boss(bx, by);
                this.enemies.push(this.activeBoss);
                sounds.playLevelUp();
            }
        }

        // Cập nhật thanh HP Boss và Tên/Màu sắc động
        const bossHpContainer = document.getElementById('boss-hp-container');
        if (this.activeBoss && this.activeBoss.hp > 0) {
            if (bossHpContainer) {
                bossHpContainer.classList.remove('hidden');
                const bossHpPct = (this.activeBoss.hp / this.activeBoss.maxHp) * 100;
                
                const hpFill = document.getElementById('boss-hp-fill');
                if (hpFill) {
                    hpFill.style.width = `${bossHpPct}%`;
                    hpFill.style.backgroundColor = this.activeBoss.color;
                    hpFill.style.boxShadow = `0 0 10px ${this.activeBoss.color}`;
                }
                
                const bossNameEl = bossHpContainer.querySelector('.boss-name');
                if (bossNameEl) {
                    bossNameEl.textContent = `⚠️ CRITICAL TARGET: ${this.activeBoss.name} ⚠️`;
                    bossNameEl.style.color = this.activeBoss.color;
                    bossNameEl.style.textShadow = `0 0 5px ${this.activeBoss.color}`;
                }
                
                document.getElementById('boss-hp-text').textContent = `${Math.ceil(this.activeBoss.hp)} / ${this.activeBoss.maxHp}`;
            }
        } else {
            if (bossHpContainer) bossHpContainer.classList.add('hidden');
        }

        // Quá trình nổ chuỗi của Boss sau khi bị hạ gục
        if (this.bossDeathTimer > 0) {
            this.bossDeathTimer -= deltaTime;
            if (Math.floor(this.bossDeathTimer / 150) % 2 === 0 && Math.random() < 0.6) {
                sounds.playHit();
                const ox = this.bossDeathX + (Math.random() - 0.5) * 100;
                const oy = this.bossDeathY + (Math.random() - 0.5) * 100;
                this.spawnBloodParticles(ox, oy, '#fffb00', 4);
                this.particles.push(new Particle(ox, oy, '#fffb00'));
            }
            if (this.bossDeathTimer <= 0) {
                sounds.playExplosion();
                this.triggerScreenShake(22, 450);
                this.blastRings.push(new BlastRing(this.bossDeathX, this.bossDeathY, 165, '#fffb00'));
                for (let i = 0; i < 22; i++) {
                    this.particles.push(new Particle(this.bossDeathX, this.bossDeathY, '#fffb00'));
                }
                // Spawn rương Siêu cấp tại vị trí chết của Boss
                this.items.push(new Item(this.bossDeathX, this.bossDeathY, 'chest'));
            }
        }
        
        // Cập nhật Timer nhặt nam châm hút toàn bản đồ
        if (this.magnetPowerupTimer > 0) {
            this.magnetPowerupTimer -= deltaTime;
        }

        // Kiểm tra phím kỹ năng nhanh
        if (this.keys['space'] || this.keys[' ']) {
            this.keys['space'] = false;
            this.keys[' '] = false;
            this.triggerDash();
        }
        if (this.keys['e']) {
            this.keys['e'] = false;
            this.triggerShockwave();
        }

        // Cập nhật Shockwave nổ EMP nếu có hoạt động
        if (this.activeShockwave) {
            this.activeShockwave.currentRadius += this.activeShockwave.speed * (deltaTime / 16.67) * 4.5;
            if (this.activeShockwave.currentRadius >= this.activeShockwave.maxRadius) {
                this.activeShockwave = null;
            }
        }

        // Cập nhật vòng nổ (Blast Rings) của thùng thuốc nổ
        for (let i = this.blastRings.length - 1; i >= 0; i--) {
            const complete = this.blastRings[i].update(deltaTime);
            if (complete) {
                this.blastRings.splice(i, 1);
            }
        }

        // Cập nhật người chơi
        this.player.update(this.keys, this.mouse, this.canvas.width, this.canvas.height, this.camera, deltaTime);

        // Xử lý va chạm chướng ngại vật cho Người chơi (Pillars và Barrels)
        this.pillars.forEach(p => {
            const dist = Vector.dist(this.player.x, this.player.y, p.x, p.y);
            const minDist = this.player.radius + p.radius;
            if (dist < minDist) {
                const angle = Vector.angle(p.x, p.y, this.player.x, this.player.y);
                const overlap = minDist - dist;
                this.player.x += Math.cos(angle) * overlap;
                this.player.y += Math.sin(angle) * overlap;
            }
        });
        this.barrels.forEach(b => {
            const dist = Vector.dist(this.player.x, this.player.y, b.x, b.y);
            const minDist = this.player.radius + b.radius;
            if (dist < minDist) {
                const angle = Vector.angle(b.x, b.y, this.player.x, this.player.y);
                const overlap = minDist - dist;
                this.player.x += Math.cos(angle) * overlap;
                this.player.y += Math.sin(angle) * overlap;
            }
        });

        // Xử lý va chạm chướng ngại vật cho kẻ địch
        this.enemies.forEach(enemy => {
            this.pillars.forEach(p => {
                const dist = Vector.dist(enemy.x, enemy.y, p.x, p.y);
                const minDist = enemy.radius + p.radius;
                if (dist < minDist) {
                    const angle = Vector.angle(p.x, p.y, enemy.x, enemy.y);
                    const overlap = minDist - dist;
                    enemy.x += Math.cos(angle) * overlap;
                    enemy.y += Math.sin(angle) * overlap;
                }
            });
            this.barrels.forEach(b => {
                const dist = Vector.dist(enemy.x, enemy.y, b.x, b.y);
                const minDist = enemy.radius + b.radius;
                if (dist < minDist) {
                    const angle = Vector.angle(b.x, b.y, enemy.x, enemy.y);
                    const overlap = minDist - dist;
                    enemy.x += Math.cos(angle) * overlap;
                    enemy.y += Math.sin(angle) * overlap;
                }
            });
        });

        const now = performance.now();
        const modifiedFireRate = this.player.fireRate * Math.pow(0.8, this.player.upgrades.fireRate);

        // 1. Tự động cận chiến quét kiếm khi quái tới gần cho Sát thủ (Assassin)
        if (this.player.role === 'assassin') {
            let closestEnemy = null;
            let minDist = 110 + this.player.upgrades.magnet * 10; // bán kính 110px

            this.enemies.forEach(enemy => {
                const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < minDist) {
                    minDist = dist;
                    closestEnemy = enemy;
                }
            });

            if (closestEnemy && now - this.player.lastShotTime >= modifiedFireRate) {
                this.player.lastShotTime = now;
                const attackAngle = Vector.angle(this.player.x, this.player.y, closestEnemy.x, closestEnemy.y);
                this.triggerSwordSlash(attackAngle);
            }
        }

        // 2. Tấn công chủ động khi đè chuột trái
        if (this.mouse.isDown) {
            if (now - this.player.lastShotTime >= modifiedFireRate) {
                this.player.lastShotTime = now;
                
                if (this.player.role === 'assassin') {
                    this.triggerSwordSlash(this.player.angle);
                } else if (this.player.role === 'fighter') {
                    this.triggerHammerSmash(this.player.angle);
                } else {
                    this.shootBullet();
                }
            }
        }

        // Cập nhật Camera (bám sát nhân vật, giữ khoảng cách tâm màn hình)
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        
        // Giới hạn Camera trong bản đồ World Size (3000 x 3000)
        this.camera.x = Math.max(0, Math.min(this.worldSize - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.worldSize - this.canvas.height, this.camera.y));

        // Cập nhật Hạt nổ (Particles)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Cập nhật số trôi (Floating Texts)
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update();
            if (this.floatingTexts[i].alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Cập nhật Vật phẩm (Items)
        const isMagnetActive = (this.magnetPowerupTimer > 0);
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(this.player, isMagnetActive, deltaTime);
            
            // Va chạm nhặt vật phẩm
            if (Vector.dist(item.x, item.y, this.player.x, this.player.y) < this.player.radius + item.radius) {
                this.collectItem(item);
                this.items.splice(i, 1);
            }
        }

        // Cập nhật Đạn (Bullets)
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            
            // Sinh vệt lửa bập bùng cho đạn Pháp sư — chỉ khi particles < 200
            if (bullet.isOrb && bullet.isPlayerBullet && this.particles.length < 200) {
                if (Math.random() < 0.25) { // Giảm từ 50% xuống 25%
                    const colors = ['#b026ff', '#ff007f', '#ff7700'];
                    const randColor = colors[Math.floor(Math.random() * colors.length)];
                    this.particles.push(new Particle(bullet.x - bullet.vx * 0.4, bullet.y - bullet.vy * 0.4, randColor));
                }
            }
            
            // Hủy đạn khi hết thời gian bay
            if (bullet.life <= 0) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Hủy đạn khi vượt quá biên thế giới
            if (bullet.x < 0 || bullet.x > this.worldSize || bullet.y < 0 || bullet.y > this.worldSize) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Kiểm tra va chạm với Cột Năng lượng
            let bulletCollided = false;
            for (let p of this.pillars) {
                if (Vector.dist(bullet.x, bullet.y, p.x, p.y) < bullet.radius + p.radius) {
                    this.bullets.splice(i, 1);
                    bulletCollided = true;
                    this.spawnBloodParticles(bullet.x, bullet.y, p.neonColor, 3);
                    break;
                }
            }
            if (bulletCollided) continue;

            // Kiểm tra va chạm với Thùng thuốc nổ
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                if (Vector.dist(bullet.x, bullet.y, b.x, b.y) < bullet.radius + b.radius) {
                    this.bullets.splice(i, 1);
                    bulletCollided = true;
                    b.hp--;
                    if (b.hp <= 0) {
                        this.triggerBarrelExplosion(b.x, b.y);
                        this.barrels.splice(j, 1);
                    } else {
                        this.spawnBloodParticles(bullet.x, bullet.y, b.color, 3);
                    }
                    break;
                }
            }
            if (bulletCollided) continue;

            // Xử lý va chạm đạn
            let bulletRemoved = false;
            if (bullet.isPlayerBullet) {
                // Đạn người chơi bắn trúng quái vật
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dist = Vector.dist(bullet.x, bullet.y, enemy.x, enemy.y);
                    
                    // Khiên chắn phản/triệt tiêu đạn của Neon Vortex
                    if (enemy instanceof Boss && enemy.bossType === 'neon_vortex' && enemy.bossState === 'SHIELD_UP') {
                        if (dist < 95 + bullet.radius) {
                            if (Math.random() < 0.6) { // 60% cơ hội triệt tiêu đạn
                                this.bullets.splice(i, 1);
                                bulletRemoved = true;
                                this.spawnBloodParticles(bullet.x, bullet.y, '#b026ff', 3);
                                break;
                            }
                        }
                    }
                    
                    if (dist < bullet.radius + enemy.radius) {
                        this.damageEnemy(enemy, bullet.damage, bullet.vx, bullet.vy, j, bullet);
                        this.bullets.splice(i, 1);
                        bulletRemoved = true;
                        break;
                    }
                }
            } else {
                // Đạn quái vật bắn trúng người chơi
                if (Vector.dist(bullet.x, bullet.y, this.player.x, this.player.y) < bullet.radius + this.player.radius) {
                    const damaged = this.player.takeDamage(bullet.damage);
                    if (damaged) {
                        this.triggerScreenShake(8, 200);
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `-${bullet.damage}`, '#ff3131', 18));
                        this.spawnBloodParticles(this.player.x, this.player.y, '#ff3131');
                    }
                    this.bullets.splice(i, 1);
                    bulletRemoved = true;
                }
            }

            if (bulletRemoved) continue;
        }

        // Cập nhật và Xử lý va chạm cho Nhát Chém (SwordSlashes)
        for (let i = this.swordSlashes.length - 1; i >= 0; i--) {
            const slash = this.swordSlashes[i];
            slash.update(deltaTime);

            if (slash.life <= 0) {
                this.swordSlashes.splice(i, 1);
                continue;
            }

            // Gây sát thương quái trong phạm vi chém (quét ngược tránh lỗi index khi splice)
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < slash.radius + enemy.radius) {
                    const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                    let diff = Math.abs(angleToEnemy - slash.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;
                    
                    if (diff < Math.PI / 3) { // Trong góc 60 độ mỗi bên = 120 độ
                        if (!slash.hitEnemies.has(enemy)) {
                            slash.hitEnemies.add(enemy);
                            const vx = Math.cos(slash.angle) * 5;
                            const vy = Math.sin(slash.angle) * 5;
                            this.damageEnemy(enemy, slash.damage, vx, vy, j, { isDagger: true });
                        }
                    }
                }
            }

            // Triệt tiêu đạn quái trong nhát chém
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                if (!bullet.isPlayerBullet) {
                    const dist = Vector.dist(this.player.x, this.player.y, bullet.x, bullet.y);
                    if (dist < slash.radius + bullet.radius) {
                        const angleToBullet = Math.atan2(bullet.y - this.player.y, bullet.x - this.player.x);
                        let diff = Math.abs(angleToBullet - slash.angle);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;
                        
                        if (diff < Math.PI / 3) {
                            this.bullets.splice(j, 1);
                            this.spawnBloodParticles(bullet.x, bullet.y, slash.color, 3);
                        }
                    }
                }
            }
        }

        // Cập nhật và Xử lý va chạm cho Sóng Búa (HammerWaves)
        for (let i = this.hammerWaves.length - 1; i >= 0; i--) {
            const wave = this.hammerWaves[i];
            wave.update(deltaTime);

            if (wave.life <= 0) {
                this.hammerWaves.splice(i, 1);
                continue;
            }

            // Gây sát thương quái trong sóng xung kích
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < wave.radius + enemy.radius && dist > wave.radius - 50 - enemy.radius) {
                    const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                    let diff = Math.abs(angleToEnemy - wave.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;

                    if (wave.is360 || diff < Math.PI / 4) { // Góc 45 độ mỗi bên = 90 độ
                        if (!wave.hitEnemies.has(enemy)) {
                            wave.hitEnemies.add(enemy);
                            // Lực đẩy tỏa đều từ tâm nếu là 360 độ
                            const forceAngle = wave.is360 ? angleToEnemy : wave.angle;
                            const vx = Math.cos(forceAngle) * 15;
                            const vy = Math.sin(forceAngle) * 15;
                            this.damageEnemy(enemy, wave.damage, vx, vy, j, { isHeavy: true });
                        }
                    }
                }
            }

            // Triệt tiêu đạn quái trong sóng búa
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                if (!bullet.isPlayerBullet) {
                    const dist = Vector.dist(this.player.x, this.player.y, bullet.x, bullet.y);
                    if (dist < wave.radius + bullet.radius && dist > wave.radius - 50 - bullet.radius) {
                        const angleToBullet = Math.atan2(bullet.y - this.player.y, bullet.x - this.player.x);
                        let diff = Math.abs(angleToBullet - wave.angle);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;

                        if (wave.is360 || diff < Math.PI / 4) {
                            this.bullets.splice(j, 1);
                            this.spawnBloodParticles(bullet.x, bullet.y, wave.color, 3);
                        }
                    }
                }
            }
        }

        // Cập nhật Kẻ địch (Enemies)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.player, this.bullets, deltaTime, this);

            // Xử lý nổ mìn nếu mìn hết máu
            if (enemy.type === 'mine' && enemy.hp <= 0) {
                this.onEnemyKilled(enemy, i);
                continue;
            }

            // Va chạm chạm quái vật đè lên người chơi
            const dist = Vector.dist(enemy.x, enemy.y, this.player.x, this.player.y);
            if (dist < enemy.radius + this.player.radius) {
                if (enemy.type === 'mine') {
                    this.onEnemyKilled(enemy, i);
                    continue;
                }
                
                const damaged = this.player.takeDamage(enemy.damage);
                if (damaged) {
                    this.triggerScreenShake(12, 250);
                    this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `-${enemy.damage}`, '#ff3131', 18));
                    this.spawnBloodParticles(this.player.x, this.player.y, '#ff3131');
                }
                
                // Đẩy nhẹ quái vật ra khi va chạm với người chơi để tránh kẹt dính
                const pushAngle = Vector.angle(this.player.x, this.player.y, enemy.x, enemy.y);
                enemy.applyKnockback(pushAngle, 8);
            }

            // Va chạm đẩy nhau giữa quái vật (Crowd Separation)
            for (let j = i - 1; j >= 0; j--) {
                const other = this.enemies[j];
                // Không đẩy mìn tĩnh
                if (enemy.type === 'mine' || other.type === 'mine') continue;
                
                const d = Vector.dist(enemy.x, enemy.y, other.x, other.y);
                const minDist = enemy.radius + other.radius;
                if (d < minDist) {
                    const angle = Vector.angle(other.x, other.y, enemy.x, enemy.y);
                    const overlap = minDist - d;
                    // Đẩy nhau ra hai hướng đối xứng để tránh quái đi xuyên qua nhau
                    enemy.x += Math.cos(angle) * overlap * 0.5;
                    enemy.y += Math.sin(angle) * overlap * 0.5;
                    other.x -= Math.cos(angle) * overlap * 0.5;
                    other.y -= Math.sin(angle) * overlap * 0.5;
                }
            }
        }

        // Sinh quái vật tự động theo thời gian (Tạm dừng khi đang chiến đấu Boss)
        const hasBoss = this.enemies.some(e => e instanceof Boss);
        if (!this.bossWarningActive && !hasBoss && this.bossDeathTimer <= 0) {
            this.spawnTimer += deltaTime;
            const adjustedInterval = Math.max(400, this.spawnInterval - Math.floor(this.gameTime / 15) * 80);
            
            if (this.spawnTimer >= adjustedInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
        }

        // --- CẬP NHẬT HỆ THỐNG VŨ KHÍ PHỤ ---

        // 1. Lá chắn năng lượng xoay vòng (Orbiting Shield)
        if (this.player.subWeapons.orbitingShield > 0) {
            const N = this.player.subWeapons.orbitingShield;
            this.player.shieldAngle += 0.04 * (deltaTime / 16.67);

            for (let i = 0; i < N; i++) {
                const angle = this.player.shieldAngle + (Math.PI * 2 / N) * i;
                const sx = this.player.x + Math.cos(angle) * 75;
                const sy = this.player.y + Math.sin(angle) * 75;

                // Va chạm lưỡi dao chém kẻ địch
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (Vector.dist(sx, sy, enemy.x, enemy.y) < enemy.radius + 15) {
                        if (!enemy.shieldHitTimer) enemy.shieldHitTimer = 0;
                        if (enemy.shieldHitTimer <= 0) {
                            enemy.shieldHitTimer = 300; // Cooldown chém 0.3s mỗi quái
                            const shieldDmg = 12 + N * 3;
                            this.damageEnemy(enemy, shieldDmg, Math.cos(angle), Math.sin(angle), j);
                        }
                    }
                }
            }
        }

        // 2. Tên lửa tầm nhiệt (Homing Missile)
        if (this.player.subWeapons.homingMissile > 0) {
            this.player.missileTimer += deltaTime;
            const missileInterval = [0, 3000, 2000, 1200, 700][Math.min(4, this.player.subWeapons.homingMissile)];

            if (this.player.missileTimer >= missileInterval) {
                this.player.missileTimer = 0;
                
                // Tìm quái gần phi thuyền nhất để nhắm bắn
                let nearest = null;
                let minDist = 650;
                this.enemies.forEach(enemy => {
                    if (enemy.hp > 0) {
                        const d = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                        if (d < minDist) {
                            minDist = d;
                            nearest = enemy;
                        }
                    }
                });

                if (nearest) {
                    this.homingMissiles.push(new HomingMissile(
                        this.player.x,
                        this.player.y,
                        nearest,
                        35 + this.player.subWeapons.homingMissile * 15
                    ));
                    sounds.playShoot();
                }
            }
        }

        // Cập nhật tọa độ bay & va chạm của các tên lửa
        for (let i = this.homingMissiles.length - 1; i >= 0; i--) {
            const m = this.homingMissiles[i];
            
            if (m.isEnemyMissile) {
                m.update(null, deltaTime, this);
            } else {
                m.update(this.enemies, deltaTime, this);
            }

            if (m.life <= 0 || m.x < 0 || m.x > this.worldSize || m.y < 0 || m.y > this.worldSize) {
                this.homingMissiles.splice(i, 1);
                continue;
            }

            // Va chạm cột năng lượng
            let col = false;
            for (let p of this.pillars) {
                if (Vector.dist(m.x, m.y, p.x, p.y) < m.radius + p.radius) {
                    if (m.isEnemyMissile) {
                        this.triggerMissileExplosionForPlayer(m.x, m.y, m.damage);
                    } else {
                        this.triggerMissileExplosion(m.x, m.y, m.damage);
                    }
                    this.homingMissiles.splice(i, 1);
                    col = true;
                    break;
                }
            }
            if (col) continue;

            // Va chạm thùng thuốc nổ
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                if (Vector.dist(m.x, m.y, b.x, b.y) < m.radius + b.radius) {
                    if (m.isEnemyMissile) {
                        this.triggerMissileExplosionForPlayer(m.x, m.y, m.damage);
                    } else {
                        this.triggerMissileExplosion(m.x, m.y, m.damage);
                    }
                    this.homingMissiles.splice(i, 1);
                    col = true;
                    b.hp--;
                    if (b.hp <= 0) {
                        this.triggerBarrelExplosion(b.x, b.y);
                        this.barrels.splice(j, 1);
                    }
                    break;
                }
            }
            if (col) continue;

            // Va chạm thực thể người chơi hoặc quái vật tùy thuộc nguồn phóng
            if (m.isEnemyMissile) {
                if (Vector.dist(m.x, m.y, this.player.x, this.player.y) < m.radius + this.player.radius) {
                    this.triggerMissileExplosionForPlayer(m.x, m.y, m.damage);
                    this.homingMissiles.splice(i, 1);
                }
            } else {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (Vector.dist(m.x, m.y, enemy.x, enemy.y) < m.radius + enemy.radius) {
                        this.triggerMissileExplosion(m.x, m.y, m.damage);
                        this.homingMissiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // 3. Drone hộ tống bắn tia laser (Laser Drone)
        if (this.player.subWeapons.laserDrone > 0) {
            // Cập nhật vị trí Drone bay bồng bềnh
            const targetX = this.player.x - Math.cos(this.player.angle) * 45;
            const targetY = this.player.y - Math.sin(this.player.angle) * 45;
            this.player.droneX += (targetX - this.player.droneX) * 0.08 * (deltaTime / 16.67);
            this.player.droneY += (targetY - this.player.droneY) * 0.08 * (deltaTime / 16.67);

            this.player.droneTimer += deltaTime;
            const droneInterval = [0, 1500, 1000, 650, 450][Math.min(4, this.player.subWeapons.laserDrone)];

            if (this.player.droneTimer >= droneInterval) {
                this.player.droneTimer = 0;
                
                // Nhắm bắn quái
                let nearest = null;
                let minDist = 480;
                this.enemies.forEach(enemy => {
                    if (enemy.hp > 0) {
                        const d = Vector.dist(this.player.droneX, this.player.droneY, enemy.x, enemy.y);
                        if (d < minDist) {
                            minDist = d;
                            nearest = enemy;
                        }
                    }
                });

                if (nearest) {
                    const angle = Vector.angle(this.player.droneX, this.player.droneY, nearest.x, nearest.y);
                    const vx = Math.cos(angle) * 11;
                    const vy = Math.sin(angle) * 11;
                    this.bullets.push(new Bullet(
                        this.player.droneX,
                        this.player.droneY,
                        vx,
                        vy,
                        6,
                        10 + this.player.subWeapons.laserDrone * 5,
                        '#39ff14', // Neon Green laser
                        true
                    ));
                    sounds.playShoot();
                }
            }
        }

        // Cập nhật trạng thái Rung màn hình
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
        }

        // Kiểm tra Game Over
        if (this.player.hp <= 0) {
            this.gameOver();
        }

        // Cập nhật HUD hiển thị trực quan
        this.updateHUD();
    }

    // --- TRIGGER ACTIVE SKILLS ---
    triggerDash() {
        if (this.player.dashCooldown > 0 || this.state !== 'PLAYING') return;

        // Xác định hướng di chuyển hiện tại
        let dx = 0;
        let dy = 0;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        // Nếu không bấm phím di chuyển nào, Dash hướng phi thuyền đang hướng tới
        let dashAngle = this.player.angle;
        if (dx !== 0 || dy !== 0) {
            dashAngle = Math.atan2(dy, dx);
        }

        const dashDistance = 140;
        const startX = this.player.x;
        const startY = this.player.y;

        // Dịch chuyển người chơi
        this.player.x += Math.cos(dashAngle) * dashDistance;
        this.player.y += Math.sin(dashAngle) * dashDistance;

        // Giới hạn trong bản đồ thế giới
        const margin = this.player.radius + 10;
        this.player.x = Math.max(margin, Math.min(3000 - margin, this.player.x));
        this.player.y = Math.max(margin, Math.min(3000 - margin, this.player.y));

        // Kích hoạt hồi chiêu và bất tử tạm thời
        this.player.dashCooldown = this.player.dashCooldownMax;
        this.player.iframe = 250; // Bất tử 0.25 giây khi lướt

        // Tạo bóng mờ dọc theo đường lướt
        for (let i = 1; i <= 4; i++) {
            const ratio = i / 4;
            this.player.ghostTrails.push({
                x: startX + (this.player.x - startX) * ratio,
                y: startY + (this.player.y - startY) * ratio,
                angle: this.player.angle,
                alpha: 0.6 * ratio
            });
        }

        // Tạo hạt hiệu ứng lướt lấp lánh tại điểm bắt đầu
        this.spawnBloodParticles(startX, startY, '#00f0ff', 10);
        sounds.playDash();
    }

    checkEnemyDeath(enemy) {
        if (enemy instanceof Boss) {
            this.bossDeathTimer = 1500;
            this.bossDeathX = enemy.x;
            this.bossDeathY = enemy.y;
            this.activeBoss = null;
            const bossHpContainer = document.getElementById('boss-hp-container');
            if (bossHpContainer) bossHpContainer.classList.add('hidden');
        }
    }

    triggerShockwave() {
        if (this.player.shockwaveCooldown > 0 || this.state !== 'PLAYING') return;

        // Thiết lập hồi chiêu
        this.player.shockwaveCooldown = this.player.shockwaveCooldownMax;

        // Tạo một đối tượng Shockwave trong game để vẽ vòng tròn nở ra
        const waveRadius = 250;
        this.activeShockwave = {
            x: this.player.x,
            y: this.player.y,
            currentRadius: 0,
            maxRadius: waveRadius,
            speed: 8, // Tốc độ lan ra
            color: '#b026ff' // Tím neon
        };

        sounds.playShockwave();
        this.triggerScreenShake(15, 300);

        // 1. Phá đạn địch trong phạm vi 250px
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.isPlayerBullet) {
                const dist = Vector.dist(this.player.x, this.player.y, bullet.x, bullet.y);
                if (dist < waveRadius) {
                    // Sinh hạt nổ đạn
                    this.spawnBloodParticles(bullet.x, bullet.y, '#ff3131', 3);
                    return false; // Hủy đạn
                }
            }
            return true;
        });

        // 2. Đẩy lùi toàn bộ quái trong phạm vi 250px và gây sát thương
        this.enemies.forEach((enemy) => {
            const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < waveRadius) {
                const angle = Vector.angle(this.player.x, this.player.y, enemy.x, enemy.y);
                // Sát thương EMP cố định
                enemy.hp -= 25;
                // Đẩy lùi cực mạnh
                enemy.applyKnockback(angle, 18);
                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 10, '25', '#b026ff', 15));
                this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 5);
            }
        });
        
        // Cập nhật lại danh sách kẻ địch (chỉ giữ lại những quái còn sống)
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy, j);
            }
        }
    }

    triggerBarrelExplosion(x, y) {
        sounds.playExplosion();
        this.triggerScreenShake(20, 350);

        const expRadius = 180;
        this.blastRings.push(new BlastRing(x, y, expRadius, '#ff4b1f'));

        // Phá các đạn xung quanh vụ nổ
        this.bullets = this.bullets.filter(bullet => {
            const dist = Vector.dist(x, y, bullet.x, bullet.y);
            if (dist < expRadius) {
                this.spawnBloodParticles(bullet.x, bullet.y, bullet.color, 3);
                return false;
            }
            return true;
        });

        // Gây sát thương và đẩy quái vật
        this.enemies.forEach(enemy => {
            const dist = Vector.dist(x, y, enemy.x, enemy.y);
            if (dist < expRadius) {
                const angle = Vector.angle(x, y, enemy.x, enemy.y);
                const damage = 60;
                enemy.hp -= damage;
                enemy.applyKnockback(angle, 20);
                
                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 15, `${damage}`, '#ff4b1f', 18));
                this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 6);
            }
        });

        // Xử lý quái chết do nổ thùng thuốc nổ
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy, j);
            }
        }

        // Tác động lên Player nếu đứng gần vụ nổ
        const playerDist = Vector.dist(x, y, this.player.x, this.player.y);
        if (playerDist < expRadius) {
            const angle = Vector.angle(x, y, this.player.x, this.player.y);
            const playerDamage = 15;
            const damaged = this.player.takeDamage(playerDamage);
            if (damaged) {
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `-${playerDamage}`, '#ff3131', 18));
                this.spawnBloodParticles(this.player.x, this.player.y, '#ff3131');
            }
            // Đẩy lùi nhẹ người chơi
            this.player.x += Math.cos(angle) * 30;
            this.player.y += Math.sin(angle) * 30;
        }

        // Tạo hiệu ứng hạt lửa tung tóe
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, '#ff4b1f'));
        }
    }

    triggerMissileExplosion(x, y, damage) {
        sounds.playExplosion();
        this.triggerScreenShake(6, 150);

        const expRadius = 100;
        this.blastRings.push(new BlastRing(x, y, expRadius, '#ff9f00')); // Orange blast ring

        // Gây sát thương và đẩy quái vật
        this.enemies.forEach(enemy => {
            const dist = Vector.dist(x, y, enemy.x, enemy.y);
            if (dist < expRadius) {
                const angle = Vector.angle(x, y, enemy.x, enemy.y);
                enemy.hp -= damage;
                enemy.applyKnockback(angle, 12);
                
                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 15, `${Math.floor(damage)}`, '#ff9f00', 16));
                this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 4);
            }
        });

        // Xử lý quái chết do tên lửa nổ
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy, j);
            }
        }

        // Hạt hiệu ứng tên lửa cam tung tóe
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, '#ff9f00'));
        }
    }

    shootBullet() {
        sounds.playShoot();

        // Sát thương cơ bản nhân tỉ lệ damageLevel
        const damage = Math.floor(this.player.damage * (1 + this.player.upgrades.damage * 0.25));
        const isDoubleShot = (this.player.upgrades.doubleShot > 0 || this.player.powerups.doubleShot > 0);
        
        const role = this.player.role || 'fighter';
        const angle = this.player.angle;

        if (role === 'ranger') {
            // Ranger: Cyan laser array (3 or 5 parallel lasers)
            const speed = 11;
            const radius = 6;
            const color = '#00f0ff';
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            if (isDoubleShot) {
                // 5 parallel lasers
                const spacing = 12;
                for (let i = -2; i <= 2; i++) {
                    const bx = this.player.x - sinA * spacing * i;
                    const by = this.player.y + cosA * spacing * i;
                    this.bullets.push(new Bullet(bx, by, vx, vy, radius, damage, color));
                }
            } else {
                // 3 parallel lasers
                const spacing = 14;
                for (let i = -1; i <= 1; i++) {
                    const bx = this.player.x - sinA * spacing * i;
                    const by = this.player.y + cosA * spacing * i;
                    this.bullets.push(new Bullet(bx, by, vx, vy, radius, damage, color));
                }
            }
        } else {
            // Fighter, Mage, Assassin
            let speed = 10;
            let radius = 8;
            let color = '#00f0ff';
            let extraProps = {};

            if (role === 'fighter') {
                speed = 7.5;
                radius = 13;
                color = '#fffb00';
                extraProps.isHeavy = true;
            } else if (role === 'mage') {
                speed = 9;
                radius = this.player.upgrades.giantFireball > 0 ? 18 : 9;
                color = '#b026ff';
                extraProps.isOrb = true;
            } else if (role === 'assassin') {
                speed = 14;
                radius = 5;
                color = '#ff007f';
                extraProps.isDagger = true;
            }

            if (isDoubleShot) {
                const offsetAngle = 0.08;
                
                const angle1 = angle - offsetAngle;
                const vx1 = Math.cos(angle1) * speed;
                const vy1 = Math.sin(angle1) * speed;

                const angle2 = angle + offsetAngle;
                const vx2 = Math.cos(angle2) * speed;
                const vy2 = Math.sin(angle2) * speed;

                const b1 = new Bullet(this.player.x, this.player.y, vx1, vy1, radius, damage, color);
                const b2 = new Bullet(this.player.x, this.player.y, vx2, vy2, radius, damage, color);
                
                Object.assign(b1, extraProps);
                Object.assign(b2, extraProps);
                
                this.bullets.push(b1);
                this.bullets.push(b2);
            } else {
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const b = new Bullet(this.player.x, this.player.y, vx, vy, radius, damage, color);
                
                Object.assign(b, extraProps);
                this.bullets.push(b);
            }
        }
    }

    triggerSwordSlash(angle) {
        sounds.playSwordSlash();
        const damage = Math.floor(this.player.damage * 1.5 * (1 + this.player.upgrades.damage * 0.25));
        const range = 110 + this.player.upgrades.magnet * 10;
        const color = '#ff007f';
        this.swordSlashes.push(new SwordSlash(this.player.x, this.player.y, angle, range, color, damage));
        
        // Sinh hạt bụi kiếm
        for (let i = 0; i < 8; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 1.2;
            const dist = 30 + Math.random() * 60;
            const px = this.player.x + Math.cos(spreadAngle) * dist;
            const py = this.player.y + Math.sin(spreadAngle) * dist;
            this.particles.push(new Particle(px, py, '#ff007f'));
        }

        const hasDual = this.player.upgrades.dualSlash > 0 || this.player.powerups.doubleShot > 0;
        const isPowerupActive = this.player.powerups.doubleShot > 0;
        const hasQuad = this.player.upgrades.dualSlash > 0 && isPowerupActive;

        if (hasQuad) {
            // Chém 4 hướng: angle, angle + Math.PI/2, angle + Math.PI, angle - Math.PI/2
            const angles = [angle + Math.PI / 2, angle + Math.PI, angle - Math.PI / 2];
            angles.forEach(a => {
                this.swordSlashes.push(new SwordSlash(this.player.x, this.player.y, a, range, color, damage));
                // Sinh hạt bụi kiếm cho các hướng này
                for (let i = 0; i < 6; i++) {
                    const spreadAngle = a + (Math.random() - 0.5) * 1.2;
                    const dist = 30 + Math.random() * 60;
                    const px = this.player.x + Math.cos(spreadAngle) * dist;
                    const py = this.player.y + Math.sin(spreadAngle) * dist;
                    this.particles.push(new Particle(px, py, '#ff007f'));
                }
            });
        } else if (hasDual) {
            // Chém 2 hướng trước sau
            const oppositeAngle = angle + Math.PI;
            this.swordSlashes.push(new SwordSlash(this.player.x, this.player.y, oppositeAngle, range, color, damage));
            
            // Hạt bụi kiếm hướng phụ
            for (let i = 0; i < 8; i++) {
                const spreadAngle = oppositeAngle + (Math.random() - 0.5) * 1.2;
                const dist = 30 + Math.random() * 60;
                const px = this.player.x + Math.cos(spreadAngle) * dist;
                const py = this.player.y + Math.sin(spreadAngle) * dist;
                this.particles.push(new Particle(px, py, '#ff007f'));
            }
        }
    }

    triggerHammerSmash(angle) {
        sounds.playHammerSmash();
        let damage = Math.floor(this.player.damage * 1.8 * (1 + this.player.upgrades.damage * 0.30));
        let maxRadius = 150 + this.player.upgrades.magnet * 15;
        const color = '#fffb00';
        
        const is360 = this.player.upgrades.hammer360 > 0 || this.player.powerups.doubleShot > 0;
        const hasPowerup = this.player.powerups.doubleShot > 0;
        
        // Nếu đã có 360 độ rồi và ăn thêm powerup x2, tăng bán kính và sát thương thêm 35%
        if (hasPowerup && this.player.upgrades.hammer360 > 0) {
            maxRadius = Math.floor(maxRadius * 1.35);
            damage = Math.floor(damage * 1.35);
        }

        const wave = new HammerWave(this.player.x, this.player.y, angle, maxRadius, color, damage);
        if (is360) {
            wave.is360 = true;
        }
        this.hammerWaves.push(wave);
        
        this.triggerScreenShake(7, 150);
        
        // Sinh hạt bụi vàng tản mát (360 độ nếu đã nâng cấp Địa Chấn hoặc có powerup)
        const particleCount = is360 ? 24 : 12;
        for (let i = 0; i < particleCount; i++) {
            const spreadAngle = is360 ? (Math.random() * Math.PI * 2) : (angle + (Math.random() - 0.5) * 1.5);
            const dist = 20 + Math.random() * (is360 ? maxRadius * 0.8 : 100);
            const px = this.player.x + Math.cos(spreadAngle) * dist;
            const py = this.player.y + Math.sin(spreadAngle) * dist;
            this.particles.push(new Particle(px, py, '#fffb00'));
        }
    }

    // --- ENEMY INFLICT DAMAGE ---
    damageEnemy(enemy, damage, bulletVx, bulletVy, enemyIdx, bulletRef = null) {
        let isCrit = false;
        let finalDamage = damage;

        // Xử lý đạn sát thủ có tỷ lệ chí mạng Crit x2
        if (bulletRef && bulletRef.isDagger) {
            if (Math.random() < 0.28) {
                finalDamage = damage * 2;
                isCrit = true;
            }
        }

        enemy.hp -= finalDamage;
        
        // Hiệu ứng nổ đạn khi đâm trúng
        this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 4);

        // Đẩy quái ra xa theo chiều đạn bay
        const bulletAngle = Math.atan2(bulletVy, bulletVx);
        let knockbackForce = 5;
        if (bulletRef && bulletRef.isHeavy) {
            knockbackForce = 15; // Đẩy lùi cực mạnh cho Đấu sĩ
        }
        enemy.applyKnockback(bulletAngle, knockbackForce);

        // Hiển thị số sát thương bay lên (Chí mạng màu hồng neon lớn)
        if (isCrit) {
            this.triggerScreenShake(3, 100);
            this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - enemy.radius, `${finalDamage}! CRIT`, '#ff007f', 19));
        } else {
            this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - enemy.radius, `${finalDamage}`, '#00f0ff', 15));
        }

        // Xử lý nổ ma pháp của Pháp sư
        if (bulletRef && bulletRef.isOrb) {
            this.triggerMagicExplosion(bulletRef.x, bulletRef.y, finalDamage);
        }

        // Kiểm tra xem quái vật chết chưa
        if (enemy.hp <= 0) {
            this.onEnemyKilled(enemy, enemyIdx);
        } else {
            // Quái trúng đạn tạo âm thanh va đập nhỏ
            sounds.playHit();
        }
    }

    triggerMagicExplosion(x, y, damage) {
        const radius = this.player.upgrades.giantFireball > 0 ? 82 : 55;
        sounds.playHit();
        this.blastRings.push(new BlastRing(x, y, radius, '#b026ff')); // Vòng nổ tím
        
        this.enemies.forEach(enemy => {
            if (Vector.dist(x, y, enemy.x, enemy.y) < radius + enemy.radius) {
                const splashFactor = this.player.upgrades.giantFireball > 0 ? 0.65 : 0.45;
                const splashDmg = Math.floor(damage * splashFactor);
                enemy.hp -= splashDmg;
                // Đẩy nhẹ xung quanh
                enemy.applyKnockback(Vector.angle(x, y, enemy.x, enemy.y), 6);
                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 10, `${splashDmg}`, '#b026ff', 13));
                this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 2);
            }
        });

        // Xử lý quái chết do nổ lan ma pháp
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy, j);
            }
        }
    }

    // --- ITEM COLLECTION ---
    collectItem(item) {
        sounds.playPickup();

        if (item.type === 'xp') {
            const leveledUp = this.player.addXp(item.value);
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, `+${item.value} XP`, '#39ff14', 15));
            
            if (leveledUp) {
                this.triggerLevelUp();
            }
        } else if (item.type === 'health') {
            const healAmount = Math.floor(this.player.maxHp * 0.3); // Hồi 30% HP
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, `+${healAmount} HP`, '#ff3131', 16));
        } else if (item.type === 'double') {
            this.player.powerups.doubleShot = 8000; // 8s bắn đạn đôi/chém kép/sóng kích lớn
            
            const role = this.player.role || 'fighter';
            let msg = 'DOUBLE LASER ACTIVE!';
            let color = '#00f0ff';
            if (role === 'fighter') {
                msg = this.player.upgrades.hammer360 > 0 ? 'XUNG KÍCH SIÊU ĐỊA CHẤN!' : 'ĐỊA CHẤN TỎA TRÒN!';
                color = '#fffb00';
            } else if (role === 'mage') {
                msg = 'SONG MA PHÁP CẦU!';
                color = '#b026ff';
            } else if (role === 'ranger') {
                msg = 'LASER PHÁO KÉP!';
                color = '#00f0ff';
            } else if (role === 'assassin') {
                msg = this.player.upgrades.dualSlash > 0 ? 'TỨ KIẾM TRẬN!' : 'ÁNH ẢNH SONG KIẾM!';
                color = '#ff007f';
            }

            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, msg, color, 18));
            sounds.playPowerup();
        } else if (item.type === 'shield') {
            this.player.powerups.shield = 10000; // Khiên chắn tối đa 10 giây hoặc 1 đòn đánh
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, `SHIELD ACTIVE!`, '#fffb00', 18));
            sounds.playPowerup();
        } else if (item.type === 'magnet') {
            this.magnetPowerupTimer = 6000; // Hút mọi vật phẩm trong 6s
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, `MAGNET ENGINE ON!`, '#b026ff', 18));
            sounds.playPowerup();
        } else if (item.type === 'chest') {
            this.state = 'SUPER_UPGRADE';
            sounds.playPowerup();
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, `SUPER CORE CHEST!`, '#fffb00', 20));
            this.triggerSuperUpgrade();
        }
    }

    // --- SPAWNING FUNCTIONS ---
    spawnEnemy() {
        // Sinh quái bên ngoài tầm nhìn của camera một chút
        const spawnDist = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
        const angle = Math.random() * Math.PI * 2;
        
        let spawnX = this.player.x + Math.cos(angle) * spawnDist;
        let spawnY = this.player.y + Math.sin(angle) * spawnDist;

        // Giới hạn quái vật không sinh ra ngoài rìa bản đồ thế giới
        spawnX = Math.max(30, Math.min(this.worldSize - 30, spawnX));
        spawnY = Math.max(30, Math.min(this.worldSize - 30, spawnY));

        // Không sinh quái quá sát người chơi (trong trường hợp đụng ranh giới bản đồ)
        if (Vector.dist(spawnX, spawnY, this.player.x, this.player.y) < 200) {
            return;
        }

        this.enemies.push(new Enemy(spawnX, spawnY, this.player.level));
    }

    spawnCollectable(x, y, xpValue) {
        const r = Math.random();
        
        if (r < 0.85) {
            // Rớt hạt XP
            this.items.push(new Item(x, y, 'xp', xpValue));
        } else if (r < 0.92) {
            // Rớt cứu thương HP
            this.items.push(new Item(x, y, 'health'));
        } else {
            // Rớt Powerup ngẫu nhiên (Double shot, Shield, Magnet)
            const powerups = ['double', 'shield', 'magnet'];
            const randomPw = powerups[Math.floor(Math.random() * powerups.length)];
            this.items.push(new Item(x, y, randomPw));
        }
    }

    spawnBloodParticles(x, y, color, count = 8) {
        // Giới hạn tổng số particle tối đa 300 để tránh drop FPS khi có nhiều vụ nổ cùng lúc
        const available = Math.max(0, 300 - this.particles.length);
        const actualCount = Math.min(count, available);
        for (let i = 0; i < actualCount; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    // --- LEVEL UP LOGIC ---
    triggerLevelUp() {
        this.state = 'UPGRADE';
        sounds.playLevelUp();
        
        // Tạm ẩn cảnh báo Boss nếu đang kích hoạt để tránh che menu nâng cấp
        if (this.bossWarningActive) {
            const warningOverlay = document.getElementById('boss-warning-overlay');
            if (warningOverlay) warningOverlay.classList.add('hidden');
        }
        
        // Lấy danh sách nâng cấp ngẫu nhiên để chuẩn bị hiển thị thẻ bài
        this.generateUpgradeChoices();
        this.displayUpgradeMenu();
    }

    generateUpgradeChoices() {
        const role = this.player.role || 'fighter';
        let upgradeTypes = [];

        // Thẻ nâng cấp chung về sinh tồn & tiện ích (Sử dụng cấp độ động và các miêu tả tương ứng)
        const maxHpCard = {
            id: 'maxHp',
            title: role === 'mage' ? 'Lõi Năng Lượng Phép' : (role === 'assassin' ? 'Giáp Phản Quang' : (role === 'fighter' ? 'Giáp Kháng Lực' : 'Hợp Kim Bảo Vệ')),
            desc: role === 'mage' ? 'Tăng 20 điểm giới hạn máu và hồi đầy thanh máu.' : (role === 'assassin' ? 'Tăng 20 điểm giới hạn máu và hồi đầy.' : 'Tăng 25 điểm giới hạn máu và hồi đầy.'),
            stat: role === 'mage' || role === 'assassin' ? `Cấp ${this.player.upgrades.maxHp + 1} (+20 HP)` : `Cấp ${this.player.upgrades.maxHp + 1} (+25 HP)`,
            icon: '❤️',
            class: 'card-pink'
        };

        const speedCard = {
            id: 'speed',
            title: role === 'mage' ? 'Gia Tốc Ma Pháp' : (role === 'assassin' ? 'Kích Tốc Ảnh Tử' : (role === 'fighter' ? 'Động Cơ Đẩy Phản Lực' : 'Cơ Động Xạ Thủ')),
            desc: 'Tăng tốc độ di chuyển phi thuyền thêm 15% để cơ động né đòn.',
            stat: `Cấp ${this.player.upgrades.speed + 1} (+15% SPD)`,
            icon: '🚀',
            class: 'card-green'
        };

        const magnetCard = {
            id: 'magnet',
            title: role === 'mage' ? 'Hút Linh Hồn' : (role === 'assassin' ? 'Từ Trường Ám Khí' : (role === 'fighter' ? 'Từ Trường Nam Châm' : 'Từ Trường Thu Gom')),
            desc: 'Tăng thêm 50% tầm ảnh hưởng từ tính để tự động thu gom XP.',
            stat: `Cấp ${this.player.upgrades.magnet + 1} (+50% Hút)`,
            icon: '🧲',
            class: 'card-purple'
        };

        if (role === 'fighter') {
            // Đấu sĩ: nâng cấp búa vàng & địa chấn 360 (Thẻ Búa năng lượng màu vàng)
            upgradeTypes = [
                maxHpCard,
                speedCard,
                magnetCard,
                {
                    id: 'damage',
                    title: 'Búa Năng Lượng Nặng',
                    desc: 'Gia công thêm xung lực động năng vào búa vàng, tăng sát thương nện búa thêm 30%.',
                    stat: `Cấp ${this.player.upgrades.damage + 1} (+30% DMG)`,
                    icon: '🔨',
                    class: 'card-yellow'
                },
                {
                    id: 'fireRate',
                    title: 'Nện Búa Liên Hoàn',
                    desc: 'Cải tiến bộ thủy lực và trục khuỷu búa, gõ búa nhanh hơn 20%.',
                    stat: `Cấp ${this.player.upgrades.fireRate + 1} (-20% CD)`,
                    icon: '⚡',
                    class: 'card-yellow'
                }
            ];
            
            if (this.player.upgrades.hammer360 === 0) {
                upgradeTypes.push({
                    id: 'hammer360',
                    title: 'Địa Chấn 360 Độ',
                    desc: 'Biến sóng búa từ hình nón 90 độ phía trước thành sóng chấn động tỏa tròn 360 độ xung quanh phi thuyền.',
                    stat: 'Kích hoạt Lõi 360°',
                    icon: '💥',
                    class: 'card-yellow'
                });
            }
        } else if (role === 'mage') {
            // Pháp sư: nâng cấp cầu lửa & siêu cầu phép (Thẻ ma pháp màu tím)
            upgradeTypes = [
                maxHpCard,
                speedCard,
                magnetCard,
                {
                    id: 'damage',
                    title: 'Khuếch Đại Tinh Thể',
                    desc: 'Cường hóa lõi ma pháp tinh thể giúp tăng 25% sát thương cầu lửa phép.',
                    stat: `Cấp ${this.player.upgrades.damage + 1} (+25% DMG)`,
                    icon: '🔮',
                    class: 'card-purple'
                },
                {
                    id: 'fireRate',
                    title: 'Niệm Chú Siêu Tốc',
                    desc: 'Tối ưu luồng mana và mạch niệm chú, giảm 20% thời gian nạp cầu lửa.',
                    stat: `Cấp ${this.player.upgrades.fireRate + 1} (-20% CD)`,
                    icon: '⏳',
                    class: 'card-purple'
                }
            ];

            if (this.player.upgrades.giantFireball === 0) {
                upgradeTypes.push({
                    id: 'giantFireball',
                    title: 'Siêu Cầu Phép',
                    desc: 'Tăng gấp đôi kích thước cầu lửa phóng ra và mở rộng 50% bán kính nổ ma pháp AoE (55px -> 82px).',
                    stat: 'Kích hoạt Siêu Cầu',
                    icon: '☄️',
                    class: 'card-purple'
                });
            }
        } else if (role === 'ranger') {
            // Xạ thủ: laser súng trường & bắn 5 tia song song (Thẻ laser màu xanh lam/cyan)
            upgradeTypes = [
                maxHpCard,
                speedCard,
                magnetCard,
                {
                    id: 'damage',
                    title: 'Xung Điện Laser',
                    desc: 'Tăng điện áp nén laser, gia tăng sát thương mỗi tia bắn thêm 25%.',
                    stat: `Cấp ${this.player.upgrades.damage + 1} (+25% DMG)`,
                    icon: '🔫',
                    class: 'card-blue'
                },
                {
                    id: 'fireRate',
                    title: 'Bộ Tăng Tốc Xả Đạn',
                    desc: 'Nâng cấp bộ nạp đạn nhanh hơn, giảm 20% giãn cách giữa các loạt laser.',
                    stat: `Cấp ${this.player.upgrades.fireRate + 1} (-20% CD)`,
                    icon: '🔥',
                    class: 'card-blue'
                }
            ];

            if (this.player.upgrades.doubleShot === 0) {
                upgradeTypes.push({
                    id: 'doubleShot',
                    title: 'Lõi Pháo Kép',
                    desc: 'Tăng cường số lượng nòng laser phụ trợ, xả đồng thời 5 tia laser song song.',
                    stat: 'Kích hoạt Pháo 5 Tia',
                    icon: '🎛️',
                    class: 'card-blue'
                });
            }
        } else if (role === 'assassin') {
            // Sát thủ: chém kiếm & song kiếm phân thân
            upgradeTypes = [
                maxHpCard,
                speedCard,
                magnetCard,
                {
                    id: 'damage',
                    title: 'Kiếm Khí Sắc Lẹm',
                    desc: 'Gia tăng điện năng lưỡi kiếm Plasma hồng, tăng 25% sát thương quét chém.',
                    stat: `Cấp ${this.player.upgrades.damage + 1} (+25% DMG)`,
                    icon: '🗡️',
                    class: 'card-pink'
                },
                {
                    id: 'fireRate',
                    title: 'Đoản Kiếm Chớp Nhoáng',
                    desc: 'Gia tốc cơ học giúp chém chớp nhoáng hơn, giảm 20% hồi chiêu vung kiếm.',
                    stat: `Cấp ${this.player.upgrades.fireRate + 1} (-20% CD)`,
                    icon: '⚔️',
                    class: 'card-pink'
                }
            ];

            if (this.player.upgrades.dualSlash === 0) {
                upgradeTypes.push({
                    id: 'dualSlash',
                    title: 'Song Kiếm Phân Thân',
                    desc: 'Vung thêm một nhát chém phụ quét ngược ra phía sau phi thuyền.',
                    stat: 'Kích hoạt Song Kiếm',
                    icon: '🔄',
                    class: 'card-pink'
                });
            }
        }

        // Trộn ngẫu nhiên và lấy 3 lựa chọn
        const shuffled = upgradeTypes.sort(() => 0.5 - Math.random());
        this.currentUpgradesPool = shuffled.slice(0, 3);
    }

    displayUpgradeMenu() {
        const choicesGrid = document.getElementById('upgrade-choices');
        if (!choicesGrid) return;
        choicesGrid.innerHTML = '';

        this.currentUpgradesPool.forEach((upgrade, idx) => {
            const card = document.createElement('div');
            card.className = `upgrade-card glassmorphism-card ${upgrade.class}`;
            card.innerHTML = `
                <div class="card-glow-${upgrade.class.split('-')[1]}"></div>
                <div class="card-icon">${upgrade.icon}</div>
                <h3>${upgrade.title}</h3>
                <p>${upgrade.desc}</p>
                <span class="card-stat">${upgrade.stat}</span>
            `;
            card.addEventListener('click', () => {
                this.applyUpgrade(upgrade.id);
            });
            choicesGrid.appendChild(card);
        });

        document.getElementById('upgrade-menu').classList.remove('hidden');
    }

    applyUpgrade(upgradeId) {
        switch (upgradeId) {
            case 'doubleShot':
                this.player.upgrades.doubleShot++;
                break;
            case 'maxHp':
                this.player.upgrades.maxHp++;
                const hpAdd = (this.player.role === 'mage' || this.player.role === 'assassin') ? 20 : 25;
                this.player.maxHp += hpAdd;
                this.player.hp = this.player.maxHp;
                break;
            case 'fireRate':
                this.player.upgrades.fireRate++;
                break;
            case 'speed':
                this.player.upgrades.speed++;
                this.player.speed = this.player.baseSpeed * (1 + this.player.upgrades.speed * 0.15);
                break;
            case 'damage':
                this.player.upgrades.damage++;
                break;
            case 'magnet':
                this.player.upgrades.magnet++;
                this.player.magnetRadius = 100 * (1 + this.player.upgrades.magnet * 0.50);
                break;
            case 'hammer360':
                this.player.upgrades.hammer360++;
                break;
            case 'giantFireball':
                this.player.upgrades.giantFireball++;
                break;
            case 'dualSlash':
                this.player.upgrades.dualSlash++;
                break;
        }

        this.player.lastShotTime = performance.now() + 100;
        document.getElementById('upgrade-menu').classList.add('hidden');
        this.state = 'PLAYING';
        this.lastTime = performance.now();
        
        // Hiện lại cảnh báo Boss nếu đang đếm ngược
        if (this.bossWarningActive) {
            const warningOverlay = document.getElementById('boss-warning-overlay');
            if (warningOverlay) warningOverlay.classList.remove('hidden');
        }
    }

    // --- SUPER CHEST UPGRADE LOGIC ---

    // --- SUPER CHEST UPGRADE LOGIC ---
    triggerSuperUpgrade() {
        this.state = 'SUPER_UPGRADE';
        sounds.playLevelUp();
        
        // Tạm ẩn cảnh báo Boss nếu đang kích hoạt để tránh che menu nâng cấp
        if (this.bossWarningActive) {
            const warningOverlay = document.getElementById('boss-warning-overlay');
            if (warningOverlay) warningOverlay.classList.add('hidden');
        }
        
        this.generateSuperUpgradeChoices();
        this.displaySuperUpgradeMenu();
    }

    generateSuperUpgradeChoices() {
        const superUpgrades = [
            {
                id: 'orbitingShield',
                title: 'Lá Chắn Xoay Vòng',
                desc: this.player.subWeapons.orbitingShield > 0 ? 'Tăng thêm 1 lưỡi dao ánh sáng xoay quanh phi thuyền.' : 'Tạo 1 lưỡi dao năng lượng xoay quanh chém quái lại gần.',
                stat: this.player.subWeapons.orbitingShield > 0 ? `Cấp ${this.player.subWeapons.orbitingShield} -> ${this.player.subWeapons.orbitingShield + 1}` : 'Mở khóa Cấp 1',
                icon: '🛡️',
                class: 'card-purple'
            },
            {
                id: 'homingMissile',
                title: 'Tên Lửa Tầm Nhiệt',
                desc: this.player.subWeapons.homingMissile > 0 ? 'Nạp và phóng tên lửa tầm nhiệt nhanh hơn.' : 'Tự động phóng tên lửa dò mục tiêu gần nhất gây nổ AoE.',
                stat: this.player.subWeapons.homingMissile > 0 ? `Cấp ${this.player.subWeapons.homingMissile} -> ${this.player.subWeapons.homingMissile + 1}` : 'Mở khóa Cấp 1',
                icon: '🚀',
                class: 'card-yellow'
            },
            {
                id: 'laserDrone',
                title: 'Laser Drone Mini',
                desc: this.player.subWeapons.laserDrone > 0 ? 'Drone bắn tia laser phụ trợ nhanh hơn.' : 'Robot Drone mini hộ tống tự động ngắm bắn kẻ địch gần nhất.',
                stat: this.player.subWeapons.laserDrone > 0 ? `Cấp ${this.player.subWeapons.laserDrone} -> ${this.player.subWeapons.laserDrone + 1}` : 'Mở khóa Cấp 1',
                icon: '🤖',
                class: 'card-green'
            }
        ];
        this.currentSuperUpgradesPool = superUpgrades;
    }

    displaySuperUpgradeMenu() {
        const choicesGrid = document.getElementById('super-upgrade-choices');
        if (!choicesGrid) return;
        
        choicesGrid.innerHTML = '';

        this.currentSuperUpgradesPool.forEach((upgrade) => {
            const card = document.createElement('div');
            card.className = `upgrade-card glassmorphism-card card-yellow`;
            card.innerHTML = `
                <div class="card-glow-yellow"></div>
                <div class="card-icon">${upgrade.icon}</div>
                <h3>${upgrade.title}</h3>
                <p>${upgrade.desc}</p>
                <span class="card-stat">${upgrade.stat}</span>
            `;
            
            card.addEventListener('click', () => {
                this.applySuperUpgrade(upgrade.id);
            });

            choicesGrid.appendChild(card);
        });

        // Hiện overlay menu nâng cấp rương vàng
        document.getElementById('super-upgrade-menu').classList.remove('hidden');
    }

    applySuperUpgrade(upgradeId) {
        // Áp dụng nâng cấp vũ khí phụ vào Player
        this.player.subWeapons[upgradeId]++;

        // Đặt vị trí Drone ban đầu tại Player để tránh Drone bay từ vô định
        if (upgradeId === 'laserDrone' && this.player.subWeapons.laserDrone === 1) {
            this.player.droneX = this.player.x;
            this.player.droneY = this.player.y;
        }

        // Hồi chiêu ngắm bắn
        this.player.lastShotTime = performance.now() + 100;

        // Ẩn menu rương và tiếp tục
        document.getElementById('super-upgrade-menu').classList.add('hidden');
        this.state = 'PLAYING';
        this.lastTime = performance.now();

        // Hiện lại cảnh báo Boss nếu đang đếm ngược
        if (this.bossWarningActive) {
            const warningOverlay = document.getElementById('boss-warning-overlay');
            if (warningOverlay) warningOverlay.classList.remove('hidden');
        }
    }

    // --- UPDATE HUD UI ---
    updateHUD() {
        // Cập nhật cấp độ
        document.getElementById('hud-level-val').textContent = this.player.level;

        // Cập nhật thanh XP phần trăm
        const xpPct = (this.player.xp / this.player.xpNeeded) * 100;
        document.getElementById('hud-xp-fill').style.width = `${xpPct}%`;

        // Cập nhật máu
        document.getElementById('hud-hp-text').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
        const hpPct = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hud-health-fill').style.width = `${hpPct}%`;

        // Cập nhật thời gian và số quái đã giết
        document.getElementById('hud-time-val').textContent = this.formatTime(this.gameTime);
        document.getElementById('hud-kills-val').textContent = this.kills;

        // Cập nhật hồi chiêu kỹ năng trên HUD
        const dashOverlay = document.getElementById('dash-cooldown-overlay');
        if (dashOverlay) {
            const pct = Math.max(0, (this.player.dashCooldown / this.player.dashCooldownMax) * 100);
            dashOverlay.style.height = `${pct}%`;
        }

        const shockwaveOverlay = document.getElementById('shockwave-cooldown-overlay');
        if (shockwaveOverlay) {
            const pct = Math.max(0, (this.player.shockwaveCooldown / this.player.shockwaveCooldownMax) * 100);
            shockwaveOverlay.style.height = `${pct}%`;
        }

        // Hiển thị đếm ngược powerup Double Shot/Shield/Speed nếu có hoạt động
        const badge = document.getElementById('active-powerup');
        if (badge) {
            if (this.player.powerups.doubleShot > 0) {
                badge.classList.remove('hidden');
                document.getElementById('powerup-name').textContent = 'LASER KÉP (Powerup)';
                document.getElementById('powerup-timer').textContent = `${(this.player.powerups.doubleShot / 1000).toFixed(1)}s`;
            } else if (this.magnetPowerupTimer > 0) {
                badge.classList.remove('hidden');
                document.getElementById('powerup-name').textContent = 'TỪ TRƯỜNG CỰC ĐẠI';
                document.getElementById('powerup-timer').textContent = `${(this.magnetPowerupTimer / 1000).toFixed(1)}s`;
            } else if (this.player.powerups.shield > 0) {
                badge.classList.remove('hidden');
                document.getElementById('powerup-name').textContent = 'KHIÊN CHẮN NĂNG LƯỢNG';
                document.getElementById('powerup-timer').textContent = `${(this.player.powerups.shield / 1000).toFixed(1)}s`;
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    // --- DRAW GRAPHICS ON CANVAS ---
    draw() {
        this.ctx.save();
        
        // Xử lý hiệu ứng Rung màn hình (Screen Shake)
        if (this.state === 'PLAYING' && this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }

        // 1. Vẽ nền màn hình tối sâu
        this.ctx.fillStyle = '#030712';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1.5. Vẽ các hạt bụi vũ trụ làm nền cuộn trôi (Space dust background)
        if (this.stars) {
            this.stars.forEach(star => {
                if (this.isInView(star.x, star.y, star.radius)) {
                    const screenX = star.x - this.camera.x;
                    const screenY = star.y - this.camera.y;
                    this.ctx.save();
                    this.ctx.globalAlpha = star.alpha;
                    this.ctx.fillStyle = star.color;
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, star.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            });
        }

        // 2. Vẽ lưới ô vuông nền thế giới Cyber — gộp tất cả đường vào 1 path duy nhất
        const gridSize = 80;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;

        // Gộp tất cả đường thẳng vào 1 beginPath/stroke duy nhất (thay vì gọi stroke() mỗi dòng)
        this.ctx.beginPath();
        for (let x = startX; x < startX + this.canvas.width + gridSize; x += gridSize) {
            const screenX = x - this.camera.x;
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
        }
        for (let y = startY; y < startY + this.canvas.height + gridSize; y += gridSize) {
            const screenY = y - this.camera.y;
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
        }
        this.ctx.stroke();

        // Vẽ các mối nguy hiểm địa hình (Hazards) dưới đất
        if (this.hazards) {
            this.hazards.forEach(h => {
                if (this.isInView(h.x, h.y, h.radius + 300)) {
                    h.draw(this.ctx, this.camera);
                }
            });
        }
        // Bỏ vẽ intersection dots — tốn nhiều arc() calls mà hiệu quả thị giác thấp

        // 3. Vẽ tường ranh giới thế giới World bounds (Đường neon dày)
        const left = 0 - this.camera.x;
        const right = this.worldSize - this.camera.x;
        const top = 0 - this.camera.y;
        const bottom = this.worldSize - this.camera.y;

        this.ctx.save();
        // 1. Quầng sáng ranh giới (Outer Glow)
        this.ctx.strokeStyle = 'rgba(176, 38, 255, 0.2)';
        this.ctx.lineWidth = 16;
        this.ctx.strokeRect(left, top, this.worldSize, this.worldSize);

        // 2. Viền ranh giới chính (Solid Core)
        this.ctx.strokeStyle = '#b026ff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(left, top, this.worldSize, this.worldSize);
        this.ctx.restore();

        // 3.5. Vẽ Sóng Chấn Động EMP nếu đang kích hoạt
        if (this.activeShockwave) {
            this.ctx.save();
            const screenX = this.activeShockwave.x - this.camera.x;
            const screenY = this.activeShockwave.y - this.camera.y;
            this.ctx.translate(screenX, screenY);
            
            // Vẽ vòng tròn sóng chấn động neon lan tỏa
            this.ctx.strokeStyle = this.activeShockwave.color;
            // Độ mờ giảm dần khi sóng lan ra ngoài rìa
            const opacity = 1 - (this.activeShockwave.currentRadius / this.activeShockwave.maxRadius);
            const alpha = Math.max(0, opacity);
            
            // 1. Quầng sáng sóng EMP (Outer Glow)
            this.ctx.globalAlpha = alpha * 0.25;
            this.ctx.strokeStyle = this.activeShockwave.color;
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.activeShockwave.currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            // 2. Viền sóng EMP chính (Solid Core)
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.activeShockwave.currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 3.6. Vẽ các vòng nổ của thùng thuốc nổ
        this.blastRings.forEach(br => {
            br.draw(this.ctx, this.camera);
        });

        // 3.7. Vẽ các Cột chướng ngại vật
        this.pillars.forEach(p => {
            if (this.isInView(p.x, p.y, p.radius)) {
                p.draw(this.ctx, this.camera);
            }
        });

        // 3.8. Vẽ các Thùng thuốc nổ
        this.barrels.forEach(b => {
            if (this.isInView(b.x, b.y, b.radius)) {
                b.draw(this.ctx, this.camera);
            }
        });

        // 4. Vẽ các vật phẩm thu thập (Items)
        this.items.forEach(item => {
            // Chỉ vẽ các vật phẩm nằm trong khung camera
            if (this.isInView(item.x, item.y, item.radius)) {
                item.draw(this.ctx, this.camera);
            }
        });

        // 5. Vẽ các viên đạn (Bullets)
        this.bullets.forEach(bullet => {
            if (this.isInView(bullet.x, bullet.y, bullet.radius)) {
                bullet.draw(this.ctx, this.camera);
            }
        });

        // 5.5. Vẽ các tên lửa tầm nhiệt (Homing Missiles)
        this.homingMissiles.forEach(m => {
            if (this.isInView(m.x, m.y, m.radius)) {
                m.draw(this.ctx, this.camera);
            }
        });

        // 5.6. Vẽ các nhát chém kiếm và sóng búa
        this.swordSlashes.forEach(slash => {
            slash.draw(this.ctx, this.camera);
        });
        this.hammerWaves.forEach(wave => {
            wave.draw(this.ctx, this.camera);
        });

        // 6. Vẽ quái vật (Enemies)
        this.enemies.forEach(enemy => {
            if (this.isInView(enemy.x, enemy.y, enemy.radius)) {
                enemy.draw(this.ctx, this.camera);
            }
        });

        // 7. Vẽ các hạt hiệu ứng (Particles) — Reset alpha sau khi vẽ xong batch
        this.ctx.save();
        this.particles.forEach(p => {
            if (this.isInView(p.x, p.y, p.radius)) {
                p.draw(this.ctx, this.camera);
            }
        });
        this.ctx.globalAlpha = 1.0; // Restore alpha cho các layer sau
        this.ctx.restore();

        // 8. Vẽ người chơi (Player)
        this.player.draw(this.ctx, this.camera);

        // 8.5. Vẽ Vũ khí phụ xoay quanh người chơi & Laser Drone
        if (this.player.subWeapons.orbitingShield > 0) {
            const N = this.player.subWeapons.orbitingShield;
            for (let i = 0; i < N; i++) {
                const angle = this.player.shieldAngle + (Math.PI * 2 / N) * i;
                const sx = this.player.x + Math.cos(angle) * 75;
                const sy = this.player.y + Math.sin(angle) * 75;
                
                if (this.isInView(sx, sy, 15)) {
                    this.ctx.save();
                    this.ctx.translate(sx - this.camera.x, sy - this.camera.y);
                    // Lưỡi dao tự xoay tròn tại chỗ cực ngầu
                    this.ctx.rotate(Date.now() * 0.012 + i);
                    
                    // 1. Quầng sáng khiên xoay (Outer Glow)
                    this.ctx.globalAlpha = 0.25;
                    this.ctx.strokeStyle = '#b026ff';
                    this.ctx.lineWidth = 6;
                    this.ctx.beginPath();
                    this.ctx.moveTo(12, 0);
                    this.ctx.lineTo(0, -6);
                    this.ctx.lineTo(-12, 0);
                    this.ctx.lineTo(0, 6);
                    this.ctx.closePath();
                    this.ctx.stroke();

                    // 2. Thân chính khiên xoay (Solid Core)
                    this.ctx.globalAlpha = 1.0;
                    this.ctx.fillStyle = 'rgba(15, 10, 25, 0.85)';
                    this.ctx.strokeStyle = '#b026ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(12, 0);
                    this.ctx.lineTo(0, -6);
                    this.ctx.lineTo(-12, 0);
                    this.ctx.lineTo(0, 6);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // Vẽ lõi năng lượng phát sáng trắng
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.restore();
                }
            }
        }

        if (this.player.subWeapons.laserDrone > 0) {
            const dx = this.player.droneX - this.camera.x;
            const dy = this.player.droneY - this.camera.y;
            
            if (this.isInView(this.player.droneX, this.player.droneY, 20)) {
                this.ctx.save();
                this.ctx.translate(dx, dy);
                
                // Drone xoay bồng bềnh nhẹ nhàng
                this.ctx.rotate(Math.sin(Date.now() * 0.003) * 0.2);
                
                // 1. Quầng sáng Laser Drone (Outer Glow)
                this.ctx.globalAlpha = 0.25;
                this.ctx.strokeStyle = '#39ff14';
                this.ctx.lineWidth = 6;
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = Math.cos(angle) * 8;
                    const py = Math.sin(angle) * 8;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.stroke();

                // 2. Thân chính Drone (Solid Core)
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = 'rgba(10, 20, 10, 0.9)';
                this.ctx.strokeStyle = '#39ff14';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = Math.cos(angle) * 8;
                    const py = Math.sin(angle) * 8;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Vẽ 2 cánh nhỏ hai bên
                this.ctx.strokeStyle = '#39ff14';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(-8, 0);
                this.ctx.lineTo(-14, -3);
                this.ctx.moveTo(8, 0);
                this.ctx.lineTo(14, -3);
                this.ctx.stroke();
                
                // Mắt cảm biến nhấp nháy
                const flash = Math.floor(Date.now() / 250) % 2 === 0;
                this.ctx.fillStyle = flash ? '#ffffff' : '#39ff14';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        }

        // 9. Vẽ số sát thương trôi nổi (Floating Texts)
        this.floatingTexts.forEach(ft => {
            if (this.isInView(ft.x, ft.y, 20)) {
                ft.draw(this.ctx, this.camera);
            }
        });

        this.ctx.restore();
    }

    // Kiểm tra thực thể có nằm trong màn hình camera hiện tại hay không để tiết kiệm render
    isInView(x, y, radius) {
        return (
            x + radius > this.camera.x &&
            x - radius < this.camera.x + this.canvas.width &&
            y + radius > this.camera.y &&
            y - radius < this.camera.y + this.canvas.height
        );
    }
}

// Khởi chạy game khi tải xong tài nguyên trang web
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new Game();
});
