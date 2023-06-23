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
}