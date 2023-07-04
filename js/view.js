class View {
    static init() {
    }
    static drawPosArray(posArray) {
        
        const eraseCanvas = document.querySelector('#erase-canvas');
        const eraseCtx = eraseCanvas.getContext('2d', { willReadFrequently: true });
                
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

    static drawPreData(ctx, data, options) {
        const figure = data.figure;

        // translate and scale
        const transMat = options.translate ? Matrix.translate(options.translate.x, options.translate.y) : Matrix.identify();
        const scaleMat = options.scale ? Matrix.scale(options.scale, options.scale) : Matrix.identify();
        let mat = Matrix.multiply(scaleMat, data.mat);
        mat = Matrix.multiply(transMat, mat);
    
        ctx.save();
    
        Matrix.setTransform(ctx, mat);
    
        ctx.strokeStyle = options.color ? `rgb(${options.color[0]},${options.color[1]},${options.color[2]})` : 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = options.lineWidth ? options.lineWidth / mat[0] : 5 / mat[0];

        // stroke path
        figure.strokes.forEach(stroke => {
            stroke.paths.forEach(path => {
                ctx.beginPath();
                path.curves.forEach((curve, i) => {
                    curve.createPath(ctx, i === 0);
                });
                ctx.stroke();
            });
        });

        //if(options.strokeRect) {// stroke rect
            const rect = figure.rect;
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 4;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        //}
    
        ctx.restore();
    }

    /**
     * draw mvg data
     * @param {CanvasRenderingContext2D} ctx context 
     * @param {*} mvgData mvg data
     * @param {*} options options
     */
    static drawMvgData(ctx, mvgData, options) {
        ctx.save();
        // translate and scale
        const transMat = options.translate ? Matrix.translate(options.translate.x, options.translate.y) : Matrix.identify();
        const scaleMat = options.scale ? Matrix.scale(options.scale, options.scale) : Matrix.identify();
        Matrix.setTransform(ctx, transMat);    
        Matrix.transform(ctx, scaleMat);
    
        mvgData.shapes.forEach(shape => {
            ctx.save();
            // matrix of object
            Matrix.transform(ctx, shape.mat);
    
            // get data to draw
            const data = mvgData.datas.find(d => d.id === shape.xlinkHref.replace('#', ''));
            if(!data) { 
                ctx.restore();
                return; // continue;
            }
            // cache
            const figure = data.figure;
            
            if(options.fillFigure) {// fill figure
                ctx.fillStyle = 'green';
                ctx.beginPath();
                figure.strokes.forEach(stroke => {
                    stroke.paths.forEach(path => {
                        path.curves.forEach((curve, i) => {
                            curve.createPath(ctx, i === 0);
                        });
                    });
                });
                ctx.closePath();
                ctx.fill();
            }       
            
            if(options.strokeRect) {// stroke rect
                const rect = figure.rect;
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 10;
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }
            ctx.restore();                 
        });    
        ctx.restore();
    }

    /**
     * draw svg text
     * @param {CanvasRenderingContext2D} ctx context
     * @param {string} svgText
     * @returns {Promise<void>} nothing
     */
    static drawSvgText(ctx, svgText, options) {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = e => { 
                // translate and scale
                const transMat = options.translate ? Matrix.translate(options.translate.x, options.translate.y) : Matrix.identify();
                const scaleMat = options.scale ? Matrix.scale(options.scale, options.scale) : Matrix.identify();
                Matrix.setTransform(ctx, transMat);    
                Matrix.transform(ctx, scaleMat);
                ctx.drawImage(img, 0, 0);
                const imageData = GraphicsApi.getImageData(ctx);
                if(options.color) {
                    Graphics.replaceColor(imageData, [0, 0, 0], options.color);
                }                
                ctx.putImageData(imageData, 0, 0);
                resolve();
            };
            img.onerror = () => { reject(); }
            img.src = 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + svgText); 
        });
    }
}