/**
 * 黒板消しのクラス
 */
class Eraser {

    static mat = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    static width = 100;
    static height = 100;
    static radius = 5;
    static img = null;

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

    static draw(ctx, mat) {
        //ctx.reset();
        ctx.save();
        if(mat) {
            Matrix.setTransform(ctx, mat);
        }
        ctx.drawImage(Model.eraserImg, 0, 0);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if(mat) {
            Matrix.setTransform(ctx, mat);
            Matrix.transform(ctx, Eraser.mat);
        } else {
            Matrix.setTransform(ctx, Eraser.mat);
        }
        
        
        ctx.beginPath();
        ctx.roundRect(0, 0, Eraser.width, Eraser.height, Eraser.radius);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 塗られているピクセルのインデックスからアニメーションの初期化を行う
     * @param {Array<number>} indexes 塗られているピクセル
     */
    static setPixels(indexes) {
        // 塗られているピクセルを黒板消しの座標系へ変換し、消すための初期位置を計算する
    }

    /**
     * 塗られているピクセルのインデックスの配列を渡す
     * @param {HTMLCanvasElement} canvas キャンバス
     * @returns {Array<number>} インデックスの配列 
     */
    static getFilledPixels(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        const indexes = [];
        for(let i = 0; i < data.length / 4; i += 1) {
            if(data[i * 4 + 3] !== 0) {// 塗られているとする
                indexes.push(i);
            }
        }
        return indexes;
    }

    static getLeftMatrix(indexes, width) {
        // x, y の min / max を求める
        MinMax.save();
        indexes.forEach(i => {
            const x = i % width;
            const y = Math.floor(i / width);
            MinMax.add({ x, y, });
        });
        const mm = MinMax.get();
        const rect = MinMax.getRect();
        MinMax.restore();

        // 現在の黒板消しの角度を求める
        const baseRad = Matrix.getRotateAngle(Eraser.mat);

        // 黒板消しの角度を消す箇所を覆う矩形のアスペクト比を考慮して求める
        const aspect = rect.width / rect.height;
        const threshhold = 2;
        
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
        // 行列を左からかける
        // T'RT・M の T'RT を求める
        // 回転中心座標に現在の行列を当てる
        const center = { x: Eraser.width / 2, y: Eraser.height / 2, };
        const movedCenter = Matrix.multiplyVec(Eraser.mat, center);
        const trans = Matrix.translate(-movedCenter.x, -movedCenter.y);
        const rotate = Matrix.rotate(rad - baseRad);
        const revTrans = Matrix.translate(movedCenter.x, movedCenter.y);
        let mat = Matrix.multiply(rotate, trans);
        mat = Matrix.multiply(revTrans, mat);

        return mat;
    }

    static getRect(width, indexes, mat) {
        const rad = Matrix.getRotateAngle(mat);
        console.log(Utility.rad2deg(rad));

        // 現在の黒板消しの角度を求める
        const baseRad = Matrix.getRotateAngle(Eraser.mat);

        console.log(Utility.rad2deg(rad + baseRad));

        const rot = Matrix.rotate(-(rad + baseRad));

        MinMax.save();
        MinMax.init();
        for(let i = 0; i < indexes.length; i += 1) {
            const x = indexes[i] % width;
            const y = Math.floor(indexes[i] / width);
            const rotated = Matrix.multiplyVec(rot, { x, y, });
            MinMax.add(rotated);
        }
        const points = MinMax.getRectPoints();              
        MinMax.restore();

        const invertRot = Matrix.rotate(rad + baseRad);
        const inverted = points.map(p => Matrix.multiplyVec(invertRot, p));  

        return inverted;
    }
}