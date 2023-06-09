/**
 * 黒板消しのクラス
 */
class Eraser {

    static mat = [1, 0, 0, 0, 1, 0, 0, 0, 1];   // 黒板消しの矩形を画像にフィットさせるための行列(この行列はUIを使ってユーザーに決定させる)
    static width = 100;     // 黒板消しの矩形の幅
    static height = 100;    // 黒板消しの矩形の高さ
    static radius = 5;      // 黒板消しの矩形の角丸の半径
    static img = null;      // 黒板消しの画像

    /**
     * 黒板消しを定義する
     * @param {Array<number>} mat 黒板消しの消える矩形用のアフィン変換行列
     * @param {number} width 黒板消しの消える矩形の幅
     * @param {number} height 黒板消しの消える矩形の高さ
     * @param {number} radius 黒板消しの消える矩形の角の半径
     * @param {string} filePath 黒板消しの画像ファイルパス
     * @returns {void} なし
     */
    static async init(mat, width, height, radius, filePath) {
        Eraser.mat = mat;
        Eraser.width = width;
        Eraser.height = height;
        Eraser.radius = radius;
        Eraser.img = await Utility.loadImage(filePath);
    }

    /**
     * 黒板消しを描画する
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト
     * @param {Array<number>} mat 行列 
     * @param {boolean} drawRect 矩形を表示するか(省略可。デフォルト値はfalse)
     * @returns {void} なし
     */
    static draw(ctx, mat, drawRect = false) {
        // 黒板消しの画像を描画
        ctx.save();
        Matrix.setTransform(ctx, mat);
        ctx.drawImage(Model.eraserImg, 0, 0);
        ctx.restore();
        // 黒板消しの角丸矩形(事前に定義しておくもの)を描画(デバッグ用)
        if(!drawRect) { return; }
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';        
        Matrix.setTransform(ctx, mat);
        Matrix.transform(ctx, Eraser.mat);
        Paint.createMovedRoundRectPath(ctx, { x: 0, y: 0, }, { x: 0, y: 0, }, 
            Eraser.width, Eraser.height, Eraser.radius);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 回転行列を描画内容から取得する
     * @param {Array<number>} indexes 描画されているインデックスの配列 
     * @param {{ width: number, height: number, }} size サイズ 
     * @returns {Array<number>} 回転行列
     */
    static getRotateMatrixByIndexes(indexes, size) {
        const width = size.width;
        // x, y の min / max を求める
        MinMax.save();
        indexes.forEach(i => {
            const x = i % width;
            const y = Math.floor(i / width);
            MinMax.regist({ x, y, });
        });
        const mm = MinMax.get();
        const rect = MinMax.getRect();
        MinMax.restore();

        // 現在の黒板消しの角度を求める
        const baseRad = Matrix.getRotateAngle(Eraser.mat);

        // 黒板消しの角度を消す箇所を覆う矩形のアスペクト比を考慮して求める
        const aspect = rect.width / rect.height;
        const threshhold = 2;
        
        // 角度をアスペクト比で決める
        let deg;
        if(aspect > threshhold) {// 結構横長
            deg = 0;
        } else if(aspect < 1 / threshhold) {// 結構縦長
            deg = -90;
        } else if(1 < aspect && aspect <= threshhold) {// 1 < aspect <= t
            deg = Utility.interpolation(-45, 0, (aspect - 1) / (threshhold - 1)); 
        } else if(1 / threshhold <= aspect && aspect <= 1) {// 1 / t <= aspect <= 1
            deg = Utility.interpolation(-90, -45, 1 - (1 - aspect) / (1 - 1 / threshhold)); 
        }
        console.log(`aspect: ${aspect.toFixed(2)}, degree: ${deg.toFixed(2)}`);
        const rad = Utility.deg2rad(deg);
        
        // 実際に回す角度を計算する
        return Matrix.rotate(rad - baseRad);
    }

    /**
     * 
     * ※本関数の戻り値は、Utility.strokePath(eraserCtx, rectPoints); で描画できる
     * @param {Array<number>} indexes 描画されているインデックスの配列 
     * @param {{ width: number, height: number, }} size サイズ 
     * @param {Array<number>} rotMat 回転行列
     * @returns 逆回転した座標系における最大最小の点(4つ)
     */
    static getRectPointsForDebug(indexes, size, rotMat) {
        const width = size.width;
        // 角度合わせした行列の角度
        const rad = Matrix.getRotateAngle(rotMat);
        // 現在の黒板消しの角度を求める
        const baseRad = Matrix.getRotateAngle(Eraser.mat);
        // 逆回転行列を求める
        const rot = Matrix.rotate(-(rad + baseRad));

        MinMax.save();
        MinMax.init();
        for(let i = 0; i < indexes.length; i += 1) {
            const x = indexes[i] % width;
            const y = Math.floor(indexes[i] / width);
            const rotated = Matrix.multiplyVec(rot, { x, y, });
            MinMax.regist(rotated);
        }
        const rectPoints = MinMax.getRectPoints();              
        MinMax.restore();

        const invertRot = Matrix.rotate(rad + baseRad);
        const inverted = rectPoints.map(p => Matrix.multiplyVec(invertRot, p));  

        return inverted;
    }

    static getMatrices(indexes, size, rotMat) {
        const width = size.width;
        const height = size.height;
        const speed = 10;//Eraser.width - 2 * Eraser.radius;
        
        // 角度合わせした行列の角度
        const rad = Matrix.getRotateAngle(rotMat);
        // 現在の黒板消しの角度を求める
        const baseRad = Matrix.getRotateAngle(Eraser.mat);
        // 逆回転行列を求める
        const rot = Matrix.rotate(-(rad + baseRad));
        
        let points = [];
        let dbgCnt = 0;
        let minY = -10000000;
        while(true) {
            if(dbgCnt++ > 100) { throw 'infinite loop.'; }

            // 最小のYを見つける
            MinMax.save();
            MinMax.init();
            for(let i = 0; i < indexes.length; i += 1) {
                const x = indexes[i] % width;
                const y = Math.floor(indexes[i] / width);
                const rotated = Matrix.multiplyVec(rot, { x, y, });
                if(minY < rotated.y) {                    
                    MinMax.regist(rotated);
                }                
            }
            const mm = MinMax.get();              
            MinMax.restore();

            if(mm.minY === Number.MAX_VALUE) {// 最小のYが見つからなかった
                break; // 正常終了
            }

            // 行の左と右を求める
            MinMax.save();
            MinMax.init();
            for(let i = 0; i < indexes.length; i += 1) {
                const x = indexes[i] % width;
                const y = Math.floor(indexes[i] / width);
                const rotated = Matrix.multiplyVec(rot, { x, y, });
                if(mm.minY <= rotated.y && rotated.y <= mm.minY + Eraser.height - Eraser.radius * 2) {
                    MinMax.regist(rotated);
                }            
            }
            const rectPoints = MinMax.getRectPoints();              
            MinMax.restore();
            
            const y = rectPoints[0].y - Eraser.radius,  // 始点と終点の y
                start = { x: rectPoints[0].x - Eraser.radius, y, }, // 始点
                end = { x: rectPoints[1].x - Eraser.width + Eraser.radius, y, };    // 終点

            // 1つ前の線分の終点から現在の始点までのアニメーション
            if(points.length === 0) {
                points.push({ mat: point2Mat(start), pos: start, });
            } else {
                points = addPoints(points, start, speed);
            }         

            // 始点から終点までのアニメーション
            if(end.x > start.x) {
                points = addPoints(points, end, speed);
            }

            minY = rectPoints[3].y;
        }

        // アニメーションデータを作成する
        // 戻り値は、行列と非表示にするインデックスの配列(なので空配列ももちろんある)

        const tmpCanvas = Utility.createCanvas(width, height);
        const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });

