class Pixel {

    /**
     * 点配列から描画のためのmin/maxを取得する
     * @param {Array<{x: number, y: number}>} posArray 点の配列
     * @param {number} lineWidth 線の太さ
     * @param {number} padding 内側の余白
     * @returns { minX: number, minY: number, maxX: number, maxY: number, } x, y の min/max
     */
    static getMinMaxForDraw(posArray, lineWidth, padding) {
        // posArrayのmin/maxを取得する
        MinMax.save();
        MinMax.init();
        posArray.forEach(pos => { MinMax.add(pos); });
        const mm = MinMax.get();
        MinMax.restore();
        // minを切り捨てる maxを切り上げる
        mm.minX = Math.floor(mm.minX);
        mm.minY = Math.floor(mm.minY);
        mm.maxX = Math.floor(mm.maxX);
        mm.maxY = Math.floor(mm.maxY);

        const radius = Math.round(lineWidth / 2);
        mm.minX -= radius + padding;
        mm.minY -= radius + padding;
        mm.maxX += radius + padding;
        mm.maxY += radius + padding;

        return mm;
    }    

    /**
     * 点群から線分を描画する
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param {Array<{x: number, y: number}>} posArray 点群
     * @param {number} lineWidth 線の太さ
     * @param {string} strokeStyle ストローク時のスタイル
     * @param {{x: number, y: number,}} translate 平行移動量
     * @returns {void} なし  
     */
    static drawPosArray(ctx, posArray, lineWidth, strokeStyle, translate) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = `rgba(${strokeStyle.r},${strokeStyle.g},${strokeStyle.b},${strokeStyle.a})`; // a は 0.0～1.0
        ctx.setTransform(1, 0, 0, 1, translate.x, translate.y);    
        ctx.beginPath();
        posArray.forEach((pos, i) => { 
            if(i === 0) { ctx.moveTo(pos.x, pos.y); }
            else { ctx.lineTo(pos.x, pos.y); } 
        });    
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 描画されているものを基に除去する点群を求める
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param {number} boundaryThreshold 境界の閾値
     * @param {number} internalThreshold 内点の閾値
     * @param {number} sigmaX x の分散
     * @param {number} sigmaY y の分散
     * @param {number} sigmaXY x と y の共分散
     * @returns {Array<{x: number, y: number}>} 点群
     */
    static getRemoveArray(ctx, boundaryThreshold, internalThreshold, sigmaX, sigmaY, sigmaXY) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        let boundaryArray = []; // 境界の点の配列
        let internalArray = []; // 内部の点の配列

        for(let i = 0; i < data.length / 4; i += 1) {
            const x = i % ctx.canvas.width;
            const y = Math.floor(i / ctx.canvas.width);

            if(Pixel.isPointExternal(imageData, x, y)) {// 外部
                continue;
            }
            // 境界かどうか判定
            const boundary = Pixel.isPointBoundary(imageData, x, y);
            if(boundary) {// 境界
                boundaryArray.push({ x, y, });
            } else {// 内部
                internalArray.push({ x, y, });
            }
        }

        // 境界の点に乱数によるフィルターをかける
        boundaryArray = boundaryArray.filter(() => Math.random() < boundaryThreshold);

        // 内部の点に乱数によるフィルターをかける
        internalArray = internalArray.filter(() => Math.random() < internalThreshold);

        let removeArray = [];

        // 境界の点から生起する点を取得する
        boundaryArray.forEach(p => {
            const posArray = Pixel.getPosArray(sigmaX, sigmaY, sigmaXY, p);
            removeArray = removeArray.concat(posArray);
        });
    
        // 内部の点から生起する点を取得する
        internalArray.forEach(p => {
            const posArray = Pixel.getPosArray(sigmaX, sigmaY, sigmaXY, p);
            removeArray = removeArray.concat(posArray);
        });

        removeArray = removeArray.concat(boundaryArray);
        removeArray = removeArray.concat(internalArray);

