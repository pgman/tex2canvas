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

    static draw(ctx) {
        ctx.drawImage(Model.eraserImg, 0, 0);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        Matrix.setTransform(ctx, Eraser.mat);
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

    static getAngle(indexes, width) {
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
        // (0, 0) と (1, 0) を動かすことで角度を求める
        const movedOrigin = Matrix.multiplyVec(Eraser.mat, { x: 0, y: 0 });
        const movedOneZero = Matrix.multiplyVec(Eraser.mat, { x: 1, y: 0 });
        const vec = Vector.subtract(movedOneZero, movedOrigin);
        const baseRad = Math.atan2(vec.y, vec.x);

        // 黒板消しの角度を求める
        console.log(mm);
        const aspect = rect.width / rect.height;
        const threshhold = 5;
        let deg;
        if(aspect > threshhold) {// 結構横長
            deg = 0;
        } else if(aspect < 1 / threshhold) {// 結構縦長
            deg = 90;
        } else if(1 < aspect && aspect <= threshhold) {// 1 < aspect <= t
            deg = Utility.interpolation(0, 45, (threshhold - aspect) / (threshhold - 1)); 
        } else if(1 / threshhold <= aspect && aspect <= 1) {// 1 / t <= aspect <= 1
            deg = Utility.interpolation(45, 90, (1 - aspect) / (1 - 1 / threshhold)); 
        }
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
}