        if(points.length === 1) {
            points.push(points[0]);
        }
        const erasedPoints = [];
        points.forEach((point, i) => {
            const prePoint = i !== 0 ? points[i - 1] : points[0];
            const preMat = Matrix.multiply(prePoint.mat, Eraser.mat);
            let prePos = Matrix.multiplyVec(preMat, { x: 0, y: 0, });
            const curPoint = points[i];
            const curMat = Matrix.multiply(curPoint.mat, Eraser.mat);
            let curPos = Matrix.multiplyVec(curMat, { x: 0, y: 0, });

            prePos = Matrix.multiplyVec(rot, prePos);
            curPos = Matrix.multiplyVec(rot, curPos);
            const vec = Vector.subtract(curPos, prePos);

            tmpCtx.save();            
            tmpCtx.reset();            
            Matrix.setTransform(tmpCtx, prePoint.mat);
            Matrix.transform(tmpCtx, rotMat);
            Matrix.transform(tmpCtx, Eraser.mat);
            Paint.createMovedRoundRectPath(tmpCtx, { x: 0, y: 0, }, vec, 
                Eraser.width, Eraser.height, Eraser.radius);
            tmpCtx.fill();
            tmpCtx.restore();

            let movedRectPoints = [
                { x: 0, y: 0, }, { x: Eraser.width, y: 0, }, { x: Eraser.width, y: Eraser.height, }, { x: 0, y: Eraser.height, },
            ];
            movedRectPoints = movedRectPoints.concat(movedRectPoints.map(p => Vector.add(p, vec)));
            // 行列をかける
            let tmpMat = Matrix.multiply(rotMat, Eraser.mat);
            tmpMat = Matrix.multiply(prePoint.mat, tmpMat);
            movedRectPoints = movedRectPoints.map(p => Matrix.multiplyVec(tmpMat, p));
            // 最大最小を取得する
            MinMax.save();
            MinMax.init();
            movedRectPoints.forEach(p => { MinMax.regist(p); });
            MinMax.truncate();  // 小数点切り捨て
            MinMax.addMargin(2);    // マージン付与
            const mm = MinMax.get();
            MinMax.restore();   
            // 最大と最小を制限する
            Object.keys(mm).forEach(key => { 
                mm[key] = Utility.limit(mm[key], 0, key.indexOf('X') >= 0 ? width : height); 
            });

            const imageData = tmpCtx.getImageData(0, 0, tmpCtx.canvas.width, tmpCtx.canvas.height);
            const data = imageData.data;

            curPoint.indexes = [];

            for(let x = mm.minX; x <= mm.maxX; x += 1) {
                for(let y = mm.minY; y <= mm.maxY; y += 1) {
                    const index = x + y * width;
                    if(data[index * 4 + 3] !== 0) { //} && indexes.includes(index) && !erasedPoints.includes(index)) {
                        // 消す範囲に収まっている 且つ 描画されている 且つ 消されていない
                        // 一旦、消す範囲に収まっているのみにする(それが一番早いので)
                        curPoint.indexes.push(index);
                        erasedPoints.push(index);
                    }
                }
            }            
        });

        return points;

        function addPoints(points, end, speed) {
            let popped = null;
            if(points.length) { popped = points.pop(); }
            if(!popped) { throw 'no pop error'; }
            // 始点から終点までのアニメーションを作成する
            const start = popped;
            let divided = Utility.divideLineSegment(start.pos, end, speed);
            divided = divided.map(d => ({ mat: point2Mat(d), pos: d }));
            return points.concat(divided);
        }

        function point2Mat(point) {
            const invertRot = Matrix.rotate(rad + baseRad);
            const inverted = Matrix.multiplyVec(invertRot, point);        
            const buildMat = Matrix.multiply(rotMat, Eraser.mat);
            const transformed = Matrix.multiplyVec(buildMat, { x: 0, y: 0, });
            return Matrix.translate(inverted.x - transformed.x, inverted.y - transformed.y);
        }
    }
}