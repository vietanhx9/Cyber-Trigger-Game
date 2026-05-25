// Pillar Entity (Chướng ngại vật cứng)
export class Pillar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 45;
        this.color = '#475569'; // Sát xi xám đen
        this.neonColor = '#00f0ff'; // Neon xanh cyan phát sáng viền nhẹ
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
