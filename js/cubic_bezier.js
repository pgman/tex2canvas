/**
 * 3次ベジェ曲線の静的クラス
 */
class CubicBezier {
    /**
	 * 3次ベジェ曲線描画
	 * @param {CanvasRenderingContext2D} [ctx] - 2Dレンダリングコンテキスト
	 * @param {array} [pts] - 制御点
	 * @param {number} [t = 1] - 補間パラメータ
	 */
	static draw(ctx, pts, t = 1) {
		let tpts;	// 3次ベジェ曲線の制御点
		
		if(pts.length !== 4) { return; }	// 3次ベジェ曲線は制御点が4つ必要

		if(t === 1) {// t が 1 -> 制御点をそのまま使用する
			tpts = pts;
		} else {// t が 1以外 -> 描画用に制御点を取得する
			tpts = _tranform(pts, t);
		}
		
		// 3次ベジェ曲線を描画
		ctx.beginPath();
		ctx.moveTo(tpts[0].x, tpts[0].y);
		ctx.bezierCurveTo(tpts[1].x, tpts[1].y, tpts[2].x, tpts[2].y, tpts[3].x, tpts[3].y);
		ctx.stroke();	
	}

    /**
	 * 3次ベジェ曲線をパラメータで変形させる
	 * @param {array} [pts] - 制御点
	 * @param {number} [t = 1] - 補間パラメータ
	 * @return {array} パラメータまでの制御点
	 */
	static tranform = (pts, t = 1) => {
		if(t < 0) { t = 0; }
		else if(t > 1) { t = 1; }

		const ret = [],
			pts01 = Util.linearInterpolation(pts[0], pts[1], t),
			pts12 = Util.linearInterpolation(pts[1], pts[2], t),
			pts01_12 = Util.linearInterpolation(pts01, pts12, t);

		ret[0] = pts[0];
		ret[1] = pts01;
		ret[2] = pts01_12;		
		ret[3] = _interpolate(pts, t);

		return ret;
	}

    // 指定長で3次ベジェ曲線を分割する
	// 長さははベジェ曲線を線分に分割する事により求める(デフォルトは100分割)
	static divideByLength(pts, length, divided = 100) {
		// エラーチェック
		if(pts.length !== 4) { return null; }

		// 分割する
		const cpts = [];
		for(let t = 0.0; t <= 1.0; t += 1 / divided) {
			cpts.push(_interpolate(pts, t));
		}		

		// 分割された線分を足していき、指定長で分割する
		const divpts = [];
		const ts = []; 
		let lastPushed = -1;
		let curlen = 0;
		cpts.forEach((pt, i) => {
			if(i === 0) { return; }
			
			// 線分長を求める
			const len = Util.distance(cpts[i - 1], cpts[i]);
			curlen += len;

			// 線分の長さが指定長さ以上
			if(curlen >= length) {
				ts.push((i + 1) * 1 / divided);
				lastPushed = i;
				curlen = curlen - length;
			}
		});

		if(lastPushed === -1) {
			ts.push(1.0);
		} else if(lastPushed !== cpts.length - 1) {
			ts.push(1.0);
		}

		return ts;
	}

    // 保管する
	static interpolate(pts, t) {
		let cbs;

		// エラーチェック
		if(pts.length !== 4) { return null; }	// 3次ベジェ曲線は制御点が4つ必要
		if(t < 0) { t = 0; }
		else if(1 < t) { t = 1; }

		// 保管する -> 制御点が1つになるまで制御点の線形補間を繰り返し、制御点を減らす
		cbs = pts;
		while(cbs.length > 1) {
			let divs = [];
			for(let i = 0; i < cbs.length - 1; i += 1) {
				divs.push(Util.linearInterpolation(cbs[i], cbs[i + 1], t));
			}
			cbs = divs;
		}	
		return cbs[0];	
	}
}

	

	

	

	