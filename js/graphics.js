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
                ret.push({ color, count: 1 });
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
        color.r = Scalar.limit(Math.round(color.r), 0, 255);
        color.g = Scalar.limit(Math.round(color.g), 0, 255);
        color.b = Scalar.limit(Math.round(color.b), 0, 255);
        color.a = Scalar.limit(Math.round(color.a), 0, 255);
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

    static equalImageData(src, dst) {
        const sd = src.data,
            dd = dst.data;
        for(let i = 0; i < sd.length; i += 1) {
            if(sd[i] !== dd[i]) { return false; }   // not equal
        }
        return true;    // equal
    }

    static drawTriangleQiita(pos1, pos2, pos3) {
        const pixels = [];
        let x1 = Math.trunc(pos1.x), y1 = Math.trunc(pos1.y),
            x2 = Math.trunc(pos2.x), y2 = Math.trunc(pos2.y),
            x3 = Math.trunc(pos3.x), y3 = Math.trunc(pos3.y);
        // y1 < y2 < y3 となるように並べ直す
        if(y1 > y2) {
            [x1, x2] = [x2, x1];    // swap(x1, x2);
            [y1, y2] = [y2, y1];    // swap(y1, y2);
        }
        if(y1 > y3) {
            [x1, x3] = [x3, x1];    // swap(x1, x3);
            [y1, y3] = [y3, y1];    // swap(y1, y3);
        }
        if(y2 > y3) {
            [x2, x3] = [x3, x2];    // swap(x2, x3);
            [y2, y3] = [y3, y2];    // swap(y2, y3);
        }
  
        // 例外的なパターンの排除
        if (y1 === y3) {
            return { x1, x2, x3, y1, y2, y3, pixels };        
        }
        if (x1 === x2 && x2 === x3) {
            return { x1, x2, x3, y1, y2, y3, pixels };
        }
  
        if (y1 === y2) {
            draw_flatTriangle(x3, y3, x1, y1, x2);
            return { x1, x2, x3, y1, y2, y3, pixels };
        } else if (y2 === y3) {
            draw_flatTriangle(x1, y1, x2, y2, x3);
            return { x1, x2, x3, y1, y2, y3, pixels };
        } else {
            const xa = Math.trunc(x1 * (y2 - y1) / (y3 - y1) + x3 * (y2 - y3) / (y1 - y3));
            draw_flatTriangle(x1, y1, xa, y2, x2);
            draw_flatTriangle(x3, y3, xa, y2, x2);
            return { x1, x2, x3, xa, y1, y2, y3, pixels };
        }

        function abs(x) { return Math.abs(x); }
        function sgn(x, d) { return  x > 0 ? d : (x < 0 ? -d : 0); }

        // この関数はハードウェア化する
        function draw_Xaxis(y, x2, x3) {
            let x = x2;
            const adx = abs(x3 - x2);
            const sdx = sgn(x3 - x2, 1);
        
            if(adx === 0) {// 書き込みが一点のケース
                pixels.push({ x, y, });
                return;
            }
        
            for(let pos = 0; pos <= adx; x += sdx, pos++) {
                pixels.push({ x, y, });
            }
        }

        // この関数はハードウェア化する
        function draw_flatTriangle(x1, y1, x2, y2, x3) {
            const ady = abs(y1 - y2);
            const sdy = sgn(y1 - y2, 1);
            const adxa = abs(x1 - x2);
            const sdxa = sgn(x1 - x2, 1);
            const adxb = abs(x1 - x3);
            const sdxb = sgn(x1 - x3, 1);
            const dxa = (sdxa === sdy) ? 1 * sdy : -1 * sdy;    // ここの符号を反転させてみたがよいのか？
            const dxb = (sdxb === sdy) ? 1 * sdy : -1 * sdy;    // ここの符号を反転させてみたがよいのか？
            let xa = x2;
            let xb = x3;
            let xda = 0;
            let xdb = 0;
            let y = y2;

            for(let ypos = 0; ypos <= ady; y += sdy, ypos++) {
                draw_Xaxis(y, xa, xb);
                xda += adxa;
                while (xda >= ady) {
                    xa += dxa;
                    xda -= ady;
                }
                xdb += adxb;
                while (xdb >= ady) {
                    xb += dxb;
                    xdb -= ady;
                }
            } 
        }
    }

    static drawSquare(argPoints) {
        const map = {};
        const pixels = [];

        // points to int
        const points = argPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y), }));
        
        // 0, 1, 2
        Graphics.drawTriangle([ points[0], points[1], points[2] ], (x, y) => {
            const key = `${x}-${y}`;
            if(typeof map[key] === 'undefined') {
                map[key] = 0;
                pixels.push({ x, y, }); 
            }
        });
        // 2, 3, 0
        Graphics.drawTriangle([ points[2], points[3], points[0] ], (x, y) => {
            const key = `${x}-${y}`;
            if(typeof map[key] === 'undefined') {
                map[key] = 0;
                pixels.push({ x, y, }); 
            }
        });
        // 4 line segments
        points.forEach((p, i) => {
            const iNext = (i + 1) % points.length;
            const pNext = points[iNext];
            Graphics.drawLineBresenham([p, pNext], (x, y) => {
                const key = `${x}-${y}`;
                if(typeof map[key] === 'undefined') {
                    map[key] = 0;
                    pixels.push({ x, y, }); 
                }
            });   
        });
        return pixels;        
    }

    static drawLineBresenham(points, func) {
        let x0 = points[0].x, y0 = points[0].y, x1 = points[1].x, y1 = points[1].y;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        let sx; 
        if(x0 < x1) {
            sx = 1;
        } else {
            sx = -1;
        }
        let sy;
        if(y0 < y1) {
            sy = 1;
        } else {
            sy = -1;
        }
        let err = dx - dy;
 
        while(true) {
            func(x0, y0);
            if (x0 === x1 && y0 === y1) { break; }
            const e2 = 2 * err;
            if (e2 > -dy) { 
                err = err - dy;
                x0 = x0 + sx;
            }
            if (e2 < dx) { 
                err = err + dx;
                y0 = y0 + sy;
            }
        }
    }

    static drawTriangle(points, func) {
        const pixels = [];
        /* at first sort the three vertices by y-coordinate ascending so v1 is the topmost vertice */
        const [v1, v2, v3] = sortVerticesAscendingByY(points);

        /* here we know that v1.y <= v2.y <= v3.y */
        if (v2.y === v3.y) {/* check for trivial case of bottom-flat triangle */        
            fillBottomFlatTriangle(v1, v2, v3);
        } else if (v1.y === v2.y) {/* check for trivial case of top-flat triangle */
            fillTopFlatTriangle(v1, v2, v3);
        } else {/* general case - split the triangle in a topflat and bottom-flat one */
            const v4 = {
                x: Math.trunc((v1.x + ((v2.y - v1.y) / (v3.y - v1.y)) * (v3.x - v1.x))), 
                y: v2.y,
            };
            fillBottomFlatTriangle(v1, v2, v4);
            fillTopFlatTriangle(v2, v4, v3);
        }

        function abs(x) { return Math.abs(x); }
        function sgn(x, d) { return  x > 0 ? d : (x < 0 ? -d : 0); }

        function drawXLine(y, x2, x3) {
            let x = x2;
            const adx = abs(x3 - x2);
            const sdx = sgn(x3 - x2, 1);
        
            // if(adx === 0) {// 書き込みが一点のケース
            //     pixels.push({ x, y, });
            //     return;
            // }
        
            for(let pos = 0; pos <= adx; x += sdx, pos++) {
                //pixels.push({ x, y, });
                func(x, y);
            }
        }

        function sortVerticesAscendingByY(points) {
            let v1 = points[0], v2 = points[1], v3 = points[2];
            // y1 < y2 < y3 となるように並べ直す
            if(v1.y > v2.y) {
                [v1, v2] = [v2, v1]; 
            }
            if(v1.y > v3.y) {
                [v1, v3] = [v3, v1]; 
            }
            if(v2.y > v3.y) {
                [v2, v3] = [v3, v2];
            }
            return [v1, v2, v3];
        }        

        function fillBottomFlatTriangle(v1, v2, v3) {
            const invslope1 = (v2.x - v1.x) / (v2.y - v1.y);
            const invslope2 = (v3.x - v1.x) / (v3.y - v1.y);

            let curx1 = v1.x;
            let curx2 = v1.x;

            for(let scanlineY = Math.trunc(v1.y); scanlineY <= Math.trunc(v2.y); scanlineY += 1) {
                drawXLine(scanlineY, Math.trunc(curx1), Math.trunc(curx2));
                curx1 += invslope1;
                curx2 += invslope2;
            }
        }

        function fillTopFlatTriangle(v1, v2, v3) {
            const invslope1 = (v3.x - v1.x) / (v3.y - v1.y);
            const invslope2 = (v3.x - v2.x) / (v3.y - v2.y);

            let curx1 = v3.x;
            let curx2 = v3.x;

            for(let scanlineY = Math.trunc(v3.y); scanlineY >= Math.trunc(v1.y); scanlineY -= 1) {
                drawXLine(scanlineY, Math.trunc(curx1), Math.trunc(curx2));
                curx1 -= invslope1;
                curx2 -= invslope2;
            }
        }
    }
}