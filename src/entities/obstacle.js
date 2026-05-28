import { Particle } from '../effects/particle.js';
import { FloatingText } from '../effects/floatingText.js';
import { sounds } from '../audio/soundManager.js';
import { Vector } from '../utils/vector.js';

// Pillar Entity (Chướng ngại vật cứng)
export class Pillar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 45;
        this.color = '#475569'; // Sát xi xám đen
        this.neonColor = '#00f0ff'; // Neon xanh cyan phát sáng viền nhẹ
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.energyCharge = 0;
        this.maxCharge = 5;
    }

    draw(ctx, camera, theme = 'cyber') {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        if (theme === 'jungle') {
            // --- JUNGLE THEME: Mossy Stone Pillar with Vines & Leaves ---
            // 1. Quầng sáng rêu xanh (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.fill();

            // 2. Thân cột đá xù xì (Circular rough stone)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#2e3a2f'; // Đá màu xanh rêu đậm
            ctx.strokeStyle = '#1e4620'; // Viền xanh lá cây sẫm
            ctx.lineWidth = 4;
            ctx.beginPath();
            // Vẽ đa giác xù xì nhẹ để tạo nét đá tự nhiên thay vì tròn xoe
            const steps = 10;
            for (let i = 0; i < steps; i++) {
                const angle = (Math.PI * 2 / steps) * i;
                const r = this.radius - 2 + Math.sin(i * 3) * 3; // Rìa gồ ghề
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ dây leo rêu phong bò quanh cột
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(-5, -5, this.radius * 0.5, 0.2, Math.PI * 1.5);
            ctx.stroke();
            
            // Dây leo thứ hai chéo qua
            ctx.strokeStyle = '#2d6a4f';
            ctx.beginPath();
            ctx.arc(5, 5, this.radius * 0.4, Math.PI * 0.5, Math.PI * 1.8);
            ctx.stroke();

            // 4. Vẽ các lá cây nhỏ mọc nhô ra rìa cột đá
            ctx.fillStyle = '#39ff14';
            // Lá 1 ở góc trên bên phải
            ctx.beginPath();
            ctx.ellipse(this.radius * 0.8, -this.radius * 0.5, 8, 4, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            // Lá 2 ở góc dưới bên trái
            ctx.fillStyle = '#2d6a4f';
            ctx.beginPath();
            ctx.ellipse(-this.radius * 0.7, this.radius * 0.6, 9, 5, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (theme === 'desert') {
            // --- DESERT THEME: Carved Terracotta/Sandstone Obelisk ---
            // 1. Quầng sáng vàng cát (Outer Glow)
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#e9c46a';
            ctx.lineWidth = 10;
            ctx.strokeRect(-this.radius * 0.9, -this.radius * 0.9, this.radius * 1.8, this.radius * 1.8);

            // 2. Tháp chính hình vuông xoay 45 độ (Diamond Obelisk)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#8b4513'; // Đá nâu cát nung
            ctx.strokeStyle = '#e9c46a'; // Khắc viền vàng cát phát sáng
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ hoa văn cổ khắc chìm/vết nứt của tháp obelisk
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Nét gạch chéo nối các đỉnh chính
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(0, this.radius);
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(this.radius, 0);
            // Vòng tròn trung tâm cổ đại
            ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
            ctx.stroke();
            
            // Nhân tháp sáng rực
            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

        } else if (theme === 'ice') {
            // --- ICE THEME: Jagged Glowing Crystal Ice Spire ---
            // 1. Quầng sáng xanh băng tuyết (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.fill();

            // 2. Tháp tinh thể băng (Sharp crystal shape)
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = '#a5f3fc'; // Màu băng lạnh lùng
            ctx.strokeStyle = '#ffffff'; // Viền tuyết trắng sáng
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            // Vẽ tinh thể lục giác góc cạnh nhọn
            const crystalSides = 6;
            for (let i = 0; i < crystalSides; i++) {
                const angle = (Math.PI * 2 / crystalSides) * i - Math.PI / 2;
                // Tạo đỉnh nhọn nhô hẳn lên ở đầu (i = 0)
                const r = (i === 0) ? this.radius * 1.15 : this.radius * 0.9;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ vân nứt tinh thể băng sắc sảo bên trong
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 1.1);
            ctx.lineTo(0, this.radius * 0.3);
            ctx.moveTo(0, this.radius * 0.3);
            ctx.lineTo(-this.radius * 0.5, this.radius * 0.7);
            ctx.moveTo(0, this.radius * 0.3);
            ctx.lineTo(this.radius * 0.5, this.radius * 0.7);
            ctx.stroke();

        } else if (theme === 'highland') {
            // --- HIGHLAND THEME: Ancient Megalith Stone with Glowing Runes ---
            // 1. Quầng sáng cổ xưa huyền bí (Outer Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#d946ef'; // Sáng hồng tím ma thuật
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Thân cột đá tảng cổ (Rough rectangular monolith)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#334155'; // Màu đá xám sẫm phong hóa
            ctx.strokeStyle = '#475569'; // Viền đá cũ
            ctx.lineWidth = 4;
            
            // Vẽ đá tảng góc cạnh
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.8, -this.radius);
            ctx.lineTo(this.radius * 0.7, -this.radius * 0.95);
            ctx.lineTo(this.radius * 0.9, this.radius * 0.9);
            ctx.lineTo(-this.radius * 0.85, this.radius * 0.95);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ chữ rune phát sáng ma thuật
            ctx.strokeStyle = '#d946ef';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            // Biểu tượng chữ rune cổ đại (dạng chữ Y/X kết hợp nét thẳng)
            ctx.moveTo(0, -this.radius * 0.5);
            ctx.lineTo(0, this.radius * 0.5);
            ctx.moveTo(-this.radius * 0.4, -this.radius * 0.2);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.radius * 0.4, -this.radius * 0.2);
            ctx.moveTo(-this.radius * 0.3, this.radius * 0.4);
            ctx.lineTo(this.radius * 0.3, this.radius * 0.4);
            ctx.stroke();
            
        } else {
            // --- CYBER THEME (Default): Glowing Octagonal Neon Column ---
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
        }

        // Draw HP ring around the center if damaged
        if (this.hp < this.maxHp) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 8, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (this.hp / this.maxHp)));
            ctx.stroke();
            ctx.restore();
        }

        // Draw energy charge indicator ring
        if (this.energyCharge && this.energyCharge > 0) {
            ctx.save();
            ctx.strokeStyle = '#fffb00'; // Vàng neon rực rỡ
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (this.energyCharge / this.maxCharge)));
            ctx.stroke();
            
            ctx.globalAlpha = 0.08 * this.energyCharge;
            ctx.fillStyle = '#fffb00';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
 
        ctx.restore();
    }
}

