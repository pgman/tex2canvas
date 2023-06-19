// ベクトルクラス(ベクトルの計算に使用)
class Vector {
    /**
     * ベクトルとベクトルを足す
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {{ x: number, y: number, }} ベクトル
     */
    static add(v0, v1) {
        return {
            x: v0.x + v1.x,
            y: v0.y + v1.y,
        };
    }

    /**
     * ベクトルからベクトルを引く
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {{ x: number, y: number, }} ベクトル
     */
    static subtract(v0, v1) {
        return {
            x: v0.x - v1.x,
            y: v0.y - v1.y,
        };
    }

    /**
     * ベクトルをスカラー倍する
     * @param {{ x: number, y: number, }} v ベクトル
     * @param {number} s スカラー
     * @returns {{ x: number, y: number, }} ベクトル
     */
    static scale(v, s) {
        return {
            x: v.x * s,
            y: v.y * s,
        };
    }

    /**
     * ベクトルの長さを求める
     * @param {{ x: number, y: number, }} v ベクトル
     * @returns {number} ベクトルの長さ
     */
    static length(v) {
        return Math.sqrt(Vector.length2(v));
    }

    /**
     * ベクトルの長さの2乗を求める
     * @param {{ x: number, y: number, }} v ベクトル
     * @returns {number} ベクトルの長さの2乗
     */
    static length2(v) {
        return v.x * v.x + v.y * v.y;
    }

    /**
     * 単位ベクトルを求める(非破壊的)
     * @param {{ x: number, y: number, }} v ベクトル
     * @returns {number} ベクトルの長さ
     */
    static unit(v) {
        const len = Vector.length(v);
        return {
            x: v.x / len,
            y: v.y / len
        };
    }

    /**
     * 内積を求める
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {number} 内積
     */
    static innerProduct(v0, v1) {
        return v0.x * v1.x + v0.y * v1.y;
    }

    /**
     * 中心(平均)を求める
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {{ x: number, y: number, }} ベクトル
     */
    static center(v0, v1) {
        return {
            x: (v0.x + v1.x) / 2,
            y: (v0.y + v1.y) / 2,
        };
    }

    /**
     * 距離を求める
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {number} 距離
     */
    static dist(v0, v1) {
        const v = Vector.subtract(v0, v1);
        return Vector.length(v);
    }

    /**
     * 距離の2乗を求める
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {number} 距離の2乗
     */
    static dist2(v0, v1) {
        const v = Vector.subtract(v0, v1);
        return Vector.length2(v);
    }

    /**
     * ベクトルが等しいか判定する(マンハッタン距離で判定する)
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @param {number} epsilon イプシロン(デフォルト値は 1e-5。差の絶対値がこの値より小さいなら等しいと判定する)
     * @returns {boolean} 等しいか(true: 等しい, false: 等しくない)
     */
    static equals(v0, v1, epsilon = 1e-5) {
        if(Math.abs(v0.x - v1.x) < epsilon && Math.abs(v0.y - v1.y) < epsilon) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 外積を求める
     * @param {{ x: number, y: number, }} v0 ベクトル
     * @param {{ x: number, y: number, }} v1 ベクトル
     * @returns {number} 外積
     */
    static outerProduct(v0, v1) {
        return v0.x * v1.y - v0.y * v1.x;
    }
    
    /**
     * 原点を通る直線と点の距離の2乗(private)
     * @param {{ x: number, y: number, }} p 直線上の点(直線上の点のもう1つは原点)
     * @param {{ x: number, y: number, }} q 点
     * @returns {number} 距離の2乗
     */
    static _dist2OriginLinePoint(p, q, tol = 1e-6) {
        const num = Vector.outerProduct(p, q);
        const pLen2 = Vector.length2(p);
        if(pLen2 < tol) {// 縮退しているので、原点との距離とする
            return Vector.length2(q);
        } else {// 縮退していない
            return num * num / pLen2;
        }        
    }

    /**
     * 直線と点の距離の2乗
     * @param {{ x: number, y: number, }} o 直線上の点
     * @param {{ x: number, y: number, }} p 直線上の点
     * @param {{ x: number, y: number, }} q 点
     * @returns {number} 距離の2乗
     */
    static dist2LinePoint(o, p, q, tol = 1e-6) {
        return Vector._dist2OriginLinePoint(Vector.subtract(p, o), Vector.subtract(q, o));
    } 
}