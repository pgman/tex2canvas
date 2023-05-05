// ベクトルクラス(ベクトルの計算に使用)
class Vector {
    // 足し算
    static add(v0, v1) {
        return {
            x: v0.x + v1.x,
            y: v0.y + v1.y,
        };
    }
    // 引き算
    static subtract(v0, v1) {
        return {
            x: v0.x - v1.x,
            y: v0.y - v1.y,
        };
    }
    // スカラー倍
    static scale(v0, s) {
        return {
            x: v0.x * s,
            y: v0.y * s,
        };
    }
    // ベクトルの長さを返す
    static length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
    // 単位ベクトルを返す(非破壊的)
    static unit(v) {
        const len = Vector.length(v);
        return {
            x: v.x / len,
            y: v.y / len
        };
    }
    // 内積
    static innerProduct(v0, v1) {
        return v0.x * v1.x + v0.y * v1.y;
    }
    static center(v0, v1) {
        return {
            x: (v0.x + v1.x) / 2,
            y: (v0.y + v1.y) / 2,
        };
    }
}