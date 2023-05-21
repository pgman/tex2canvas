class Pixel {

    /**
     * アニメーション用のピクセルデータを取得する
     * @param {Array<{x: number, y: number}>} posArray 点の配列
     * @param {number} lineWidth 線の太さ
     * @param {string} strokeStyle ストローク時のスタイル
     * @param {number} boundaryThreshold 境界の閾値
     * @param {number} internalThreshold 内点の閾値
     * @param {number} sigma 分散
     * @param {number} length 線分を描画する長さ 
     * @returns {Object} アニメーション用のピクセルデータのオブジェクト
     */
    static getAnimationPixelData(posArray, lineWidth, strokeStyle, boundaryThreshold, internalThreshold, 
        sigma, length) {
        console.time('getPixelData');

        // posArrayの min/max を取得する
        const padding = 4;
        const mm = Pixel.getMinMaxForDraw(posArray, lineWidth, padding);

        // canvasを作成し、線分を描画する
        const width = mm.maxX - mm.minX;
        const height = mm.maxY - mm.minY;
        const canvas = Utility.createCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        Pixel.drawPosArray(ctx, posArray, lineWidth, strokeStyle, { x: -mm.minX, y: -mm.minY });

        // 除去する点群を取得する
        const removeArray = Pixel.getRemoveArray(ctx, boundaryThreshold, internalThreshold, sigma, sigma, 0);
        // 除去する点群を非表示にする
        Pixel.drawRemoveArray(ctx, removeArray);

        // アニメーション用のcanvasを作成する
        const indexesArray = [];

        // 全体の長さを求めてみる
        const wholeLength = posArray.reduce((p, c, i) => p + (i > 0 ? Vector.dist(posArray[i - 1], c) : 0), 0);    
        console.log('whole length: ', wholeLength);

        // 作業用のcanvas
        const tmpCanvas = Utility.createCanvas(width, height);
        const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });

        let curLength = 0;
        let dbgCnt = 0;
        while(true) {
            if(dbgCnt++ > 100000) { 
                console.error('inifinity loop!!');
                break;
            }
            let tmpLength = 0;
            let tmpIndex = -1;
            for(let i = 0; i < posArray.length; i += 1) {
                if(i - 1 < 0) { continue; } // i === 1 からループする
                const dist = Vector.dist(posArray[i - 1], posArray[i]);
                tmpLength += dist;
                if(curLength <= tmpLength) {      
                    tmpIndex = i;
                    const diff = curLength - tmpLength + dist;
                    const lastIndexes = indexesArray.length === 0 ? null : indexesArray[0];
                    const indexes = Pixel.createIndexes(tmpCtx, lastIndexes, posArray, tmpIndex, diff / dist,
                        { x: -mm.minX, y: -mm.minY });
                    indexesArray.push(indexes);
                    break;
                } else if(i + 1 >= posArray.length) {
                    // 最終
                    tmpIndex = posArray.length - 1;
                    const lastIndexes = indexesArray.length === 0 ? null : indexesArray[0];
                    const indexes = Pixel.createIndexes(tmpCtx, lastIndexes, posArray, tmpIndex, 1,
                        { x: -mm.minX, y: -mm.minY });
                    indexesArray.push(indexes);
                }
            }
            const epsilon = 0.00001;
            if(curLength >= wholeLength - epsilon) {
                break;
            }        
            curLength += length;
        }

        console.timeEnd('getPixelData');

        return {
            rect: {            
                x: mm.minX,
                y: mm.minY,
                width: canvas.width,
                height: canvas.height,
            },
            canvas,
            indexesArray,
            memory: indexesArray.length * canvas.width * canvas.height * 4,
        };    
    }

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
        mm.maxX = Math.ceil(mm.maxX);
        mm.maxY = Math.ceil(mm.maxY);

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

            if(!Pixel.isPointExternal(imageData, x, y)) {
                data[i * 4 + 0] = 255;
                data[i * 4 + 1] = 255;
                data[i * 4 + 2] = 255;
                data[i * 4 + 3] = Math.random() * 255;
            }            
        });
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 描画するインデックス(アニメーションの1フレーム)の作成
     * @param {CanvasRenderingContext2D} tmpCtx 作業用canvasのコンテキスト
     * @param {Array<number>} lastIndexes 1つ前のインデックスの配列
     * @param {Array<{x:number, y: number}>} posArray 点配列 
     * @param {number} index インデックス
     * @param {number} rate 割合 
     * @param {{x:number, y: number}} translate 平行移動量 
     * @returns {Array<number>} 描画するインデックスの配列
     */
    static createIndexes(tmpCtx, lastIndexes, posArray, index, rate, translate) {
        // 描画する(何色でもよいので、白色で塗る)
        tmpCtx.save();
        tmpCtx.reset();
        tmpCtx.lineCap = 'round';
        tmpCtx.lineJoin = 'round';
        tmpCtx.lineWidth = lineWidth;
        tmpCtx.strokeStyle = `rgba(255, 255, 255, 1)`; // a は 0.0～1.0
        tmpCtx.setTransform(1, 0, 0, 1, translate.x, translate.y); 
        tmpCtx.beginPath();   
        tmpCtx.moveTo(posArray[0].x, posArray[0].y); 
        let mm;       
        posArray.forEach((pos, i) => { 
            if(i <= 0 || i > index) { return; }
            const posPre = posArray[i - 1];
            let newPos;
            if(i < index) {     
                newPos = pos;
            } else if(i === index) {
                let vec = Vector.subtract(pos, posPre);
                vec = Vector.scale(vec, rate);
                newPos = Vector.add(posPre, vec);

                MinMax.save();
                MinMax.init();
                MinMax.add(pos);
                MinMax.add(newPos);
                mm = MinMax.get();
                MinMax.restore();
            }
            tmpCtx.lineTo(newPos.x, newPos.y);            
        });
        tmpCtx.stroke();
        tmpCtx.restore();

        // 塗られている箇所のみを塗る
        const tmpImageData = tmpCtx.getImageData(0, 0, tmpCtx.canvas.width, tmpCtx.canvas.height);

        // 戻り値
        const indexes = [];

        // min / maxを大きくする
        mm.minX = Math.floor(mm.minX);
        mm.minY = Math.floor(mm.minY);
        mm.maxX = Math.ceil(mm.maxX);
        mm.maxY = Math.ceil(mm.maxY);
        const radius = Math.round(lineWidth / 2);
        const tmpPadding = 2;
        mm.minX -= radius + tmpPadding;
        mm.minY -= radius + tmpPadding;
        mm.maxX += radius + tmpPadding;
        mm.maxY += radius + tmpPadding;
        
        mm.minX += translate.x;
        mm.minY += translate.y;
        mm.maxX += translate.x;
        mm.maxY += translate.y;

        if(mm.minX < 0) { mm.minX = 0; }
        if(mm.minX > tmpCtx.canvas.width) { mm.minX = tmpCtx.canvas.width; }
        if(mm.minY < 0) { mm.minY = 0; }
        if(mm.minY > tmpCtx.canvas.height) { mm.minY = tmpCtx.canvas.height; }
        if(mm.maxX < 0) { mm.maxX = 0; }
        if(mm.maxX > tmpCtx.canvas.width) { mm.maxX = tmpCtx.canvas.width; }
        if(mm.maxY < 0) { mm.maxY = 0; }
        if(mm.maxY > tmpCtx.canvas.height) { mm.maxY = tmpCtx.canvas.height; }
        
        for(let x = mm.minX; x <= mm.maxX; x += 1) {
            for(let y = mm.minY; y <= mm.maxY; y += 1) {
                const i = y * tmpCtx.canvas.width + x;
                if(Pixel.isPointExternal(tmpImageData, x, y)) {// 外部
                    continue;
                }
                if(lastIndexes) {
                    if(lastIndexes.indexOf(i) < 0) {// ない
                        indexes.push(i);
                    }
                } else {// 初回なので無条件に追加する
                    indexes.push(i);
                }     
            }
        }
        return indexes;
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