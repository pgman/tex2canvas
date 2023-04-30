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
     * @param {CanvasRenderingContext2D} ctx 
     * @param {boolean} move moveToメソッドを呼ぶか 
     */
    path(ctx, move = false) {
        if(move) {
            ctx.moveTo(this.points[0].x, this.points[0].y);
        }
        if(this.type === 'ls') {// line segment
            ctx.lineTo(this.points[1].x, this.points[1].y);
        } else if(this.type === 'qb') {// quadratic bezier curve
            ctx.quadraticCurveTo(this.points[1].x, this.points[1].y, this.points[2].x, this.points[2].y);
        } else if(this.type === 'cb') {// cubic bezier curve
            ctx.bezierCurveTo(this.points[1].x, this.points[1].y, this.points[2].x, this.points[2].y, this.points[3].x, this.points[3].y);
        }        
    }

    /**
     * 矩矩形を取得する
     * @param {number} divLength パラメータの分割数
     * @returns {{ x: number, y: number, width: number, height: number, }} 
     */
    rect(divLength = 1000) {
        const points = this.points;
        if(this.type === 'ls') {// line segment
            return {
                x: Math.min(points[0].x, points[1].x), 
                y: Math.min(points[0].y, points[1].y),
                width: Math.abs(points[0].x - points[1].x),
                height: Math.abs(points[0].y - points[1].y),
            };
        } else if(this.type === 'qb' || this.type === 'cb') {// quadratic bezier curve or cubic bezier curve
            let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE,
                maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;
            for(let i = 0; i <= divLength; i += 1) {
                const t = i / divLength;
                const p = this.interpolate(t);
                if(p.x < minX) { minX = p.x; }
                if(p.y < minY) { minY = p.y; }
                if(p.x > maxX) { maxX = p.x; }
                if(p.y > maxY) { maxY = p.y; }
            }
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }    
    }

    /**
     * tの値に対応する点を求める
     * @param {number} t パラメータ(0 <= t <= 1)
     * @returns {{ x: number, y: number, }} tの値に対応した座標
     */
	interpolate(t) {
		// エラーチェック
        if(this.type === 'ls') {// line segment
            throw 'no bezier curve.'
        }
		if(t < 0) { t = 0; }
		else if(1 < t) { t = 1; }

		// 保管する -> 制御点が1つになるまで制御点の線形補間を繰り返し、制御点を減らす
		let cbs = this.points;
		while(cbs.length > 1) {
			let divs = [];
			for(let i = 0; i < cbs.length - 1; i += 1) {
				divs.push(Utility.linearInterpolation(cbs[i], cbs[i + 1], t));
			}
			cbs = divs;
		}	
		return cbs[0];	
	}
}