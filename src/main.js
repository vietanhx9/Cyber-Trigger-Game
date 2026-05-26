import { sounds } from './audio/soundManager.js';
import { Vector } from './utils/vector.js';
import { Player } from './entities/player.js';
import { Enemy, Boss } from './entities/enemy.js';
import { Bullet, SwordSlash, HammerWave, HomingMissile, GravitySingularity } from './entities/bullet.js';
import { Item } from './entities/item.js';
import { Particle } from './effects/particle.js';
import { FloatingText } from './effects/floatingText.js';
import { Hazard } from './hazards/hazard.js';
import { Pillar, Barrel } from './entities/obstacle.js';
import { BlastRing } from './effects/blastRing.js';
import { LightningBolt } from './effects/lightningBolt.js';

class ShadowClone {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.lifeMax = 2500; // lasts for 2.5 seconds
        this.life = this.lifeMax;
        this.lastSlashTime = 0;
        this.radius = 20;
        this.driftAngle = Math.random() * Math.PI * 2;
    }

    update(enemies, deltaTime, gameEngine) {
        this.life -= deltaTime;
        if (this.life <= 0) return true; // to be spliced

        // Find nearest enemy to drift towards and slash
        let closest = null;
        let minDist = 300;
        enemies.forEach(enemy => {
            if (enemy.hp > 0 && enemy.type !== 'mine' && enemy.type !== 'portal') {
                const dist = Vector.dist(this.x, this.y, enemy.x, enemy.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            }
        });

        if (closest) {
            // Drift towards enemy
            const angle = Vector.angle(this.x, this.y, closest.x, closest.y);
            this.driftAngle = angle;
            this.x += Math.cos(angle) * 3 * (deltaTime / 16.67);
            this.y += Math.sin(angle) * 3 * (deltaTime / 16.67);

            // Slash every 300ms
            const now = performance.now();
            if (now - this.lastSlashTime >= 300) {
                this.lastSlashTime = now;
                // Trigger a sword slash at closest enemy angle
                gameEngine.triggerCloneSwordSlash(this.x, this.y, angle, this.damage);
            }
        } else {
            // Drift in a random direction if no enemies
            this.x += Math.cos(this.driftAngle) * 1 * (deltaTime / 16.67);
            this.y += Math.sin(this.driftAngle) * 1 * (deltaTime / 16.67);
        }

        return false;
    }

    draw(ctx, camera) {
        // Draw translucent pink ship
        const sX = this.x - camera.x;
        const sY = this.y - camera.y;
        
        ctx.save();
        ctx.translate(sX, sY);
        ctx.rotate(this.driftAngle);
        
        const alpha = Math.max(0.1, this.life / this.lifeMax) * 0.55;
        ctx.fillStyle = `rgba(255, 0, 127, ${alpha * 0.4})`;
        ctx.strokeStyle = `rgba(255, 0, 127, ${alpha})`;
        ctx.lineWidth = 2;
        
        // Triangle ship shape
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
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
        this.lightningBolts = [];
        this.singularities = [];
        this.shadowClones = [];
        this.merchantSpawnTimer = 0;
        this.merchantActive = false;
        this.merchantPortal = null;
        
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

        // Grid Distortions & White flash
        this.gridDistortions = [];
        this.whiteFlashTimer = 0;

        // Bản đồ game (cyber, jungle, desert)
        this.mapTheme = 'cyber';

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
            overclockFill: document.getElementById('hud-overclock-fill'),
            overclockText: document.getElementById('hud-overclock-text'),
            overclockPrompt: document.getElementById('overclock-prompt'),
            hackedShop: document.getElementById('hacked-shop-menu'),
            hackedShopChoices: document.getElementById('hacked-shop-choices'),
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
            card.addEventListener('mouseenter', () => {
                sounds.playMenuHover();
            });
            card.addEventListener('click', () => {
                sounds.playMenuSelect();
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

        // Đăng ký âm thanh hover cho toàn bộ nút bấm neon và nút loa
        const menuButtons = document.querySelectorAll('.btn-neon, .audio-toggle-btn');
        menuButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                sounds.playMenuHover();
            });
        });

        // Nút Start
        const startBtnEl = document.getElementById('btn-start-game');
        if (startBtnEl) {
            startBtnEl.addEventListener('click', () => {
                sounds.init();
                sounds.playMenuSelect();
                this.startGame();
            });
        }

        // Nút Restart
        const restartBtnEl = document.getElementById('btn-restart-game');
        if (restartBtnEl) {
            restartBtnEl.addEventListener('click', () => {
                sounds.playMenuSelect();
                this.startGame();
            });
        }

        // Nút bật/tắt loa nhanh
        const audioBtnEl = document.getElementById('btn-audio-toggle');
        if (audioBtnEl) {
            audioBtnEl.addEventListener('click', () => {
                sounds.toggleMute();
                sounds.playMenuSelect();
            });
        }

        // Nút Resume trong Pause Menu
        const resumeBtn = document.getElementById('btn-resume-game');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                sounds.playMenuSelect();
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
                sounds.playMenuSelect();
                this.backToMainMenu();
            });
        }

        // Nút đóng Chợ Đen
        const closeShopBtn = document.getElementById('btn-close-shop');
        if (closeShopBtn) {
            closeShopBtn.addEventListener('click', () => {
                sounds.playMenuSelect();
                this.closeHackedShop();
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

    addGridDistortion(x, y, radius = 180, force = 40, life = 400) {
        if (!this.gridDistortions) this.gridDistortions = [];
        this.gridDistortions.push({ x, y, radius, force, life });
    }

    warpPoint(x, y) {
        if (!this.gridDistortions || this.gridDistortions.length === 0) return { x, y };
        
        let dx = 0;
        let dy = 0;
        
        for (let i = 0; i < this.gridDistortions.length; i++) {
            const dist = this.gridDistortions[i];
            const distX = x - dist.x;
            const distY = y - dist.y;
            const distSq = distX * distX + distY * distY;
            const radiusSq = dist.radius * dist.radius;
            
            if (distSq < radiusSq) {
                const distance = Math.sqrt(distSq);
                if (distance > 0) {
                    // Lực đẩy lồi ra xa tâm vụ nổ/đập búa
                    const forceFactor = (1 - distance / dist.radius) * dist.force;
                    dx += (distX / distance) * forceFactor;
                    dy += (distY / distance) * forceFactor;
                }
            }
        }
        return { x: x + dx, y: y + dy };
    }

    onEnemyKilled(enemy, enemyIdx) {
        if (enemy.type === 'mine') {
            this.triggerMineExplosion(enemy.x, enemy.y);
            this.enemies.splice(enemyIdx, 1);
            return;
        }

        sounds.playExplosion();
        this.kills++;

        // Thu hoạch quái đặc biệt Glitch Gold Bug
        if (enemy.type === 'gold_bug') {
            for (let i = 0; i < 7; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 40;
                this.items.push(new Item(enemy.x + Math.cos(angle) * dist, enemy.y + Math.sin(angle) * dist, 'xp', 5));
            }
            this.items.push(new Item(enemy.x, enemy.y + 15, 'double'));
            this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 30, 'GLITCH HARVESTED! 💰', '#fffb00', 16));
        }

        // Tích lũy năng lượng Overclock
        if (this.player && !this.player.overclockActive) {
            this.player.overclockEnergy = Math.min(100, (this.player.overclockEnergy || 0) + 2.5);
        }

        this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, 12);
        this.triggerScreenShake(4, 100);

        const isPoisoned = enemy.poisonDuration && enemy.poisonDuration > 0;
        if (isPoisoned) {
            sounds.playPickup(); // Beep/splash sound for poison spread
            const poisonRadius = 130;
            this.blastRings.push(new BlastRing(enemy.x, enemy.y, poisonRadius, '#39ff14'));
            
            this.enemies.forEach(otherEnemy => {
                if (otherEnemy !== enemy && otherEnemy.hp > 0 && otherEnemy.type !== 'mine') {
                    const dist = Vector.dist(enemy.x, enemy.y, otherEnemy.x, otherEnemy.y);
                    if (dist < poisonRadius + otherEnemy.radius) {
                        const spreadDmg = Math.floor(enemy.poisonDamage * 1.5);
                        otherEnemy.hp -= spreadDmg;
                        otherEnemy.poisonDuration = 3000;
                        otherEnemy.poisonDamage = enemy.poisonDamage;
                        otherEnemy.lastPoisonTickTime = 0;
                        
                        this.floatingTexts.push(new FloatingText(otherEnemy.x, otherEnemy.y - 10, `${spreadDmg}`, '#39ff14', 13));
                        this.spawnBloodParticles(otherEnemy.x, otherEnemy.y, '#39ff14', 4);
                    }
                }
            });
        }

        const isBoss = (enemy instanceof Boss);
        let isLastBoss = false;
        
        if (isBoss) {
            if (enemy.silentDeath) {
                // Do nothing, silent death from split
            } else {
                // Check if this is the last Boss alive in the enemies list (excluding the current one being killed)
                const otherBossesAlive = this.enemies.some(e => e instanceof Boss && e !== enemy && e.hp > 0 && !e.silentDeath);
                if (!otherBossesAlive) {
                    isLastBoss = true;
                }
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
        this.addGridDistortion(x, y, expRadius * 1.2, 30, 400);
        
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
        this.addGridDistortion(x, y, expRadius * 1.2, 30, 400);

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
        // Random bản đồ khi bắt đầu game (5 loại bản đồ)
        const mapThemes = ['cyber', 'jungle', 'desert', 'ice', 'highland'];
        this.mapTheme = mapThemes[Math.floor(Math.random() * mapThemes.length)];

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

        // Cập nhật tooltip và icon của kỹ năng active E trên HUD theo vai trò
        const skillShockwave = document.getElementById('skill-shockwave');
        if (skillShockwave) {
            const skillIcon = skillShockwave.querySelector('.skill-icon');
            const skillTooltip = skillShockwave.querySelector('.skill-tooltip');
            
            if (this.selectedRole === 'fighter') {
                if (skillIcon) skillIcon.textContent = '🔨';
                if (skillTooltip) skillTooltip.textContent = 'ĐỊA CHẤN VÀNG (E)';
                skillShockwave.style.borderColor = '#fffb00';
                skillShockwave.style.boxShadow = 'inset 0 0 8px rgba(255, 251, 0, 0.2), 0 0 12px rgba(255, 251, 0, 0.4)';
            } else if (this.selectedRole === 'mage') {
                if (skillIcon) skillIcon.textContent = '🔮';
                if (skillTooltip) skillTooltip.textContent = 'CHRONO-BLINK (E)';
                skillShockwave.style.borderColor = '#b026ff';
                skillShockwave.style.boxShadow = 'inset 0 0 8px rgba(176, 38, 255, 0.2), 0 0 12px rgba(176, 38, 255, 0.4)';
            } else if (this.selectedRole === 'ranger') {
                if (skillIcon) skillIcon.textContent = '⚡';
                if (skillTooltip) skillTooltip.textContent = 'QUÁ TẢI PLASMA (E)';
                skillShockwave.style.borderColor = '#00f0ff';
                skillShockwave.style.boxShadow = 'inset 0 0 8px rgba(0, 240, 255, 0.2), 0 0 12px rgba(0, 240, 255, 0.4)';
            } else if (this.selectedRole === 'assassin') {
                if (skillIcon) skillIcon.textContent = '🗡️';
                if (skillTooltip) skillTooltip.textContent = 'VÔ ẢNH KÍCH (E)';
                skillShockwave.style.borderColor = '#ff007f';
                skillShockwave.style.boxShadow = 'inset 0 0 8px rgba(255, 0, 127, 0.2), 0 0 12px rgba(255, 0, 127, 0.4)';
            }
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
        this.activeShockwaves = [];
        this.lightningBolts = [];
        this.singularities = [];
        this.shadowClones = [];
        this.merchantSpawnTimer = 0;
        this.merchantActive = false;
        this.merchantPortal = null;

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
        
        // Khởi tạo các hạt nền đặc trưng cho từng bản đồ (đom đóm, cát, tuyết rơi, cánh hoa ma thuật, bụi vũ trụ)
        this.stars = [];
        if (this.mapTheme === 'jungle') {
            const fireflyColors = ['#39ff14', '#aacc00', '#55ff00', '#76ff03'];
            for (let i = 0; i < 120; i++) {
                const baseAlpha = 0.15 + Math.random() * 0.35;
                this.stars.push({
                    x: Math.random() * this.worldSize,
                    y: Math.random() * this.worldSize,
                    radius: 1.2 + Math.random() * 1.6,
                    color: fireflyColors[Math.floor(Math.random() * fireflyColors.length)],
                    alpha: baseAlpha,
                    baseAlpha: baseAlpha,
                    angle: Math.random() * Math.PI * 2,
                    flickerTimer: Math.random() * 100
                });
            }
        } else if (this.mapTheme === 'desert') {
            const sandColors = ['#e9c46a', '#f4a261', '#e76f51', '#d4a373', '#e09f67'];
            for (let i = 0; i < 180; i++) {
                this.stars.push({
                    x: Math.random() * this.worldSize,
                    y: Math.random() * this.worldSize,
                    radius: 0.6 + Math.random() * 1.0,
                    color: sandColors[Math.floor(Math.random() * sandColors.length)],
                    alpha: 0.15 + Math.random() * 0.3,
                    speed: 0.4 + Math.random() * 1.2
                });
            }
        } else if (this.mapTheme === 'ice') {
            // Tuyết rơi vĩnh cửu
            const snowColors = ['#ffffff', '#e0f2fe', '#bae6fd', '#f8fafc'];
            for (let i = 0; i < 150; i++) {
                this.stars.push({
                    x: Math.random() * this.worldSize,
                    y: Math.random() * this.worldSize,
                    radius: 1.0 + Math.random() * 2.0, // Hạt tuyết to nhỏ khác nhau
                    color: snowColors[Math.floor(Math.random() * snowColors.length)],
                    alpha: 0.3 + Math.random() * 0.5,
                    speed: 0.5 + Math.random() * 1.2,
                    wobble: Math.random() * 100,
                    wobbleSpeed: 0.01 + Math.random() * 0.03
                });
            }
        } else if (this.mapTheme === 'highland') {
            // Cánh hoa anh đào/lá phong ma thuật bay lượn
            const petalColors = ['#f472b6', '#c084fc', '#e879f9', '#a78bfa', '#f43f5e'];
            for (let i = 0; i < 100; i++) {
                this.stars.push({
                    x: Math.random() * this.worldSize,
                    y: Math.random() * this.worldSize,
                    radius: 1.5 + Math.random() * 2.0, // Cánh hoa to bay lãng mạn
                    color: petalColors[Math.floor(Math.random() * petalColors.length)],
                    alpha: 0.25 + Math.random() * 0.45,
                    speed: 0.3 + Math.random() * 0.8,
                    wave: Math.random() * 100,
                    waveSpeed: 0.005 + Math.random() * 0.015
                });
            }
        } else {
            // Cyber theme (mặc định)
            const starColors = ['#00f0ff', '#ff007f', '#39ff14', '#ffffff', '#b026ff'];
            for (let i = 0; i < 200; i++) {
                this.stars.push({
                    x: Math.random() * this.worldSize,
                    y: Math.random() * this.worldSize,
                    radius: 0.8 + Math.random() * 1.5,
                    color: starColors[Math.floor(Math.random() * starColors.length)],
                    alpha: 0.12 + Math.random() * 0.3
                });
            }
        }

        // Hiện thông báo tên bản đồ bằng FloatingText rực rỡ
        const mapNames = {
            'cyber': 'BẢN ĐỒ CYBERPUNK CỔ ĐIỂN',
            'jungle': 'THUNG LŨNG RỪNG RẬM / JUNGLE VALLEY',
            'desert': 'HẺM NÚI SA MẠC / DESERT CANYON',
            'ice': 'HỒ BĂNG GIÁ VĨNH CỬU / ETERNAL FROST',
            'highland': 'CAO NGUYÊN MA THUẬT / MAGICAL HIGHLAND'
        };
        const mapColors = {
            'cyber': '#00f0ff',
            'jungle': '#39ff14',
            'desert': '#e9c46a',
            'ice': '#a5f3fc',
            'highland': '#d946ef'
        };
        this.floatingTexts.push(new FloatingText(
            this.player.x, 
            this.player.y - 120, 
            mapNames[this.mapTheme], 
            mapColors[this.mapTheme], 
            22
        ));
        
        this.gameTime = 0;
        this.kills = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1600;
        this.magnetPowerupTimer = 0;
        this.gridDistortions = [];
        this.whiteFlashTimer = 0;
        
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
        if (this.state !== 'PLAYING' && this.state !== 'UPGRADE' && this.state !== 'SUPER_UPGRADE' && this.state !== 'HACKED_SHOP' && this.state !== 'PAUSED') return;

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
            this.disasterTimer = 8000; // 8 giây thiên tai
            this.disasterTickTimer = 0;
            
            const types = [
                'earthquake', 'fire_vent', 'meteor_storm',
                'portal_overload', 'frequency_glitch', 'zero_gravity',
                'matrix_protocol'
            ];
            this.disasterType = types[Math.floor(Math.random() * types.length)];
            this.nextDisasterTime += this.disasterInterval;
            
            // Âm thanh báo động thiên tai
            sounds.playLevelUp();
            
            const disasterNames = {
                'earthquake': 'ĐỘNG ĐẤT / EARTHQUAKE ALERT!',
                'fire_vent': 'LỬA PHUN TRÀO / VOLCANIC ERUPTION!',
                'meteor_storm': 'MƯA ĐÁ CYBER / METEOR STORM!',
                'portal_overload': 'CỔNG DỮ LIỆU QUÁ TẢI / PORTAL OVERLOAD!',
                'frequency_glitch': 'LỖI TẦN SỐ HỆ THỐNG / FREQUENCY GLITCH!',
                'zero_gravity': 'TRẠNG THÁI PHI TRỌNG LỰC / ZERO GRAVITY!',
                'matrix_protocol': 'GIAO THỨC MATRIX / MATRIX PROTOCOL DETECTED!'
            };
            const disasterColors = {
                'earthquake': '#39ff14',
                'fire_vent': '#ff7700',
                'meteor_storm': '#ff3131',
                'portal_overload': '#ff00ff',
                'frequency_glitch': '#00f0ff',
                'zero_gravity': '#b026ff',
                'matrix_protocol': '#39ff14'
            };
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 60, disasterNames[this.disasterType], disasterColors[this.disasterType], 22));

            // Kích hoạt logic khi bắt đầu sự kiện
            if (this.disasterType === 'portal_overload') {
                // Triệu hồi 2 cổng portal ngoài camera
                for (let k = 0; k < 2; k++) {
                    const spawnDist = Math.max(this.canvas.width, this.canvas.height) / 2 + 150;
                    const angle = Math.random() * Math.PI * 2;
                    let px = this.player.x + Math.cos(angle) * spawnDist;
                    let py = this.player.y + Math.sin(angle) * spawnDist;
                    
                    px = Math.max(80, Math.min(this.worldSize - 80, px));
                    py = Math.max(80, Math.min(this.worldSize - 80, py));
                    
                    const portal = new Enemy(px, py, this.player.level, 'portal');
                    this.enemies.push(portal);
                    this.spawnBloodParticles(px, py, '#ff00ff', 12);
                }
            } else if (this.disasterType === 'matrix_protocol') {
                // Sinh ngẫu nhiên quái Glitch Gold Bug gần phi thuyền
                const angle = Math.random() * Math.PI * 2;
                const bx = this.player.x + Math.cos(angle) * 350;
                const by = this.player.y + Math.sin(angle) * 350;
                const goldBug = new Enemy(bx, by, this.player.level, 'gold_bug');
                this.enemies.push(goldBug);
            } else if (this.disasterType === 'frequency_glitch') {
                // Áp dụng CSS class glitch
                const container = document.getElementById('game-container');
                if (container) container.classList.add('glitch-active');
            }
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
                const container = document.getElementById('game-container');
                if (container) container.classList.remove('glitch-active');
            }
        }

        // Cập nhật các Mối nguy hiểm (Hazards)
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            this.hazards[i].update(deltaTime, this);
            if (this.hazards[i].isDead) {
                this.hazards.splice(i, 1);
            }
        }

        // Cập nhật bossSpawnInterval dựa trên level hiện tại của player
        let targetInterval = 60;
        if (this.player.level > 11) {
            targetInterval = 30;
        } else if (this.player.level > 8) {
            targetInterval = 30;
        } else if (this.player.level > 5) {
            targetInterval = 45;
        }
        
        if (this.bossSpawnInterval !== targetInterval) {
            const diff = targetInterval - this.bossSpawnInterval;
            this.bossSpawnInterval = targetInterval;
            if (!this.bossWarningActive) {
                // Điều chỉnh mốc tiếp theo tương ứng để không bị chậm trễ
                this.nextBossTime = Math.max(this.gameTime, this.nextBossTime + diff);
            }
        }

        // Xử lý Cảnh báo Boss & Spawn Boss định kỳ
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
                
                const angle = Math.random() * Math.PI * 2;
                let bossCount = 1;
                let multiplier = 1.0;
                
                if (this.player.level > 11) {
                    bossCount = 2;
                    multiplier = 1.5;
                } else if (this.player.level > 8) {
                    bossCount = 1;
                    multiplier = 1.4;
                } else if (this.player.level > 5) {
                    bossCount = 1;
                    multiplier = 1.2;
                }
                
                if (bossCount === 2) {
                    // Spawn 2 boss ngẫu nhiên đối xứng qua phi thuyền
                    const bx1 = this.player.x + Math.cos(angle) * 350;
                    const by1 = this.player.y + Math.sin(angle) * 350;
                    const bx2 = this.player.x + Math.cos(angle + Math.PI) * 350;
                    const by2 = this.player.y + Math.sin(angle + Math.PI) * 350;
                    
                    const bossTypes = ['yellow_intruder', 'neon_vortex', 'synapse_reaper', 'arch_overseer', 'grid_infection'];
                    const type1 = bossTypes[Math.floor(Math.random() * bossTypes.length)];
                    const type2 = bossTypes[Math.floor(Math.random() * bossTypes.length)];
                    
                    const boss1 = new Boss(bx1, by1, type1, multiplier);
                    const boss2 = new Boss(bx2, by2, type2, multiplier);
                    
                    this.enemies.push(boss1);
                    this.enemies.push(boss2);
                    this.activeBoss = boss1; // Lưu tham chiếu cho HUD
                } else {
                    // Spawn 1 boss
                    const bx = this.player.x + Math.cos(angle) * 350;
                    const by = this.player.y + Math.sin(angle) * 350;
                    
                    const boss = new Boss(bx, by, null, multiplier);
                    this.enemies.push(boss);
                    this.activeBoss = boss;
                }
                
                sounds.playLevelUp();
            }
        }

        // Cập nhật thanh HP Boss và Tên/Màu sắc động (hỗ trợ hiển thị tổng máu của nhiều boss)
        const bossHpContainer = document.getElementById('boss-hp-container');
        const activeBosses = this.enemies.filter(e => e instanceof Boss && e.hp > 0 && !e.silentDeath);
        if (activeBosses.length > 0) {
            if (bossHpContainer) {
                bossHpContainer.classList.remove('hidden');
                
                const totalHp = activeBosses.reduce((sum, b) => sum + b.hp, 0);
                const totalMaxHp = activeBosses.reduce((sum, b) => sum + b.maxHp, 0);
                const bossHpPct = (totalHp / totalMaxHp) * 100;
                
                const hpFill = document.getElementById('boss-hp-fill');
                const bossColor = activeBosses[0].color;
                if (hpFill) {
                    hpFill.style.width = `${bossHpPct}%`;
                    hpFill.style.backgroundColor = bossColor;
                    hpFill.style.boxShadow = `0 0 10px ${bossColor}`;
                }
                
                const bossNameEl = bossHpContainer.querySelector('.boss-name');
                if (bossNameEl) {
                    const uniqueNames = activeBosses.map(b => b.name).filter((v, i, a) => a.indexOf(v) === i);
                    bossNameEl.textContent = `⚠️ CRITICAL TARGETS: ${uniqueNames.join(' & ')} ⚠️`;
                    bossNameEl.style.color = bossColor;
                    bossNameEl.style.textShadow = `0 0 5px ${bossColor}`;
                }
                
                document.getElementById('boss-hp-text').textContent = `${Math.ceil(totalHp)} / ${totalMaxHp}`;
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
                
                // Spawn Cổng Chợ Đen khi diệt Boss
                this.merchantActive = true;
                this.merchantPortal = {
                    x: this.bossDeathX,
                    y: this.bossDeathY,
                    radius: 40,
                    pulseTimer: 0,
                    life: 15000 // 15 giây
                };
                this.floatingTexts.push(new FloatingText(this.bossDeathX, this.bossDeathY - 40, 'CỔNG CHỢ ĐEN XUẤT HIỆN! 📡', '#ff3131', 20));
            }
        }
        
        // Cập nhật Timer nhặt nam châm hút toàn bản đồ
        if (this.magnetPowerupTimer > 0) {
            this.magnetPowerupTimer -= deltaTime;
        }

        // Cập nhật các điểm biến dạng lưới nền
        if (this.gridDistortions) {
            for (let i = this.gridDistortions.length - 1; i >= 0; i--) {
                const dist = this.gridDistortions[i];
                dist.life -= deltaTime;
                dist.force *= 0.92; // suy hao dần lực kéo
                if (dist.life <= 0) {
                    this.gridDistortions.splice(i, 1);
                }
            }
        }

        // Cập nhật flash màn hình trắng khi chí mạng
        if (this.whiteFlashTimer > 0) {
            this.whiteFlashTimer -= deltaTime;
            if (this.whiteFlashTimer < 0) this.whiteFlashTimer = 0;
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
        if (this.keys['q'] || this.keys['f']) {
            this.keys['q'] = false;
            this.keys['f'] = false;
            this.triggerOverclock();
        }

        // Cập nhật Sóng Chấn Động nếu có hoạt động
        for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
            const wave = this.activeShockwaves[i];
            wave.currentRadius += wave.speed * (deltaTime / 16.67) * 4.5;
            if (wave.currentRadius >= wave.maxRadius) {
                this.activeShockwaves.splice(i, 1);
            }
        }

        // Cập nhật vòng nổ (Blast Rings) của thùng thuốc nổ
        for (let i = this.blastRings.length - 1; i >= 0; i--) {
            const complete = this.blastRings[i].update(deltaTime);
            if (complete) {
                this.blastRings.splice(i, 1);
            }
        }

        // Cập nhật tia sét (Lightning Bolts)
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const isDead = this.lightningBolts[i].update(deltaTime);
            if (isDead) {
                this.lightningBolts.splice(i, 1);
            }
        }

        // Cập nhật người chơi
        this.player.update(this.keys, this.mouse, this.canvas.width, this.canvas.height, this.camera, deltaTime);

        // Xử lý càn quét trong Shadow Dash của Sát thủ
        if (this.player.role === 'assassin' && this.player.shadowDashTimer > 0) {
            const dashReach = this.player.radius + 40;
            
            // 1. Phá hủy đạn địch xung quanh đường lướt
            this.bullets = this.bullets.filter(bullet => {
                if (!bullet.isPlayerBullet) {
                    const dist = Vector.dist(this.player.x, this.player.y, bullet.x, bullet.y);
                    if (dist < dashReach + bullet.radius) {
                        this.spawnBloodParticles(bullet.x, bullet.y, '#ff3131', 2);
                        return false;
                    }
                }
                return true;
            });

            // 2. Chém và gây sát thương lớn lên quái vật chạm phải
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.player.shadowDashHitEnemies && !this.player.shadowDashHitEnemies.has(enemy)) {
                    const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                    if (dist < dashReach + enemy.radius) {
                        this.player.shadowDashHitEnemies.add(enemy);
                        
                        // Sát thương 70 (scaled theo nâng cấp damage)
                        const dashDamage = Math.floor(70 * (1 + this.player.upgrades.damage * 0.25));
                        this.damageEnemy(enemy, dashDamage, Math.cos(this.player.shadowDashAngle) * 5, Math.sin(this.player.shadowDashAngle) * 5, j);
                        
                        // Hiệu ứng chém kiếm pink neon đẹp mắt
                        sounds.playSwordSlash();
                        this.swordSlashes.push(new SwordSlash(
                            enemy.x, enemy.y, 
                            this.player.shadowDashAngle + (Math.random() - 0.5) * 0.5, 
                            enemy.radius + 20, 
                            '#ff007f', 
                            0 // Sát thương đã được tính trực tiếp
                        ));
                    }
                }
            }
        }

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
        let modifiedFireRate = this.player.fireRate * Math.pow(0.8, this.player.upgrades.fireRate);
        if (this.player.plasmaOverloadTimer > 0) {
            modifiedFireRate /= 3.0; // Bắn nhanh gấp 3 lần khi bật Quá tải Plasma
        }
        if (this.disasterActive && this.disasterType === 'frequency_glitch') {
            modifiedFireRate /= 2.0; // Bắn nhanh gấp đôi trong sự kiện Frequency Glitch
        }

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
            if (this.player.role === 'ranger' && this.player.overclockActive) {
                // Ranger Overclock: Mega Beam laser sweep
                if (!this.lastRangerLaserTickTime) this.lastRangerLaserTickTime = 0;
                const laserNow = performance.now();
                if (laserNow - this.lastRangerLaserTickTime >= 60) {
                    this.lastRangerLaserTickTime = laserNow;
                    
                    const angle = this.player.angle;
                    const maxLen = 700;
                    const laserDamage = Math.max(1, Math.floor(this.player.damage * 0.35 * (1 + this.player.upgrades.damage * 0.25)));
                    
                    // Line-circle intersection with enemies
                    this.enemies.forEach((enemy, idx) => {
                        if (enemy.hp > 0 && enemy.type !== 'portal') {
                            const ex = enemy.x - this.player.x;
                            const ey = enemy.y - this.player.y;
                            
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const proj = ex * cosA + ey * sinA;
                            
                            if (proj > 0 && proj < maxLen) {
                                const perpDist = Math.abs(-ex * sinA + ey * cosA);
                                const allowedDist = enemy.radius + 15;
                                if (perpDist < allowedDist) {
                                    const vx = cosA * 2;
                                    const vy = sinA * 2;
                                    this.damageEnemy(enemy, laserDamage, vx, vy, idx);
                                    
                                    const hitX = this.player.x + cosA * proj;
                                    const hitY = this.player.y + sinA * proj;
                                    this.spawnBloodParticles(hitX, hitY, '#00f0ff', 2);
                                }
                            }
                        }
                    });
                    
                    // Intersect with barrels
                    for (let j = this.barrels.length - 1; j >= 0; j--) {
                        const b = this.barrels[j];
                        const ex = b.x - this.player.x;
                        const ey = b.y - this.player.y;
                        const proj = ex * Math.cos(angle) + ey * Math.sin(angle);
                        
                        if (proj > 0 && proj < maxLen) {
                            const perpDist = Math.abs(-ex * Math.sin(angle) + ey * Math.cos(angle));
                            const allowedDist = b.radius + 15;
                            if (perpDist < allowedDist) {
                                this.triggerBarrelExplosion(b.x, b.y, 'ranger_overload');
                                this.barrels.splice(j, 1);
                            }
                        }
                    }
                }
            } else {
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
        }

        // Cập nhật Camera (bám sát nhân vật, giữ khoảng cách tâm màn hình)
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        
        // Giới hạn Camera trong bản đồ World Size (3000 x 3000)
        this.camera.x = Math.max(0, Math.min(this.worldSize - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.worldSize - this.canvas.height, this.camera.y));

        // Cập nhật hạt bụi vũ trụ / đom đóm / gió cát / tuyết rơi / cánh hoa nền của bản đồ
        if (this.stars) {
            this.stars.forEach(star => {
                if (this.mapTheme === 'jungle') {
                    // Đom đóm bay lượn ngẫu nhiên nhẹ nhàng
                    star.angle = (star.angle || 0) + (Math.random() - 0.5) * 0.1;
                    star.x += Math.cos(star.angle) * 0.25 * (deltaTime / 16);
                    star.y += Math.sin(star.angle) * 0.25 * (deltaTime / 16);
                    
                    // Giữ đom đóm trong biên giới bản đồ
                    if (star.x < 0) star.x += this.worldSize;
                    if (star.x > this.worldSize) star.x -= this.worldSize;
                    if (star.y < 0) star.y += this.worldSize;
                    if (star.y > this.worldSize) star.y -= this.worldSize;

                    // Nhấp nháy nhẹ độ sáng qua hàm sin
                    star.flickerTimer = (star.flickerTimer || 0) + deltaTime * 0.002;
                    star.alpha = star.baseAlpha + Math.sin(star.flickerTimer) * 0.12;
                    star.alpha = Math.max(0.08, Math.min(0.65, star.alpha));
                } else if (this.mapTheme === 'desert') {
                    // Gió cát thổi bụi cát bay ngang từ trái sang phải
                    star.x += (1.6 + star.speed) * (deltaTime / 16);
                    star.y += (Math.random() - 0.5) * 0.25 * (deltaTime / 16);
                    
                    if (star.x > this.worldSize) {
                        star.x = 0;
                        star.y = Math.random() * this.worldSize;
                    }
                } else if (this.mapTheme === 'ice') {
                    // Tuyết rơi chậm trôi nghiêng xuống dưới kèm wobble hình sin ngang
                    star.wobble += star.wobbleSpeed * (deltaTime / 16);
                    star.x += Math.sin(star.wobble) * 0.18 * (deltaTime / 16);
                    star.y += star.speed * 0.8 * (deltaTime / 16);
                    
                    if (star.y > this.worldSize) {
                        star.y = 0;
                        star.x = Math.random() * this.worldSize;
                    }
                    if (star.x < 0) star.x += this.worldSize;
                    if (star.x > this.worldSize) star.x -= this.worldSize;
                } else if (this.mapTheme === 'highland') {
                    // Cánh hoa ma thuật bay lượn mềm mại hình sin ngang
                    star.wave += star.waveSpeed * (deltaTime / 16);
                    star.x += star.speed * 0.7 * (deltaTime / 16);
                    star.y += Math.sin(star.wave) * 0.35 * (deltaTime / 16);
                    
                    if (star.x > this.worldSize) {
                        star.x = 0;
                        star.y = Math.random() * this.worldSize;
                    }
                    if (star.y < 0) star.y += this.worldSize;
                    if (star.y > this.worldSize) star.y -= this.worldSize;
                }
            });
        }

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
        
        // Cập nhật Hố đen ma pháp (Gravity Singularities)
        for (let i = this.singularities.length - 1; i >= 0; i--) {
            const singularity = this.singularities[i];
            const isDead = singularity.update(this.enemies, deltaTime, this);
            if (isDead) {
                this.singularities.splice(i, 1);
            }
        }

        // Cập nhật Phân Thân Bóng Tối (Shadow Clones)
        for (let i = this.shadowClones.length - 1; i >= 0; i--) {
            const clone = this.shadowClones[i];
            const isDead = clone.update(this.enemies, deltaTime, this);
            if (isDead) {
                this.shadowClones.splice(i, 1);
            }
        }

        // Spawn shadow clones liên tục mỗi 800ms khi Assassin bật Overclock
        if (this.player.role === 'assassin' && this.player.overclockActive) {
            const now = performance.now();
            if (!this.lastShadowCloneSpawnTime) this.lastShadowCloneSpawnTime = 0;
            if (now - this.lastShadowCloneSpawnTime >= 800) {
                this.lastShadowCloneSpawnTime = now;
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 80;
                const cloneX = this.player.x + Math.cos(angle) * dist;
                const cloneY = this.player.y + Math.sin(angle) * dist;
                const cloneDamage = Math.floor(this.player.damage * 0.8 * (1 + this.player.upgrades.damage * 0.25));
                this.shadowClones.push(new ShadowClone(cloneX, cloneY, cloneDamage));
            }
        }

        // Cập nhật Cổng Chợ Đen (Merchant Portal)
        if (this.state === 'PLAYING') {
            this.merchantSpawnTimer += deltaTime;
            if (this.merchantSpawnTimer >= 90000) { // 90 giây
                this.merchantSpawnTimer = 0;
                this.merchantActive = true;
                
                const angle = Math.random() * Math.PI * 2;
                const portalX = Math.max(100, Math.min(this.worldSize - 100, this.player.x + Math.cos(angle) * 200));
                const portalY = Math.max(100, Math.min(this.worldSize - 100, this.player.y + Math.sin(angle) * 200));
                
                this.merchantPortal = {
                    x: portalX,
                    y: portalY,
                    radius: 40,
                    pulseTimer: 0,
                    life: 15000 // 15 giây
                };
                
                sounds.playLevelUp();
                this.floatingTexts.push(new FloatingText(portalX, portalY - 40, 'CỔNG CHỢ ĐEN XUẤT HIỆN! 📡', '#ff3131', 20));
            }
        }

        if (this.merchantActive && this.merchantPortal) {
            this.merchantPortal.life -= deltaTime;
            this.merchantPortal.pulseTimer += deltaTime;
            if (this.merchantPortal.life <= 0) {
                this.merchantActive = false;
                this.merchantPortal = null;
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 40, 'CỔNG CHỢ ĐEN ĐÃ ĐÓNG!', '#888888', 16));
            } else {
                const dist = Vector.dist(this.player.x, this.player.y, this.merchantPortal.x, this.merchantPortal.y);
                if (dist < this.player.radius + this.merchantPortal.radius) {
                    this.merchantActive = false;
                    this.merchantPortal = null;
                    this.triggerHackedShop();
                }
            }
        }

        // Xử lý mất HP từ Ép Xung Quá Nhiệt (Overheated)
        if (this.player.upgrades.overheated > 0 && this.state === 'PLAYING') {
            if (!this.lastOverheatedDamageTime) this.lastOverheatedDamageTime = 0;
            const now = performance.now();
            if (now - this.lastOverheatedDamageTime >= 1200) {
                this.lastOverheatedDamageTime = now;
                if (this.player.hp > 1) {
                    this.player.hp = Math.max(1, this.player.hp - 1);
                    this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 30, '-1 HP 🔥', '#ff5500', 12));
                    this.spawnBloodParticles(this.player.x, this.player.y, '#ff5500', 3);
                }
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
                if (bullet.isSingularity) {
                    this.singularities.push(new GravitySingularity(bullet.x, bullet.y, bullet.damage));
                }
                this.bullets.splice(i, 1);
                continue;
            }

            // Hủy đạn khi vượt quá biên thế giới
            if (bullet.x < 0 || bullet.x > this.worldSize || bullet.y < 0 || bullet.y > this.worldSize) {
                if (bullet.isSingularity) {
                    this.singularities.push(new GravitySingularity(bullet.x, bullet.y, bullet.damage));
                }
                this.bullets.splice(i, 1);
                continue;
            }

            // Kiểm tra va chạm với Cột Năng lượng
            let bulletCollided = false;
            for (let k = this.pillars.length - 1; k >= 0; k--) {
                const p = this.pillars[k];
                if (Vector.dist(bullet.x, bullet.y, p.x, p.y) < bullet.radius + p.radius) {
                    bulletCollided = true;
                    this.bullets.splice(i, 1);
                    this.spawnBloodParticles(bullet.x, bullet.y, p.neonColor, 4);
                    
                    // Nổ ma pháp nếu là đạn Mage
                    if (bullet.isOrb && bullet.isPlayerBullet) {
                        if (bullet.isSingularity) {
                            this.singularities.push(new GravitySingularity(bullet.x, bullet.y, bullet.damage));
                        } else {
                            this.triggerMagicExplosion(bullet.x, bullet.y, bullet.damage);
                        }
                    }

                    // Gây sát thương lên Cột Khúc Xạ
                    if (bullet.isPlayerBullet) {
                        p.hp -= bullet.damage;
                        if (p.hp <= 0) {
                            this.triggerPillarExplosion(p, k);
                        }
                    }
                    
                    // Cơ chế khúc xạ (Refractive energy splitting)
                    const isLaser = (bullet.color === '#00f0ff' || bullet.color === '#39ff14' || bullet.color === '#ff00ff' || bullet.color === '#ff3131');
                    const currentSplit = bullet.splitCount || 0;
                    if (isLaser && currentSplit < 2 && p.hp > 0) {
                        const incomingAngle = Math.atan2(bullet.vy, bullet.vx);
                        const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                        
                        // Phân tách thành 2 tia lệch +/- 30 độ
                        const angles = [incomingAngle - Math.PI / 6, incomingAngle + Math.PI / 6];
                        angles.forEach(ang => {
                            const vx = Math.cos(ang) * speed;
                            const vy = Math.sin(ang) * speed;
                            // Đẩy ra ngoài rìa cột một chút để tránh va chạm ngay lập tức
                            const spawnX = p.x + Math.cos(ang) * (p.radius + 8);
                            const spawnY = p.y + Math.sin(ang) * (p.radius + 8);
                            
                            const splitBullet = new Bullet(
                                spawnX, spawnY, vx, vy,
                                bullet.radius * 0.8,
                                bullet.damage * 0.75,
                                bullet.color,
                                bullet.isPlayerBullet
                            );
                            splitBullet.splitCount = currentSplit + 1;
                            
                            // Giữ lại thuộc tính đặc biệt
                            if (bullet.isHeavy) splitBullet.isHeavy = true;
                            if (bullet.isDagger) splitBullet.isDagger = true;
                            if (bullet.isOrb) splitBullet.isOrb = true;
                            
                            this.bullets.push(splitBullet);
                        });
                    }
                    break;
                }
            }
            if (bulletCollided) continue;

            // Kiểm tra va chạm với Thùng thuốc nổ
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                if (Vector.dist(bullet.x, bullet.y, b.x, b.y) < bullet.radius + b.radius) {
                    bulletCollided = true;
                    this.bullets.splice(i, 1);
                    
                    // Nổ ma pháp nếu là đạn Mage
                    if (bullet.isOrb && bullet.isPlayerBullet) {
                        if (bullet.isSingularity) {
                            this.singularities.push(new GravitySingularity(bullet.x, bullet.y, bullet.damage));
                        } else {
                            this.triggerMagicExplosion(bullet.x, bullet.y, bullet.damage);
                        }
                    }
                    
                    b.hp--;
                    if (b.hp <= 0) {
                        let triggerSource = 'bullet';
                        if (bullet.isPlayerBullet) {
                            if (this.player.role === 'fighter') {
                                triggerSource = 'fighter';
                            } else if (this.player.role === 'ranger' && this.player.plasmaOverloadTimer > 0) {
                                triggerSource = 'ranger_overload';
                            }
                        }
                        this.triggerBarrelExplosion(b.x, b.y, triggerSource);
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
                const distToPlayer = Vector.dist(bullet.x, bullet.y, this.player.x, this.player.y);
                
                // Cơ chế Phản Đòn EMP (Synergy EMP Reflector)
                const hasEmpReflector = (this.player.upgrades.empReflector || 0) > 0;
                const isDashing = (this.player.iframe > 0 && this.player.isDashingTimer > 0) || (this.player.shadowDashTimer > 0);
                const hasShield = this.player.powerups.shield > 0;
                
                if (hasEmpReflector && (isDashing || hasShield) && distToPlayer < bullet.radius + this.player.radius + 20) {
                    bullet.isPlayerBullet = true;
                    // Phản đòn ngược lại hướng xuất phát với tốc độ cao hơn
                    bullet.vx = -bullet.vx * 1.3;
                    bullet.vy = -bullet.vy * 1.3;
                    bullet.color = '#00f0ff'; // Xanh cyan neon phản đòn
                    bullet.damage = Math.floor(bullet.damage * 1.5 * this.player.upgrades.empReflector);
                    this.spawnBloodParticles(bullet.x, bullet.y, '#00f0ff', 4);
                    sounds.playHit();
                    if (Math.random() < 0.25) {
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 30, 'REFLECT! 📡', '#00f0ff', 15));
                    }
                } else {
                    if (distToPlayer < bullet.radius + this.player.radius) {
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
                const dist = Vector.dist(slash.x, slash.y, enemy.x, enemy.y);
                if (dist < slash.radius + enemy.radius) {
                    const angleToEnemy = Math.atan2(enemy.y - slash.y, enemy.x - slash.x);
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

            // Kiểm tra va chạm Cột Năng lượng trong nhát chém
            for (let k = this.pillars.length - 1; k >= 0; k--) {
                const p = this.pillars[k];
                const dist = Vector.dist(slash.x, slash.y, p.x, p.y);
                if (dist < slash.radius + p.radius) {
                    const angleToPillar = Math.atan2(p.y - slash.y, p.x - slash.x);
                    let diff = Math.abs(angleToPillar - slash.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;
                    
                    if (diff < Math.PI / 3) {
                        if (!slash.hitPillars) slash.hitPillars = new Set();
                        if (!slash.hitPillars.has(p)) {
                            slash.hitPillars.add(p);
                            p.hp -= slash.damage;
                            this.spawnBloodParticles(p.x, p.y, p.neonColor, 4);
                            if (p.hp <= 0) {
                                this.triggerPillarExplosion(p, k);
                            }
                        }
                    }
                }
            }

            // Kiểm tra va chạm Thùng thuốc nổ trong nhát chém
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                const dist = Vector.dist(slash.x, slash.y, b.x, b.y);
                if (dist < slash.radius + b.radius) {
                    const angleToBarrel = Math.atan2(b.y - slash.y, b.x - slash.x);
                    let diff = Math.abs(angleToBarrel - slash.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;

                    if (diff < Math.PI / 3) {
                        this.triggerBarrelExplosion(b.x, b.y, 'assassin');
                        this.barrels.splice(j, 1);
                    }
                }
            }

            // Triệt tiêu đạn quái trong nhát chém
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                if (!bullet.isPlayerBullet) {
                    const dist = Vector.dist(slash.x, slash.y, bullet.x, bullet.y);
                    if (dist < slash.radius + bullet.radius) {
                        const angleToBullet = Math.atan2(bullet.y - slash.y, bullet.x - slash.x);
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

            // Kiểm tra va chạm Cột Năng lượng trong sóng búa
            for (let k = this.pillars.length - 1; k >= 0; k--) {
                const p = this.pillars[k];
                const dist = Vector.dist(this.player.x, this.player.y, p.x, p.y);
                if (dist < wave.radius + p.radius && dist > wave.radius - 50 - p.radius) {
                    const angleToPillar = Math.atan2(p.y - this.player.y, p.x - this.player.x);
                    let diff = Math.abs(angleToPillar - wave.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;
                    
                    if (wave.is360 || diff < Math.PI / 4) {
                        if (!wave.hitPillars) wave.hitPillars = new Set();
                        if (!wave.hitPillars.has(p)) {
                            wave.hitPillars.add(p);
                            p.hp -= wave.damage;
                            this.spawnBloodParticles(p.x, p.y, p.neonColor, 4);
                            if (p.hp <= 0) {
                                this.triggerPillarExplosion(p, k);
                            }
                        }
                    }
                }
            }

            // Kiểm tra va chạm Thùng thuốc nổ trong sóng búa
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                const dist = Vector.dist(this.player.x, this.player.y, b.x, b.y);
                if (dist < wave.radius + b.radius && dist > wave.radius - 50 - b.radius) {
                    const angleToBarrel = Math.atan2(b.y - this.player.y, b.x - this.player.x);
                    let diff = Math.abs(angleToBarrel - wave.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;

                    if (wave.is360 || diff < Math.PI / 4) {
                        this.triggerBarrelExplosion(b.x, b.y, 'fighter');
                        this.barrels.splice(j, 1);
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

            // Kiểm tra quái chết (ví dụ do Độc rút máu)
            if (enemy.hp <= 0) {
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
                
                if (enemy.isHacked) {
                    // Quái vật bị hack không gây sát thương cho người chơi, chỉ đẩy nhẹ ra
                    const pushAngle = Vector.angle(this.player.x, this.player.y, enemy.x, enemy.y);
                    enemy.applyKnockback(pushAngle, 4);
                } else {
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

                    // Hacked enemy vs Non-hacked enemy combat
                    if ((enemy.isHacked && !other.isHacked) || (!enemy.isHacked && other.isHacked)) {
                        const hackedObj = enemy.isHacked ? enemy : other;
                        const targetObj = enemy.isHacked ? other : enemy;

                        if (!hackedObj.lastHackedHitTime) hackedObj.lastHackedHitTime = 0;
                        const now = performance.now();
                        if (now - hackedObj.lastHackedHitTime >= 1000) {
                            hackedObj.lastHackedHitTime = now;
                            
                            // Hacked deals contact damage to target
                            const dmg = Math.floor(hackedObj.damage * 1.5);
                            targetObj.hp -= dmg;
                            this.spawnBloodParticles(targetObj.x, targetObj.y, targetObj.color, 4);
                            this.floatingTexts.push(new FloatingText(targetObj.x, targetObj.y - targetObj.radius, `${dmg}`, '#ff00ff', 14));
                            sounds.playHit();

                            // Target also deals damage back to hacked enemy
                            hackedObj.hp -= Math.floor(targetObj.damage * 0.5);
                            this.spawnBloodParticles(hackedObj.x, hackedObj.y, hackedObj.color, 2);

                            // If the current enemy dies, kill it immediately and break
                            if (enemy.hp <= 0) {
                                this.onEnemyKilled(enemy, i);
                                break;
                            }
                        }
                    }
                }
            }
        }

        // Sinh quái vật tự động theo thời gian (Tạm dừng khi đang chiến đấu Boss)
        const hasBoss = this.enemies.some(e => e instanceof Boss);
        if (!this.bossWarningActive && !hasBoss && this.bossDeathTimer <= 0) {
            this.spawnTimer += deltaTime;
            let adjustedInterval = Math.max(400, this.spawnInterval - Math.floor(this.gameTime / 15) * 80);
            if (this.disasterActive && this.disasterType === 'matrix_protocol') {
                adjustedInterval /= 2.2;
            }
            
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
                    
                    let laserColor = '#39ff14';
                    if (this.player.subWeapons.laserDrone === 2) laserColor = '#00f0ff';
                    else if (this.player.subWeapons.laserDrone === 3) laserColor = '#ff00ff';
                    else if (this.player.subWeapons.laserDrone >= 4) laserColor = '#fffb00';
                    
                    this.bullets.push(new Bullet(
                        this.player.droneX,
                        this.player.droneY,
                        vx,
                        vy,
                        6,
                        10 + this.player.subWeapons.laserDrone * 5,
                        laserColor,
                        true
                    ));
                    sounds.playShoot();
                }
            }

            // --- TÍNH NĂNG DRONE CHIẾN THUẬT INTERACTIVE ---
            
            // Cấp 2+: Shield Drone - Tạo lá chắn trước đầu phi thuyền chắn đạn
            if (this.player.subWeapons.laserDrone >= 2) {
                const shieldX = this.player.x + Math.cos(this.player.angle) * 50;
                const shieldY = this.player.y + Math.sin(this.player.angle) * 50;
                for (let j = this.bullets.length - 1; j >= 0; j--) {
                    const bullet = this.bullets[j];
                    if (!bullet.isPlayerBullet) {
                        const d = Vector.dist(bullet.x, bullet.y, shieldX, shieldY);
                        if (d < bullet.radius + 18) {
                            const angleToBullet = Math.atan2(bullet.y - this.player.y, bullet.x - this.player.x);
                            let diff = Math.abs(angleToBullet - this.player.angle);
                            if (diff > Math.PI) diff = Math.PI * 2 - diff;
                            if (diff < Math.PI / 3) {
                                this.bullets.splice(j, 1);
                                sounds.playHit();
                                this.spawnBloodParticles(bullet.x, bullet.y, '#00f0ff', 3);
                            }
                        }
                    }
                }
            }

            // Cấp 3+: Hacking Drone - Tự động hack virus lớn thành đồng minh trong 6 giây
            if (this.player.subWeapons.laserDrone >= 3) {
                if (!this.lastHackTime) this.lastHackTime = 0;
                const hackNow = performance.now();
                if (hackNow - this.lastHackTime >= 6000) {
                    let candidates = this.enemies.filter(e => e.hp > 0 && !e.isHacked && e.type !== 'mine' && e.type !== 'portal' && !(e instanceof Boss));
                    if (candidates.length > 0) {
                        candidates.sort((a, b) => {
                            return Vector.dist(this.player.x, this.player.y, a.x, a.y) - Vector.dist(this.player.x, this.player.y, b.x, b.y);
                        });
                        
                        const targetEnemy = candidates[0];
                        if (Vector.dist(this.player.x, this.player.y, targetEnemy.x, targetEnemy.y) < 350) {
                            this.lastHackTime = hackNow;
                            targetEnemy.isHacked = true;
                            targetEnemy.hackTimer = 6000;
                            targetEnemy.color = '#ff00ff';
                            
                            sounds.playPowerup();
                            this.floatingTexts.push(new FloatingText(targetEnemy.x, targetEnemy.y - targetEnemy.radius - 10, 'HACKED! 📡', '#ff00ff', 14));
                            this.spawnBloodParticles(targetEnemy.x, targetEnemy.y, '#ff00ff', 6);
                            
                            this.activeHackBeam = {
                                startX: this.player.droneX,
                                startY: this.player.droneY,
                                endX: targetEnemy.x,
                                endY: targetEnemy.y,
                                life: 200
                            };
                        }
                    }
                }
            }

            // Cấp 4+: Nano-Repair Drone - Hồi phục khẩn cấp khi máu thấp dưới 35%
            if (this.player.subWeapons.laserDrone >= 4 && (this.player.hp / this.player.maxHp) <= 0.35) {
                if (!this.lastRepairTime) this.lastRepairTime = 0;
                const repairNow = performance.now();
                if (repairNow - this.lastRepairTime >= 10000) {
                    this.lastRepairTime = repairNow;
                    
                    const healAmt = Math.floor(this.player.maxHp * 0.1);
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
                    
                    sounds.playPowerup();
                    this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 30, `+${healAmt} HP (NANO REPAIR) 🧪`, '#39ff14', 16));
                    this.blastRings.push(new BlastRing(this.player.x, this.player.y, 80, '#39ff14'));
                    this.spawnBloodParticles(this.player.x, this.player.y, '#39ff14', 8);
                }
            }
        }

        if (this.activeHackBeam) {
            this.activeHackBeam.life -= deltaTime;
            if (this.activeHackBeam.life <= 0) {
                this.activeHackBeam = null;
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
        this.player.isDashingTimer = 250; // Đếm ngược lướt phục vụ EMP Reflector

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

        const role = this.player.role || 'fighter';

        if (role === 'fighter') {
            const waveRadius = 320;
            this.activeShockwaves.push({
                x: this.player.x,
                y: this.player.y,
                currentRadius: 0,
                maxRadius: waveRadius,
                speed: 8,
                color: '#fffb00'
            });

            sounds.playExplosion();
            this.triggerScreenShake(20, 350);

            // Phá hủy đạn địch
            this.bullets = this.bullets.filter(bullet => {
                if (!bullet.isPlayerBullet) {
                    const dist = Vector.dist(this.player.x, this.player.y, bullet.x, bullet.y);
                    if (dist < waveRadius) {
                        this.spawnBloodParticles(bullet.x, bullet.y, '#ff3131', 3);
                        return false;
                    }
                }
                return true;
            });

            // Gây sát thương (60), đẩy lùi mạnh (25) và choáng (1.5s)
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < waveRadius) {
                    const angle = Vector.angle(this.player.x, this.player.y, enemy.x, enemy.y);
                    enemy.stunTimer = 1500; // 1.5 giây choáng
                    const damage = Math.floor(60 * (1 + this.player.upgrades.damage * 0.25));
                    this.damageEnemy(enemy, damage, Math.cos(angle) * 25, Math.sin(angle) * 25, j, { isHeavy: true });
                }
            }

            // Kích nổ thùng thuốc nổ gần đó
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                const dist = Vector.dist(this.player.x, this.player.y, b.x, b.y);
                if (dist < waveRadius) {
                    this.triggerBarrelExplosion(b.x, b.y, 'fighter');
                    this.barrels.splice(j, 1);
                }
            }
        } else if (role === 'ranger') {
            const waveRadius = 160;
            this.activeShockwaves.push({
                x: this.player.x,
                y: this.player.y,
                currentRadius: 0,
                maxRadius: waveRadius,
                speed: 10,
                color: '#00f0ff'
            });

            sounds.playShockwave();
            this.triggerScreenShake(8, 200);

            // Dọn dẹp đạn xung quanh
            this.bullets = this.bullets.filter(bullet => {
                if (!bullet.isPlayerBullet) {
                    const dist = Vector.dist(this.player.x, this.player.y, bullet.x, bullet.y);
                    if (dist < waveRadius) {
                        this.spawnBloodParticles(bullet.x, bullet.y, '#ff3131', 2);
                        return false;
                    }
                }
                return true;
            });

            // Đẩy nhẹ quái ra
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dist = Vector.dist(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < waveRadius) {
                    const angle = Vector.angle(this.player.x, this.player.y, enemy.x, enemy.y);
                    const damage = Math.floor(15 * (1 + this.player.upgrades.damage * 0.25));
                    this.damageEnemy(enemy, damage, Math.cos(angle) * 6, Math.sin(angle) * 6, j);
                }
            }

            // Kích nổ thùng thuốc nổ gần đó
            for (let j = this.barrels.length - 1; j >= 0; j--) {
                const b = this.barrels[j];
                const dist = Vector.dist(this.player.x, this.player.y, b.x, b.y);
                if (dist < waveRadius) {
                    this.triggerBarrelExplosion(b.x, b.y, 'ranger_overload');
                    this.barrels.splice(j, 1);
                }
            }

            // Kích hoạt trạng thái quá tải
            this.player.plasmaOverloadTimer = 4000;
        } else if (role === 'mage') {
            let blinkAngle = this.player.angle; // default to mouse direction
            let dx = 0;
            let dy = 0;
            if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
            if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
            if (this.keys['d'] || this.keys['arrowright']) dx += 1;
            if (dx !== 0 || dy !== 0) {
                blinkAngle = Math.atan2(dy, dx);
            }

            const blinkDist = 200;
            const startX = this.player.x;
            const startY = this.player.y;

            const targetX = startX + Math.cos(blinkAngle) * blinkDist;
            const targetY = startY + Math.sin(blinkAngle) * blinkDist;

            const margin = this.player.radius + 15;
            const finalX = Math.max(margin, Math.min(3000 - margin, targetX));
            const finalY = Math.max(margin, Math.min(3000 - margin, targetY));

            // Sóng nổ xuất phát
            this.activeShockwaves.push({
                x: startX,
                y: startY,
                currentRadius: 0,
                maxRadius: 160,
                speed: 12,
                color: '#b026ff'
            });
            this.spawnBloodParticles(startX, startY, '#b026ff', 8);

            // Dịch chuyển
            this.player.x = finalX;
            this.player.y = finalY;

            // Sóng nổ điểm đến
            this.activeShockwaves.push({
                x: finalX,
                y: finalY,
                currentRadius: 0,
                maxRadius: 220,
                speed: 10,
                color: '#b026ff'
            });
            this.spawnBloodParticles(finalX, finalY, '#b026ff', 12);

            sounds.playShockwave();
            this.triggerScreenShake(12, 250);

            // Phá đạn ở cả 2 khu vực
            this.bullets = this.bullets.filter(bullet => {
                if (!bullet.isPlayerBullet) {
                    const distStart = Vector.dist(startX, startY, bullet.x, bullet.y);
                    const distEnd = Vector.dist(finalX, finalY, bullet.x, bullet.y);
                    if (distStart < 160 || distEnd < 220) {
                        this.spawnBloodParticles(bullet.x, bullet.y, '#ff3131', 2);
                        return false;
                    }
                }
                return true;
            });

            // Gây sát thương và đẩy quái ở cả 2 khu vực
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const distStart = Vector.dist(startX, startY, enemy.x, enemy.y);
                if (distStart < 160) {
                    const angle = Vector.angle(startX, startY, enemy.x, enemy.y);
                    const damage = Math.floor(15 * (1 + this.player.upgrades.damage * 0.25));
                    this.damageEnemy(enemy, damage, Math.cos(angle) * 10, Math.sin(angle) * 10, j);
                    continue;
                }
                
                const distEnd = Vector.dist(finalX, finalY, enemy.x, enemy.y);
                if (distEnd < 220) {
                    const angle = Vector.angle(finalX, finalY, enemy.x, enemy.y);
                    const damage = Math.floor(35 * (1 + this.player.upgrades.damage * 0.25));
                    this.damageEnemy(enemy, damage, Math.cos(angle) * 18, Math.sin(angle) * 18, j);
                }
            }
        } else if (role === 'assassin') {
            let dashAngle = this.player.angle; // default to mouse direction
            let dx = 0;
            let dy = 0;
            if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
            if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
            if (this.keys['d'] || this.keys['arrowright']) dx += 1;
            if (dx !== 0 || dy !== 0) {
                dashAngle = Math.atan2(dy, dx);
            }

            this.player.shadowDashTimer = 250; // 250ms lướt
            this.player.shadowDashAngle = dashAngle;
            this.player.shadowDashHitEnemies = new Set();

            sounds.playSwordSlash();
            this.triggerScreenShake(6, 150);
        }
    }

    triggerBarrelExplosion(x, y, triggerSource) {
        sounds.playExplosion();
        this.triggerScreenShake(triggerSource ? 26 : 20, 350);

        const isResonant = (triggerSource === 'fighter' || triggerSource === 'ranger_overload');
        const expRadius = isResonant ? 270 : 180;
        const damage = isResonant ? 120 : 60;
        const blastColor = isResonant ? (triggerSource === 'fighter' ? '#fffb00' : '#00f0ff') : '#ff4b1f';

        this.blastRings.push(new BlastRing(x, y, expRadius, blastColor));
        this.addGridDistortion(x, y, expRadius * 1.15, isResonant ? 65 : 40, 500);

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
            if (dist < expRadius && enemy.hp > 0) {
                const angle = Vector.angle(x, y, enemy.x, enemy.y);
                enemy.hp -= damage;
                enemy.applyKnockback(angle, isResonant ? 32 : 20);
                
                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 15, `${damage}`, blastColor, isResonant ? 22 : 18));
                this.spawnBloodParticles(enemy.x, enemy.y, enemy.color, isResonant ? 10 : 6);
            }
        });

        // Xích sét cộng hưởng (Chain Lightning) nếu là phản ứng đặc biệt
        if (isResonant) {
            // Lấy tối đa 5 quái còn sống trong phạm vi 350px (ngoài tầm sát thương trực tiếp của vụ nổ càng tốt, hoặc tất cả quái)
            const targets = this.enemies
                .filter(enemy => enemy.hp > 0 && enemy.type !== 'mine' && Vector.dist(x, y, enemy.x, enemy.y) < 350)
                .slice(0, 5);

            targets.forEach(target => {
                const lightningDamage = 40;
                target.hp -= lightningDamage;
                target.stunTimer = 1000; // Choáng 1 giây
                target.applyKnockback(Vector.angle(x, y, target.x, target.y), 10);
                
                this.floatingTexts.push(new FloatingText(target.x, target.y - 20, `${lightningDamage} ⚡`, blastColor, 15));
                this.spawnBloodParticles(target.x, target.y, blastColor, 5);
                this.lightningBolts.push(new LightningBolt(x, y, target.x, target.y, blastColor));
            });
        }

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
            const playerDamage = isResonant ? 25 : 15;
            const damaged = this.player.takeDamage(playerDamage);
            if (damaged) {
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 20, `-${playerDamage}`, '#ff3131', 18));
                this.spawnBloodParticles(this.player.x, this.player.y, '#ff3131');
            }
            // Đẩy lùi người chơi
            this.player.x += Math.cos(angle) * (isResonant ? 45 : 30);
            this.player.y += Math.sin(angle) * (isResonant ? 45 : 30);
        }

        // Tạo hiệu ứng hạt lửa tung tóe
        for (let i = 0; i < (isResonant ? 40 : 20); i++) {
            this.particles.push(new Particle(x, y, blastColor));
        }
    }

    triggerMissileExplosion(x, y, damage) {
        sounds.playExplosion();
        this.triggerScreenShake(6, 150);

        const expRadius = 100;
        this.blastRings.push(new BlastRing(x, y, expRadius, '#ff9f00')); // Orange blast ring
        this.addGridDistortion(x, y, expRadius * 1.2, 30, 400);

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

        if (role === 'mage' && this.player.overclockActive) {
            const speed = 6.5;
            const radius = 15;
            const color = '#b026ff';
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const b = new Bullet(this.player.x, this.player.y, vx, vy, radius, damage, color);
            b.isSingularity = true;
            b.isOrb = true;
            this.bullets.push(b);
            return;
        }

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

    triggerCloneSwordSlash(x, y, angle, damage) {
        sounds.playSwordSlash();
        const range = 90;
        const color = '#ff007f';
        this.swordSlashes.push(new SwordSlash(x, y, angle, range, color, damage));
        
        // Sinh hạt bụi kiếm
        for (let i = 0; i < 4; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 1.2;
            const dist = 20 + Math.random() * 40;
            const px = x + Math.cos(spreadAngle) * dist;
            const py = y + Math.sin(spreadAngle) * dist;
            this.particles.push(new Particle(px, py, '#ff007f'));
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
        this.addGridDistortion(this.player.x, this.player.y, maxRadius * 1.25, 45, 450);
        
        // Sinh hạt bụi vàng tản mát (360 độ nếu đã nâng cấp Địa Chấn hoặc có powerup)
        const particleCount = is360 ? 24 : 12;
        for (let i = 0; i < particleCount; i++) {
            const spreadAngle = is360 ? (Math.random() * Math.PI * 2) : (angle + (Math.random() - 0.5) * 1.5);
            const dist = 20 + Math.random() * (is360 ? maxRadius * 0.8 : 100);
            const px = this.player.x + Math.cos(spreadAngle) * dist;
            const py = this.player.y + Math.sin(spreadAngle) * dist;
            this.particles.push(new Particle(px, py, '#fffb00'));
        }

        // Fighter Overclock: Chain Lightning
        if (this.player.overclockActive) {
            let currentSource = this.player;
            let targets = this.enemies.filter(e => e.hp > 0 && e.type !== 'mine' && e.type !== 'portal' && Vector.dist(this.player.x, this.player.y, e.x, e.y) < 500);
            let chainCount = 0;
            const chainDamage = Math.floor(damage * 1.5);
            const visited = new Set();
            
            while (chainCount < 5 && targets.length > 0) {
                let closest = null;
                let closestDist = Infinity;
                for (let t of targets) {
                    if (visited.has(t)) continue;
                    const d = Vector.dist(currentSource.x, currentSource.y, t.x, t.y);
                    if (d < closestDist) {
                        closestDist = d;
                        closest = t;
                    }
                }
                if (!closest) break;
                
                visited.add(closest);
                this.lightningBolts.push(new LightningBolt(currentSource.x, currentSource.y, closest.x, closest.y, '#fffb00'));
                this.damageEnemy(closest, chainDamage, 0, 0, this.enemies.indexOf(closest));
                
                currentSource = closest;
                chainCount++;
            }
        }
    }

    // --- ENEMY INFLICT DAMAGE ---
    damageEnemy(enemy, damage, bulletVx, bulletVy, enemyIdx, bulletRef = null) {
        let isCrit = false;
        let finalDamage = damage;

        // Xử lý chí mạng: Assassin (isDagger) tỷ lệ 28%, các vai trò khác 6%
        const critChance = (bulletRef && bulletRef.isDagger) ? 0.28 : 0.06;
        if (Math.random() < critChance) {
            finalDamage = damage * 2;
            isCrit = true;
        }

        // Áp dụng Độc Tố Dữ Liệu (Synergy Digital Venom)
        if (this.player.upgrades.digitalVenom > 0 && enemy.type !== 'mine') {
            enemy.poisonDuration = 3000; // 3 giây dính độc
            enemy.poisonDamage = Math.max(1, Math.floor(this.player.damage * 0.15 * this.player.upgrades.digitalVenom));
            enemy.lastPoisonTickTime = 0;
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

        // Hiển thị số sát thương bay lên (Chí mạng màu cầu vồng lớn nhấp nháy màn hình)
        if (isCrit) {
            this.triggerScreenShake(3, 100);
            this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - enemy.radius, `${finalDamage}! CRIT`, '#ff007f', 32, true));
            this.whiteFlashTimer = 50; // 50ms nháy màn hình trắng

            // Burst of 15 rainbow-colored particles
            const available = Math.max(0, 300 - this.particles.length);
            const actualCount = Math.min(15, available);
            for (let i = 0; i < actualCount; i++) {
                const randColor = `hsl(${Math.random() * 360}, 100%, 65%)`;
                this.particles.push(new Particle(enemy.x, enemy.y, randColor));
            }
        } else {
            this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - enemy.radius, `${finalDamage}`, '#00f0ff', 15));
        }

        // Xử lý nổ ma pháp của Pháp sư
        if (bulletRef && bulletRef.isOrb) {
            if (bulletRef.isSingularity) {
                this.singularities.push(new GravitySingularity(bulletRef.x, bulletRef.y, finalDamage));
            } else {
                this.triggerMagicExplosion(bulletRef.x, bulletRef.y, finalDamage);
            }
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
        this.addGridDistortion(x, y, radius * 1.2, 35, 400);
        
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

        // Bắn mảnh pha lê tự động tìm kẻ địch (Synergy Cầu Phép Phân Mảnh)
        if (this.player.upgrades.crystalSplinters > 0) {
            // Sắp xếp quái vật theo khoảng cách từ tâm nổ
            const sortedEnemies = this.enemies
                .filter(enemy => enemy.hp > 0 && enemy.type !== 'mine')
                .map(enemy => ({ enemy, dist: Vector.dist(x, y, enemy.x, enemy.y) }))
                .sort((a, b) => a.dist - b.dist);
                
            const splinterCount = 3 + this.player.upgrades.crystalSplinters;
            for (let i = 0; i < splinterCount; i++) {
                // Chọn mục tiêu tương ứng
                const targetData = sortedEnemies[i % Math.max(1, sortedEnemies.length)];
                const target = targetData ? targetData.enemy : null;
                
                const splinterDmg = Math.floor(this.player.damage * 0.35 * this.player.upgrades.crystalSplinters);
                const splinter = new HomingMissile(x, y, target, splinterDmg, false, '#b026ff');
                splinter.speed = 10;
                splinter.radius = 4;
                splinter.angle = Math.random() * Math.PI * 2;
                this.homingMissiles.push(splinter);
            }
        }
    }

    triggerPillarExplosion(p, pIdx) {
        sounds.playExplosion();
        this.triggerScreenShake(20, 300);
        const empRadius = 220;
        this.blastRings.push(new BlastRing(p.x, p.y, empRadius, '#00f0ff'));
        this.addGridDistortion(p.x, p.y, empRadius * 1.2, 40, 450);
        
        this.enemies.forEach((enemy, idx) => {
            if (enemy.hp > 0 && enemy.type !== 'portal') {
                const dist = Vector.dist(p.x, p.y, enemy.x, enemy.y);
                if (dist < empRadius + enemy.radius) {
                    const empDmg = 40;
                    enemy.hp -= empDmg;
                    enemy.stunTimer = 3000; // Choáng 3 giây
                    
                    this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 15, `${empDmg} EMP ⚡`, '#00f0ff', 15));
                    this.spawnBloodParticles(enemy.x, enemy.y, '#00f0ff', 6);
                }
            }
        });
        
        // Check for enemy deaths
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy, j);
            }
        }
        
        this.pillars.splice(pIdx, 1);
    }

    // --- ITEM COLLECTION ---
    collectItem(item) {
        sounds.playPickup();

        if (item.type === 'xp') {
            const leveledUp = this.player.addXp(item.value);
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, `+${item.value} XP`, '#39ff14', 15));
            
            // Tích lũy năng lượng Overclock
            if (this.player && !this.player.overclockActive) {
                this.player.overclockEnergy = Math.min(100, (this.player.overclockEnergy || 0) + 1.0);
            }

            // Lõi nanoDrain: Hồi 1 HP khi nhặt XP
            if (this.player.upgrades.nanoDrain > 0) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
            }

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

        // Bổ sung thẻ nâng cấp phối hợp (Synergy Upgrades) khi đủ điều kiện (Lv3+)
        if (this.player.upgrades.damage >= 3 && this.player.upgrades.magnet >= 3 && (this.player.upgrades.digitalVenom || 0) < 3) {
            upgradeTypes.push({
                id: 'digitalVenom',
                title: '☣️ Lõi Độc Tố Dữ Liệu',
                desc: 'Tất cả đòn đánh gây độc ăn mòn rút HP quái theo thời gian (DOT). Khi quái độc chết sẽ nổ lan độc tố xung quanh.',
                stat: `Cấp ${(this.player.upgrades.digitalVenom || 0) + 1} (Synergy)`,
                icon: '☣️',
                class: 'card-green'
            });
        }

        if (this.player.upgrades.speed >= 3 && this.player.upgrades.maxHp >= 3 && (this.player.upgrades.empReflector || 0) < 3) {
            upgradeTypes.push({
                id: 'empReflector',
                title: '📡 Khiên EMP Phản Đòn',
                desc: 'Khi đang Lướt (Dash) hoặc kích Hoạt Khiên, đạn quái bay trúng người chơi sẽ bị phản hồi ngược lại tấn công quái.',
                stat: `Cấp ${(this.player.upgrades.empReflector || 0) + 1} (Synergy)`,
                icon: '📡',
                class: 'card-blue'
            });
        }

        if (role === 'mage' && this.player.upgrades.damage >= 3 && this.player.upgrades.fireRate >= 3 && (this.player.upgrades.crystalSplinters || 0) < 3) {
            upgradeTypes.push({
                id: 'crystalSplinters',
                title: '🔮 Cầu Phép Phân Mảnh',
                desc: 'Cầu ma pháp tím của Pháp sư khi phát nổ sẽ giải phóng 3-5 mảnh pha lê tự động bay găm vào kẻ địch gần nhất.',
                stat: `Cấp ${(this.player.upgrades.crystalSplinters || 0) + 1} (Synergy)`,
                icon: '🔮',
                class: 'card-purple'
            });
        }

        // Trộn ngẫu nhiên và lấy 3 lựa chọn
        const shuffled = upgradeTypes.sort(() => 0.5 - Math.random());
        this.currentUpgradesPool = shuffled.slice(0, 3);
    }

    apply3DTilt(card, glowColor = 'rgba(0, 240, 255, 0.25)') {
        card.addEventListener('mouseenter', () => {
            sounds.playMenuHover();
        });

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = ((y - centerY) / centerY) * -15; 
            const tiltY = ((x - centerX) / centerX) * 15;
            
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`;
            card.style.transition = 'transform 0.05s ease';
            
            const glow = card.querySelector('[class^="card-glow-"]');
            if (glow) {
                const glowX = (x / rect.width) * 100;
                const glowY = (y / rect.height) * 100;
                glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor} 0%, transparent 65%)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            card.style.transition = 'transform 0.3s ease';
            const glow = card.querySelector('[class^="card-glow-"]');
            if (glow) {
                glow.style.background = '';
            }
        });
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
            
            // Xác định màu phát sáng
            let glowColor = 'rgba(0, 240, 255, 0.25)';
            if (upgrade.class.includes('green')) glowColor = 'rgba(57, 255, 20, 0.25)';
            else if (upgrade.class.includes('pink')) glowColor = 'rgba(255, 0, 127, 0.25)';
            else if (upgrade.class.includes('purple')) glowColor = 'rgba(176, 38, 255, 0.25)';
            else if (upgrade.class.includes('yellow')) glowColor = 'rgba(255, 251, 0, 0.25)';
            
            this.apply3DTilt(card, glowColor);

            card.addEventListener('click', () => {
                sounds.playMenuSelect();
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
            case 'digitalVenom':
                this.player.upgrades.digitalVenom = (this.player.upgrades.digitalVenom || 0) + 1;
                break;
            case 'empReflector':
                this.player.upgrades.empReflector = (this.player.upgrades.empReflector || 0) + 1;
                break;
            case 'crystalSplinters':
                this.player.upgrades.crystalSplinters = (this.player.upgrades.crystalSplinters || 0) + 1;
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
                title: 'Drone Chiến Thuật',
                desc: this.player.subWeapons.laserDrone > 0 
                    ? [
                        '',
                        'Drone Lv2: Mở khóa Lá chắn (Shield) chặn đạn phía trước.',
                        'Drone Lv3: Mở khóa Hacking phát tia hack virus làm đồng minh (6s).',
                        'Drone Lv4: Mở khóa Nano-Repair tự động hồi HP khẩn cấp khi thấp.'
                      ][Math.min(3, this.player.subWeapons.laserDrone)] || 'Drone Lv Max: Tối đa hóa mọi chỉ số hỗ trợ.'
                    : 'Robot Drone mini hộ tống tự động ngắm bắn kẻ địch. Nâng cấp để mở khóa thêm các tính năng chiến thuật cực mạnh.',
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
            
            this.apply3DTilt(card, 'rgba(255, 251, 0, 0.25)');
            
            card.addEventListener('click', () => {
                sounds.playMenuSelect();
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

        // Cập nhật HUD Overclock
        const overclockFill = document.getElementById('hud-overclock-fill');
        const overclockText = document.getElementById('hud-overclock-text');
        const overclockPrompt = document.getElementById('overclock-prompt');
        
        if (overclockFill) {
            const pct = Math.min(100, Math.floor(this.player.overclockEnergy || 0));
            overclockFill.style.width = `${pct}%`;
            
            if (overclockText) {
                overclockText.textContent = this.player.overclockActive 
                    ? `OVERCLOCKED! ${Math.ceil(this.player.overclockTimer / 1000)}s` 
                    : `${pct}%`;
            }
            
            if (overclockPrompt) {
                if (pct >= 100 && !this.player.overclockActive) {
                    overclockPrompt.classList.remove('hidden');
                } else {
                    overclockPrompt.classList.add('hidden');
                }
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

        // 1. Vẽ nền màn hình tối sâu theo từng loại bản đồ
        let bgStyle = '#030712'; // Cyber theme background
        let gridStroke = 'rgba(255, 255, 255, 0.05)'; // Cyber grid lines
        
        if (this.mapTheme === 'jungle') {
            bgStyle = '#02140d'; // Deep jungle green
            gridStroke = 'rgba(74, 120, 86, 0.08)'; // Mossy green grid
        } else if (this.mapTheme === 'desert') {
            bgStyle = '#140d07'; // Dusty canyon brown
            gridStroke = 'rgba(244, 164, 96, 0.08)'; // Warm sandy grid
        } else if (this.mapTheme === 'ice') {
            bgStyle = '#021625'; // Deep frosty blue-black
            gridStroke = 'rgba(165, 243, 252, 0.08)'; // Icy blue grid
        } else if (this.mapTheme === 'highland') {
            bgStyle = '#0e0d16'; // Misty highland night violet-black
            gridStroke = 'rgba(217, 70, 239, 0.08)'; // Purple/magenta grid
        }
        if (this.disasterActive && this.disasterType === 'matrix_protocol') {
            gridStroke = 'rgba(57, 255, 20, 0.18)';
        }
        
        this.ctx.fillStyle = bgStyle;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1.5. Vẽ các hạt nền (Space dust / đom đóm / bão cát)
        if (this.stars) {
            this.stars.forEach(star => {
                if (this.isInView(star.x, star.y, star.radius)) {
                    const screenX = star.x - this.camera.x;
                    const screenY = star.y - this.camera.y;
                    this.ctx.save();
                    
                    if (this.mapTheme === 'jungle') {
                        // Đom đóm phát sáng nhòe (glow)
                        this.ctx.shadowColor = star.color;
                        this.ctx.shadowBlur = 6;
                    }
                    
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
        this.ctx.strokeStyle = gridStroke;
        this.ctx.lineWidth = 1;
        
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;

        if (this.gridDistortions && this.gridDistortions.length > 0) {
            this.ctx.beginPath();
            const segmentLen = 40;
            // Vẽ các đường dọc uốn cong
            for (let x = startX; x < startX + this.canvas.width + gridSize; x += gridSize) {
                let first = true;
                const endY = startY + this.canvas.height + gridSize;
                for (let y = startY; y <= endY; y += segmentLen) {
                    const warped = this.warpPoint(x, y);
                    const screenX = warped.x - this.camera.x;
                    const screenY = warped.y - this.camera.y;
                    if (first) {
                        this.ctx.moveTo(screenX, screenY);
                        first = false;
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
                const warpedEnd = this.warpPoint(x, endY);
                this.ctx.lineTo(warpedEnd.x - this.camera.x, warpedEnd.y - this.camera.y);
            }
            // Vẽ các đường ngang uốn cong
            for (let y = startY; y < startY + this.canvas.height + gridSize; y += gridSize) {
                let first = true;
                const endX = startX + this.canvas.width + gridSize;
                for (let x = startX; x <= endX; x += segmentLen) {
                    const warped = this.warpPoint(x, y);
                    const screenX = warped.x - this.camera.x;
                    const screenY = warped.y - this.camera.y;
                    if (first) {
                        this.ctx.moveTo(screenX, screenY);
                        first = false;
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
                const warpedEnd = this.warpPoint(endX, y);
                this.ctx.lineTo(warpedEnd.x - this.camera.x, warpedEnd.y - this.camera.y);
            }
            this.ctx.stroke();
        } else {
            // Đường thẳng vẽ nhanh tối ưu hiệu năng
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
        }

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

        let boundaryGlow = 'rgba(176, 38, 255, 0.2)'; // Cyber purple glow
        let boundaryCore = '#b026ff'; // Cyber purple core
        
        if (this.mapTheme === 'jungle') {
            boundaryGlow = 'rgba(46, 125, 50, 0.35)'; // Jungle green glow
            boundaryCore = '#2e7d32'; // Jungle green core
        } else if (this.mapTheme === 'desert') {
            boundaryGlow = 'rgba(212, 140, 72, 0.3)'; // Desert orange glow
            boundaryCore = '#d48c48'; // Desert orange core
        } else if (this.mapTheme === 'ice') {
            boundaryGlow = 'rgba(0, 240, 255, 0.35)'; // Icy cyan glow
            boundaryCore = '#00f0ff'; // Icy cyan core
        } else if (this.mapTheme === 'highland') {
            boundaryGlow = 'rgba(217, 70, 239, 0.35)'; // Highland magenta glow
            boundaryCore = '#d946ef'; // Highland magenta core
        }

        this.ctx.save();
        // 1. Quầng sáng ranh giới (Outer Glow)
        this.ctx.strokeStyle = boundaryGlow;
        this.ctx.lineWidth = 16;
        this.ctx.strokeRect(left, top, this.worldSize, this.worldSize);

        // 2. Viền ranh giới chính (Solid Core)
        this.ctx.strokeStyle = boundaryCore;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(left, top, this.worldSize, this.worldSize);
        this.ctx.restore();

        // 3.5. Vẽ Sóng Chấn Động EMP/Skill nếu đang kích hoạt
        this.activeShockwaves.forEach(wave => {
            this.ctx.save();
            const screenX = wave.x - this.camera.x;
            const screenY = wave.y - this.camera.y;
            this.ctx.translate(screenX, screenY);
            
            // Vẽ vòng tròn sóng chấn động neon lan tỏa
            this.ctx.strokeStyle = wave.color;
            // Độ mờ giảm dần khi sóng lan ra ngoài rìa
            const opacity = 1 - (wave.currentRadius / wave.maxRadius);
            const alpha = Math.max(0, opacity);
            
            // 1. Quầng sáng sóng (Outer Glow)
            this.ctx.globalAlpha = alpha * 0.25;
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, wave.currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            // 2. Viền sóng chính (Solid Core)
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, wave.currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 3.6. Vẽ các vòng nổ của thùng thuốc nổ
        this.blastRings.forEach(br => {
            br.draw(this.ctx, this.camera);
        });

        // 3.7. Vẽ các Cột chướng ngại vật
        this.pillars.forEach(p => {
            if (this.isInView(p.x, p.y, p.radius)) {
                p.draw(this.ctx, this.camera, this.mapTheme);
            }
        });

        // 3.8. Vẽ các Thùng thuốc nổ
        this.barrels.forEach(b => {
            if (this.isInView(b.x, b.y, b.radius)) {
                b.draw(this.ctx, this.camera, this.mapTheme);
            }
        });

        // 4. Vẽ các vật phẩm thu thập (Items)
        this.items.forEach(item => {
            // Chỉ vẽ các vật phẩm nằm trong khung camera
            if (this.isInView(item.x, item.y, item.radius)) {
                item.draw(this.ctx, this.camera);
            }
        });

        // Vẽ Cổng Chợ Đen (Merchant Portal)
        if (this.merchantActive && this.merchantPortal) {
            const portal = this.merchantPortal;
            if (this.isInView(portal.x, portal.y, portal.radius + 100)) {
                const sX = portal.x - this.camera.x;
                const sY = portal.y - this.camera.y;
                
                this.ctx.save();
                this.ctx.translate(sX, sY);
                
                const rot = (portal.pulseTimer || 0) * 0.003;
                this.ctx.rotate(rot);
                
                const pulse = 1 + Math.sin((portal.pulseTimer || 0) * 0.008) * 0.1;
                const rad = portal.radius * pulse;
                
                this.ctx.strokeStyle = '#ff2255';
                this.ctx.shadowColor = '#ff2255';
                this.ctx.shadowBlur = 15;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.rotate(-rot * 2);
                this.ctx.strokeStyle = '#ff0033';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    this.ctx.moveTo(0, 0);
                    this.ctx.quadraticCurveTo(Math.cos(angle + 0.5) * rad * 0.7, Math.sin(angle + 0.5) * rad * 0.7, Math.cos(angle) * rad, Math.sin(angle) * rad);
                }
                this.ctx.stroke();
                
                const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
                grad.addColorStop(0, 'rgba(15, 0, 5, 0.9)');
                grad.addColorStop(0.6, 'rgba(100, 0, 20, 0.7)');
                grad.addColorStop(1, 'rgba(255, 0, 50, 0)');
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
                
                this.ctx.save();
                this.ctx.fillStyle = '#ff2255';
                this.ctx.shadowColor = '#ff2255';
                this.ctx.shadowBlur = 8;
                this.ctx.font = 'bold 13px Courier New, monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('📡 HACK PORTAL', sX, sY - rad - 12);
                
                const remainingSec = Math.ceil(portal.life / 1000);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px Courier New, monospace';
                this.ctx.fillText(`ĐÓNG SAU: ${remainingSec}s`, sX, sY + rad + 15);
                this.ctx.restore();
            }
        }

        // Vẽ Hố đen ma pháp (Gravity Singularities)
        if (this.singularities) {
            this.singularities.forEach(s => {
                s.draw(this.ctx, this.camera);
            });
        }

        // Vẽ Phân Thân Bóng Tối (Shadow Clones)
        if (this.shadowClones) {
            this.shadowClones.forEach(c => {
                c.draw(this.ctx, this.camera);
            });
        }

        // Vẽ chùm tia hủy diệt của Ranger Overclock
        if (this.player && this.player.role === 'ranger' && this.player.overclockActive && this.mouse.isDown) {
            const startX = this.player.x - this.camera.x;
            const startY = this.player.y - this.camera.y;
            const angle = this.player.angle;
            const maxLen = 700;
            const endX = startX + Math.cos(angle) * maxLen;
            const endY = startY + Math.sin(angle) * maxLen;
            
            this.ctx.save();
            
            // Outer thick cyan glowing beam
            this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            this.ctx.lineWidth = 26;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Middle cyan beam
            this.ctx.strokeStyle = '#00f0ff';
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Inner white core
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Laser sparks/particles at muzzle
            if (Math.random() < 0.3) {
                const px = this.player.x + Math.cos(angle) * 35;
                const py = this.player.y + Math.sin(angle) * 35;
                this.particles.push(new Particle(px, py, '#00f0ff'));
            }
            
            this.ctx.restore();
        }

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

        // 5.7. Vẽ tia sét cộng hưởng (Lightning Bolts)
        this.lightningBolts.forEach(bolt => {
            bolt.draw(this.ctx, this.camera);
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
            
            // 0. Xác định màu sắc Drone theo Cấp/Tính năng
            let droneColor = '#39ff14'; // Cấp 1 (Lục)
            let droneGlow = 'rgba(57, 255, 20, 0.25)';
            let droneBody = 'rgba(10, 20, 10, 0.9)';
            if (this.player.subWeapons.laserDrone === 2) {
                droneColor = '#00f0ff'; // Cấp 2: Cyan (Shield)
                droneGlow = 'rgba(0, 240, 255, 0.25)';
                droneBody = 'rgba(10, 20, 20, 0.9)';
            } else if (this.player.subWeapons.laserDrone === 3) {
                droneColor = '#ff00ff'; // Cấp 3: Hồng (Hacking)
                droneGlow = 'rgba(255, 0, 255, 0.25)';
                droneBody = 'rgba(20, 10, 20, 0.9)';
            } else if (this.player.subWeapons.laserDrone >= 4) {
                droneColor = '#fffb00'; // Cấp 4+: Vàng (Nano-Repair)
                droneGlow = 'rgba(255, 251, 0, 0.25)';
                droneBody = 'rgba(20, 20, 10, 0.9)';
            }

            if (this.isInView(this.player.droneX, this.player.droneY, 20)) {
                this.ctx.save();
                this.ctx.translate(dx, dy);
                
                // Drone xoay bồng bềnh nhẹ nhàng
                this.ctx.rotate(Math.sin(Date.now() * 0.003) * 0.2);
                
                // 1. Quầng sáng Laser Drone (Outer Glow)
                this.ctx.globalAlpha = 0.25;
                this.ctx.strokeStyle = droneColor;
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
                this.ctx.fillStyle = droneBody;
                this.ctx.strokeStyle = droneColor;
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
                this.ctx.strokeStyle = droneColor;
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(-8, 0);
                this.ctx.lineTo(-14, -3);
                this.ctx.moveTo(8, 0);
                this.ctx.lineTo(14, -3);
                this.ctx.stroke();
                
                // Mắt cảm biến nhấp nháy
                const flash = Math.floor(Date.now() / 250) % 2 === 0;
                this.ctx.fillStyle = flash ? '#ffffff' : droneColor;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }

            // Vẽ lá chắn năng lượng phía trước đầu phi thuyền nếu cấp >= 2
            if (this.player.subWeapons.laserDrone >= 2) {
                const px = this.player.x - this.camera.x;
                const py = this.player.y - this.camera.y;
                const angle = this.player.angle;
                
                this.ctx.save();
                this.ctx.translate(px, py);
                this.ctx.rotate(angle);
                
                // Vòng ngoài phát sáng cyan
                this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
                this.ctx.lineWidth = 6;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 50, -Math.PI / 3, Math.PI / 3);
                this.ctx.stroke();
                
                // Lõi sáng trắng
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 50, -Math.PI / 3, Math.PI / 3);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        }

        // Vẽ tia Hack của Hacking Drone nếu có hoạt động
        if (this.activeHackBeam) {
            const beam = this.activeHackBeam;
            this.ctx.save();
            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 10;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(beam.startX - this.camera.x, beam.startY - this.camera.y);
            this.ctx.lineTo(beam.endX - this.camera.x, beam.endY - this.camera.y);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 9. Vẽ số sát thương trôi nổi (Floating Texts)
        this.floatingTexts.forEach(ft => {
            if (this.isInView(ft.x, ft.y, 20)) {
                ft.draw(this.ctx, this.camera);
            }
        });

        // 10. Vẽ lớp phủ trắng nháy màn hình khi chí mạng
        if (this.whiteFlashTimer > 0) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * (this.whiteFlashTimer / 50)})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        if (this.player.overclockActive) {
            this.ctx.save();
            
            // Yellow fading vignette overlay
            const grad = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.3,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
            );
            grad.addColorStop(0, 'rgba(255, 251, 0, 0)');
            grad.addColorStop(1, 'rgba(255, 251, 0, 0.15)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // CRT scanlines
            this.ctx.strokeStyle = 'rgba(255, 251, 0, 0.07)';
            this.ctx.lineWidth = 1.5;
            const step = 6;
            this.ctx.beginPath();
            for (let y = 0; y < this.canvas.height; y += step) {
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
            }
            this.ctx.stroke();
            
            // Random horizontal glitch lines
            if (Math.random() < 0.15) {
                this.ctx.fillStyle = 'rgba(255, 251, 0, 0.12)';
                const gy = Math.random() * this.canvas.height;
                const gh = 3 + Math.random() * 8;
                this.ctx.fillRect(0, gy, this.canvas.width, gh);
            }
            
            // Screen vignette/neon overlay label
            this.ctx.fillStyle = '#fffb00';
            this.ctx.shadowColor = '#fffb00';
            this.ctx.shadowBlur = 10;
            this.ctx.font = 'bold 18px Courier New, monospace';
            this.ctx.textAlign = 'right';
            const remainingOverclockSec = (this.player.overclockTimer / 1000).toFixed(1);
            this.ctx.fillText(`⚡ OVERCLOCK ACTIVE: ${remainingOverclockSec}s`, this.canvas.width - 25, 45);
            
            this.ctx.restore();
        }

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

    triggerOverclock() {
        if (this.state !== 'PLAYING') return;
        if (this.player.overclockActive) return;
        if (this.player.overclockEnergy < 100) return;
        
        this.player.overclockActive = true;
        this.player.overclockTimer = 8000; // 8 seconds
        this.player.overclockEnergy = 0;
        
        sounds.playPowerup();
        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 40, 'SYSTEM OVERCLOCK ACTIVE! ⚡', '#fffb00', 22));
        this.triggerScreenShake(15, 400);
        this.addGridDistortion(this.player.x, this.player.y, 250, 60, 500);

        if (this.player.role === 'assassin') {
            const cloneDamage = Math.floor(this.player.damage * 0.8 * (1 + this.player.upgrades.damage * 0.25));
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2) / 3;
                const cloneX = this.player.x + Math.cos(angle) * 80;
                const cloneY = this.player.y + Math.sin(angle) * 80;
                this.shadowClones.push(new ShadowClone(cloneX, cloneY, cloneDamage));
            }
        }
    }

    triggerHackedShop() {
        this.state = 'HACKED_SHOP';
        sounds.stopMusic();
        sounds.playPowerup();
        
        const shopEl = document.getElementById('hacked-shop-menu');
        if (shopEl) shopEl.classList.remove('hidden');
        
        const allHackedPool = [
            {
                id: 'glassCore',
                name: 'LÕI THỦY TINH',
                desc: 'Tăng cực hạn <span class="buff-text">+150% Sát thương</span>, nhưng khóa HP tối đa ở <span class="debuff-text">35 HP</span>.',
                stat: '+150% DMG / 35 Max HP',
                cost: 20,
                icon: '💎'
            },
            {
                id: 'overheated',
                name: 'ÉP XUNG QUÁ NHIỆT',
                desc: 'Tăng điên cuồng <span class="buff-text">+80% Tốc độ bắn</span>, nhưng <span class="debuff-text">tự mất 1 HP mỗi 1.2 giây</span>.',
                stat: '+80% Fire Rate / -1 HP mỗi 1.2s',
                cost: 15,
                icon: '🔥'
            },
            {
                id: 'lagSwitch',
                name: 'TRỄ TẦN SỐ (LAG)',
                desc: 'Làm chậm toàn bộ virus đi <span class="buff-text">35%</span>, nhưng <span class="debuff-text">hồi chiêu Lướt (Dash) tăng 100%</span>.',
                stat: '-35% Enemy Speed / +100% CD Dash',
                cost: 18,
                icon: '⏳'
            },
            {
                id: 'limitBreak',
                name: 'PHÁ VỠ GIỚI HẠN',
                desc: 'Tăng mạnh mẽ <span class="buff-text">+30% Tốc độ chạy</span>, nhưng <span class="debuff-text">nhận thêm 25% sát thương</span>.',
                stat: '+30% Speed / +25% DMG Taken',
                cost: 12,
                icon: '🚀'
            },
            {
                id: 'nanoDrain',
                name: 'NANO HÚT NĂNG LƯỢNG',
                desc: 'Nhặt ngọc XP giúp <span class="buff-text">hồi 1 HP</span>, nhưng làm <span class="debuff-text">giảm 20% sát thương</span> đòn chính.',
                stat: 'XP heals 1 HP / -20% Sát thương',
                cost: 15,
                icon: '🧪'
            }
        ];
        
        const pool = [...allHackedPool].sort(() => 0.5 - Math.random()).slice(0, 3);
        const choicesGrid = document.getElementById('hacked-shop-choices');
        if (choicesGrid) {
            choicesGrid.innerHTML = '';
            pool.forEach(upgrade => {
                const card = document.createElement('div');
                card.className = 'upgrade-card glassmorphism-card hacked-upgrade-card';
                
                const hasEnoughXp = this.player.xp >= upgrade.cost;
                const costClass = hasEnoughXp ? 'hacked-card-cost' : 'hacked-card-cost insufficient';
                
                card.innerHTML = `
                    <div class="card-glow-red"></div>
                    <div class="card-icon">${upgrade.icon}</div>
                    <h3>${upgrade.name}</h3>
                    <p>${upgrade.desc}</p>
                    <span class="card-stat">${upgrade.stat}</span>
                    <div class="${costClass}">Yêu cầu: ${upgrade.cost} XP (Hiện có: ${Math.floor(this.player.xp)} XP)</div>
                `;
                
                card.addEventListener('click', () => {
                    if (this.player.xp >= upgrade.cost) {
                        this.player.xp -= upgrade.cost;
                        this.applyHackedUpgrade(upgrade.id);
                        this.closeHackedShop();
                    } else {
                        sounds.playHit();
                        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 25, "KHÔNG ĐỦ XP!", "#ff3131", 16));
                    }
                });
                
                choicesGrid.appendChild(card);
            });
        }
    }

    applyHackedUpgrade(id) {
        sounds.playPowerup();
        this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 30, 'LÕI ĐÃ ĐỘT BIẾN! ⚠️', '#ff3131', 20));
        
        if (id === 'glassCore') {
            this.player.upgrades.glassCore = (this.player.upgrades.glassCore || 0) + 1;
            this.player.damage *= 2.5;
            this.player.maxHp = 35;
            this.player.hp = Math.min(this.player.hp, 35);
        } else if (id === 'overheated') {
            this.player.upgrades.overheated = (this.player.upgrades.overheated || 0) + 1;
            this.player.fireRate *= 0.55;
        } else if (id === 'lagSwitch') {
            this.player.upgrades.lagSwitch = (this.player.upgrades.lagSwitch || 0) + 1;
            this.player.dashCooldownMax *= 2.0;
        } else if (id === 'limitBreak') {
            this.player.upgrades.limitBreak = (this.player.upgrades.limitBreak || 0) + 1;
            this.player.speed *= 1.3;
        } else if (id === 'nanoDrain') {
            this.player.upgrades.nanoDrain = (this.player.upgrades.nanoDrain || 0) + 1;
            this.player.damage *= 0.8;
        }
    }

    closeHackedShop() {
        const shopEl = document.getElementById('hacked-shop-menu');
        if (shopEl) shopEl.classList.add('hidden');
        this.state = 'PLAYING';
        sounds.playMusic();
        this.lastTime = performance.now();
    }
}

// Khởi chạy game khi tải xong tài nguyên trang web
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new Game();
});
