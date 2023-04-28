class Util {
    /**
     * 2点間の距離を求める
     * @param {object} [pos0] - 線分の始点
     * @param {object} [pos1] - 線分の終点
     * @return {number} 2点間の距離を返す
     */
    static distance(pos0, pos1) {
       return Math.sqrt(Math.pow(pos0.x - pos1.x, 2) + Math.pow(pos0.y - pos1.y, 2));
    }

    /**
	 * 線形補間する
	 * @param {object} [pos0] - 線分の始点
	 * @param {object} [pos1] - 線分の終点
	 * @param {number} [t] - 補間パラメータ
	 * @return {object} 線形補間された座標を返す
	 */
	static linearInterpolation = (pos0, pos1, t) => {
		return { 
			x: (1 - t) * pos0.x + t * pos1.x,
			y: (1 - t) * pos0.y + t * pos1.y
		};
	}

    /**
	 * canvasを作成する
	 * @param {number} [width] - 幅
	 * @param {number} [width] - 高さ
	 * @return {object} canvasを返す
	 */
	static createCanvas(width, height) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

    static clearCanvas = (ctx) => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);	// クリア
	}

    /**
	 * 線分を描画する
	 * @param {object} [pos0] - 線分の始点座標
	 * @param {object} [pos1] - 線分の終点座標
	 */
	static drawLine(ctx, pos0, pos1) {
		ctx.beginPath();
		ctx.moveTo(pos0.x, pos0.y);
		ctx.lineTo(pos1.x, pos1.y);
		ctx.stroke();
	}	

    /**
	 * 点配列を拡大する
	 * @param {array} [curves] - 点群
	 * @param {number} [rate] - 拡大率
	 * @return {array} 拡大された点群
	 */
	static zoomCurves(curves, rate) {
		return curves.map(array => 
			array.map(inarray => 
				inarray.map(pos => {
					return { x: pos.x * rate, y: pos.y * rate };
				})
			)			
		);
	}

    static isPosInMinMax = (pos, min, max) => {
		if(min.x <= pos.x && pos.x <= max.x
		&& min.y <= pos.y && pos.y <= max.y) {
			return true;
		} else {
			return false;
		}
	}

    // mean 平均
	// sd 標準僅差
	static normalDistribution = (mean, sd) => {
	    var x = Math.random();
	    var y = Math.random();

	    var z1 = Math.sqrt(-2*Math.log(x))*Math.cos(2 * Math.PI * y);
	    var z2 = Math.sqrt(-2*Math.log(x))*Math.sin(2 * Math.PI * y);

	    return {
	    	z1: mean + z1 * sd,
	    	z2: mean + z2 * sd
	    };
	}
}
	

	

	

	

	

	

	

	