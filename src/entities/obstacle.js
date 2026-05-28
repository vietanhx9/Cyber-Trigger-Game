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

        if (theme === 'jungle') {
            // --- JUNGLE THEME: Mossy Stone Brick Wall ---
            // 1. Quầng rêu sáng nhẹ (Green Glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#39ff14';
            ctx.fillRect(-this.w / 2 - 4, -this.h / 2 - 4, this.w + 8, this.h + 8);
            
            // 2. Thân chính (Mossy Stone Blocks)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#223024'; // Rêu sẫm
            ctx.strokeStyle = '#141c15'; // Viền tối chia gạch
            ctx.lineWidth = 3.5;
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);
            
            // Vẽ các khối gạch đá đan xen
            ctx.strokeStyle = '#141c15';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Đường phân chia ngang ở giữa
            ctx.moveTo(-this.w / 2, 0);
            ctx.lineTo(this.w / 2, 0);
            // Các đường phân chia dọc so le
            for (let offset = -this.w / 2 + 40; offset < this.w / 2; offset += 80) {
                ctx.moveTo(offset, -this.h / 2);
                ctx.lineTo(offset, 0);
                ctx.moveTo(offset + 40, 0);
                ctx.lineTo(offset + 40, this.h / 2);
            }
            ctx.stroke();

            // Vẽ các vết rêu xanh mọc lan trên đá
            ctx.fillStyle = '#39ff14';
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(-this.w / 3, -this.h / 4, 8, 0, Math.PI * 2);
            ctx.arc(-this.w / 3 + 6, -this.h / 4 + 2, 6, 0, Math.PI * 2);
            ctx.arc(this.w / 4, this.h / 5, 10, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (theme === 'desert') {
            // --- DESERT THEME: Carved Sandstone Brick Wall ---
            // 1. Quầng nhiệt màu cát cam (Orange/Yellow Glow)
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#f4a261';
            ctx.fillRect(-this.w / 2 - 5, -this.h / 2 - 5, this.w + 10, this.h + 10);

            // 2. Thân đá cát nung (Sandstone blocks)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#8c4f2b';
            ctx.strokeStyle = '#e9c46a'; // Viền khắc vàng
            ctx.lineWidth = 3.5;
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);
            
            // Vẽ các đường chạm khắc cổ đại dài chạy dọc thân tường
            ctx.strokeStyle = 'rgba(233, 196, 106, 0.45)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-this.w / 2 + 10, -this.h / 4);
            ctx.lineTo(this.w / 2 - 10, -this.h / 4);
            ctx.moveTo(-this.w / 2 + 10, this.h / 4);
            ctx.lineTo(this.w / 2 - 10, this.h / 4);
            ctx.stroke();

        } else if (theme === 'ice') {
            // --- ICE THEME: Frosty Ice Block Wall ---
            // 1. Quầng sáng xanh băng (Frosty Cyan Glow)
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-this.w / 2 - 6, -this.h / 2 - 6, this.w + 12, this.h + 12);

            // 2. Tảng băng trơn màu Cyan (Frozen solid core)
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = 'rgba(165, 243, 252, 0.95)'; // Cyan băng
            ctx.strokeStyle = '#ffffff'; // Viền tuyết trắng sáng
            ctx.lineWidth = 3.5;
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

            // Vẽ vân nứt chéo sắc bén bên trong tảng băng
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-this.w / 2 + 15, -this.h / 2 + 5);
            ctx.lineTo(-this.w / 2 + 45, this.h / 2 - 5);
            ctx.moveTo(this.w / 4, -this.h / 2 + 5);
            ctx.lineTo(this.w / 4 - 20, this.h / 2 - 5);
            ctx.stroke();

        } else if (theme === 'highland') {
            // --- HIGHLAND THEME: Runic Monolith Wall (Obsidian) ---
            // 1. Quầng sáng ma thuật tím (Magenta Glow)
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#d946ef';
            ctx.lineWidth = 8;
            ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

            // 2. Đá Obsidian đen sẫm (Dark basalt monolith)
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#1e293b'; // Basalt đen/xám sẫm
            ctx.strokeStyle = '#d946ef'; // Rune tím phát sáng
            ctx.lineWidth = 3.5;
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

            // Vẽ các hoa văn rune chữ chi chạy zig-zag dọc tường
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            let first = true;
            for (let offset = -this.w / 2 + 20; offset < this.w / 2; offset += 40) {
                const yOffset = first ? -this.h / 4 : this.h / 4;
                if (first) {
                    ctx.moveTo(offset, yOffset);
                    first = false;
                } else {
                    ctx.lineTo(offset, yOffset);
                }
                first = !first;
            }
            ctx.stroke();

        } else {
            // --- CYBER THEME (Default): Glowing Octagonal Neon Wall ---
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
        }

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

