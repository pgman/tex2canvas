// 描画に関するクラス(描画に関するAPIを使用)
class Paint {
    /**
     * 線分のパスを作成する
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param { x: number, y: number, width: number, arc: boolean, }} start 始点
     * @param { x: number, y: number, width: number, arc: boolean, }} end 終点 
     * @returns {void} なし
     */
    static createLinePath(ctx, start, end) {
        const vec = { x: end.x - start.x, y: end.y - start.y, };  // 始点から終点へのベクトルを求める
        const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        const unit = { x: vec.x / len, y: vec.y / len, };  // 単位ベクトル化する
        const nrm = { x: unit.y, y: -unit.x, }; // -90度回転する        
        const angle = Math.atan2(nrm.y, nrm.x); // 角度を求める
        // 点を求める
        const posArray = [
            {
                x: start.x + nrm.x * start.width / 2,
                y: start.y + nrm.y * start.width / 2,
            },
            {
                x: end.x + nrm.x * end.width / 2,
                y: end.y + nrm.y * end.width / 2,
            },
            {
                x: end.x - nrm.x * end.width / 2,
                y: end.y - nrm.y * end.width / 2,
            },
            {
                x: start.x - nrm.x * start.width / 2,
                y: start.y - nrm.y * start.width / 2,
            },
        ];

        ctx.beginPath();
        ctx.moveTo(posArray[0].x, posArray[0].y);
        ctx.lineTo(posArray[1].x, posArray[1].y);
        if(!end.arc) {// 終点を丸くする
            ctx.lineTo(posArray[2].x, posArray[2].y);        
        } else {
            ctx.arc(end.x, end.y, end.width / 2, angle, angle + Math.PI);
        }
        ctx.lineTo(posArray[3].x, posArray[3].y);
        if(!start.arc) {// 始点を丸くする
            ctx.lineTo(posArray[0].x, posArray[0].y);   
        } else {
            ctx.arc(start.x, start.y, start.width / 2, angle + Math.PI, angle);
        }
        ctx.closePath();
    }

