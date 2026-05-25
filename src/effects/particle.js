export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.radius = 2 + Math.random() * 3;
        this.color = color;
        this.alpha = 1.0;
        // Decay nhanh hơn để particle tắt sớm hơn (tiết kiệm render)
        this.decay = 0.030 + Math.random() * 0.025;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.92; // giảm tốc nhẹ
        this.vy *= 0.92;
        this.alpha -= this.decay;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        // Không dùng save/restore & shadowBlur mỗi particle — tốn kém nhất trên Canvas
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