// TerrainZone Entity (Vùng địa hình đặc trưng từng map)
export class TerrainZone {
    constructor(x, y, radius, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type; // 'bush', 'dune', 'oasis', 'ice_patch', 'magic_zone', 'speed_pad'
        this.angle = Math.random() * Math.PI * 2; // Góc xoay cho tự nhiên
        
        if (type === 'speed_pad') {
            // Mạch tăng tốc có hướng ngẫu nhiên: 0 (Right), PI/2 (Down), PI (Left), 1.5*PI (Up)
            this.angle = Math.floor(Math.random() * 4) * (Math.PI / 2);
            this.padArrowOffset = 0; // Để làm hiệu ứng chạy mũi tên
        }
        
        // Timer đập/nháy cho hiệu ứng ma pháp và ốc đảo
        this.pulseTimer = Math.random() * 1000;
    }

    update(deltaTime) {
        this.pulseTimer += deltaTime;
        if (this.type === 'speed_pad') {
            // Chạy hiệu ứng mũi tên
            this.padArrowOffset = (this.padArrowOffset + 0.15 * (deltaTime / 16.67)) % 30;
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        if (this.type === 'bush') {
            // --- JUNGLE THEME: Leafy Circular Bush ---
            ctx.rotate(this.angle);
            ctx.globalAlpha = 0.8;
            
            // Vẽ các tệp cụm lá cây tròn đan xen nhau
            ctx.fillStyle = '#1b4d22'; // Xanh lá cây sẫm dưới
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Vẽ cụm lá cây con xung quanh
            ctx.fillStyle = '#228b22'; // Xanh lá vừa
            const leafCount = 6;
            for (let i = 0; i < leafCount; i++) {
                const angle = (Math.PI * 2 / leafCount) * i;
                const lx = Math.cos(angle) * (this.radius * 0.6);
                const ly = Math.sin(angle) * (this.radius * 0.6);
                ctx.beginPath();
                ctx.arc(lx, ly, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Nhân lá sáng neon trên cùng
            ctx.fillStyle = '#39ff14'; // Xanh chuối neon
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(-5, -5, this.radius * 0.4, 0, Math.PI * 2);
            ctx.arc(5, 8, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'dune') {
            // --- DESERT THEME: Sand Dune (Đồi cát) ---
            ctx.rotate(this.angle);
            ctx.globalAlpha = 0.5;

            // Gradient cát
            const grad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
            grad.addColorStop(0, '#e9c46a'); // Vàng cát sáng
            grad.addColorStop(0.5, '#d4a373'); // Vàng cam ấm
            grad.addColorStop(1, '#a07148'); // Nâu bóng cát
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Vẽ đường gờ đồi cát uốn lượn hình chữ S
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = 0.25;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.8, -this.radius * 0.2);
            ctx.bezierCurveTo(-this.radius * 0.2, -this.radius * 0.8, this.radius * 0.2, this.radius * 0.8, this.radius * 0.8, this.radius * 0.2);
            ctx.stroke();

        } else if (this.type === 'oasis') {
            // --- DESERT THEME: Healing Oasis (Ốc đảo) ---
            const pulse = Math.sin(this.pulseTimer * 0.003) * 0.05;
            const r = this.radius * (1 + pulse);

            // 1. Quầng sáng rực nước (Cyan Water Glow)
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
            ctx.fill();

            // 2. Viền bờ rêu màu xanh lục
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#2d6a4f';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // 3. Lõi hồ nước trong xanh
            const waterGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r - 6);
            waterGrad.addColorStop(0, '#ffffff'); // Tâm trắng sáng
            waterGrad.addColorStop(0.3, '#cffafe'); // Lớp cyan nhạt
            waterGrad.addColorStop(1, '#0891b2'); // Bìa xanh thẳm
            ctx.fillStyle = waterGrad;
            ctx.beginPath();
            ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
            ctx.fill();

            // 4. Nhãn chữ chỉ dẫn nhỏ nhắn
            ctx.fillStyle = '#ffffff';
            ctx.font = "bold 10px 'Orbitron', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("HEALING OASIS 💧", 0, 4);

        } else if (this.type === 'ice_patch') {
            // --- ICE THEME: Slippery Ice Patch (Băng trơn) ---
            ctx.rotate(this.angle);
            ctx.globalAlpha = 0.45;
            
            // Khối đa giác băng lục giác dẹt
            ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            const sides = 6;
            for (let i = 0; i < sides; i++) {
                const angle = (Math.PI * 2 / sides) * i;
                // Co giãn nhẹ để tạo đa giác ko tròn xoe
                const dist = this.radius * (0.95 + Math.sin(i * 1.7) * 0.05);
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Vân rạn băng tuyết mờ ảo bên trong
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.5, 0);
            ctx.lineTo(this.radius * 0.4, -this.radius * 0.3);
            ctx.moveTo(0, -this.radius * 0.4);
            ctx.lineTo(-this.radius * 0.2, this.radius * 0.5);
            ctx.stroke();

        } else if (this.type === 'magic_zone') {
            // --- HIGHLAND THEME: Magic Runic Zone ---
            const pulse = 1 + Math.sin(this.pulseTimer * 0.004) * 0.04;
            const r = this.radius * pulse;

            // 1. Quầng sáng phát quang tím (Magenta Glow)
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#d946ef';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // 2. Vòng tròn biểu tượng phép thuật xoay
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = '#d946ef';
            ctx.lineWidth = 2.5;
            ctx.save();
            ctx.rotate(this.pulseTimer * 0.0006); // Tự động xoay chậm rãi
            
            // Vẽ vòng tròn lớn bên ngoài
            ctx.beginPath();
            ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
            ctx.stroke();

            // Vẽ vòng tròn đứt đoạn bên trong
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(0, 0, r - 16, 0, Math.PI * 0.4); ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r - 16, Math.PI * 0.5, Math.PI * 0.9); ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r - 16, Math.PI * 1.0, Math.PI * 1.4); ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r - 16, Math.PI * 1.5, Math.PI * 1.9); ctx.stroke();

            // Vẽ ký tự ngôi sao 3 cánh năng lượng ma pháp ở tâm
            ctx.beginPath();
            for (let k = 0; k < 3; k++) {
                const ang = (Math.PI * 2 / 3) * k - Math.PI / 2;
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ang) * (r - 20), Math.sin(ang) * (r - 20));
            }
            ctx.stroke();
            ctx.restore();

            // Nhãn biểu tượng buff
            ctx.fillStyle = '#d946ef';
            ctx.font = "bold 10px 'Orbitron', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("MAGIC ZONE ⚡", 0, r - 12);
            
        } else if (this.type === 'speed_pad') {
            // --- CYBER THEME: Speed Conveyor Pad ---
            ctx.rotate(this.angle);
            ctx.globalAlpha = 0.7;

            // 1. Vẽ nền hộp chữ nhật bo tròn màu xám công nghệ viền xanh lá
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.strokeStyle = '#39ff14'; // Viền xanh chuối neon sáng
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2, 8);
            ctx.fill();
            ctx.stroke();

            // 2. Vẽ 3 chevrons (mũi tên) chạy dọc băng chuyền theo angle hướng sang phải (0 rad)
            ctx.strokeStyle = '#fffb00'; // Mũi tên màu vàng neon
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const arrowSpacing = 26;
            const startX = -this.radius + 15 + this.padArrowOffset;

            ctx.save();
            // Cắt nội dung vẽ chỉ nằm trong vùng Speed Pad
            ctx.beginPath();
            ctx.roundRect(-this.radius + 2, -this.radius * 0.55, this.radius * 2 - 4, this.radius * 1.1, 8);
            ctx.clip();

            for (let offset = -arrowSpacing * 2; offset < this.radius * 2; offset += arrowSpacing) {
                const ax = startX + offset;
                ctx.beginPath();
                ctx.moveTo(ax - 6, -10);
                ctx.lineTo(ax, 0);
                ctx.lineTo(ax - 6, 10);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.restore();
    }
}
