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

    /**
     * 画像を90度回す
     * @param {ImageData} imageData イメージデータ
     * @returns {ImageData} イメージデータ
     */
    static rotateImage90Degrees(imageData) {
        const srcData = imageData.data;
        // replace width and height
        const dst = GraphicsApi.createImageData(imageData.height, imageData.width);
        const dstData = dst.data;
        for(let x = 0; x < dst.width; x += 1) {
            for(let y = 0; y < dst.height; y += 1) {
                const di = dst.width * y + x;
                const si = dst.width * x + y;
                for(let j = 0; j < 4; j += 1) {
                    dstData[di * 4 + j] = srcData[si * 4 + j];
                }                
            }
        }
        return dst;
    }

    /**
     * 画像を1800度回す
     * @param {ImageData} imageData イメージデータ
     * @returns {ImageData} イメージデータ
     */
    static rotateImage180Degrees(imageData) {
        const srcData = imageData.data;
        const dst = GraphicsApi.createImageData(imageData.width, imageData.height);
        const dstData = dst.data;
        for(let x = 0; x < dst.width; x += 1) {
            for(let y = 0; y < dst.height; y += 1) {
                const di = dst.width * y + x;
                const si = dst.width * (dst.height - 1 - y) + (dst.width - 1 - x);
                for(let j = 0; j < 4; j += 1) {
                    dstData[di * 4 + j] = srcData[si * 4 + j];
                }                
            }
        }
        return dst;
    }
}