    /**
     * 丸い長方形を動かしたときのパスを作成する
     * @param {CanvasRenderingContext2D} ctx キャンバスのコンテキスト 
     * @param {{ x: number, y: number, }} start 始点
     * @param {{ x: number, y: number, }} end 終点
     * @param {number} width 矩形の幅
     * @param {number} height 矩形の高さ
     * @param {number} radius 矩形の角の半径
     * @param {number} epsilon 閾値(短い移動量や単位ベクトルの小さい成分を無視するための閾値)
     * @returns {void} なし
     */
    static createMovedRoundRectPath(ctx, start, end, width, height, radius, epsilon = 1e-5) {
        const vec = { x: end.x - start.x, y: end.y - start.y, };  // 始点から終点へのベクトルを求める
        const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        const unit = { x: vec.x / len, y: vec.y / len, };  // 単位ベクトル化する
        // 小さい成分は0にする(x軸に沿った移動 または y軸に沿った移動とみなす)
        if(Math.abs(unit.x) < epsilon) { unit.x = 0; }
        if(Math.abs(unit.y) < epsilon) { unit.y = 0; }    
        const nrm = { x: unit.y, y: -unit.x, }; // -90度回転する    
        const angle = Math.atan2(nrm.y, nrm.x); // 角度を求める

        if(width <= 0 || height <= 0 || radius < 0) {// パラメータチェック
            throw 'parameter is invalid.';
        }

        if(len < epsilon || unit.x === 0 || unit.y === 0) {// 移動量が小さすぎる または x軸に沿った移動 または y軸に沿った移動 => roundRectで処理する
            const corner = {
                x: start.x < end.x ? start.x : end.x,
                y: start.y < end.y ? start.y : end.y,
            };
            ctx.beginPath();            
            ctx.roundRect(corner.x, corner.y, width + Math.abs(vec.x), height + Math.abs(vec.y), radius);
            return;
        }

        // 基準となる4隅の円の中心座標(左上隅を原点とした座標系)を求める
        const basePoints = [
            { x: radius, y: radius, },
            { x: width - radius, y: radius, },
            { x: width - radius, y: height - radius, },
            { x: radius, y: height - radius, },
        ];
        // 始点、終点の位置ベクトルを加算する
        const starts = basePoints.map(p => ({ x: p.x + start.x, y: p.y + start.y, }));
        const ends = basePoints.map(p => ({ x: p.x + end.x, y: p.y + end.y, }));

        // 移動方向から開始インデックスを求める
        let index;
        if(vec.x > 0 && vec.y > 0) {// #1    
            index = 1;
        } else if(vec.x > 0 && vec.y < 0) {// #0
            index = 0;
        } else if(vec.x < 0 && vec.y < 0) {// #3
            index = 3;
        } else if(vec.x < 0 && vec.y > 0) {// #2
            index = 2;
        }

        // 回す角度を求める
        // ※ angle は Math.atan2 の戻り値なので [-π, π]であり、
        //    π / 2 の倍数になるような角度は微小線分発生の原因となるため、事前に除いてある
        let endAngle = -100;
        for(let i = 0; i < 4; i += 1) {
            const currentAngle = - Math.PI + Math.PI * 0.5 * i;
            const nextAngle = - Math.PI + Math.PI * 0.5 * (i + 1);
            if(currentAngle <= angle && angle <= nextAngle) {// 現在の角度がこの象限にある            
                endAngle = nextAngle;
                break;
            }
        }
        if(endAngle === -100) {
            throw 'endAngle is not found.';
        }

        // 現在の座標を求める
        const nextPosArray = [];
        for(let i = 0; i < 4; i += 1) {
            const array = i < 2 ? ends : starts;
            const endPos = {
                x: radius * Math.cos(endAngle + Math.PI * 0.5 * i) + array[(index + i) % 4].x,
                y: radius * Math.sin(endAngle + Math.PI * 0.5 * i) + array[(index + i) % 4].y,
            };
            const nextPos = getNextPos(endPos, endAngle + Math.PI * 0.5 * i); 
            nextPosArray.push(nextPos);
        }

        // パスを作成する
        ctx.beginPath();     
        ctx.moveTo(starts[index].x + nrm.x * radius, starts[index].y + nrm.y * radius);
        ctx.lineTo(ends[index].x + nrm.x * radius, ends[index].y + nrm.y * radius);
        ctx.arc(ends[index].x, ends[index].y, radius, angle, endAngle);
        ctx.lineTo(nextPosArray[0].x, nextPosArray[0].y);
        ctx.arc(ends[(index + 1) % 4].x, ends[(index + 1) % 4].y, radius, endAngle, endAngle + Math.PI * 0.5);
        ctx.lineTo(nextPosArray[1].x, nextPosArray[1].y);
        ctx.arc(ends[(index + 2) % 4].x, ends[(index + 2) % 4].y, radius, endAngle + Math.PI * 0.5, angle + Math.PI);
        ctx.lineTo(starts[(index + 2) % 4].x - nrm.x * radius, starts[(index + 2) % 4].y - nrm.y * radius);
        ctx.arc(starts[(index + 2) % 4].x, starts[(index + 2) % 4].y, radius, angle + Math.PI, endAngle + Math.PI * 1.0);
        ctx.lineTo(nextPosArray[2].x, nextPosArray[2].y);
        ctx.arc(starts[(index + 3) % 4].x, starts[(index + 3) % 4].y, radius, endAngle + Math.PI * 1.0, endAngle + Math.PI * 1.5);
        ctx.lineTo(nextPosArray[3].x, nextPosArray[3].y);
        ctx.arc(starts[index].x, starts[index].y, radius, endAngle + Math.PI * 1.5, angle);
        ctx.closePath();
        
        /**
         * 軸と平行に移動したときの座標を求める
         * @param {number} currentPos 現在の座標
         * @param {number} currentAngle 現在の角度
         * @returns {{ x: number, y: number }} 座標 
         */
        function getNextPos(currentPos, currentAngle) {
            // ベクトルを求める(x軸かy軸に平行)    
            const nextVec = {
                x: Math.cos(currentAngle + Math.PI * 0.5),
                y: Math.sin(currentAngle + Math.PI * 0.5),
            };
            // 0付近は0に、1付近は1に、-1付近は-1にする
            if(Math.abs(nextVec.x) < 0.01) { nextVec.x = 0; }
            if(nextVec.x > 1 - 0.01) { nextVec.x = 1; }
            if(nextVec.x < -(1 - 0.01)) { nextVec.x = -1; }
            if(Math.abs(nextVec.y) < 0.01) { nextVec.y = 0; }
            if(nextVec.y > 1 - 0.01) { nextVec.y = 1; }
            if(nextVec.y < -(1 - 0.01)) { nextVec.y = -1; }
            // 平行移動量を求める
            const translate = Math.abs(nextVec.x) === 1 ? width - 2 * radius : height - 2 * radius;
            const nextPos = {
                x: currentPos.x + nextVec.x * translate,
                y: currentPos.y + nextVec.y * translate,
            };
            return nextPos;
        }
    }    
}