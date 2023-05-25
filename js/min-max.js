class MinMax {
    static minX = Number.MAX_VALUE;
    static minY = Number.MAX_VALUE;
    static maxX = -Number.MAX_VALUE;
    static maxY = -Number.MAX_VALUE;
    static stack = []; // for save / restore

    static save() {
        this.stack.push({
            minX: MinMax.minX,
            minY: MinMax.minY,
            maxX: MinMax.maxX,
            maxY: MinMax.maxY,            
        });
    }

    static restore() {
        if(this.stack.length <= 0) {
            throw 'stack is empty.';
        }
        const popped = this.stack.pop();
        MinMax.minX = popped.minX;
        MinMax.minY = popped.minY;
        MinMax.maxX = popped.maxX;
        MinMax.maxY = popped.maxY;
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