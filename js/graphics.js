// API未使用(主に引数はimageData)の画像処理
class Graphics {
    /**
     * 画像の色情報を取得する
     * 色ごとに配列を作成し、同色がいくつあるか数える
     * @param {ImageData} imageData イメージデータ
     * @returns {Array<Object>} 色情報
     */
    static getColorInfo(imageData) {
        const ret = [];
        const data = imageData.data;
        for(let i = 0; i < data.length / 4; i += 1) {
            const color = [ data[i * 4 + 0], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3] ];
            const found = ret.find(c => c.color[0] === color[0] && c.color[1] === color[1] && c.color[2] === color[2] && c.color[3] === color[3]);
            if(!found) {
                ret.push({ color, count: 0 });
            } else {
                found.count += 1;
            }
        }
        ret.sort((a, b) => b.count - a.count);
        return ret;
    }

    /**
     * 画像が全て同じ色か確認する
     * 透過は(0,0,0,0)であることの確認する。他の画素は指定色であることを確認する
     * @param {ImageData} imageData イメージデータ
     * @param {Array<number>} color rgbデータ
     * @returns {boolean} 全て白か
     */
    static isSameColor(imageData, color) {
        const data = imageData.data;
        for(let i = 0; i < data.length / 4; i += 1) {
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === 0 && g === 0 && b === 0 && a === 0) {
                continue;
            } else if(r === color[0] && g === color[1] && b === color[2] && a !== 0) {
                continue;
            } else {
                return false;
            }
        }
        return true;
    }    

    /**
     * 線分描画(実際には描画される点を返す)
     * @param {{ x: number, y: number, }} start 始点 
     * @param {{ x: number, y: number, }} end 終点 
     * @param {{ width: number, height: number, }} size 描画するキャンバスのサイズ  
     * @returns {Array<{ index: number, rate: number, }>} インデックスと割合の配列
     */
    static drawLine(start, end, size) {
        // 始点と終点のx座標とy座標の差を計算
        const vec = Vector.subtract(end, start);
        // 線の長さを計算
        const length = Vector.length(vec);
        // 横軸との成す角を計算
        const rad = Math.atan2(vec.y, vec.x);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // 長さ分の線を描画
        const indexes = [];
        for(let l = 0; l <= length;) {
            const x = Math.round(start.x + l * cos);
            const y = Math.round(start.y + l * sin);
            // 画像外の点は描画しない
            if(x >= 0 && x < size.width && y >= 0 && y < size.height) { 
                const index = y * size.width + x;
                if(!indexes.some(elm => elm.index === index)) {
                    const rate = l === length ? 1 : l / length;
                    indexes.push({ index, rate }); 
                }
            }
            
            if(l === length) {
                break;
            }
            if(l + 1 > length) {// 次が最後
                l = length;
            } else {// 次が最後でない
                l += 1;
            }
        }
        return indexes;
    }

    /**
     * あるXに色のついた画素があるか調べる
     * @param {ImageData} imageData イメージデータ
     * @param {number} x Xの座標
     * @param {number} startY 走査するYの座標 
     * @param {number} height 走査するYの高さ 
     * @returns {boolean} あるXに色のついた画素があるか
     */
    static existX(imageData, x, startY, height) {
        const data = imageData.data;
        for(let y = startY; y < startY + height; y += 1) {
            const i = x + y * imageData.width;
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === 0 && g === 0 && b === 0 && a === 0) {
                continue;
            } else {
                return true;
            }
        }
        return false;
    }

    /**
     * あるXに色のついた画素があるか調べる
     * @param {ImageData} imageData イメージデータ
     * @param {number} y Yの座標
     * @param {number} startX 走査するXの座標 
     * @param {number} width 走査するXの幅 
     * @returns {boolean} あるYに色のついた画素があるか
     */
    static existY(imageData, y, startX, width) {
        const data = imageData.data;
        for(let x = startX; x < startX + width; x += 1) {
            const i = x + y * imageData.width;
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === 0 && g === 0 && b === 0 && a === 0) {
                continue;
            } else {
                return true;
            }
        }
        return false;   // その行は色が存在しない
    }

    /**
     * 画像の色を取得する
     * @param {ImageData} imageData イメージデータ
     * @param {number} xRate xの割合
     * @param {number} yRate yの割合
     * @returns {{ r: number, g: number, b: number, a: number }} 色
     */
    static getImageColor(imageData, xRate, yRate, startXRate = 0, endXRate = 1) {
        const width = imageData.width;
        const height = imageData.height;
        let x = startXRate + (endXRate - startXRate) * xRate * (width - 1);
        if(x < 0) { x = 0; }
        if(x > width - 1) { x = width - 1; }
        let y = yRate * (height - 1);
        if(y < 0) { y = 0; }
        if(y > height - 1) { y = height - 1; }
        // bilenear 周辺4pxの画素の色を取得する
        const xMin = Math.floor(x);
        const xMax = Math.ceil(x);
        const xt = x - xMin;
        const yMin = Math.floor(y);
        const yMax = Math.ceil(y);
        const yt = y - yMin;

        const xMinYMinColor = getColor(imageData, xMin, yMin);
        const xMinYMaxColor = getColor(imageData, xMin, yMax);
        const xMinColor = linearInterpolation(xMinYMinColor, xMinYMaxColor, yt);

        const xMaxYMinColor = getColor(imageData, xMax, yMin);
        const xMaxYMaxColor = getColor(imageData, xMax, yMax);
        const xMaxColor = linearInterpolation(xMaxYMinColor, xMaxYMaxColor, yt);

        let color = linearInterpolation(xMinColor, xMaxColor, xt);
        color.r = Math.round(color.r);
        color.g = Math.round(color.g);
        color.b = Math.round(color.b);
        color.a = Math.round(color.a);
        if(color.r < 0) { color.r = 0; }
        if(color.r > 255) { color.r = 255; }
        if(color.g < 0) { color.g = 0; }
        if(color.g > 255) { color.g = 255; }
        if(color.b < 0) { color.b = 0; }
        if(color.b > 255) { color.b = 255; }
        if(color.a < 0) { color.a = 0; }
        if(color.a > 255) { color.a = 255; }
        return color;

        function getColor(imageData, x, y) {
            const i = y * imageData.width + x;
            return {
                r: imageData.data[i * 4 + 0],
                g: imageData.data[i * 4 + 1],
                b: imageData.data[i * 4 + 2],
                a: imageData.data[i * 4 + 3],
            };
        }

        function linearInterpolation(c0, c1, t) {
            return { 
                r: (1 - t) * c0.r + t * c1.r,
                g: (1 - t) * c0.g + t * c1.g,
                b: (1 - t) * c0.b + t * c1.b,
                a: (1 - t) * c0.a + t * c1.a,
            };
        }
    }    

    /**
     * 画像の差分を取得する
     * @param {ImageData} src 画像 
     * @param {ImageData} dst 画像
     * @returns {Array<{ index: number, r: number, g: number, b: number, a: number, }>} 差分のインデックスと色の配列
     */
    static getImageDataDiff(src, dst) {
        const ret = [],
            sd = src.data,
            dd = dst.data;
        for(let i = 0; i < sd.length / 4; i += 1) {
            if(sd[i * 4 + 0] !== dd[i * 4 + 0] || sd[i * 4 + 1] !== dd[i * 4 + 1]
            || sd[i * 4 + 2] !== dd[i * 4 + 2] || sd[i * 4 + 3] !== dd[i * 4 + 3]) {
                ret.push({ index: i, r: dd[i * 4 + 0], g: dd[i * 4 + 1], b: dd[i * 4 + 2], a: dd[i * 4 + 3], });
            }
        }
        return ret;
    }

    static setColorByIndex(imageData, index, color) {
        const data = imageData.data;
        data[index * 4 + 0] = color[0];
        data[index * 4 + 1] = color[1];
        data[index * 4 + 2] = color[2];
        data[index * 4 + 3] = color[3];
    }
}