// Explosive Barrel Entity (Thùng thuốc nổ)
export class Barrel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.hp = 1; // 1 phát bắn là nổ
        this.color = '#ff3131'; // Neon đỏ cảnh báo nổ
    }

    draw(ctx, camera, theme = 'cyber') {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        if (theme === 'jungle') {
            // --- JUNGLE THEME: Old Wooden Slime Barrel ---
            // 1. Quầng sáng xanh độc phát quang (Outer Glow)
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // 2. Thùng gỗ tròn (Solid Wood Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#5c3a21'; // Màu gỗ nâu
            ctx.strokeStyle = '#2d1a0e'; // Viền gỗ tối
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ đai sắt của thùng gỗ
            ctx.strokeStyle = '#1e1a17';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Đai trên
            ctx.arc(0, 0, this.radius * 0.75, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
            ctx.beginPath();
            // Đai dưới
            ctx.arc(0, 0, this.radius * 0.75, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();

            // 4. Vẽ bóng khí độc màu xanh phát sáng ở giữa
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.radius * 0.3, -this.radius * 0.2, 2.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (theme === 'desert') {
            // --- DESERT THEME: Rusted Corrugated Iron Oil Drum ---
            // 1. Quầng sáng nhiệt hổ phách (Outer Glow)
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff7700';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // 2. Thùng sắt rỉ sét (Rusty Metal Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#8b4f30'; // Màu sắt rỉ sét cam nâu
            ctx.strokeStyle = '#5a2d18'; // Viền sắt xước tối
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ các đường gờ gia cố chạy ngang thùng (ridges)
            ctx.strokeStyle = '#4a2514';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.8, -this.radius * 0.35);
            ctx.lineTo(this.radius * 0.8, -this.radius * 0.35);
            ctx.moveTo(-this.radius * 0.8, this.radius * 0.35);
            ctx.lineTo(this.radius * 0.8, this.radius * 0.35);
            ctx.stroke();

            // 4. Vẽ vạch cảnh báo sọc vàng đen ở chính giữa (warning stripes)
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
            ctx.clip();
            
            ctx.fillStyle = '#ffcc00'; // Dải vàng ở giữa
            ctx.fillRect(-this.radius, -this.radius * 0.25, this.radius * 2, this.radius * 0.5);
            
            // Vẽ 3 sọc đen chéo
            ctx.strokeStyle = '#1e1e1e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, -5); ctx.lineTo(-2, 5);
            ctx.moveTo(-2, -5); ctx.lineTo(6, 5);
            ctx.moveTo(6, -5); ctx.lineTo(14, 5);
            ctx.stroke();
            ctx.restore();

        } else if (theme === 'ice') {
            // --- ICE THEME: Frozen Explosive Ice Barrel ---
            // 1. Quầng sáng xanh tuyết giá (Outer Glow)
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // 2. Thùng bọc băng đóng tuyết (Frozen Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#0f172a'; // Thùng sắt lạnh
            ctx.strokeStyle = '#00f0ff'; // Viền băng cyan
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 3. Vẽ các nhũ băng đọng (Icicles hanging)
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            // Nhũ băng bên trái
            ctx.moveTo(-this.radius * 0.7, 0);
            ctx.lineTo(-this.radius * 0.5, this.radius * 0.5);
            ctx.lineTo(-this.radius * 0.3, 0);
            // Nhũ băng ở giữa
            ctx.moveTo(-this.radius * 0.2, 0);
            ctx.lineTo(0, this.radius * 0.75);
            ctx.lineTo(this.radius * 0.2, 0);
            // Nhũ băng bên phải
            ctx.moveTo(this.radius * 0.3, 0);
            ctx.lineTo(this.radius * 0.5, this.radius * 0.5);
            ctx.lineTo(this.radius * 0.7, 0);
            ctx.fill();

            // 4. Biểu tượng bông tuyết ở tâm
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
            }
            ctx.stroke();

        } else if (theme === 'highland') {
            // --- HIGHLAND THEME: Runic Magic Barrel ---
            // 1. Quầng sáng ma thuật tím (Outer Glow)
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#d946ef';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // 2. Thùng đá ma pháp (Stony Runic Core)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#1e293b'; // Màu đá xanh đen tối
            ctx.strokeStyle = '#d946ef'; // Viền hồng tím ma thuật
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 3. Đường nứt ma thuật rực hồng
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.6, -this.radius * 0.4);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.radius * 0.6, -this.radius * 0.4);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, this.radius * 0.75);
            ctx.stroke();

            // 4. Lõi năng lượng ma thuật phát sáng ở tâm
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // --- CYBER THEME (Default): Glowing Neon Canister ---
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
        }

        ctx.restore();
    }
}

