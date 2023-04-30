class Curve {
    /**
     * コンストラクタ
     * @param {Array<{x:number, y:number}>} points 点群
     */
    constructor(points) {
        this.points = JSON.parse(JSON.stringify(points));
    }

    /**
     * getter
     */
    get type() {
        if(this.points.length === 2) {// line segment
            return 'ls';
        } else if(this.points.length === 3) {// quadratic bezier curve
            return 'qb';
        } else if(this.points.length === 4) {// cubic bezier curve
            return 'cb';
        } else {
            throw 'invalid points length';
        }
    }

    /**
     * Canvasにpathを作成する
     * @param {*} ctx 
     * @param {boolean} move moveToメソッドを呼ぶか 
     */
    path(ctx, move = false) {
        if(move) {
            ctx.moveTo(this.points[0].x, this.points[0].y);
        }
        if(this.type === 'ls') {
            ctx.lineTo(this.points[1].x, this.points[1].y);
        } else if(this.type === 'qb') {
            ctx.quadraticCurveTo(this.points[1].x, this.points[1].y, this.points[2].x, this.points[2].y);
        } else if(this.type === 'cb') {
            ctx.bezierCurveTo(this.points[1].x, this.points[1].y, this.points[2].x, this.points[2].y, this.points[3].x, this.points[3].y);
        }        
    }

    rect() {

    }
}