        return removeArray;
    }

    /**
     * 除去する点群を描画する
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param {Array<{x: number, y: number}>} removeArray 除去する点群
     * @returns {void} なし  
     */
    static drawRemoveArray(ctx, removeArray) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        // 除去する点を非表示にする
        removeArray.forEach(p => {
            const x = p.x;
            const y = p.y;
            if(x < 0 || x >= imageData.width) { return; }
            if(y < 0 || y >= imageData.height) { return; }
            const i = y * imageData.width + x;

            data[i * 4 + 0] = 255;
            data[i * 4 + 1] = 255;
            data[i * 4 + 2] = 255;
            data[i * 4 + 3] = Math.random() * 255;
        });
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 点が外部か判定する
     * @param {ImageData} imageData イメージデータ
     * @param {number} x xの座標
     * @param {number} y yの座標
     * @returns {boolean} 点が外部かどうか
     */
    static isPointExternal(imageData, x, y) {
        if(x < 0 || x >= imageData.width) { return false; }
        if(y < 0 || y >= imageData.height) { return false; }
        const data = imageData.data;
        const i = y * imageData.width + x;
        const r = data[i * 4 + 0];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];
        if(r === 0 && g === 0 && b === 0 && a === 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 点が境界か判定する
     * @param {ImageData} imageData イメージデータ
     * @param {number} x xの座標
     * @param {number} y yの座標
     * @returns {boolean} 点が境界かどうか
     */
    static isPointBoundary(imageData, x, y) {
        if(x < 0 || x >= imageData.width) { return false; }
        if(y < 0 || y >= imageData.height) { return false; }
        if(Pixel.isPointExternal(imageData, x + 1, y)
        || Pixel.isPointExternal(imageData, x, y + 1)
        || Pixel.isPointExternal(imageData, x - 1, y)
        || Pixel.isPointExternal(imageData, x, y - 1)) {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * 2次元正規分布に従う座標配列を取得する
     * @param {number} sigmaX x の分散
     * @param {number} sigmaY y の分散
     * @param {number} sigmaXY x と y の共分散
     * @param {{x: number, y: number}} mu 平均
     * @returns {Array<{x: number, y: number}>} 点の配列
     */
    static getPosArray(sigmaX, sigmaY, sigmaXY, mu) {
        const sigma = [ sigmaX * sigmaX,    sigmaXY,            0, 
                        sigmaXY,            sigmaY * sigmaY,    0, 
                              0,            0,                  1 ];
        const lambda = Matrix.inverse(sigma);
    
        const posArray = [];
        const roundSigmaX = Math.round(sigmaX);
        const roundSigmaY = Math.round(sigmaY);
        // -2σ ～ +2σの範囲のピクセルを対象とする
        for(let x = mu.x - 2 * roundSigmaX; x <= mu.x + 2 * roundSigmaX; x += 1) {
            for(let y = mu.y - 2 * roundSigmaY; y <= mu.y + 2 * roundSigmaY; y += 1) {
                const pdf = Pixel.getPdf({x, y}, lambda, mu);
                const rand = Math.random();
                if(rand <= pdf) {
                    posArray.push({x, y});
                }
            }
        }
        return posArray;
    }

    /**
     * 正規化していないpdf(確率密度関数)の値を求める(正規化していなのでpdfではない)
     * @param {number} p 位置ベクトル
     * @param {number} lambda 分散共分散行列の逆行列
     * @param {number} mu 平均
     * @returns {void} なし
     */
    static getPdf(p, lambda, mu) {
        const v = { x: p.x - mu.x, y: p.y - mu.y, };
        const nv = Matrix.multiplyVec(lambda, v);
        // あえて正規化しない。そうすると平均の点のpdfがちょうど1になるので都合がよい
        const pdf = Math.exp(-1 / 2 * (v.x * nv.x + v.y * nv.y)); 
        return pdf;
    }
}