import { Vector } from '../utils/vector.js';
import { FloatingText } from '../effects/floatingText.js';
import { Particle } from '../effects/particle.js';
import { BlastRing } from '../effects/blastRing.js';
import { sounds } from '../audio/soundManager.js';

export class Hazard {
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
