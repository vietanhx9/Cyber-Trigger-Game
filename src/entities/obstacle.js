// Pillar Entity (Chướng ngại vật cứng)
export class Pillar {
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
export class Barrel {
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
