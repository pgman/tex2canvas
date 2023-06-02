class View {
    static init() {
        Settings.createHtml('#settings-wrapper');
        document.querySelector('#svg-checkbox').checked = Model.svgCheck;
        document.querySelector('#textarea').value = Model.equation;

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.reset();
        ctx.drawImage(Model.blackBoardImg, 0, 0);

        Model.strokeArray.forEach(stroke => { View.drawPosArray(stroke); });
        //Eraser.draw(ctx);
    }
    static drawPosArray(posArray, drawEraser = false) {
        
        const eraseCanvas = document.querySelector('#erase-canvas');
        const eraseCtx = eraseCanvas.getContext('2d');
        //eraseCtx.reset();
        if(drawEraser) { Eraser.draw(eraseCtx); }
        
        eraseCtx.save();
        eraseCtx.strokeStyle = 'white';
        eraseCtx.lineWidth = 6;
        eraseCtx.lineCap = 'round';
        eraseCtx.lineJoin = 'round';
        eraseCtx.beginPath();
        posArray.forEach((pos, i) => {
            if(i === 0) { eraseCtx.moveTo(pos.x, pos.y); }
            else { eraseCtx.lineTo(pos.x, pos.y); }
        });
        eraseCtx.stroke();
        eraseCtx.restore();
    }

    static drawDatas(datas) {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.reset();
        ctx.drawImage(Model.blackBoardImg, 0, 0);    
        datas.forEach(data => { View.drawData(ctx, data); });
    }

    static drawData(ctx, data) {
        const transMat = Matrix.translate(Settings.padding, Settings.padding);
        const scaleMat = Matrix.scale(Settings.scale, Settings.scale);
        let mat = Matrix.multiply(scaleMat, data.mat);
        mat = Matrix.multiply(transMat, mat);
    
        ctx.save();
    
        Matrix.setTransform(ctx, mat);
    
        ctx.strokeStyle = 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Settings.lineWidth / mat[0];
        if(data.type === 'app') {
            ctx.beginPath();
            data.curvesArray.forEach((curves, i) => {
                curves.forEach((curve, j) => { 
                    curve.path(ctx, j === 0); 
                });
            });
            ctx.stroke();
        } else {
            data.kvg.paths.forEach(path => {                
                ctx.beginPath();
                path.curvesArray.forEach((curves, i) => {
                    curves.forEach((curve, j) => { 
                        curve.path(ctx, j === 0); 
                    });
                });
                ctx.stroke();
            });
        }
    
        ctx.restore();
    }

    static drawSvg(ctx, mvgData, options) {
        ctx.save();
    
        const transMat = Matrix.translate(Settings.padding, Settings.padding);
        const scaleMat = Matrix.scale(Settings.scale, Settings.scale);
    
        // ビューポート変換行列
        Matrix.setTransform(ctx, transMat);
    
        Matrix.transform(ctx, scaleMat);
    
        Matrix.transform(ctx, mvgData.vpMat);
    
        mvgData.shapes.forEach(shape => {
            ctx.save();
            // オブジェクト変換行列をかける
            Matrix.transform(ctx, shape.mat);
    
            // 描画するpathを取得する
            const path = mvgData.paths.find(p => p.c === shape.c);
            if(!path) { return; } // continue;
            
            if(options.fillChar) {// 文字を塗る
                ctx.fillStyle = options.fillStyle ? options.fillStyle : 'green';
                ctx.lineWidth = 10;
                ctx.beginPath();
                path.curvesArray.forEach(curves => {
                    curves.forEach((curve, i) => { 
                        curve.path(ctx, i === 0); 
                    });
                });
                ctx.closePath();
                ctx.fill();
            }       
            
            if(options.strokeRect) {
                const rect = path.rect;
                ctx.strokeStyle = 'red';
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }               
    
            ctx.restore();                 
        });
    
        ctx.restore();
    }
}