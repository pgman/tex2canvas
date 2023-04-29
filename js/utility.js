class Utility {
    /**
     * 2点間の距離を求める
     * @param {{ x:number, y: number }} pos0 線分の始点
     * @param {{ x:number, y: number }} pos1 線分の終点
     * @return {number} 2点間の距離を返す
     */
    static distance(pos0, pos1) {
       return Math.sqrt(Math.pow(pos0.x - pos1.x, 2) + Math.pow(pos0.y - pos1.y, 2));
    }

    /**
	 * 線形補間する
	 * @param {{ x:number, y: number }} pos0 線分の始点
	 * @param {{ x:number, y: number }} pos1 線分の終点
	 * @param {number} t 補間パラメータ
	 * @return {{ x:number, y: number }} 線形補間された座標を返す
	 */
	static linearInterpolation(pos0, pos1, t) {
		return { 
			x: (1 - t) * pos0.x + t * pos1.x,
			y: (1 - t) * pos0.y + t * pos1.y
		};
	}

	/**
	 * 数値かどうか
	 * @param {string} s 文字列
	 * @returns {boolean} 0123456789-.のいづれかか？
	 */
	static isNumeric(s) {
		return '0123456789+-.'.indexOf(s) >= 0;
	}

    /**
	 * canvasを作成する
	 * @param {number} width 幅
	 * @param {number} height 高さ
	 * @return {Object} canvas
	 */
	static createCanvas(width, height) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	/**
	 * Canvasをクリアする
	 * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
	 * @returns {void} なし
	 */
    static clearCanvas = ctx => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);	
	}

	/**
	 * 要素作成
	 * @param {string} tagName タグの名称 
	 * @param {string} innerHtml 要素のinnerHTML 
	 * @param {string} styles 要素のスタイル 
	 * @returns {Object} 要素
	 */
	static createElement(tagName, innerHtml, styles) {
		const elm = document.createElement(tagName);
		elm.innerHTML = innerHtml;
		Object.keys(styles).forEach(prop => { elm.style[prop] = styles[prop]; });
		return elm;
	}

    /**
	 * 線分を描画する
	 * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
	 * @param {{ x:number, y: number }} pos0 線分の始点座標
	 * @param {{ x:number, y: number }} pos1 線分の終点座標
	 * @return {void} なし
	 */
	static drawLine(ctx, pos0, pos1) {
		ctx.beginPath();
		ctx.moveTo(pos0.x, pos0.y);
		ctx.lineTo(pos1.x, pos1.y);
		ctx.stroke();
	}	

    /**
	 * 点配列を拡大する
	 * @param {Array<T>} curves 点群
	 * @param {number} rate 拡大率
	 * @return {Array<T>} 拡大された点群
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
	

	

	

	

	

	

	

	