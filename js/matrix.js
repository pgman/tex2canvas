// 行列クラス(行列の計算に使用)
class Matrix {
    // m0は行列、m1は行列又はベクトル
    // 行列は大きさ9の1次元配列であること。 ex. [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]
    // ベクトルはxとyをプロパティに持つ連想配列であること。 ex. { x: 2, y: 4 }
    // 左からベクトルをかけることは想定していない
    static multiply(m0, m1) {
        if(m1.length && m1.length === 9) {// m1は行列
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
        } else {// m1はベクトル
            return {
                x: m0[0] * m1.x + m0[1] * m1.y + m0[2],
                y: m0[3] * m1.x + m0[4] * m1.y + m0[5],                
            };
        }
    }

    /**
     * 単位行列作成
     * @returns {Array<Number>} 行列
     */
    static identify() {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    /**
     * 平行移動行列作成
     * @param {Number} x x方向の平行移動量
     * @param {Number} y y方向の平行移動量
     * @returns {Array<Number>} 行列
     */
    static translate(x, y) {
        return [1, 0, x, 0, 1, y, 0, 0, 1];
    }

    /**
     * 拡大縮小行列作成
     * @param {Number} x x方向の拡大率
     * @param {Number} y y方向の拡大率
     * @returns {Array<Number>} 行列
     */
    static scale(x, y) {
        return [x, 0, 0, 0, y, 0, 0, 0, 1];
    }
    
    /**
     * 回転行列作成
     * @param {Number} theta 回転角度(ラジアン)
     * @returns {Array<Number>} 行列
     */
    static rotate(theta) {
        const cos = Math.cos(theta),
            sin = Math.sin(theta);
        return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
    }

    /**
     * 逆行列作成
     * @param {Array<Number>} m 行列
     * @returns {Array<Number>} 逆行列
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
     * @param {Array<Number>} m 行列
     * @returns {Number} 行列式の値
     */
    static determinant(m) {
        return m[0] * m[4] * m[8] 
        + m[1] * m[5] * m[6] 
        + m[2] * m[3] * m[7]
        - m[2] * m[4] * m[6]
        - m[1] * m[3] * m[8]
        - m[0] * m[5] * m[7];
    }
}