import { Vector } from '../utils/vector.js';
import { Particle } from '../effects/particle.js';

// Bullet Entity
export class Bullet {
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
export class SwordSlash {
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
export class HammerWave {
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
export class HomingMissile {
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
