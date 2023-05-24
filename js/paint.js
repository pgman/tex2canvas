// 描画に関するクラス
class Paint {
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param {{ pos: { x:number, y: number }, width: number, arc: boolean, }} start 始点
     * @param {{ pos: { x:number, y: number }, width: number, arc: boolean, }} end 終点 
     */
    static fillTrapezoid(ctx, start, end) {
        let vec = Vector.subtract(end.pos, start.pos);  // 始点から終点へのベクトルを求める
        const unitVec = Vector.unit(vec);
        const nrm = { x: unit.y, y: -unit.x, };
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
        ctx.save();
        ctx.moveTo(posArray[0].x, posArray[0].y);

        ctx.restore();
    }
}