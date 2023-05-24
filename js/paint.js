// 描画に関するクラス
class Paint {
    /**
     * 台形を塗りつぶす
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param {{ pos: { x: number, y: number }, width: number, arc: boolean, }} start 始点
     * @param {{ pos: { x: number, y: number }, width: number, arc: boolean, }} end 終点 
     * @returns {void} なし
     */
    static fillTrapezoid(ctx, start, end) {
        const vec = Vector.subtract(end.pos, start.pos);  // 始点から終点へのベクトルを求める
        const unit = Vector.unit(vec);  // 単位ベクトル化する
        const nrm = { x: unit.y, y: -unit.x, }; // -90度回転する
        // 角度を求める
        const angle = Math.atan2(nrm.y, nrm.x);
        // 点を求める
        const posArray = [
            {
                x: start.pos.x + nrm.x * start.width / 2,
                y: start.pos.y + nrm.y * start.width / 2,
            },
            {
                x: end.pos.x + nrm.x * end.width / 2,
                y: end.pos.y + nrm.y * end.width / 2,
            },
            {
                x: end.pos.x - nrm.x * end.width / 2,
                y: end.pos.y - nrm.y * end.width / 2,
            },
            {
                x: start.pos.x - nrm.x * start.width / 2,
                y: start.pos.y - nrm.y * start.width / 2,
            },
        ];

        // 塗りつぶす
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(posArray[0].x, posArray[0].y);
        ctx.lineTo(posArray[1].x, posArray[1].y);
        if(!end.arc) {// 終点を丸くする
            ctx.lineTo(posArray[2].x, posArray[2].y);        
        } else {
            ctx.arc(end.pos.x, end.pos.y, end.width / 2, angle, angle + Math.PI);
        }
        ctx.lineTo(posArray[3].x, posArray[3].y);
        if(!start.arc) {// 始点を丸くする
            ctx.lineTo(posArray[0].x, posArray[0].y);   
        } else {
            ctx.arc(start.pos.x, start.pos.y, start.width / 2, angle + Math.PI, angle);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}