export class FloatingText {
    constructor(x, y, text, color, size = 16) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.alpha = 1.0;
        this.vy = -1.2; // Tốc độ trôi lên
        this.vx = (Math.random() - 0.5) * 0.6; // Bay xéo nhẹ
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.025; // Biến mất sau ~40 frames
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = `bold ${this.size}px 'Orbitron', sans-serif`;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        ctx.strokeText(this.text, screenX, screenY);
        ctx.fillText(this.text, screenX, screenY);
        ctx.restore();
    }
}
