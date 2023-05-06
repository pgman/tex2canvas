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
     * 円を塗りつぶす
     * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
     * @param {{ x: number, y: number, }} pos 円の中心座標 
     * @param {number} radius 円の半径
     * @returns {void} なし 
     */
    static fillCircle(ctx, pos, radius) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2, false);
        ctx.fill();
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

    /**
     * 点が矩形内に存在するか
     * @param {{ x: number, y: number, }} pos 点 
     * @param {{ x: number, y: number, width: number, height: number}} rect 矩形 
     * @returns {boolean} 点が矩形内に存在するか
     */
    static isPosInRect = (pos, rect) => {
		if(rect.x <= pos.x && pos.x <= rect.x + rect.width
		&& rect.y <= pos.y && pos.y <= rect.y + rect.height) {
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

	/**
     * 文字の UTF-16 コードを16進数で取得
     * ex. '山' -> '05c71'
     * @param {string} str 文字列(長さは1であること) 
     * @returns {string} 16進数の文字列(長さは5) 
     */
	static getCodeByChar(str) {
		let ret;
		if(str.length !== 1) { return ''; }
		ret = str.charCodeAt(0).toString(16);	// 16進数で取得
		ret = Utility.zeroPadding(ret, 5);	// 0 padding する
		return ret;
	}

    // debug 中
    static getCharByCode(code) {    }

	/**
     * 0 paddingする
     * @param {number} num 数値 
     * @param {number} length 長さ
     * @returns 0 padding された文字列
     */
	static zeroPadding(num, length) {
    	return ('0000000000' + num).slice(-length);
	}

    /**
     * src の矩形のアスペクト比に合わせて縦を基準にdstの矩形を調整する
     * @param {{ x: number, y: number, width: number, height: number, }} src 基準となる矩形
     * @param {{ x: number, y: number, width: number, height: number, }} dst srcにフィットさせる矩形
     * @returns {{ x: number, y: number, width: number, height: number, }} フィットした矩形
     */
    static fitVerticalRect(src, dst) {
        // src の矩形のアスペクト比に合わせて縦を基準にdstの矩形を調整する
        // なので、dst.yとdst.heightは変わらない
        const dstCenterX = dst.x + dst.width / 2;
        const srcAspect = src.width / src.height;
        const dstWidth = dst.height * srcAspect;
        return {
            x: dstCenterX - dstWidth / 2,
            y: dst.y,
            width: dstWidth,
            height: dst.height,
        };
    }

    /**
     * src の矩形のアスペクト比に合わせて横を基準にdstの矩形を調整する
     * @param {{ x: number, y: number, width: number, height: number, }} src 基準となる矩形
     * @param {{ x: number, y: number, width: number, height: number, }} dst srcにフィットさせる矩形
     * @returns {{ x: number, y: number, width: number, height: number, }} フィットした矩形
     */
    static fitHorizontalRect(src, dst) {
        // src の矩形のアスペクト比に合わせて横を基準にdstの矩形を調整する
        // なので、dst.xとdst.widthは変わらない
        const dstCenterY = dst.y + dst.height / 2;
        const srcAspect = src.width / src.height;
        const dstHeight = dst.width / srcAspect;
        return {
            x: dst.x,
            y: dstCenterY - dstHeight / 2,
            width: dst.width,
            height: dstHeight,
        };
    }

    /**
     * load image
     * @param {String} dataUrl url
     * @returns {Promise<Image>} 画像
     */
    static loadImage(dataUrl) {
	    return new Promise(function(resolve, reject) {
			const image = new Image();
			image.onload = () => { resolve(image); };
			image.src = dataUrl;
	    });
	}
}
	

	

	

	

	

	

	

	