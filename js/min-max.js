class MinMax {
    static minX = Number.MAX_VALUE;
    static minY = Number.MAX_VALUE;
    static maxX = -Number.MAX_VALUE;
    static maxY = -Number.MAX_VALUE;
    static stack = []; // for save / restore

    /**
     * 現在の状態を保存する
     * @returns {void} なし
     */
    static save() {
        this.stack.push({
            minX: MinMax.minX,
            minY: MinMax.minY,
            maxX: MinMax.maxX,
            maxY: MinMax.maxY,            
        });
    }

    /**
     * 状態を復元する
     * @returns {void} なし
     */
    static restore() {
        if(this.stack.length <= 0) {
            throw 'stack is empty.';
        }
        const popped = this.stack.pop();
        MinMax.minX = popped.minX;
        MinMax.minY = popped.minY;
        MinMax.maxX = popped.maxX;
        MinMax.maxY = popped.maxY;
    }

    /**
     * 初期化する
     * @returns {void} なし
     */
    static init() {
        MinMax.minX = Number.MAX_VALUE;
        MinMax.minY = Number.MAX_VALUE;
        MinMax.maxX = -Number.MAX_VALUE;
        MinMax.maxY = -Number.MAX_VALUE;
    }

    /**
     * 点を登録する
     * @param {{ x: number, y: number, }} 点
     * @returns {void} なし
     */
    static regist(p) {
        if(p.x < MinMax.minX) { MinMax.minX = p.x; }
        if(p.y < MinMax.minY) { MinMax.minY = p.y; }
        if(p.x > MinMax.maxX) { MinMax.maxX = p.x; }
        if(p.y > MinMax.maxY) { MinMax.maxY = p.y; }
    }

    /**
     * 小数点を切り捨てる(min を切り捨てる。max は切り上げる)
     * @returns {void} なし
     */
    static truncate() {
        MinMax.minX = Math.floor(MinMax.minX);
        MinMax.minY = Math.floor(MinMax.minY);
        MinMax.maxX = Math.ceil(MinMax.maxX);
        MinMax.maxY = Math.ceil(MinMax.maxY);
    }

    /**
     * マージンを付加する
     * @param {number} margin マージン(正の数を想定)
     * @returns {void} なし 
     */
    static addMargin(margin) {
        MinMax.minX -= margin;
        MinMax.minY -= margin;
        MinMax.maxX += margin;
        MinMax.maxY += margin;
    }

    /**
     * xとyの最小値/最大値を取得する
     * @returns {{ minX: number, minY: number, maxX: number, maxY: number, }} xとyの最小値/最大値
     */
    static get() {
        return { 
            minX: MinMax.minX,
            minY: MinMax.minY,
            maxX: MinMax.maxX,
            maxY: MinMax.maxY,
        };
    }

    /**
     * xとyの最小値/最大値を矩形として取得する
     * @returns {{ x: number, y: number, width: number, height: number, }} 矩形
     */
    static getRect() {
        return { 
            x: MinMax.minX,
            y: MinMax.minY,
            width: MinMax.maxX - MinMax.minX,
            height: MinMax.maxY - MinMax.minY,
        };
    }

    /**
     * 矩形の4点として取得する
     * @returns {Array<number>} 矩形の4点
     */
    static getRectPoints() {
        return [
            { x: MinMax.minX, y: MinMax.minY, },
            { x: MinMax.maxX, y: MinMax.minY, },
            { x: MinMax.maxX, y: MinMax.maxY, },
            { x: MinMax.minX, y: MinMax.maxY, },
        ];
    }
}