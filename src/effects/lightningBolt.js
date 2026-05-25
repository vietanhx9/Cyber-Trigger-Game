export class LightningBolt {
    constructor(startX, startY, endX, endY, color) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.color = color;
        this.life = 200; // 200ms duration
        this.lifeMax = 200;
        
        // Generate zig-zag segments once so it has a stable, realistic shape
        this.points = [];
        const segments = 6;
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        
        this.points.push({ x: startX, y: startY });
        for (let i = 1; i < segments; i++) {
            const ratio = i / segments;
            // Base position along the straight line
            const bx = startX + dx * ratio;
            const by = startY + dy * ratio;
            // Perpendicular offset for the zig-zag effect
            const offset = (Math.random() - 0.5) * 24;
            const px = bx - Math.sin(angle) * offset;
            const py = by + Math.cos(angle) * offset;
            this.points.push({ x: px, y: py });
        }
        this.points.push({ x: endX, y: endY });
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        return this.life <= 0;
    }
    
    draw(ctx, camera) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.lifeMax);
        
        // 1. Quầng sáng sét (Outer Glow)
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.points[0].x - camera.x, this.points[0].y - camera.y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x - camera.x, this.points[i].y - camera.y);
        }
        ctx.stroke();
        
        // 2. Tia sét lõi trắng chính (Solid Core)
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x - camera.x, this.points[0].y - camera.y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x - camera.x, this.points[i].y - camera.y);
        }
        ctx.stroke();
        
        ctx.restore();
    }
}