// Wall Entity (Chướng ngại vật tường chữ nhật cứng)
export class Wall {
    constructor(x, y, w, h, angle = 0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.angle = angle; // Xoay góc
        this.color = '#334155';
        this.neonColor = '#ff0055'; // neon viền hồng đỏ
        this.radius = Math.max(w, h) / 2; // Cận bán kính kiểm tra nhanh va chạm
    }

    draw(ctx, camera, theme = 'cyber') {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // 1. Quầng sáng viền (Outer Glow)
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = this.neonColor;
        ctx.lineWidth = 10;
        ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

        // 2. Thân chính
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = this.neonColor;
        ctx.lineWidth = 3;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

        // Vẽ vân lưới công nghệ bên trong bức tường
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let offset = -this.w / 2 + 15; offset < this.w / 2; offset += 30) {
            ctx.moveTo(offset, -this.h / 2);
            ctx.lineTo(offset, this.h / 2);
        }
        ctx.stroke();

        ctx.restore();
    }
}

// PortalGate Entity (Cổng dịch chuyển công nghệ)
export class PortalGate {
    constructor(x, y, label, color = '#00f0ff') {
        this.x = x;
        this.y = y;
        this.radius = 28;
        this.label = label;
        this.color = color; // e.g. '#00f0ff' (Cổng A) hoặc '#ff00ff' (Cổng B)
        this.targetPortal = null; // Sẽ liên kết sau
        this.cooldown = 0; // ms
        this.rotationAngle = 0;
    }

    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
            if (this.cooldown < 0) this.cooldown = 0;
        }
        this.rotationAngle += 0.03 * (deltaTime / 16.67);
    }

    teleport(entity, gameEngine) {
        if (!this.targetPortal) return;
        
        // Hiệu ứng nổ hạt tại cổng đi
        gameEngine.spawnBloodParticles(this.x, this.y, this.color, 15);
        if (gameEngine.particles) {
            for (let i = 0; i < 8; i++) {
                gameEngine.particles.push(new Particle(this.x, this.y, '#ffffff'));
            }
        }
        
        // Di chuyển thực thể sang cổng đích
        entity.x = this.targetPortal.x;
        entity.y = this.targetPortal.y;
        
        // Đặt hồi chiêu cho cả 2 cổng để chống dịch chuyển ngược vô hạn
        this.cooldown = 2500;
        this.targetPortal.cooldown = 2500;
        
        // Hiệu ứng nổ hạt tại cổng đến
        gameEngine.spawnBloodParticles(entity.x, entity.y, this.targetPortal.color, 15);
        if (gameEngine.particles) {
            for (let i = 0; i < 8; i++) {
                gameEngine.particles.push(new Particle(entity.x, entity.y, '#ffffff'));
            }
        }
        
        // Rung màn hình nhẹ và chạy âm thanh dịch chuyển
        gameEngine.triggerScreenShake(6, 150);
        sounds.playPowerup();
        
        // Thêm floating text báo dịch chuyển
        gameEngine.floatingTexts.push(new FloatingText(
            entity.x, entity.y - entity.radius - 20,
            "TELEPORTED 📡",
            this.targetPortal.color,
            16,
            false
        ));
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        // Vẽ quầng sáng ngoài (Outer Glow)
        ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.01) * 0.05;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Vẽ vòng xoay cổng dịch chuyển
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3.5;
        ctx.save();
        ctx.rotate(this.rotationAngle);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI * 0.6, Math.PI * 1.0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI * 1.2, Math.PI * 1.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI * 1.8, Math.PI * 2.2);
        ctx.stroke();
        ctx.restore();

        // Tâm cổng nhấp nháy
        if (this.cooldown > 0) {
            ctx.fillStyle = '#64748b'; // xám khi hồi chiêu
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.beginPath();
        ctx.arc(0, 0, 10 + Math.sin(Date.now() * 0.015) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Nhãn tên cổng
        ctx.fillStyle = this.color;
        ctx.font = "bold 11px 'Orbitron', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(this.label, 0, this.radius + 18);

        ctx.restore();
    }
}
