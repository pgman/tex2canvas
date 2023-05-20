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
        const points = this.points;
        if(move) {
            ctx.moveTo(points[0].x, points[0].y);
        }
        if(this.type === 'ls') {// line segment
            ctx.lineTo(points[1].x, points[1].y);
        } else if(this.type === 'qb') {// quadratic bezier curve
            ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
        } else if(this.type === 'cb') {// cubic bezier curve
            ctx.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
        }        
    }

    pathDivided(ctx, move = false, brushDiameter) {
        const points = this.points;

        const divideCount = 3;
        for(let i = 0; i < divideCount; i += 1) {
            const t = i / divideCount;
            const tNext = (i + 1) / divideCount;
            const pos = this.interpolate(t);
            const posNext = this.interpolate(tNext);
            draw(pos.x, pos.y, posNext.x, posNext.y, brushDiameter);
        }

        function draw(xLast, yLast, x, y, brushDiameter) {
            ctx.strokeStyle = 'rgba(255,255,255,'+(0.2+Math.random()*0.2)+')';
            ctx.beginPath();
            ctx.moveTo(xLast, yLast);		
            ctx.lineTo(x, y);
            ctx.stroke();
              
            // Chalk Effect
            var length = Math.round(Math.sqrt(Math.pow(x-xLast,2)+Math.pow(y-yLast,2))/(5/brushDiameter));
            var xUnit = (x-xLast)/length;
            var yUnit = (y-yLast)/length;
            for(var i=0; i<length; i++ ){
                var xCurrent = xLast+(i*xUnit);	
                var yCurrent = yLast+(i*yUnit);
                var xRandom = xCurrent+(Math.random()-0.5)*brushDiameter*1.2;			
                var yRandom = yCurrent+(Math.random()-0.5)*brushDiameter*1.2;
                ctx.clearRect( xRandom, yRandom, Math.random()*2+2, Math.random()+1);
            }
        }
    }

    /**
     * 矩形を取得する
     * @param {number} divLength パラメータの分割数
     * @returns {{ x: number, y: number, width: number, height: number, }} 
     */
    rect(divLength = 100) {
        const points = this.points;
        if(this.type === 'ls') {// line segment
            return {
                x: Math.min(points[0].x, points[1].x), 
                y: Math.min(points[0].y, points[1].y),
                width: Math.abs(points[0].x - points[1].x),
                height: Math.abs(points[0].y - points[1].y),
            };
        } else if(this.type === 'qb' || this.type === 'cb') {// quadratic bezier curve or cubic bezier curve
            // MinMaxをここでは読んではいけない
            MinMax.save();
            MinMax.init();
            for(let i = 0; i <= divLength; i += 1) {
                const t = i / divLength;
                const p = this.interpolate(t);
                MinMax.add(p);
            }
            const rect = MinMax.getRect();
            MinMax.restore();
            return rect;
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