import { Vector } from '../utils/vector.js';
import { sounds } from '../audio/soundManager.js';
import { Particle } from '../effects/particle.js';
import { FloatingText } from '../effects/floatingText.js';

export class Player {
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
            dualSlash: 0,
            digitalVenom: 0,
            empReflector: 0,
            crystalSplinters: 0,
            glassCore: 0,
            overheated: 0,
            lagSwitch: 0,
            limitBreak: 0,
            nanoDrain: 0
        };

        this.ultimateEnergy = 0;
        this.hyperDriveActive = false;
        this.hyperDriveTimer = 0;

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

        // Trạng thái kỹ năng kích hoạt riêng biệt của các vai trò (RPG active skills)
        this.plasmaOverloadTimer = 0; // Xạ thủ
        this.shadowDashTimer = 0; // Sát thủ
        this.shadowDashAngle = 0; // Sát thủ
        this.shadowDashHitEnemies = new Set(); // Sát thủ
        
        this.isDashingTimer = 0; // Thời gian còn lại của Dash vật lý
        
        // Vận tốc cho quán tính trong trạng thái Zero Gravity
        this.vx = 0;
        this.vy = 0;

        // Trạng thái Overclock (Hack Mode)
        this.overclockEnergy = 0; // 0 to 100
        this.overclockActive = false;
        this.overclockTimer = 0; // ms
        this.overheatTimer = 0; // ms (Thời gian quá nhiệt sau khi overclock)
    }

    update(keys, mouse, canvasWidth, canvasHeight, camera, deltaTime) {
        // Cập nhật thời gian Powerups
        if (this.powerups.doubleShot > 0) this.powerups.doubleShot -= deltaTime;
        if (this.powerups.shield > 0) this.powerups.shield -= deltaTime;
        if (this.powerups.speedBoost > 0) this.powerups.speedBoost -= deltaTime;
        if (this.iframe > 0) this.iframe -= deltaTime;

        // Cập nhật thời gian Overclock
        if (this.overclockActive) {
            this.overclockTimer -= deltaTime;
            if (this.overclockTimer <= 0) {
                this.overclockActive = false;
                this.overclockTimer = 0;
                this.overclockEnergy = 0;
                this.overheatTimer = 3000; // 3 giây quá nhiệt phạt hạ nhiệt
                
                if (window.gameEngine) {
                    window.gameEngine.floatingTexts.push(new FloatingText(
                        this.x, this.y - this.radius - 20, 
                        "SYSTEM OVERHEAT: COOLING DOWN... ⚠️", 
                        "#ff5500", 18, true
                    ));
                    sounds.playHit(); // Còi cảnh báo quá nhiệt
                }
            }
        }

        // Cập nhật bộ đếm thời gian quá nhiệt
        if (this.overheatTimer > 0) {
            this.overheatTimer -= deltaTime;
            if (this.overheatTimer < 0) this.overheatTimer = 0;
        }

        // Cập nhật thời gian Hyper-Drive
        if (this.hyperDriveActive) {
            this.hyperDriveTimer -= deltaTime;
            if (this.hyperDriveTimer <= 0) {
                this.hyperDriveActive = false;
                this.hyperDriveTimer = 0;
            }
        }

        // Cập nhật hồi chiêu kỹ năng
        if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
        if (this.shockwaveCooldown > 0) this.shockwaveCooldown -= deltaTime;

        // Cập nhật bộ đếm thời gian lướt
        if (this.isDashingTimer > 0) {
            this.isDashingTimer -= deltaTime;
            if (this.isDashingTimer < 0) this.isDashingTimer = 0;
        }

        // Xử lý các bóng mờ di chuyển
        if (this.ghostTrails.length > 0) {
            this.ghostTrails.forEach(gt => gt.alpha -= deltaTime / 200); // Mờ dần trong 200ms
            this.ghostTrails = this.ghostTrails.filter(gt => gt.alpha > 0);
        }

        // Cập nhật bộ đếm thời gian kỹ năng active đặc biệt
        if (this.plasmaOverloadTimer > 0) this.plasmaOverloadTimer -= deltaTime;
        
        // Tính tốc độ hiện tại (có tính Speed Boost powerup)
        let currentSpeed = this.speed;
        if (this.powerups.speedBoost > 0) {
            currentSpeed *= 1.5;
        }
        if (this.plasmaOverloadTimer > 0) {
            currentSpeed *= 1.6; // Xạ thủ tăng tốc khi bật Quá tải Plasma
        }
        if (this.hyperDriveActive) {
            currentSpeed *= 1.5; // Tăng 50% tốc độ di chuyển trong Hyper-Drive
        }
        if (this.overclockActive) {
            if (this.role === 'assassin') {
                currentSpeed *= 1.45; // Assassin di chuyển cực nhanh trong Overclock
            } else {
                currentSpeed *= 1.25; // Các class khác tăng tốc 25%
            }
        }
        if (this.overheatTimer > 0) {
            currentSpeed *= 0.7; // Giảm 30% tốc chạy khi phi thuyền bị quá nhiệt
        }
        if (window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'matrix_protocol') {
            currentSpeed *= 1.3; // Tăng 30% tốc độ di chuyển trong Matrix Protocol
        }

        // Giảm 30% tốc độ di chuyển khi có động đất đang hoạt động
        if (window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'earthquake') {
            currentSpeed *= 0.7;
        }

        // Di chuyển tự động khi đang lướt Shadow Dash (Sát thủ)
        if (this.shadowDashTimer > 0) {
            this.shadowDashTimer -= deltaTime;
            if (this.shadowDashTimer < 0) this.shadowDashTimer = 0;
            
            const dashSpeed = 16.0;
            this.x += Math.cos(this.shadowDashAngle) * dashSpeed * (deltaTime / 16.67);
            this.y += Math.sin(this.shadowDashAngle) * dashSpeed * (deltaTime / 16.67);
            
            // Luôn duy trì bất tử trong suốt quá trình lướt
            this.iframe = Math.max(this.iframe, 100);
            
            // Thêm bóng mờ tần suất cao
            if (Math.floor(Date.now() / 25) % 2 === 0) {
                this.ghostTrails.push({
                    x: this.x,
                    y: this.y,
                    angle: this.shadowDashAngle,
                    alpha: 0.85
                });
            }
        } else {
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

            const isZeroGravity = window.gameEngine && window.gameEngine.disasterActive && window.gameEngine.disasterType === 'zero_gravity';
            if (isZeroGravity) {
                // Acceleration: add to velocity
                const acc = 0.15 * currentSpeed;
                this.vx += dx * acc;
                this.vy += dy * acc;
                
                // Cap velocity to currentSpeed
                const speedSquared = this.vx * this.vx + this.vy * this.vy;
                if (speedSquared > currentSpeed * currentSpeed) {
                    const speedVal = Math.sqrt(speedSquared);
                    this.vx = (this.vx / speedVal) * currentSpeed;
                    this.vy = (this.vy / speedVal) * currentSpeed;
                }
                
                // Apply drag: 4% friction
                this.vx *= 0.96;
                this.vy *= 0.96;
                
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // Standard movement (non-zero gravity)
                this.vx = dx * currentSpeed;
                this.vy = dy * currentSpeed;
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        // Giới hạn trong bản đồ thế giới
        const margin = this.radius + 10;
        const worldSize = (window.gameEngine ? window.gameEngine.worldSize : 5000);
        this.x = Math.max(margin, Math.min(worldSize - margin, this.x));
        this.y = Math.max(margin, Math.min(worldSize - margin, this.y));

        // Nhắm bắn xoay theo chuột
        // Lấy tọa độ chuột trên canvas và dịch chuyển tương ứng với camera để ra tọa độ thế giới
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        this.angle = Vector.angle(this.x, this.y, worldMouseX, worldMouseY);
    }

    takeDamage(amount) {
        if (this.hyperDriveActive) return false; // Không nhận sát thương khi đang Hyper-Drive!
        if (this.overclockActive) return false; // Không nhận sát thương khi đang Overclock (CPU Hack)!
        if (this.iframe > 0) return false;

        // Nhân đôi sát thương nhận vào nếu Bão mặt trời đang hoạt động
        if (window.gameEngine && window.gameEngine.weatherActive && window.gameEngine.weatherType === 'solar_flare') {
            amount *= 2;
        }
        
        if (this.upgrades.limitBreak > 0) {
            amount = Math.floor(amount * 1.15);
        }
        
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

        // Vẽ hiệu ứng sấm sét/điện trường cyan xoay tròn khi Ranger bật Quá Tải Plasma
        if (this.plasmaOverloadTimer > 0) {
            ctx.save();
            ctx.rotate(Date.now() * 0.008);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.025) * 0.3;
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 1.6, -0.3, 0.3);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.rotate(this.angle);

        // Hiệu ứng Overclock phát sáng cực mạnh bao quanh
        if (this.overclockActive) {
            ctx.save();
            ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.02) * 0.15;
            ctx.strokeStyle = '#fffb00';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Hiệu ứng Quá Nhiệt (Overheat) phát sáng cam/đỏ và xì khói
        if (this.overheatTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.25 + Math.sin(Date.now() * 0.035) * 0.15;
            ctx.strokeStyle = '#ff5500';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            // Sinh các hạt khói nhiệt màu cam/đỏ bay lên phía trên
            if (Math.random() < 0.12 && window.gameEngine) {
                const ox = this.x + (Math.random() - 0.5) * 20;
                const oy = this.y + (Math.random() - 0.5) * 20;
                const randColor = Math.random() < 0.65 ? '#ff5500' : '#ffaa00';
                const p = new Particle(ox, oy, randColor);
                p.vx = (Math.random() - 0.5) * 1.5;
                p.vy = -Math.random() * 2 - 0.5; // bay vút lên
                p.life = 400 + Math.random() * 300;
                window.gameEngine.particles.push(p);
            }
        }

        // Hiệu ứng Hyper-Drive phát sáng hồng tím cực mạnh bao quanh
        if (this.hyperDriveActive) {
            ctx.save();
            ctx.globalAlpha = 0.45 + Math.sin(Date.now() * 0.025) * 0.2;
            ctx.strokeStyle = '#d946ef'; // Magenta
            ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Vẽ vòng năng lượng ảo ảnh bên trong
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.rotate(Date.now() * 0.005);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI, false);
            ctx.stroke();
            ctx.restore();
        }

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
