// 没になった関数をここにおく
// 画像を曲げる関数

/**
 * ベジェ曲線に沿って画像を描画する - 2023/06/23
 * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト
 * @param {Image} img 画像
 * @param {Araay<{ x: number, y: number}>} 制御点の配列
 * @param {number} startLineWidth 始点の線の幅
 * @param {number} endLineWidth 終点の線の幅
 * @returns {void} なし
 */
function bezierImage(ctx, img, points, startLineWidth, endLineWidth, startXRate, endXRate) {
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
 * ベジェ曲線に沿って画像を描画する - 2023/06/20 ごろ本ソースへ移籍
 * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト
 * @param {Image} img 画像
 * @param {Araay<{ x: number, y: number}>} 制御点の配列
 * @param {number} startLineWidth 始点の線の幅
 * @param {number} endLineWidth 終点の線の幅
 * @returns {void} なし
 */
 function bezierImage3(ctx, img, points, startLineWidth, endLineWidth, useFillRect) {

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;
    const imgCtx = imgCanvas.getContext('2d', { willReadFrequently: true });
    imgCtx.drawImage(img, 0, 0);
    const imgImageData = imgCtx.getImageData(0, 0, imgCtx.canvas.width, imgCtx.canvas.height);

    ctx.reset();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // get imagedata of ctx
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    // get vectors
    const vectors = CubicBezierCurve.getVectors(points);

    // 全体の長さを求める
    const [wholeLength, steps] = CubicBezierCurve.wholeLength(points, 1000);
    const div = Math.round(wholeLength / 4); // * 4 is too late.

    ctx.save();
    let curLength = 0;
    for(let i = 0; i < div; i += 1) {
        const t = i / div;        
        const nextT = (i + 1) / div;
        const pos = CubicBezierCurve.pointByT(points, t);
        const nextPos = CubicBezierCurve.pointByT(points, nextT);
        if(i > 0) {
            const preT = (i - 1) / div;
            const prePos = CubicBezierCurve.pointByT(points, preT);
            const dist = Vector.dist(pos, prePos);
            curLength += dist;
        }
        const curDist = Vector.dist(pos, nextPos);

        // 現在の点から法線方向に現在の線分の幅の半分動かした点を取得する
        const [top, bottom] = getShiftedPoints(pos, t, vectors, curLength / wholeLength, startLineWidth, endLineWidth);

        // 次の点から法線方向に現在の線分の幅の半分動かした点を取得する
        const [nextTop, nextBottom] = getShiftedPoints(nextPos, nextT, vectors, (curLength + curDist) / wholeLength, startLineWidth, endLineWidth);

        // パスを塗りつぶすことにより、四角形内のインデックスを取得する
        const indexes = getFilledIndexesBySquarePath([ top, nextTop, nextBottom, bottom ], 
            { width: ctx.canvas.width, height: ctx.canvas.height, });

        indexes.forEach(index => {
            // index to x, y
            const x = index % ctx.canvas.width;
            const y = Math.floor(index / ctx.canvas.width);
            // get rate of x
            const nearestX = nearestRate2LineSegments([top, nextTop, nextBottom, bottom], { x, y, }, 1e-5);
            const xRate = (curLength + curDist * nearestX.rate) / wholeLength;
            // get rate of y
            const nearestY = nearestRateLineSegment([nearestX.point, nearestX.nextPoint], { x, y, }, 1e-5);
            const yRate = nearestY.rate;
            // get image color by xRate and yRate
            const color = getImageColor(imgImageData, xRate, yRate);
            if(!useFillRect) {
                if(color.a !== 0) {
                    data[index * 4 + 0] = color.r;
                    data[index * 4 + 1] = color.g;
                    data[index * 4 + 2] = color.b;
                    data[index * 4 + 3] = color.a;
                }
            } else {
                ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
                ctx.fillRect(x, y, 1, 1);
            }    
        });
        if(!useFillRect) {
            ctx.putImageData(imageData, 0, 0);
        }
    }
    ctx.restore();

    /**
     * 線分上のパラメータを求める
     * @param {Array<{ x: number, y: number, }>} points 0-1: 線分#0
     * @param {{ x: number, y: number, }} target 対象となる点
     * @param {number} tol 距離の2乗を0とみなす許容範囲
     * @returns {Object} 対象となる点の近くを通る直線を定める情報
     */ 
    function nearestRateLineSegment(points, target, tol = 1e-6) {
        let start = points[0];
        let end = points[1];
        let startRate = 0;
        let endRate = 1;

        let loopCnt = 0;
        const maxLoopCnt = 10;
        let nearest = null;
        while(true) {
            if(++loopCnt >= maxLoopCnt) { 
                //console.log('max loop count.');
                break; 
            }
            const distances = [];
            const divides = 10;

            for(let i = 0; i <= divides; i += 1) {
                const rate = i / divides;
                const point = Utility.linearInterpolation(start, end, rate);
                const dist2 = Vector.dist2(point, target);
                const curRate = startRate + (endRate - startRate) * rate;
                distances.push({ index: i, rate: curRate, dist2, point, });
            }
            // sort by distance squared 
            distances.sort((a, b) => a.dist2 - b.dist2);
            nearest = distances[0];
            if(nearest.dist2 < tol) {// found.
                break;
            }

            // update start, end, startRate and endRate            
            const index = distances[0].index;
            const oldStartRate = startRate;
            const oldRateVec = endRate - startRate;
            if(index === 0) {
                start = points[0];
                end = Utility.linearInterpolation(start, end, 1 / divides);
                startRate = oldStartRate;
                endRate = oldStartRate + oldRateVec * (1 / divides);
            } else if(index === divides) {
                start = Utility.linearInterpolation(start, end, (divides - 1) / divides);
                end = points[1];
                startRate = oldStartRate + oldRateVec * (divides - 1) / divides;
                endRate = oldStartRate + oldRateVec * 1;
            } else {
                start = Utility.linearInterpolation(start, end, (index - 1) / divides);
                end = Utility.linearInterpolation(start, end, (index + 1) / divides);
                startRate = oldStartRate + oldRateVec * (index - 1) / divides;
                endRate = oldStartRate + oldRateVec * (index + 1) / divides;
            }
        }
        return nearest;
    }

    /**
     * 2線分上のパラメータを求める
     * @param {Array<{ x: number, y: number, }>} points 0-1: 線分#0, 3-2: 線分#1
     * @param {{ x: number, y: number, }} target 対象となる点
     * @param {number} tol 距離の2乗を0とみなす許容範囲
     * @returns {Object} 対象となる点の近くを通る直線を定める情報
     */ 
    function nearestRate2LineSegments(points, target, tol = 1e-6) {
        let start = points[0];
        let end = points[1];
        let nextStart = points[3];
        let nextEnd = points[2];
        let startRate = 0;
        let endRate = 1;

        let loopCnt = 0;
        const maxLoopCnt = 10;
        let nearest = null;
        while(true) {
            if(++loopCnt >= maxLoopCnt) { 
                //console.log('max loop count.');
                break; 
            }
            const distances = [];
            const divides = 10;
            for(let i = 0; i <= divides; i += 1) {
                const rate = i / divides;
                const point = Utility.linearInterpolation(start, end, rate);
                const nextPoint = Utility.linearInterpolation(nextStart, nextEnd, rate);
                const dist2 = Vector.dist2LinePoint(point, nextPoint, target);
                const curRate = startRate + (endRate - startRate) * rate;
                distances.push({ index: i, rate: curRate, dist2, point, nextPoint });
            }
            // sort by distance squared 
            distances.sort((a, b) => a.dist2 - b.dist2);
            nearest = distances[0];
            if(nearest.dist2 < tol) {// found.
                break;
            }
            // update start, end, nextStart, nextEnd, startRate and endRate            
            const index = distances[0].index;
            const oldStartRate = startRate;
            const oldRateVec = endRate - startRate;
            if(index === 0) {
                start = points[0];
                end = Utility.linearInterpolation(start, end, 1 / divides);
                nextStart = points[3];
                nextEnd = Utility.linearInterpolation(nextStart, nextEnd, 1 / divides);
                startRate = oldStartRate;
                endRate = oldStartRate + oldRateVec * (1 / divides);
            } else if(index === divides) {
                start = Utility.linearInterpolation(start, end, (divides - 1) / divides);
                end = points[1];
                nextStart = Utility.linearInterpolation(nextStart, nextEnd, (divides - 1) / divides);
                nextEnd = points[2];
                startRate = oldStartRate + oldRateVec * (divides - 1) / divides;
                endRate = oldStartRate + oldRateVec * 1;
            } else {
                start = Utility.linearInterpolation(start, end, (index - 1) / divides);
                end = Utility.linearInterpolation(start, end, (index + 1) / divides);
                nextStart = Utility.linearInterpolation(nextStart, nextEnd, (index - 1) / divides);
                nextEnd = Utility.linearInterpolation(nextStart, nextEnd, (index + 1) / divides);
                startRate = oldStartRate + oldRateVec * (index - 1) / divides;
                endRate = oldStartRate + oldRateVec * (index + 1) / divides;
            }
        }
        return nearest;
    }

    /**
     * 分割する
     * @param {{ x: number, y: number, }} start 始点
     * @param {{ x: number, y: number, }} end 終点
     * @param {number} divides 分割数
     * @returns {Array<{ x: number, y: number, }>} 点の配列
     */
    function createPointsByLineSegment(start, end, divides) {
        const points = [];
        for(let i = 0; i <= divides; i += 1) {
            const point = Utility.linearInterpolation(start, end, i / divides);
            points.push(point);
        }
        return points;
    }

    /**
     * パスを塗りつぶすことにより、四角形内のインデックスを取得する
     * @param {Array<{ x: number, y: number, }>} points 四角形の点(時計回り)
     * @param {{ width: number, height: number, }} canvasSize キャンバスのサイズ
     */
    function getFilledIndexesBySquarePath(points, size) {

        // get min/max of points
        MinMax.save();
        MinMax.init();
        points.forEach(p => { MinMax.regist(p); });
        MinMax.addMargin(2);
        MinMax.truncate();
        const mm = MinMax.getRect();
        MinMax.restore();

        // create canvas
        const canvas = Utility.createCanvas(mm.width, mm.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // transform points
        trans = points.map(p => Vector.subtract(p, mm)); 

        // fill square
        ctx.save();
        ctx.beginPath();
        trans.forEach((p, i) => { 
            if(i === 0) { ctx.moveTo(p.x, p.y); }
            else { ctx.lineTo(p.x, p.y); }
        });
        //ctx.closePath();
        ctx.fill();
        ctx.restore();

        // get index of filled pixel
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        let indexes = [];
        for(let i = 0; i < data.length / 4; i += 1) {
            if(data[i * 4 + 3] !== 0) {// filled
                indexes.push(i);
            }
        }

        // 元のcanvasの外側にある点は無視する
        indexes = indexes.filter(index => {
            let x = index % ctx.canvas.width;
            let y = Math.floor(index / ctx.canvas.width);
            x += mm.x;
            y += mm.y;
            if(x < 0 || x > size.width - 1 || y < 0 || y > size.height - 1) {
                return false;
            } else {
                return true;
            }
        });

        // indexsを変換する。元のcanvasの座標系でのインデックスに変換する
        indexes = indexes.map(index => {
            let x = index % ctx.canvas.width;
            let y = Math.floor(index / ctx.canvas.width);
            x += mm.x;
            y += mm.y;
            const newIndex = x + y * size.width;
            return newIndex;
        });

        return indexes;
    }

    function getShiftedPoints(pos, t, vectors, rate, startLineWidth, endLineWidth) {
        // 接線のベクトルを求める
        let vector = CubicBezierCurve.firstDerivativeByT(points, t);
        // 単位ベクトル化する
        vector = Vector.unit(vector);
        // -90度回す
        const nrm = Vector.nrm(vector);

        const lineWidth = startLineWidth + (endLineWidth - startLineWidth) * rate;
        const halfWidth = lineWidth * 0.5;
        const top = {
            x: pos.x + halfWidth * nrm.x,
            y: pos.y + halfWidth * nrm.y,
        };
        const bottom = {
            x: pos.x + halfWidth * (-nrm.x),
            y: pos.y + halfWidth * (-nrm.y),
        };
        return [ top, bottom, ];
    }
}

/**
 * ベジェ曲線に沿って画像を描画する
 * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト
 * @param {Image} img 画像
 * @param {Araay<{ x: number, y: number}>} 制御点の配列
 * @param {number} startLineWidth 始点の線の幅
 * @param {number} endLineWidth 終点の線の幅
 * @returns {void} なし
 */
function bezierImage3(ctx, img, points, startLineWidth, endLineWidth, useFillRect) {

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;
    const imgCtx = imgCanvas.getContext('2d', { willReadFrequently: true });
    imgCtx.drawImage(img, 0, 0);
    const imgImageData = imgCtx.getImageData(0, 0, imgCtx.canvas.width, imgCtx.canvas.height);

    ctx.reset();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // get imagedata of ctx
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    // get vectors
    const vectors = CubicBezierCurve.getVectors(points);

    // 全体の長さを求める
    const [wholeLength, steps] = CubicBezierCurve.wholeLength(points, 1000);
    const div = Math.round(wholeLength / 4); // * 4 is too late.

    ctx.save();
    let curLength = 0;
    for(let i = 0; i < div; i += 1) {
        const t = i / div;        
        const nextT = (i + 1) / div;
        const pos = CubicBezierCurve.pointByT(points, t);
        const nextPos = CubicBezierCurve.pointByT(points, nextT);
        if(i > 0) {
            const preT = (i - 1) / div;
            const prePos = CubicBezierCurve.pointByT(points, preT);
            const dist = Vector.dist(pos, prePos);
            curLength += dist;
        }
        const curDist = Vector.dist(pos, nextPos);

        // 現在の点から法線方向に現在の線分の幅の半分動かした点を取得する
        const [top, bottom] = getShiftedPoints(pos, t, vectors, curLength / wholeLength, startLineWidth, endLineWidth);

        // 次の点から法線方向に現在の線分の幅の半分動かした点を取得する
        const [nextTop, nextBottom] = getShiftedPoints(nextPos, nextT, vectors, (curLength + curDist) / wholeLength, startLineWidth, endLineWidth);

        // パスを塗りつぶすことにより、四角形内のインデックスを取得する
        const indexes = getFilledIndexesBySquarePath([ top, nextTop, nextBottom, bottom ], 
            { width: ctx.canvas.width, height: ctx.canvas.height, });

        indexes.forEach(index => {
            // index to x, y
            const x = index % ctx.canvas.width;
            const y = Math.floor(index / ctx.canvas.width);
            // get rate of x
            const nearestX = nearestRate2LineSegments([top, nextTop, nextBottom, bottom], { x, y, }, 1e-5);
            const xRate = (curLength + curDist * nearestX.rate) / wholeLength;
            // get rate of y
            const nearestY = nearestRateLineSegment([nearestX.point, nearestX.nextPoint], { x, y, }, 1e-5);
            const yRate = nearestY.rate;
            // get image color by xRate and yRate
            const color = Graphics.getImageColor(imgImageData, xRate, yRate);
            if(!useFillRect) {
                if(color.a !== 0) {
                    data[index * 4 + 0] = color.r;
                    data[index * 4 + 1] = color.g;
                    data[index * 4 + 2] = color.b;
                    data[index * 4 + 3] = color.a;
                }
            } else {
                ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
                ctx.fillRect(x, y, 1, 1);
            }    
        });
        if(!useFillRect) {
            ctx.putImageData(imageData, 0, 0);
        }
    }
    ctx.restore();

    /**
     * 線分上のパラメータを求める
     * @param {Array<{ x: number, y: number, }>} points 0-1: 線分#0
     * @param {{ x: number, y: number, }} target 対象となる点
     * @param {number} tol 距離の2乗を0とみなす許容範囲
     * @returns {Object} 対象となる点の近くを通る直線を定める情報
     */ 
    function nearestRateLineSegment(points, target, tol = 1e-6) {
        let start = points[0];
        let end = points[1];
        let startRate = 0;
        let endRate = 1;

        let loopCnt = 0;
        const maxLoopCnt = 10;
        let nearest = null;
        while(true) {
            if(++loopCnt >= maxLoopCnt) { 
                //console.log('max loop count.');
                break; 
            }
            const distances = [];
            const divides = 10;

            for(let i = 0; i <= divides; i += 1) {
                const rate = i / divides;
                const point = Utility.linearInterpolation(start, end, rate);
                const dist2 = Vector.dist2(point, target);
                const curRate = startRate + (endRate - startRate) * rate;
                distances.push({ index: i, rate: curRate, dist2, point, });
            }
            // sort by distance squared 
            distances.sort((a, b) => a.dist2 - b.dist2);
            nearest = distances[0];
            if(nearest.dist2 < tol) {// found.
                break;
            }

            // update start, end, startRate and endRate            
            const index = distances[0].index;
            const oldStartRate = startRate;
            const oldRateVec = endRate - startRate;
            if(index === 0) {
                start = start;
                end = Utility.linearInterpolation(start, end, 1 / divides);
                startRate = oldStartRate;
                endRate = oldStartRate + oldRateVec * (1 / divides);
            } else if(index === divides) {
                start = Utility.linearInterpolation(start, end, (divides - 1) / divides);
                end = end;
                startRate = oldStartRate + oldRateVec * (divides - 1) / divides;
                endRate = oldStartRate + oldRateVec * 1;
            } else {
                start = Utility.linearInterpolation(start, end, (index - 1) / divides);
                end = Utility.linearInterpolation(start, end, (index + 1) / divides);
                startRate = oldStartRate + oldRateVec * (index - 1) / divides;
                endRate = oldStartRate + oldRateVec * (index + 1) / divides;
            }
        }
        return nearest;
    }

    /**
     * 2線分上のパラメータを求める
     * @param {Array<{ x: number, y: number, }>} points 0-1: 線分#0, 3-2: 線分#1
     * @param {{ x: number, y: number, }} target 対象となる点
     * @param {number} tol 距離の2乗を0とみなす許容範囲
     * @returns {Object} 対象となる点の近くを通る直線を定める情報
     */ 
    function nearestRate2LineSegments(points, target, tol = 1e-6) {
        let start = points[0];
        let end = points[1];
        let nextStart = points[3];
        let nextEnd = points[2];
        let startRate = 0;
        let endRate = 1;

        let loopCnt = 0;
        const maxLoopCnt = 10;
        let nearest = null;
        while(true) {
            if(++loopCnt >= maxLoopCnt) { 
                //console.log('max loop count.');
                break; 
            }
            const distances = [];
            const divides = 10;
            for(let i = 0; i <= divides; i += 1) {
                const rate = i / divides;
                const point = Utility.linearInterpolation(start, end, rate);
                const nextPoint = Utility.linearInterpolation(nextStart, nextEnd, rate);
                const dist2 = Vector.dist2LinePoint(point, nextPoint, target);
                const curRate = startRate + (endRate - startRate) * rate;
                distances.push({ index: i, rate: curRate, dist2, point, nextPoint });
            }
            // sort by distance squared 
            distances.sort((a, b) => a.dist2 - b.dist2);
            nearest = distances[0];
            if(nearest.dist2 < tol) {// found.
                break;
            }
            // update start, end, nextStart, nextEnd, startRate and endRate            
            const index = distances[0].index;
            const oldStartRate = startRate;
            const oldRateVec = endRate - startRate;
            if(index === 0) {
                start = start;
                end = Utility.linearInterpolation(start, end, 1 / divides);
                nextStart = nextStart;
                nextEnd = Utility.linearInterpolation(nextStart, nextEnd, 1 / divides);
                startRate = oldStartRate;
                endRate = oldStartRate + oldRateVec * (1 / divides);
            } else if(index === divides) {
                start = Utility.linearInterpolation(start, end, (divides - 1) / divides);
                end = end;
                nextStart = Utility.linearInterpolation(nextStart, nextEnd, (divides - 1) / divides);
                nextEnd = nextEnd;
                startRate = oldStartRate + oldRateVec * (divides - 1) / divides;
                endRate = oldStartRate + oldRateVec * 1;
            } else {
                start = Utility.linearInterpolation(start, end, (index - 1) / divides);
                end = Utility.linearInterpolation(start, end, (index + 1) / divides);
                nextStart = Utility.linearInterpolation(nextStart, nextEnd, (index - 1) / divides);
                nextEnd = Utility.linearInterpolation(nextStart, nextEnd, (index + 1) / divides);
                startRate = oldStartRate + oldRateVec * (index - 1) / divides;
                endRate = oldStartRate + oldRateVec * (index + 1) / divides;
            }
        }
        return nearest;
    }

    /**
     * 分割する
     * @param {{ x: number, y: number, }} start 始点
     * @param {{ x: number, y: number, }} end 終点
     * @param {number} divides 分割数
     * @returns {Array<{ x: number, y: number, }>} 点の配列
     */
    function createPointsByLineSegment(start, end, divides) {
        const points = [];
        for(let i = 0; i <= divides; i += 1) {
            const point = Utility.linearInterpolation(start, end, i / divides);
            points.push(point);
        }
        return points;
    }

    /**
     * パスを塗りつぶすことにより、四角形内のインデックスを取得する
     * @param {Array<{ x: number, y: number, }>} points 四角形の点(時計回り)
     * @param {{ width: number, height: number, }} canvasSize キャンバスのサイズ
     */
    function getFilledIndexesBySquarePath(points, size) {

        // get min/max of points
        MinMax.save();
        MinMax.init();
        points.forEach(p => { MinMax.regist(p); });
        MinMax.addMargin(2);
        MinMax.truncate();
        const mm = MinMax.getRect();
        MinMax.restore();

        // create canvas
        const canvas = Utility.createCanvas(mm.width, mm.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // transform points
        trans = points.map(p => Vector.subtract(p, mm)); 

        // fill square
        ctx.save();
        ctx.beginPath();
        trans.forEach((p, i) => { 
            if(i === 0) { ctx.moveTo(p.x, p.y); }
            else { ctx.lineTo(p.x, p.y); }
        });
        //ctx.closePath();
        ctx.fill();
        ctx.restore();

        // get index of filled pixel
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        let indexes = [];
        for(let i = 0; i < data.length / 4; i += 1) {
            if(data[i * 4 + 3] !== 0) {// filled
                indexes.push(i);
            }
        }

        // 元のcanvasの外側にある点は無視する
        indexes = indexes.filter(index => {
            let x = index % ctx.canvas.width;
            let y = Math.floor(index / ctx.canvas.width);
            x += mm.x;
            y += mm.y;
            if(x < 0 || x > size.width - 1 || y < 0 || y > size.height - 1) {
                return false;
            } else {
                return true;
            }
        });

        // indexsを変換する。元のcanvasの座標系でのインデックスに変換する
        indexes = indexes.map(index => {
            let x = index % ctx.canvas.width;
            let y = Math.floor(index / ctx.canvas.width);
            x += mm.x;
            y += mm.y;
            const newIndex = x + y * size.width;
            return newIndex;
        });

        return indexes;
    }

    function getShiftedPoints(pos, t, vectors, rate, startLineWidth, endLineWidth) {
        // 接線のベクトルを求める
        let vector = CubicBezierCurve.firstDerivativeByT(points, t);
        // 単位ベクトル化する
        vector = Vector.unit(vector);
        // -90度回す
        const nrm = Vector.nrm(vector);

        const lineWidth = startLineWidth + (endLineWidth - startLineWidth) * rate;
        const halfWidth = lineWidth * 0.5;
        const top = {
            x: pos.x + halfWidth * nrm.x,
            y: pos.y + halfWidth * nrm.y,
        };
        const bottom = {
            x: pos.x + halfWidth * (-nrm.x),
            y: pos.y + halfWidth * (-nrm.y),
        };
        return [ top, bottom, ];
    }
}


