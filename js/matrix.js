// 行列クラス(行列の計算に使用)
class Matrix {
    /**
     * 行列の積を計算する
     * @param {Array<number>} m0 行列(左側)
     * @param {Array<number>} m1 行列(右側)
     * @returns {Array<number>} 行列
     */
    static multiply(m0, m1) {        
        if(m0.length !== 9 || m1.length !== 9) {
            throw 'the arguments are invalid.'
        }
        return [
            m0[0] * m1[0] + m0[1] * m1[3] + m0[2] * m1[6],
            m0[0] * m1[1] + m0[1] * m1[4] + m0[2] * m1[7],
            m0[0] * m1[2] + m0[1] * m1[5] + m0[2] * m1[8],
            m0[3] * m1[0] + m0[4] * m1[3] + m0[5] * m1[6],
            m0[3] * m1[1] + m0[4] * m1[4] + m0[5] * m1[7],
            m0[3] * m1[2] + m0[4] * m1[5] + m0[5] * m1[8],
            m0[6] * m1[0] + m0[7] * m1[3] + m0[8] * m1[6],
            m0[6] * m1[1] + m0[7] * m1[4] + m0[8] * m1[7],
            m0[6] * m1[2] + m0[7] * m1[5] + m0[8] * m1[8],
        ];
    }

    /**
     * ベクトルに行列を掛ける
     * @param {Array<number>} m 行列
     * @param {{ x: number, y: number, }} v ベクトル 
     * @returns {{ x: number, y: number, }} ベクトル 
     */
    static multiplyVec(m, v) {
        return {
            x: m[0] * v.x + m[1] * v.y + m[2],
            y: m[3] * v.x + m[4] * v.y + m[5],                
        };
    }

    /**
     * 矩形に行列を掛ける(※ただし回転行列がかかっていないことが前提。180度の回転ならOK)
     * @param {Array<number>} m 行列
     * @param {{ x: number, y: number, width: number, height: number, }} r 矩形 
     */
    static multiplyRect(m, r) {
        const p0 = Matrix.multiplyVec(m, { x: r.x, y: r.y });
        const p1 = Matrix.multiplyVec(m, { x: r.x + r.width, y: r.y + r.height });
        return {
            x: Math.min(p0.x, p1.x),
            y: Math.min(p0.y, p1.y),
            width: Math.abs(p0.x - p1.x),
            height: Math.abs(p0.y - p1.y),
        };          
    }

    /**
     * 単位行列作成
     * @returns {Array<number>} 行列
     */
    static identify() {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    /**
     * 平行移動行列作成
     * @param {number} x x方向の平行移動量
     * @param {number} y y方向の平行移動量
     * @returns {Array<number>} 行列
     */
    static translate(x, y) {
        return [1, 0, x, 0, 1, y, 0, 0, 1];
    }

    /**
     * 拡大縮小行列作成
     * @param {number} x x方向の拡大率
     * @param {number} y y方向の拡大率
     * @returns {Array<number>} 行列
     */
    static scale(x, y) {
        return [x, 0, 0, 0, y, 0, 0, 0, 1];
    }
    
    /**
     * 回転行列作成
     * @param {number} theta 回転角度(ラジアン)
     * @returns {Array<number>} 行列
     */
    static rotate(theta) {
        const cos = Math.cos(theta),
            sin = Math.sin(theta);
        return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
    }

    /**
     * スキュー行列作成
     * @param {number} thetaX 回転角度(ラジアン)
     * @param {number} thetaY 回転角度(ラジアン)
     * @returns {Array<number>} 行列
     */
    static skew(thetaX, thetaY) {
        const tanX = Math.tan(thetaX), 
            tanY = Math.tan(thetaY);
        return [ 1, tanX, 0, tanY, 1, 0, 0, 0, 1 ];
    }

    /**
     * 逆行列作成
     * @param {Array<number>} m 行列
     * @returns {Array<number>} 逆行列
     */
    static inverse(m) {
        const det = Matrix.determinant(m),
            inv = [
                m[4] * m[8] - m[5] * m[7],    -(m[1] * m[8] - m[2] * m[7]),   m[1] * m[5] - m[2] * m[4],
                -(m[3] * m[8] - m[5] * m[6]), m[0] * m[8] - m[2] * m[6],      -(m[0] * m[5] - m[2] * m[3]),
                m[3] * m[7] - m[4] * m[6],    -(m[0] * m[7] - m[1] * m[6]),   m[0] * m[4] - m[1] * m[3]
            ];
        return inv.map(elm => elm / det);
    }

    /**
     * 行列式を求める
     * @param {Array<number>} m 行列
     * @returns {number} 行列式の値
     */
    static determinant(m) {
        return m[0] * m[4] * m[8] 
        + m[1] * m[5] * m[6] 
        + m[2] * m[3] * m[7]
        - m[2] * m[4] * m[6]
        - m[1] * m[3] * m[8]
        - m[0] * m[5] * m[7];
    }

    /**
     * コンテキストに行列をセットする(ctx.setTransformに対応)
     * @param {CanvasRenderingContext2D} ctx コンテキスト
     * @param {Array<number>} m 行列
     * @returns {void} なし
     */
    static setTransform(ctx, m) {
        ctx.setTransform(m[0], m[3], m[1], m[4], m[2], m[5]);
    }

    /**
     * コンテキストに行列をセットする(ctx.transformに対応)
     * @param {CanvasRenderingContext2D} ctx コンテキスト
     * @param {Array<number>} m 行列
     * @returns {void} なし
     */
    static transform(ctx, m) {
        ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
    }
}