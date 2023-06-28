// 没になった関数をここにおく
// 画像を曲げる関数

/**
 * ベジェ曲線に沿って画像を描画する - 2023/06/23
 * ※本ロジックの欠点：
 * ・変換前画像から変換後画像への写像を実装しているところがよくない
 * ・fillRectというAPIを使用しているのがよくない
 * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト
 * @param {Image} img 画像
 * @param {Araay<{ x: number, y: number}>} 制御点の配列
 * @param {number} startLineWidth 始点の線の幅
 * @param {number} endLineWidth 終点の線の幅
 * @returns {void} なし
 */
function bezierImageOld(ctx, img, points, startLineWidth, endLineWidth, startXRate, endXRate) {
    // 画像のイメージデータを取得する
    const imageData = GraphicsApi.getImageDataByImage(img);

    // get whole length
    const wholeLength = CubicBezierCurve.length(points, 1000);
    
    ctx.reset();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const data = [];
    let curLength = 0;
    let preT = -1;
    let t = 0;
    while(true) {
        const pos = CubicBezierCurve.pointByT(points, t);
        if(preT >= 0) {
            const prePos = CubicBezierCurve.pointByT(points, preT);
            const dist = Vector.dist(pos, prePos);
            curLength += dist;
        }

        // tが微小変化(1/1000)したときの長さを求める
        const diffT = t + 1 / 1000;
        const diffPos = CubicBezierCurve.pointByT(points, diffT);
        const diff = Vector.dist(pos, diffPos);

        // for debug
        data.push({
            t,
            diff,
            length: curLength,
            first: Vector.length(CubicBezierCurve.firstDerivativeByT(points, t)),
            second: Vector.length(CubicBezierCurve.secondDerivativeByT(points, t)),
            curvature: CubicBezierCurve.curvatureByT(points, t),
        });

        // get first derivative
        let vector = CubicBezierCurve.firstDerivativeByT(points, t);
        // unit vectorize
        vector = Vector.unit(vector);
        // rotate -90 degree
        const nrm = Vector.nrm(vector);
        // nrm length
        const curLineWidth = startLineWidth + (endLineWidth - startLineWidth) * curLength / wholeLength;
        // get shifted point
        const top = Vector.add(pos, Vector.scale(nrm, curLineWidth / 2));
        const bottom = Vector.add(pos, Vector.scale(nrm, -curLineWidth / 2));
        const xRate = curLength / wholeLength;
        
        ctx.save();    
        const yDiv = Math.round(curLineWidth * 4);
        for(let j = 0; j <= yDiv; j += 1) {
            const yRate = j / yDiv;
            const internal = Utility.linearInterpolation(top, bottom, yRate); 
            // get internal point color            
            const color = Graphics.getImageColor(imageData, xRate, yRate, startXRate, endXRate);
            // 本当は画素を直接描画したいがそうすると、きれいにはならない。
            ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
            ctx.fillRect(internal.x, internal.y, 0.5, 0.5);
        }
        ctx.restore();

        // finish ?
        if(t === 1) { break; }
        // update t
        preT = t;
        let radius = 1 / Math.abs(CubicBezierCurve.curvatureByT(points, t));
        const maxRadius = 1, minRadius = 0.2;
        radius = Scalar.limit(radius, minRadius, maxRadius);
        t += radius * 0.25 / diff / 1000;
        if(t > 1) { t = 1; }
    }
    return data;
}

/**
 * ベジェ曲線に沿って画像を描画する- 2023/06/28
 * ※本ロジックの欠点：
 * ・変換前画像から変換後画像への写像を実装しているところがよくない
 * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト
 * @param {Image} img 画像
 * @param {Araay<{ x: number, y: number}>} 制御点の配列
 * @param {number} startLineWidth 始点の線の幅
 * @param {number} endLineWidth 終点の線の幅
 * @returns {void} なし
 */
function bezierImageOld2(ctx, img, points, startLineWidth, endLineWidth, startXRate, endXRate) {
    // 画像のイメージデータを取得する
    const imageData = GraphicsApi.getImageDataByImage(img);

    // ベクトルを求める
    const vectors = CubicBezierCurve.getVectors(points);

    // get length of cubic bezie curve
    const wholeLength = CubicBezierCurve.length(points, 1000); 

    let curLength = 0;
    let preT = -1;
    let t = 0;
    const ret = [];

    while(true) {
        const data = [];
        const pos = CubicBezierCurve.pointByT(points, t);
        let dist = 0;
        if(preT >= 0) {
            const prePos = CubicBezierCurve.pointByT(points, preT);
            dist = Vector.dist(pos, prePos);
        }
        curLength += dist;

        // tが微小変化(1/1000)したときの長さを求める
        const diffT = t + 1 / 1000;
        const diffPos = CubicBezierCurve.pointByT(points, diffT);
        const diff = Vector.dist(pos, diffPos);

        // 曲率半径を求める
        const realRadius = 1 / Math.abs(CubicBezierCurve.curvatureByT(points, t));

        // get first derivative
        let vector = CubicBezierCurve.firstDerivativeByT(points, t);
        // unit vectorize
        vector = Vector.unit(vector);
        // rotate -90 degree
        const nrm = Vector.nrm(vector);
        // nrm length
        const curLineWidth = startLineWidth + (endLineWidth - startLineWidth) * curLength / wholeLength;
        // get shifted point
        const top = Vector.add(pos, Vector.scale(nrm, curLineWidth / 2));
        const bottom = Vector.add(pos, Vector.scale(nrm, -curLineWidth / 2));
        const xRate = curLength / wholeLength;
        // top と bottom を結ぶ直線が描画される画素を求める
        const indexes = Graphics.drawLine(top, bottom, { width: ctx.canvas.width, height: ctx.canvas.height, });
                
        // create data
        data.indexes = indexes.map((elm, i) => {
            let preColor;
            if(i === 0) {
                preColor = null;
            } else {
                const pre = indexes[i - 1];
                preColor = Graphics.getImageColor(imageData, xRate, pre.rate, startXRate, endXRate);
                preColor = JSON.parse(JSON.stringify(preColor));
            }
            let nextColor;
            if(i === indexes.length - 1) {
                nextColor = null;
            } else {
                const next = indexes[i + 1];
                nextColor = Graphics.getImageColor(imageData, xRate, next.rate, startXRate, endXRate);
                nextColor = JSON.parse(JSON.stringify(nextColor));
            }
            let color = Graphics.getImageColor(imageData, xRate, elm.rate, startXRate, endXRate);
            color = JSON.parse(JSON.stringify(color));
            color.i = elm.index;
            if(color.a !== 0 && ((preColor && preColor.a === 0) || (nextColor && nextColor.a === 0))) {
                color.a = Math.round(color.a * 0.1);
            }
            return color;
        });
        data.t = t;
        data.diff = diff;
        data.dist = dist;
        data.curLength = curLength;
        data.realRadius = realRadius;
        ret.push(data);
        
        // finish ?
        if(t === 1) { break; }

        // save previous t
        preT = t;
        // 曲率半径を補正する
        const maxRadius = 1, minRadius = 0.2;
        const limitedRadius = Scalar.limit(realRadius, minRadius, maxRadius);
        // update t
        t += limitedRadius * 0.25 / diff / 1000;
        if(t > 1) { t = 1; }
    }

    return ret;
}

