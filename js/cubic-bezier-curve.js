// 2次元の3次ベジェ曲線クラス
class CubicBezierCurve {

    /**
     * 線分から3次ベジェ曲線への変換
     * @param {Array<{x: number, y: number, }>} points 線分の始点と終点
     * @returns {Array<{x: number, y: number, }>} 3次ベジェ曲線の制御点
     */
    static fromLineSegment(points) {
        const inter = t => Utility.linearInterpolation(points[0], points[1], t);
        return [ points[0], inter(1 / 3), inter(2 / 3), points[1] ];
    }

    /**
     * 2次ベジェ曲線から3次ベジェ曲線への変換
     * @param {Array<{x: number, y: number, }>} points 2次ベジェ曲線の制御点
     * @returns {Array<{x: number, y: number, }>} 3次ベジェ曲線の制御点
     */
    static fromQuadratic(points) {
        return [ points[0], points[1], points[1], points[2] ];
    }

    /**
     * パラメータから3次ベジェ曲線の点の座標を得る
     * @param {Array<{x: number, y: number, }>} points 3次ベジェ曲線の制御点
     * @param {number} t パラメータ(0-1)
     * @returns {{x: number, y: number, }} 点の座標
     */
    static pointByT(points, t) {
        return {
            x: oneDimPointByT(points, t, 'x'),
            y: oneDimPointByT(points, t, 'y'),
        };

        /**
         * 1次元の3次ベジェ曲線の点の座標を得る
         * @param {Array<{x: number, y: number, }>} points 2次元の3次ベジェ曲線の制御点
         * @param {number} t パラメータ(0-1)
         * @param {string} prop プロパティ名
         * @returns {number} 1次元の点の座標
         */
        function oneDimPointByT(points, t, prop) {
            return (1 - t) ** 3 * points[0][prop] 
                    + 3 * t * (1 - t) ** 2 * points[1][prop] 
                    + 3 * t ** 2 * (1 - t) * points[2][prop] 
                    + t ** 3 * points[3][prop];
        }
    }

    /**
     * パラメータから3次ベジェ曲線の1階微分を得る
     * @param {Array<{x: number, y: number, }>} points 2次元の3次ベジェ曲線の制御点
     * @param {number} t パラメータ
     * @returns {{ x: number, y: number, }} 1階微分
     */
    static firstDerivativeByT(points, t) {
        const vectors = CubicBezierCurve.getVectors(points);
        return {
            x: oneDimFirstDerivativeByT(vectors, t, 'x'),
            y: oneDimFirstDerivativeByT(vectors, t, 'y'),
        };

        /**
         * 1次元の3次ベジェ曲線の1階微分を得る
         * @param {Array<{x: number, y: number, }>} points 2次元の3次ベジェ曲線の制御点
         * @param {number} t パラメータ(0-1)
         * @param {string} prop プロパティ名
         * @returns {number} 1次元の1階微分
         */
        function oneDimFirstDerivativeByT(vectors, t, prop) {
            const dr = (1 - t) ** 2 * vectors[0][prop]
                     + 2 * t * (1 - t) * vectors[1][prop]
                     + t ** 2 * vectors[2][prop];
            return dr * 3;
        }
    }    

    /**
     * ベジェ曲線の2階微分を求める
     * @param {Array<{x: number, y: number, }>} points 2次元の3次ベジェ曲線の制御点
     * @param {number} t パラメータ
     * @returns {{ x: number, y: number, }} 2階微分
     */
    static secondDerivativeByT(points, t) {
        const vectors = CubicBezierCurve.getVectors(points);
        return {
            x: oneDimSecondDerivativeByT(vectors, t, 'x'),
            y: oneDimSecondDerivativeByT(vectors, t, 'y'),
        };

        /**
         * 1次元の3次ベジェ曲線の2階微分を得る
         * @param {Array<{x: number, y: number, }>} points 2次元の3次ベジェ曲線の制御点
         * @param {number} t パラメータ(0-1)
         * @param {string} prop プロパティ名
         * @returns {number} 1次元の2階微分
         */
        function oneDimSecondDerivativeByT(vectors, t, prop) {
            const d2r = (1 - t) * (vectors[1][prop] - vectors[0][prop])
                      + t * (vectors[2][prop] - vectors[1][prop]);
            return d2r * 6;
        }        
    }

    /**
     * ベジェ曲線の曲率を求める
     * @param {Array<{x: number, y: number, }>} points 2次元の3次ベジェ曲線の制御点
     * @param {number} t パラメータ
     * @param {number} tol 1階微分の長さの2乗を0とみなす閾値 
     * @returns {number} 曲率
     */
    static curvatureByT(points, t, tol = 1e-6) {
        const p1 = CubicBezierCurve.firstDerivativeByT(points, t);     // 1階微分
        const p2 = CubicBezierCurve.secondDerivativeByT(points, t);    // 2階微分
        let ret = p2.x * p1.y - p1.x * p2.y;
        const len2 = p1.x * p1.x + p1.y * p1.y;
        if(len2 < tol) { return Number.MAX_VALUE; } // 分母になる数が小さいので、大きい値を返す
        ret /= Math.pow(len2, 3 / 2);
        return ret;
    }

    /**
     * 制御点からベクトルを求める
     * @param {Array<{ x: number, y: number }>} points 制御点の配列(length === 4)
     * @returns {Array<{ x: number, y: number }>} ベクトルの配列(length === 3)
     */
    static getVectors(points) {
        const vectors = [];
        for(let i = 0; i < points.length; i += 1) {
            if(i + 1 >= points.length) { continue; }
            const vector = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y, };
            vectors.push(Vector.unit(vector));
        }
        return vectors;
    }

    /**
     * ベジェ曲線の長さを取得する
     * @param {Array<{ x: number, y: number }>} points 制御点の配列
     * @param {number} div 分割数
     * @returns {number} 長さ
     */
    static wholeLength(points, div = 1000) {
        let length = 0;
        const steps = [{ t: 0, dist: 0, }];
        for(let i = 0; i < div; i += 1) {
            const t = i / div;
            const nextT = (i + 1) / div;
            const pos = CubicBezierCurve.pointByT(points, t);
            const nextPos = CubicBezierCurve.pointByT(points, nextT);
            const dist = Vector.dist(pos, nextPos);
            length += dist;
            steps.push({ t: nextT, dist });
        }
        return [length, steps];
    } 
    
}