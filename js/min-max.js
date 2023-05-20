class MinMax {
    static minX = Number.MAX_VALUE;
    static minY = Number.MAX_VALUE;
    static maxX = -Number.MAX_VALUE;
    static maxY = -Number.MAX_VALUE;
    static savedMinX = Number.MAX_VALUE;
    static savedMinY = Number.MAX_VALUE;
    static savedMaxX = -Number.MAX_VALUE;
    static savedMaxY = -Number.MAX_VALUE;

    static save() {
        MinMax.savedMinX = MinMax.minX;
        MinMax.savedMinY = MinMax.minY;
        MinMax.savedMaxX = MinMax.maxX;
        MinMax.savedMaxY = MinMax.maxY;
    }

    static restore() {
        MinMax.minX = MinMax.savedMinX;
        MinMax.minY = MinMax.savedMinY;
        MinMax.maxX = MinMax.savedMaxX;
        MinMax.maxY = MinMax.savedMaxY;
    }

    static init() {
        MinMax.minX = Number.MAX_VALUE;
        MinMax.minY = Number.MAX_VALUE;
        MinMax.maxX = -Number.MAX_VALUE;
        MinMax.maxY = -Number.MAX_VALUE;
    }

    static add(p) {
        if(p.x < MinMax.minX) { MinMax.minX = p.x; }
        if(p.y < MinMax.minY) { MinMax.minY = p.y; }
        if(p.x > MinMax.maxX) { MinMax.maxX = p.x; }
        if(p.y > MinMax.maxY) { MinMax.maxY = p.y; }
    }

    static get() {
        return { 
            minX: MinMax.minX,
            minY: MinMax.minY,
            maxX: MinMax.maxX,
            maxY: MinMax.maxY,
        };
    }

    static getRect() {
        return { 
            x: MinMax.minX,
            y: MinMax.minY,
            width: MinMax.maxX - MinMax.minX,
            height: MinMax.maxY - MinMax.minY,
        };
    }
}