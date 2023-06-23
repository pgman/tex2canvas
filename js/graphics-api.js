// APIを使用する画像処理
class GraphicsApi {
    /**
     * イメージデータを作成する(canvasを経由して作成する)
     * @param {number} width 幅
     * @param {number} height 高さ
     * @returns {ImageData} イメージデータ 
     */
    static createImageData(width, height) {    
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, width, height);
        return imageData;
    }
    
    /**
     * トリミングしたキャンバスを作成する
     * @param {HTMLCanvasElement} canvas キャンバス 
     * @param {{x: number, y: number, width: number, height: number, }} rect 矩形 
     * @returns {HTMLCanvasElement} トリミングしたキャンバス
     */
    static trimCanvas(canvas, rect) {
        const trimmed = Utility.createCanvas(rect.width, rect.height);
        const ctx = trimmed.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, trimmed.width, trimmed.height);
        return trimmed;
    }   

    /**
     * 画像からイメージデータを取得する
     * @param {Image} img 画像 
     * @returns {ImageData} イメージデータ
     */
    static getImageDataByImage(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        return imageData;
    }

    /**
     * 色を置換する
     * @param {CanvasRenderingContext2D} ctx コンテキスト 
     * @param {Array<number>} src 置き換えられる色 
     * @param {Array<number>} dst 置換する色
     * @returns {void} なし
     */
    static replaceColor(ctx, src, dst) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length / 4; i += 1) {
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === src[0] && g === src[1] && b === src[2] && a !== 0) {
                data[i * 4 + 0] = dst[0];
                data[i * 4 + 1] = dst[1];
                data[i * 4 + 2] = dst[2];
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
}