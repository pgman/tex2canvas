class View {
    static init() {
        Settings.createHtml('#settings-wrapper');
        document.querySelector('#textarea').value = Model.equation;

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.reset();
        ctx.drawImage(Model.blackBoardImg, 0, 0);
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
}