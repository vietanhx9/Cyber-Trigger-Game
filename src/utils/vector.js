export class Vector {
    static dist(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }
    
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
}
