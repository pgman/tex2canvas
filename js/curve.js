class Curve {

    /**
     * constructor
     * @param {Array<{ x: number, y: number, }>} points array of point
     */
    constructor(points) {
        if(!Array.isArray(points)) {
            throw 'invalid parameter.'
        }
        // I want to support arcs in the future
        this.type = Define.CUBIC_BEZIER_CURVE;
        if(points.length === 4) {// cubic bezier curve            
            this.src = Define.CUBIC_BEZIER_CURVE;
            this.points = Utility.deepCopy(points);
        } else if(points.length === 3) {// quadratic bezier curve
            this.src = Define.QUADRATIC_BEZIER_CURVE;
            this.points = CubicBezierCurve.fromQuadratic(points);
        } else if(points.length === 2) {// line segment
            this.src = Define.LINE_SEGMENT;
            this.points = CubicBezierCurve.fromLineSegment(points);
        } else {
            throw 'invalid paramter.';
        }
        this.length = CubicBezierCurve.getLength(this.points);
        this.rect = CubicBezierCurve.getRect(this.points);
    }

    /**
     * get segments (for animation)
     * @param {ImageData} imageData image data
     * @param {{ width: number, height: number, }} size size of canvas
     * @param {number} startLineWidth line width of start point
     * @param {number} endLineWidth line width of end point
     * @param {number} startXRate rate of start of x
     * @param {number} endXRate rate of end of x
     * @param {step} step width of step(px)
     * @returns {void} nothing
     */
    getSegments(imageData, size, startLineWidth, endLineWidth, startXRate, endXRate, step) {
        // return value
        const segments = [];

        // cache
        const points = this.points;
        const wholeLength = this.length;

        // cache size
        const width = size.width;
        const height = size.height;    

        // 本来はnextTを長さがstepになるように選ぶべきであるが、あまり利点がないので全体の長さをstepで割ったものを採用する
        let div = Math.round(wholeLength / step);
        if(div < 1) { div = 1; }    // div is at least 1.

        let curLength = 0;
        for(let i = 0; i < div; i += 1) {
            const t = i / div;        
            const nextT = (i + 1) / div;
            const pointByT = CubicBezierCurve.pointByT(points, t);
            const pointByNextT = CubicBezierCurve.pointByT(points, nextT);
            if(i > 0) {
                const preT = (i - 1) / div;
                const prePos = CubicBezierCurve.pointByT(points, preT);
                const dist = Vector.dist(pointByT, prePos);
                curLength += dist;
            }
            const curDist = Vector.dist(pointByT, pointByNextT);

            // Get a point that is half the width of the current segment in the normal direction from the current point
            const [top, bottom] = getShiftedPoints(pointByT, t, curLength / wholeLength, startLineWidth, endLineWidth);

            // Get a point that is half the width of the next segment in the normal direction from the next point
            const [nextTop, nextBottom] = getShiftedPoints(pointByNextT, nextT, (curLength + curDist) / wholeLength, startLineWidth, endLineWidth);

            // パスを塗りつぶすことにより、四角形内のインデックスを取得する
            // getFilledIndexesにバグが出た時は、代替としてgetFilledIndexesBySquarePathを使う。
            // 細い線なら20ms -> 40msぐらいとやや遅くなる
            const indexes = getFilledIndexes([ top, nextTop, nextBottom, bottom ], { width, height, });
            
            // nearestRate2LineSegments, nearestRateLineSegment のパラメータ
            // 本アプリでは幅が2-10ぐらい使うのが普通であり、X,Yの割合をそんなに正確に求める必要はないため、本パラメータは荒くしてよいはず
            // 精度に関しては最大で (2 / divides) ^ maxCount * step であり、最小で (1/ divides) ^ maxCount * step となる
            // const maxLoopCnt = 5, divides = 5, tol = 1e-4; と設定し、step === 1 だと凡そ精度 0.01
            const maxLoopCnt = 5, divides = 5, tol = 1e-4;

            const pixels = [];
            indexes.forEach(index => {
                // index to x, y
                const x = index % width;
                const y = Math.floor(index / width);
                // get rate of x
                const nearestX = nearestRate2LineSegments([top, nextTop, nextBottom, bottom], { x, y, }, maxLoopCnt, divides, tol);
                const xRate = (curLength + curDist * nearestX.rate) / wholeLength;
                // get rate of y
                const nearestY = nearestRateLineSegment([nearestX.point, nearestX.nextPoint], { x, y, }, maxLoopCnt, divides, tol);
                const yRate = nearestY.rate;
                // get image color by xRate and yRate
                const color = Graphics.getImageColor(imageData, xRate, yRate, startXRate, endXRate);
                pixels.push({ i: index, x, y, a: color.a });
            });
            segments.push({ 
                pixels,             // 線分の画素情報
                length: curDist,    // 現在の線分の長さ
                square: [ top, nextTop, nextBottom, bottom ],   // 四角形の点
                pointByT,           // t の座標   
                radiusByT: 1 / Math.abs(CubicBezierCurve.curvatureByT(points, t)),          // tの曲率半径
                deltaLengthByT: deltaLength(points, pointByT, t, 1 / 1000),                 // tの長さの変化量
            });
        }
        return segments;

        function deltaLength(points, pointByT, t, delta = 1 / 1000) {
            // tが微小変化(1/1000)したときの長さを求める
            const diffT = t + delta;
            const diffPos = CubicBezierCurve.pointByT(points, diffT);
            const diff = Vector.dist(pointByT, diffPos);
            return diff / delta;
        }    

        /**
         * 線分上のパラメータを求める
         * @param {Array<{ x: number, y: number, }>} points 0-1: 線分#0
         * @param {{ x: number, y: number, }} target 対象となる点
         * @param {number} tol 距離の2乗を0とみなす許容範囲
         * @returns {Object} 対象となる点の近くを通る直線を定める情報
         */ 
        function nearestRateLineSegment(points, target, maxLoopCnt = 6, divides = 8, tol = 1e-6) {
            let start = points[0];
            let end = points[1];
            let startRate = 0;
            let endRate = 1;

            let loopCnt = 0;
            let nearest = null;
            while(true) {
                if(loopCnt >= maxLoopCnt) { break; }
                loopCnt += 1;
                const distances = [];

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
                const oldStart = start;
                const oldEnd = end;
                const oldStartRate = startRate;
                const oldRateVec = endRate - startRate;
                if(index === 0) {
                    end = Utility.linearInterpolation(oldStart, oldEnd, 1 / divides);
                    endRate = oldStartRate + oldRateVec * (1 / divides);
                } else if(index === divides) {
                    start = Utility.linearInterpolation(oldStart, oldEnd, (divides - 1) / divides);
                    startRate = oldStartRate + oldRateVec * (divides - 1) / divides;
                } else {
                    start = Utility.linearInterpolation(oldStart, oldEnd, (index - 1) / divides);
                    end = Utility.linearInterpolation(oldStart, oldEnd, (index + 1) / divides);
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
        function nearestRate2LineSegments(points, target, maxLoopCnt = 6, divides = 8, tol = 1e-6) {
            let start = points[0];
            let end = points[1];
            let nextStart = points[3];
            let nextEnd = points[2];
            let startRate = 0;
            let endRate = 1;

            let loopCnt = 0;
            let nearest = null;
            while(true) {
                if(loopCnt >= maxLoopCnt) { break; }
                loopCnt += 1;
                const distances = [];
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
                const oldStart = start;
                const oldEnd = end;
                const oldNextStart = nextStart;
                const oldNextEnd = nextEnd;
                const oldStartRate = startRate;
                const oldRateVec = endRate - startRate;
                if(index === 0) {
                    end = Utility.linearInterpolation(oldStart, oldEnd, 1 / divides);
                    nextEnd = Utility.linearInterpolation(oldNextStart, oldNextEnd, 1 / divides);
                    endRate = oldStartRate + oldRateVec * (1 / divides);
                } else if(index === divides) {
                    start = Utility.linearInterpolation(oldStart, oldEnd, (divides - 1) / divides);
                    nextStart = Utility.linearInterpolation(oldNextStart, oldNextEnd, (divides - 1) / divides);
                    startRate = oldStartRate + oldRateVec * (divides - 1) / divides;
                } else {
                    start = Utility.linearInterpolation(oldStart, oldEnd, (index - 1) / divides);
                    end = Utility.linearInterpolation(oldStart, oldEnd, (index + 1) / divides);
                    nextStart = Utility.linearInterpolation(oldNextStart, oldNextEnd, (index - 1) / divides);
                    nextEnd = Utility.linearInterpolation(oldNextStart, oldNextEnd, (index + 1) / divides);
                    startRate = oldStartRate + oldRateVec * (index - 1) / divides;
                    endRate = oldStartRate + oldRateVec * (index + 1) / divides;
                }
            }
            return nearest;
        }

        /**
         * 四角形内のインデックスを取得する
         * @param {Array<{ x: number, y: number, }>} points 四角形の点(時計回り)
         * @param {{ width: number, height: number, }} size キャンバスのサイズ
         */
        function getFilledIndexes(points, size) {
            // 四角形の塗りつぶしの点の座標を取得する
            const pixels = Graphics.drawSquare(points);
            // 元のcanvasの外側にある点は無視する
            const clipped = pixels.filter(p => {
                if(p.x < 0 || p.x > size.width - 1 || p.y < 0 || p.y > size.height - 1) {
                    return false;
                } else {
                    return true;
                }
            });
            // 元のcanvasの座標系でのインデックスに変換する
            const indexes = clipped.map(p => p.x + p.y * size.width);
            return indexes;
        }

        /**
         * パスを塗りつぶすことにより、四角形内のインデックスを取得する
         * ※本メソッドよりgetFilledIndexesの方が早いので、本メソッドは基本的に不採用ではあるが、getFilledIndexesにバグが出た時の代替として残しておく
         * @param {Array<{ x: number, y: number, }>} points 四角形の点(時計回り)
         * @param {{ width: number, height: number, }} size キャンバスのサイズ
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

        function getShiftedPoints(pos, t, rate, startLineWidth, endLineWidth) {
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
     * create path
     * @param {CanvasRenderingContext2D} ctx context
     * @param {boolean} move call moveTo method? 
     * @returns {void} void
     */
    createPath(ctx, move = false) {
        const points = this.points;
        if(move) {
            ctx.moveTo(points[0].x, points[0].y);
        }
        if(this.type === Define.CUBIC_BEZIER_CURVE) {// cubic bezier curve
            ctx.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
        } else {
            throw 'invalid this.type.';
        }
    }

    /**
     * Affine transformation
     * @param {Array<number>} m matrix
     * @return {void} nothing
     */
    transform(m) {
        this.points = this.points.map(p => Matrix.multiplyVec(m, p));
        this.length = CubicBezierCurve.getLength(this.points);
        this.rect = CubicBezierCurve.getRect(this.points);
    }

    stringify() {
        let points;
        if(this.src === Define.CUBIC_BEZIER_CURVE) {// cubic bezier curve
            points = this.points;
        } else if(this.src === Define.QUADRATIC_BEZIER_CURVE) {// quadratic bezier curve
            points = [ this.points[0], this.points[1], this.points[3] ];
        } else if(this.src === Define.LINE_SEGMENT) {// line segment
            points =[ this.points[0], this.points[3] ];
        } else {
            throw 'invalid this.src.';
        }
        return JSON.stringify({ src: this.src, points, });
    }

    static parse(jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if(!parsed || !parsed.src || !parsed.points) {
            'invalid jsonStr.';
        }
        return new Curve(parsed.points);
    }
}