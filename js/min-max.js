class MinMax {
    static minX = Number.MAX_VALUE;
    static minY = Number.MAX_VALUE;
    static maxX = -Number.MAX_VALUE;
    static maxY = -Number.MAX_VALUE;

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
}