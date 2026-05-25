import { Vector } from '../utils/vector.js';

export class BlastRing {
    constructor(x, y, maxRadius, color = '#ff3131') {
        this.x = x;
        this.y = y;
        this.currentRadius = 0;
        this.maxRadius = maxRadius;
        this.speed = 6;
        this.color = color;
        this.alpha = 1.0;
    }

    update(deltaTime) {
        this.currentRadius += this.speed * (deltaTime / 16.67) * 4;
        this.alpha = 1 - (this.currentRadius / this.maxRadius);
        return this.currentRadius >= this.maxRadius; // Trả về true khi nổ xong
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        const alpha = Math.max(0, this.alpha);
        
        // 1. Quầng sáng vụ nổ (Outer Glow)
        ctx.globalAlpha = alpha * 0.25;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Vòng nổ chính (Solid Core)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
