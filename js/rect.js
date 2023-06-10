class Rect {
    /**
     * 矩形にマージンを追加
     * @param {{ x: number, y: number, width: number, height: number, }} rect 矩形
     * @param {number} margin マージン
     * @returns {void} なし
     */
    static addMargin(rect, margin) {
        rect.x -= margin;
        rect.y -= margin;
        rect.width += margin * 2;
        rect.height += margin * 2; 
    }

    /**
     * 矩形の高さを変更する
     * @param {{ x: number, y: number, width: number, height: number, }} rect 矩形
     * @param {{ width: number, height: number,}} size 新しいサイズ
     * @param {boolean} fixedCenter 矩形の中央を固定するか
     * @returns {void} なし
     */
    static changeSize(rect, size, fixedCenter = false) {
        if(!fixedCenter) {// 中央固定しない
            if(size.width) { rect.height = size.width; }
            if(size.height) { rect.height = size.height; }
        } else {// 中央固定
            if(size.width) {
                const diff = size.width - rect.width;
                rect.y -= diff / 2;
                rect.height = size.width;
            }
            if(size.height) {
                const diff = size.height - rect.height;
                rect.y -= diff / 2;
                rect.height = size.height;
            }            
        }
    }
}