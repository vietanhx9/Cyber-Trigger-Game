import { Vector } from '../utils/vector.js';

export class Item {
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
