class Scalar {
    /**
     * 値の範囲を制限する
     * @param {number} value 値 
     * @param {number} min 最小値
     * @param {number} max 最大値
     * @returns {number} 値
     */
    static limit(value, min, max) {
        if(value < min) { return min; }
        else if(max < value) { return max; }
        else { return value; }
    }

    /**
	 * 線形補間する
	 * @param {number} v0 始点
	 * @param {number} v1 終点
	 * @param {number} t 補間パラメータ
	 * @return {number} 線形補間された値を返す
	 */
	static linearInterpolation(v0, v1, t) {
		return (1 - t) * v0 + t * v1;
	}
}