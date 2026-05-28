import { Vector } from '../utils/vector.js';
import { sounds } from '../audio/soundManager.js';
import { Bullet, SwordSlash, HammerWave, HomingMissile } from './bullet.js';
import { Particle } from '../effects/particle.js';
import { FloatingText } from '../effects/floatingText.js';
import { BlastRing } from '../effects/blastRing.js';

export class Enemy {
    constructor(x, y, level, type = null) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.angle = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.shootTimer = Math.random() * 2000; // Timer ngẫu nhiên ban đầu cho quái bắn
        this.stunTimer = 0; // Bộ đếm thời gian choáng (stun) từ kỹ năng Đấu sĩ
        
        // Trạng thái độc tố (Synergy Digital Venom)
        this.poisonDuration = 0;
        this.poisonDamage = 0;
        this.lastPoisonTickTime = 0;

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
        const hpMult = 1 + (level - 1) * 0.18;
        const dmgMult = 1 + (level - 1) * 0.10;
        const speedMult = 1 + (level - 1) * 0.03;

        switch (this.type) {
            case 'tanker':
                this.radius = 32;
                this.speed = 1.3 * speedMult;
                this.hp = Math.floor(70 * hpMult);
                this.maxHp = this.hp;
                this.damage = Math.floor(25 * dmgMult);
                this.xpValue = 5;
                this.color = '#b026ff'; // Neon Purple
                break;
            case 'mine':
                this.radius = 12;
                this.speed = 0;
                this.hp = 1;
                this.maxHp = 1;
                this.damage = Math.floor(20 * dmgMult);
                this.xpValue = 0;
                this.color = '#ff9f00'; // Neon Orange for mine flashing
                break;
            case 'shooter':
                this.radius = 18;
                this.speed = 2.0 * speedMult;
                this.hp = Math.floor(35 * hpMult);
                this.maxHp = this.hp;
                this.damage = Math.floor(10 * dmgMult);
                this.xpValue = 4;
                this.color = '#ff9f00'; // Neon Orange
                break;
            case 'sniper':
                this.radius = 16;
                this.speed = 1.5 * speedMult;
                this.hp = Math.floor(45 * hpMult);
                this.maxHp = this.hp;
                this.damage = Math.floor(22 * dmgMult);
                this.xpValue = 5;
                this.color = '#ff00ff'; // Neon Magenta
                this.sniperAimTimer = 0;
                break;
            case 'portal':
                this.radius = 35;
                this.speed = 0;
                this.hp = Math.floor(180 * hpMult); // HP cao
                this.maxHp = this.hp;
                this.damage = 0; // Không gây sát thương va chạm
                this.xpValue = 18; // Điểm kinh nghiệm cao
                this.color = '#ff00ff'; // Hồng/tím neon
                this.portalSpawnTimer = 0;
                break;
            case 'gold_bug':
                this.radius = 16;
                this.speed = 4.2 * speedMult; // Rất nhanh
                this.hp = Math.floor(40 * hpMult);
                this.maxHp = this.hp;
                this.damage = 0; // Không gây sát thương va chạm
                this.xpValue = 35; // Điểm kinh nghiệm rất cao
                this.color = '#fffb00'; // Vàng neon
                this.goldBugTeleportTimer = 0;
                break;
            case 'runner':
            default:
                this.radius = 14;
                this.speed = 3.0 * speedMult;
                this.hp = Math.floor(20 * hpMult);
                this.maxHp = this.hp;
                this.damage = Math.floor(12 * dmgMult);
                this.xpValue = 1;
                this.color = '#ff007f'; // Neon Pink (Runner mặc định)
                break;
        }
    }

    update(player, gameBullets, deltaTime, gameEngineRef) {
        const worldSize = (window.gameEngine ? window.gameEngine.worldSize : 5000);
        // Giảm lực đẩy lùi (Knockback) theo thời gian (giảm chậm hơn trong Zero Gravity)
        const isZeroGravity = window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'zero_gravity';
        const decay = isZeroGravity ? 0.95 : 0.8;
        this.x += this.knockbackX;
        this.y += this.knockbackY;
        this.knockbackX *= decay;
        this.knockbackY *= decay;

        // Xử lý rút máu độc tố (Synergy Digital Venom)
        if (this.poisonDuration > 0) {
            this.poisonDuration -= deltaTime;
            this.lastPoisonTickTime += deltaTime;
            if (this.lastPoisonTickTime >= 500) {
                this.lastPoisonTickTime = 0;
                this.hp -= this.poisonDamage;
                if (gameEngineRef) {
                    gameEngineRef.floatingTexts.push(new FloatingText(this.x, this.y - this.radius - 5, `${this.poisonDamage}`, '#39ff14', 13));
                    gameEngineRef.spawnBloodParticles(this.x, this.y, '#39ff14', 2);
                }
            }
        }

        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer < 0) this.stunTimer = 0;
            // Vẫn giới hạn trong bản đồ thế giới đề phòng bị đẩy lùi vượt biên
            this.x = Math.max(this.radius, Math.min(worldSize - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(worldSize - this.radius, this.y));
            return;
        }

        if (this.type === 'portal') {
            this.portalSpawnTimer = (this.portalSpawnTimer || 0) + deltaTime;
            if (this.portalSpawnTimer >= 2500) {
                this.portalSpawnTimer = 0;
                if (gameEngineRef) {
                    const angle = Math.random() * Math.PI * 2;
                    const sx = this.x + Math.cos(angle) * (this.radius + 15);
                    const sy = this.y + Math.sin(angle) * (this.radius + 15);
                    const spawnType = Math.random() < 0.75 ? 'runner' : 'shooter';
                    const spawnEnemy = new Enemy(sx, sy, gameEngineRef.player.level, spawnType);
                    gameEngineRef.enemies.push(spawnEnemy);
                    gameEngineRef.spawnBloodParticles(sx, sy, spawnEnemy.color, 4);
                }
            }
            this.x = Math.max(this.radius, Math.min(worldSize - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(worldSize - this.radius, this.y));
            return;
        }

        if (this.type === 'mine') {
            return;
        }

        if (this.type === 'gold_bug') {
            // Gold Bug teleport liên tục mỗi 1.5 giây
            this.goldBugTeleportTimer = (this.goldBugTeleportTimer || 0) + deltaTime;
            if (this.goldBugTeleportTimer >= 1500) {
                this.goldBugTeleportTimer = 0;
                // Teleport ngẫu nhiên xung quanh vị trí hiện tại
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 120;
                const tx = this.x + Math.cos(angle) * dist;
                const ty = this.y + Math.sin(angle) * dist;
                
                if (gameEngineRef) {
                    gameEngineRef.spawnBloodParticles(this.x, this.y, '#fffb00', 8);
                    sounds.playPickup(); // Teleport sound
                }
                
                this.x = Math.max(this.radius + 30, Math.min(worldSize - this.radius - 30, tx));
                this.y = Math.max(this.radius + 30, Math.min(worldSize - this.radius - 30, ty));
                
                if (gameEngineRef) {
                    gameEngineRef.spawnBloodParticles(this.x, this.y, '#ffffff', 8);
                }
            }

            // Chạy trốn khỏi người chơi
            this.angle = Vector.angle(player.x, player.y, this.x, this.y);
            this.x += Math.cos(this.angle) * currentSpeed;
            this.y += Math.sin(this.angle) * currentSpeed;
            
            this.x = Math.max(this.radius, Math.min(worldSize - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(worldSize - this.radius, this.y));
            return;
        }

        // Xử lý Hacked (Drone Cấp 3+)
        let target = player;
        let isHackedTarget = false;

        if (this.isHacked) {
            this.hackTimer -= deltaTime;
            if (this.hackTimer <= 0) {
                this.isHacked = false;
                // Khôi phục màu mặc định của quái vật
                if (this.type === 'runner') this.color = '#ff007f';
                else if (this.type === 'tanker') this.color = '#b026ff';
                else if (this.type === 'shooter') this.color = '#ffaa00';
                else if (this.type === 'sniper') this.color = '#ff0055';
            } else {
                // Nhắm vào quái vật khác gần nhất
                if (gameEngineRef && gameEngineRef.enemies) {
                    let nearestEnemy = null;
                    let minDist = Infinity;
                    gameEngineRef.enemies.forEach(other => {
                        if (other !== this && other.hp > 0 && !other.isHacked && other.type !== 'mine' && other.type !== 'portal') {
                            const d = Vector.dist(this.x, this.y, other.x, other.y);
                            if (d < minDist) {
                                minDist = d;
                                nearestEnemy = other;
                            }
                        }
                    });
                    if (nearestEnemy) {
                        target = nearestEnemy;
                        isHackedTarget = true;
                    }
                }
            }
        }

        // Lưu mục tiêu để vẽ tia laser ngắm bắn
        this.targetX = target.x;
        this.targetY = target.y;

        this.angle = Vector.angle(this.x, this.y, target.x, target.y);
        const distToTarget = Vector.dist(this.x, this.y, target.x, target.y);

        const isFrequencyGlitch = window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'frequency_glitch';
        let currentSpeed = isFrequencyGlitch ? this.speed * 2.0 : this.speed;
        if (window.gameEngine && window.gameEngine.player && window.gameEngine.player.upgrades.lagSwitch > 0) {
            currentSpeed *= 0.65; // Giảm 35% tốc độ của quái vật do Lag Switch
        }

        // Logic di chuyển cho từng loại quái vật
        if (this.type === 'shooter') {
            // Giữ khoảng cách tầm 250px với mục tiêu
            if (distToTarget > 280) {
                this.x += Math.cos(this.angle) * currentSpeed;
                this.y += Math.sin(this.angle) * currentSpeed;
            } else if (distToTarget < 200) {
                this.x -= Math.cos(this.angle) * currentSpeed;
                this.y -= Math.sin(this.angle) * currentSpeed;
            } else {
                // Đi vòng quanh nhẹ nhàng
                const tangentAngle = this.angle + Math.PI / 2;
                this.x += Math.cos(tangentAngle) * (currentSpeed * 0.5);
                this.y += Math.sin(tangentAngle) * (currentSpeed * 0.5);
            }

            // Tự bắn đạn vào mục tiêu mỗi 2 giây
            const shootInterval = isFrequencyGlitch ? 1000 : 2000;
            this.shootTimer += deltaTime;
            if (this.shootTimer >= shootInterval) {
                this.shootTimer = 0;
                this.shootAtTarget(target, gameBullets, isHackedTarget);
            }
        } else if (this.type === 'sniper') {
            // Sniper di chuyển giữ khoảng cách 300-450px với mục tiêu
            if (distToTarget > 450) {
                this.x += Math.cos(this.angle) * currentSpeed;
                this.y += Math.sin(this.angle) * currentSpeed;
                this.sniperAimTimer = Math.max(0, this.sniperAimTimer - (isFrequencyGlitch ? deltaTime : deltaTime * 0.5)); // Giảm nhắm khi di chuyển
            } else if (distToTarget < 300) {
                this.x -= Math.cos(this.angle) * currentSpeed;
                this.y -= Math.sin(this.angle) * currentSpeed;
                this.sniperAimTimer = Math.max(0, this.sniperAimTimer - (isFrequencyGlitch ? deltaTime : deltaTime * 0.5)); // Giảm nhắm khi di chuyển
            } else {
                // Đứng yên ngắm bắn
                this.sniperAimTimer += isFrequencyGlitch ? deltaTime * 2 : deltaTime;
                if (this.sniperAimTimer >= 1200) {
                    this.sniperAimTimer = 0;
                    this.shootSniperBulletAtTarget(target, gameBullets, isHackedTarget);
                }
            }
        } else {
            // Runner và Tanker: đuổi thẳng tới mục tiêu
            this.x += Math.cos(this.angle) * currentSpeed;
            this.y += Math.sin(this.angle) * currentSpeed;
        }

        // Giới hạn trong bản đồ thế giới
        this.x = Math.max(this.radius, Math.min(worldSize - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(worldSize - this.radius, this.y));
    }

    shootAtTarget(target, gameBullets, isHackedTarget = false) {
        // Nếu level >= 4, bắn chùm 3 viên cách nhau 150ms
        if (this.level >= 4) {
            let count = 0;
            const shootInterval = setInterval(() => {
                // Kiểm tra nếu quái đã chết hoặc game đã dừng, dừng bắn
                if (this.hp <= 0 || (window.gameEngine && window.gameEngine.state !== 'PLAYING')) {
                    clearInterval(shootInterval);
                    return;
                }
                
                this.fireSingleBullet(target, gameBullets, isHackedTarget);
                count++;
                if (count >= 3) {
                    clearInterval(shootInterval);
                }
            }, 150);
        } else {
            this.fireSingleBullet(target, gameBullets, isHackedTarget);
        }
    }

    fireSingleBullet(target, gameBullets, isHackedTarget) {
        if (this.hp <= 0) return;
        const bulletAngle = Vector.angle(this.x, this.y, target.x, target.y);
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
            isHackedTarget ? '#ff00ff' : '#ff3131', // Hồng neon đồng minh / Đỏ neon kẻ địch
            isHackedTarget // Nếu hacked thì đạn gây hại cho quái vật (là đạn người chơi)
        ));
    }

    shootSniperBulletAtTarget(target, gameBullets, isHackedTarget = false) {
        sounds.playShoot();
        const bulletAngle = Vector.angle(this.x, this.y, target.x, target.y);
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
            isHackedTarget ? '#00ffff' : '#ff00ff', // Cyan neon đồng minh / Hồng neon kẻ địch
            isHackedTarget
        ));
    }


    applyKnockback(angle, force) {
        const isZeroGravity = window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'zero_gravity';
        const mult = isZeroGravity ? 3 : 1;
        this.knockbackX = Math.cos(angle) * force * mult;
        this.knockbackY = Math.sin(angle) * force * mult;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Vẽ cổng dịch chuyển (Portal) và trả về sớm
        if (this.type === 'portal') {
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // 1. Quầng sáng rực rỡ cổng dịch chuyển (Outer Glow)
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.35, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Viền ngoài cổng dịch chuyển
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = '#b026ff';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            // 3. Xoắn ốc năng lượng tự quay tròn
            ctx.rotate(Date.now() * 0.0035);
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < 360; i += 6) {
                const rVal = (i / 360) * this.radius;
                const rad = (i * Math.PI) / 180;
                const px = Math.cos(rad) * rVal;
                const py = Math.sin(rad) * rVal;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            
            // Lõi trắng sáng nhấp nháy phát điện
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 7 + Math.sin(Date.now() * 0.012) * 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();

            // Vẽ thanh máu mini phía trên portal nếu mất máu
            if (this.hp < this.maxHp) {
                ctx.save();
                ctx.translate(screenX, screenY - this.radius - 12);
                const barW = this.radius * 2;
                const barH = 4;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(-barW/2, 0, barW, barH);
                const hpPct = this.hp / this.maxHp;
                ctx.fillStyle = hpPct > 0.4 ? '#39ff14' : '#ff3131';
                ctx.fillRect(-barW/2, 0, barW * hpPct, barH);
                ctx.restore();
            }
            return;
        }

        // Vẽ tia laser ngắm bắn của Sniper lên mặt đất trước (Khử shadowBlur)
        if (this.type === 'sniper' && this.sniperAimTimer > 0) {
            const tx = this.targetX !== undefined ? this.targetX : (window.gameEngine && window.gameEngine.player ? window.gameEngine.player.x : 0);
            const ty = this.targetY !== undefined ? this.targetY : (window.gameEngine && window.gameEngine.player ? window.gameEngine.player.y : 0);
            const isHackedLaser = this.isHacked;
            ctx.save();
            
            // 1. Quầng sáng laser (Outer Glow)
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = isHackedLaser ? '#00f0ff' : '#ff00ff';
            ctx.lineWidth = 4 + (this.sniperAimTimer / 1200) * 3.0;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(tx - camera.x, ty - camera.y);
            ctx.stroke();

            // 2. Tia laser chính (Solid Core)
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = isHackedLaser 
                ? `rgba(0, 240, 255, ${0.45 + (this.sniperAimTimer / 1200) * 0.55})`
                : `rgba(255, 0, 255, ${0.45 + (this.sniperAimTimer / 1200) * 0.55})`;
            ctx.lineWidth = 1 + (this.sniperAimTimer / 1200) * 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(tx - camera.x, ty - camera.y);
            ctx.stroke();
            
            ctx.restore();
        }

        ctx.save();
        ctx.translate(screenX, screenY);

        // Vẽ hiệu ứng vòng độc phát sáng (Synergy Digital Venom)
        if (this.poisonDuration > 0) {
            ctx.save();
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.45 + Math.sin(Date.now() * 0.015) * 0.25;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Vẽ hạt độc phát sáng nhỏ bay xung quanh
            ctx.fillStyle = '#39ff14';
            const orbitAngle = (Date.now() * 0.005);
            ctx.beginPath();
            ctx.arc(Math.cos(orbitAngle) * (this.radius + 6), Math.sin(orbitAngle) * (this.radius + 6), 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

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

        if (this.type === 'gold_bug') {
            ctx.save();
            ctx.translate(screenX, screenY);
            
            const glitchOffset = (Math.random() - 0.5) * 5;
            const glitchScale = 1.0 + (Math.random() - 0.5) * 0.25;
            ctx.scale(glitchScale, glitchScale);
            
            const colors = ['#fffb00', '#00f0ff', '#ffffff'];
            const randColor = colors[Math.floor(Math.random() * colors.length)];
            
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = randColor;
            ctx.beginPath();
            ctx.arc(glitchOffset, glitchOffset, this.radius * 2.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(10, 10, 0, 0.85)';
            ctx.strokeStyle = '#fffb00';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 1.4);
            ctx.lineTo(this.radius * 1.0, 0);
            ctx.lineTo(0, this.radius * 1.4);
            ctx.lineTo(-this.radius * 1.0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = randColor;
            ctx.fillRect(-this.radius * 0.4, -this.radius * 0.4, this.radius * 0.8, this.radius * 0.8);
            
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
export class Boss extends Enemy {
    constructor(x, y, bossType = null, statMultiplier = 1.0) {
        super(x, y, 1, 'boss');
        
        const bossTypes = ['yellow_intruder', 'neon_vortex', 'synapse_reaper', 'arch_overseer', 'grid_infection'];
        this.bossType = bossType || bossTypes[Math.floor(Math.random() * bossTypes.length)];
        
        this.bossTimer = 0;
        this.bossState = 'WALK';
        this.stateTimer = 0;
        
        // Trạng thái chống Overclock (Firewall) - Tự động kích hoạt khi vừa xuất hiện
        this.detectedOverclock = false;
        this.firewallTimer = 3500;
        this.spawnShieldAlerted = false;
        
        switch (this.bossType) {
            case 'yellow_intruder':
                this.name = 'CYBER INTRUDER';
                this.radius = 65;
                this.speed = 1.0;
                this.maxHp = 1200;
                this.damage = 30;
                this.color = '#fffb00'; // Neon Yellow-Orange
                this.chargeAngle = 0;
                this.chargeSpeed = 16;
                break;
            case 'neon_vortex':
                this.name = 'NEON VORTEX';
                this.radius = 60;
                this.speed = 0.8;
                this.maxHp = 1500;
                this.damage = 25;
                this.color = '#b026ff'; // Neon Purple
                this.shieldAngle = 0;
                this.shieldHitTimer = 0;
                break;
            case 'synapse_reaper':
                this.name = 'SYNAPSE REAPER';
                this.radius = 55;
                this.speed = 2.2;
                this.maxHp = 1100;
                this.damage = 35;
                this.color = '#ff007f'; // Neon Pink
                break;
            case 'arch_overseer':
                this.name = 'ARCH OVERSEER';
                this.radius = 75;
                this.speed = 0.6;
                this.maxHp = 1900;
                this.damage = 40;
                this.color = '#00f0ff'; // Neon Cyan
                this.laserAngle = 0;
                this.laserActive = false;
                break;
            case 'grid_infection':
                this.name = 'GRID INFECTION';
                this.radius = 60;
                this.speed = 1.2;
                this.maxHp = 1300;
                this.damage = 28;
                this.color = '#ff9f00'; // Neon Orange
                this.hasSplit = false;
                this.isClone = false;
                break;
        }
        
        this.maxHp = Math.floor(this.maxHp * statMultiplier);
        // Sát thương tăng tiến vừa phải bằng 50% cường độ của HP để tránh shock dame
        this.damage = Math.floor(this.damage * (1.0 + (statMultiplier - 1.0) * 0.5));
        
        this.hp = this.maxHp;
        this.xpValue = 60;
        this.silentDeath = false;
    }

    update(player, gameBullets, deltaTime, gameEngineRef) {
        const worldSize = (window.gameEngine ? window.gameEngine.worldSize : 5000);
        // Cảnh báo khiên bảo vệ vừa xuất hiện
        if (!this.spawnShieldAlerted) {
            this.spawnShieldAlerted = true;
            if (gameEngineRef) {
                gameEngineRef.floatingTexts.push(new FloatingText(
                    this.x, this.y - this.radius - 20, 
                    "⚠️ BOSS SHIELD ACTIVE (-75% DMG) ⚠️", 
                    "#ff3131", 20, true
                ));
            }
        }

        const isFrequencyGlitch = gameEngineRef && gameEngineRef.disasterActive && gameEngineRef.disasterType === 'frequency_glitch';
        const isRaged = (this.hp / this.maxHp < 0.40);
        
        let activeDelta = isFrequencyGlitch ? deltaTime * 2 : deltaTime;
        if (isRaged) {
            activeDelta *= 1.5; // Tăng 50% tốc độ thực hiện hành động/bắn đạn
        }
        
        // Xử lý Giao thức Tường lửa & Phản công khi người chơi bật Overclock
        if (player.overclockActive) {
            if (!this.detectedOverclock) {
                this.detectedOverclock = true;
                this.firewallTimer = 3500; // 3.5 giây tường lửa hoạt động
                
                if (gameEngineRef) {
                    // Đẩy lùi người chơi ra xa nhẹ để giữ khoảng cách an toàn
                    const angleToPlayer = Vector.angle(this.x, this.y, player.x, player.y);
                    player.x += Math.cos(angleToPlayer) * 110;
                    player.y += Math.sin(angleToPlayer) * 110;
                    
                    // Thổi bay toàn bộ đạn của người chơi ở gần Boss
                    if (gameEngineRef.bullets) {
                        gameEngineRef.bullets = gameEngineRef.bullets.filter(bullet => {
                            if (bullet.isPlayerBullet) {
                                const dist = Vector.dist(this.x, this.y, bullet.x, bullet.y);
                                return dist > this.radius + 150;
                            }
                            return true;
                        });
                    }
                    
                    // Hiện thông báo tường lửa
                    gameEngineRef.floatingTexts.push(new FloatingText(
                        this.x, this.y - this.radius - 20, 
                        "⚠️ ANTI-HACK FIREWALL ENGAGED ⚠️", 
                        "#ff3131", 20, true
                    ));
                    
                    // Rung màn hình khi kích hoạt tường lửa
                    gameEngineRef.triggerScreenShake(8, 200);
                    // Bắn loạt đạn tỏa tròn phản công ngay lập tức
                    this.fireBulletCircle(gameBullets);
                }
            }
        } else {
            this.detectedOverclock = false;
        }

        if (this.firewallTimer > 0) {
            this.firewallTimer -= deltaTime;
        }
        
        // Tăng tốc độ di chuyển tạm thời của Boss trong Frequency Glitch, trạng thái Rage và khi bị người chơi Overclock
        const originalSpeed = this.speed;
        const originalChargeSpeed = this.chargeSpeed;
        if (isFrequencyGlitch) {
            this.speed *= 2.0;
            if (this.chargeSpeed) this.chargeSpeed *= 2.0;
        }
        if (isRaged) {
            this.speed *= 1.3;
            if (this.chargeSpeed) this.chargeSpeed *= 1.3;
        }
        if (player.overclockActive) {
            this.speed *= 1.5; // Điên cuồng di chuyển áp sát khi người chơi ép xung
            if (this.chargeSpeed) this.chargeSpeed *= 1.5;
        }

        // Kháng đẩy lùi cực mạnh cho Boss (hệ số giữ lại quán tính knockback nhỏ hơn nhiều)
        this.x += this.knockbackX;
        this.y += this.knockbackY;
        this.knockbackX *= 0.25;
        this.knockbackY *= 0.25;

        this.angle = Vector.angle(this.x, this.y, player.x, player.y);
        this.bossTimer += activeDelta;
        this.stateTimer += activeDelta;

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
        this.x = Math.max(this.radius, Math.min(worldSize - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(worldSize - this.radius, this.y));
        
        // Khôi phục lại speed ban đầu
        this.speed = originalSpeed;
        this.chargeSpeed = originalChargeSpeed;
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
        const originalColor = this.color;
        const isRaged = (this.hp / this.maxHp < 0.40);
        if (isRaged) {
            this.color = Math.floor(Date.now() / 200) % 2 === 0 ? '#ff003c' : originalColor;
        }

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
        
        // Vẽ Khiên Tường lửa bảo vệ màu đỏ chớp nháy xung quanh Boss
        if (this.firewallTimer > 0) {
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // Lắc nhẹ vòng bảo vệ để tạo cảm giác lực điện từ
            const shieldOffset = Math.sin(Date.now() * 0.04) * 2;
            
            // 1. Quầng sáng khiên (Outer Glow)
            ctx.globalAlpha = 0.2 + Math.sin(Date.now() * 0.02) * 0.1;
            ctx.strokeStyle = '#ff3131';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.45 + shieldOffset, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Viền khiên chính dạng lưới
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = '#ff9f00';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.45 + shieldOffset, 0, Math.PI * 2);
            ctx.stroke();
            
            // Vẽ các tia sét nhỏ bên trong vòng khiên
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.rotate(Date.now() * 0.004);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.moveTo(this.radius * 1.25, -5);
                ctx.lineTo(this.radius * 1.45, 0);
                ctx.lineTo(this.radius * 1.25, 5);
            }
            ctx.stroke();
            
            ctx.restore();
        }
        
        this.color = originalColor;
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
