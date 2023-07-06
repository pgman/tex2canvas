class AppSvg {

    static show(avgFigure, mvgData) {
        const layerElm = document.createElement('div');
        layerElm.id = 'avg-layer';
        layerElm.style.backgroundColor = '#888888';
        layerElm.style.opacity = 0.3;
        layerElm.style.position = 'fixed';
        layerElm.style.left = '0px';
        layerElm.style.top = '0px';
        layerElm.style.width = `${window.innerWidth}px`;
        layerElm.style.height = `${window.innerHeight}px`;
        document.body.appendChild(layerElm);

        const divElm = document.createElement('div');

        divElm.id = 'avg-dialog';
        divElm.style.backgroundColor = '#ffffff';
        divElm.style.position = 'fixed';
        divElm.style.left = `${(window.innerWidth - AppSvg.DIALOG_WIDTH) / 2}px`;
        divElm.style.top = `${(window.innerHeight - AppSvg.DIALOG_HEIGHT) / 2}px`;
        divElm.style.width = `${AppSvg.DIALOG_WIDTH}px`;
        divElm.style.height = `${AppSvg.DIALOG_HEIGHT}px`;
        divElm.style.padding = '20px';
        document.body.appendChild(divElm);
        divElm.innerHTML = `
            <div style="margin-bottom: 8px;">
                <select id="avg-path-select"></select>
            </div>
            <div style="margin-bottom: 8px;">
                <button id="avg-interpolation-button">interpolation</button>
                <button id="avg-line-button">line</button>
                <button id="avg-cancel-button">cancel</button>
            </div>
            <div style="margin-bottom: 8px;">
                <button id="avg-save-button">save</button>
                <button id="avg-clear-button">clear</button>
            </div>
            <div style="margin-bottom: 8px;">
                <span>save</span>
            </div>
            <div style="border: 2px solid black; width: ${AppSvg.CANVAS_SIZE}px; height: ${AppSvg.CANVAS_SIZE}px;">
                <canvas id="avg-char-canvas"></canvas>
            </div>
        `;     

        const charCanvas = document.querySelector('#avg-char-canvas');
        charCanvas.width = AppSvg.CANVAS_SIZE;
        charCanvas.height = AppSvg.CANVAS_SIZE;
        charCanvas.style.display = 'inline';
        
        AppSvg.attachEvent();

        AppSvg.onInit(avgFigure, mvgData);
    }

    static attachEvent() {

        // レイヤークリック時の処理
        document.querySelector('#avg-layer').addEventListener('click', e => {
            document.body.removeChild(document.querySelector('#avg-layer'));
            document.body.removeChild(document.querySelector('#avg-dialog'));
        });

        // prevent context menu 
        document.querySelector('#avg-char-canvas').addEventListener('contextmenu', e => { e.preventDefault(); });

        // mousedown
        document.querySelector('#avg-char-canvas').addEventListener('mousedown', e => {
            if(AppSvg.mode === '') { return; }
            const worldPos = AppSvg.getWorldPosByEvent(e);
    
            if(AppSvg.mode === 'interpolation' || AppSvg.mode === 'line') {
                if(e.button === 2) {// right button
                    AppSvg.mode = '';
                    AppSvg.onDraw();
                    return;
                }
                let curve;
                if(AppSvg.mode === 'interpolation') {
                    curve = new Curve([ worldPos, worldPos, worldPos, worldPos ]);
                } else if(AppSvg.mode === 'line') {
                    curve = new Curve([ worldPos, worldPos ]);
                }
                const curPath = AppSvg.curFigure.strokes[AppSvg.curFigure.strokes.length - 1].paths[0];
                curPath.curves.push(curve);
            } 
            AppSvg.onDraw();
        });

        // mousemove
        document.querySelector('#avg-char-canvas').addEventListener('mousemove', e => {
            if(AppSvg.mode === '') { return; }
            const worldPos = AppSvg.getWorldPosByEvent(e);
    
            if(AppSvg.mode === 'interpolation') {
                const curPath = AppSvg.curFigure.strokes[AppSvg.curFigure.strokes.length - 1].paths[0];
                if(curPath.curves.length === 0) {
                    return;
                } 
                const p = curPath.curves[curPath.curves.length - 1].points;
                p[3] = worldPos;
    
                if(curPath.curves.length === 1) {
                    const p = curPath.curves[curPath.curves.length - 1].points;
                    const v = Vector.subtract(p[3], p[0]);
                    p[1] = Vector.add(p[0], Vector.scale(v, 1 / 3));
                    p[2] = Vector.add(p[0], Vector.scale(v, 2 / 3));
                } else if(curPath.curves.length >= 2) {
                    const p = curPath.curves[curPath.curves.length - 2].points;
                    const q = curPath.curves[curPath.curves.length - 1].points;
                    const p0q3 = Vector.subtract(q[3], p[0]);
                    p[2] = Vector.add(p[3], Vector.scale(p0q3, -1 / 6));
                    q[1] = Vector.add(p[3], Vector.scale(p0q3, 1 / 6));
                    if(curPath.curves.length === 2) {
                        p[1] = Vector.center(p[0], p[2]);
                    }
                    q[2] = Vector.center(q[1], q[3]);
                }
                AppSvg.onDraw();
            } else if(AppSvg.mode === 'line') {
                const curPath = AppSvg.curFigure.strokes[AppSvg.curFigure.strokes.length - 1].paths[0];
                if(curPath.curves.length === 0) {
                    return;
                } 
                const p = curPath.curves[curPath.curves.length - 1].points;
                p[3] = worldPos;
                AppSvg.onDraw();
            }
        });

        // mouseup
        document.querySelector('#avg-char-canvas').addEventListener('mouseup', e => {
            if(AppSvg.mode === '') { return; }
            AppSvg.onDraw();
        });
    
        // click
        document.querySelector('#avg-char-canvas').addEventListener('click', e => {
            if(AppSvg.mode === '') { return; }        
            AppSvg.onDraw();
        });

        // interpolation
        document.querySelector('#avg-interpolation-button').addEventListener('click', e => {
            if(AppSvg.curFigure.strokes.length === 0
            || AppSvg.curFigure.strokes[AppSvg.curFigure.strokes.length - 1].paths[0].curves.length !== 0) {    
                    AppSvg.mode = 'interpolation';                     
                const path = new Path([]);
                const stroke = new Stroke([ path ]);
                AppSvg.curFigure.strokes.push(stroke);
                AppSvg.onDraw();
            }
        });
    
        // line
        document.querySelector('#avg-line-button').addEventListener('click', e => {
            if(AppSvg.curFigure.strokes.length === 0
            || AppSvg.curFigure.strokes[AppSvg.curFigure.strokes.length - 1].paths[0].curves.length !== 0) {    
                AppSvg.mode = 'line';
                const path = new Path([]);
                const stroke = new Stroke([ path ]);
                AppSvg.curFigure.strokes.push(stroke);
                AppSvg.onDraw();
            }
        });
    
        document.querySelector('#avg-cancel-button').addEventListener('click', e => {
            AppSvg.mode = '';
            if(AppSvg.curFigure.strokes.length) {
                AppSvg.curFigure.strokes.pop();
            }            
            AppSvg.onDraw();
        });   
        
        document.querySelector('#avg-save-button').addEventListener('click', e => {
            if(AppSvg.selectedDataIndex === -1) { return; }
            if(AppSvg.curFigure.strokes.length === 0) { return; }
            const data = AppSvg.mvgData.datas[AppSvg.selectedDataIndex];
            AppSvg.avgFigure[data.c] = AppSvg.curFigure.copy();
            AppSvg.save(AppSvg.avgFigure);
        });  
        
        document.querySelector('#avg-clear-button').addEventListener('click', e => {
            AppSvg.mode = '';
            AppSvg.curFigure = new Figure([]);
            AppSvg.onDraw();
        });  

        document.querySelector('#avg-path-select').addEventListener('change', AppSvg.onChange);   
        
    }

    /**
     * save figure of avg
     * @param {Object} avgFigure map of figure
     * @returns {void}
     */
    static save(avgFigure) {
        // create save data
        const saveFigure = {};
        Object.keys(avgFigure).forEach(key => {
            const figure = avgFigure[key];
            saveFigure[key] = figure.stringify();
        });
        // save
        Utility.saveJsonFile(saveFigure, 'app-svg.json');
    }

    /**
     * load figure of avg
     * @returns {Promise<Object>} map of figure
     */
    static async load() {
        try {
            const res = await fetch('app-svg.json');
            const data = await res.text();
            const parsed = JSON.parse(data);
            const loadFigure = {};
            Object.keys(parsed).forEach(key => {
                const strFigure = parsed[key];
                loadFigure[key] = Figure.parse(strFigure);
            });
            return loadFigure;
        } catch(e) {
            return {};
        }
    }

    static DIALOG_WIDTH = 404;
    static DIALOG_HEIGHT = 520;
    static VIEWBOX_SIZE = 119;
    static CANVAS_SIZE = 400;
    static MVG_PADDING = 20;
    static mvgData = null;
    static mode = '';
    static curvesArray = [];
    static tempCurves = [];
    static selectedDataIndex = -1;

    static onInit(avgFigure, mvgData) {
        // コピーする
        AppSvg.avgFigure = avgFigure;
        AppSvg.mvgData = mvgData;

        if(!AppSvg.mvgData || !AppSvg.mvgData.shapes || AppSvg.mvgData.shapes.length === 0) {
            console.error('error');
            AppSvg.selectedDataIndex = -1;
            document.querySelector('#avg-path-select').innerHTML = '';
            return;
        }

        // create select
        let html = '';
        AppSvg.mvgData.datas.forEach((data, i) => {
            html += `<option ${i === 0 ? 'selected' : ''} value='${data.c}'>${data.c}</option>`;
        });
        document.querySelector('#avg-path-select').innerHTML = html;

        AppSvg.onChange();
    
    }

    static onChange() {
        AppSvg.selectedDataIndex = document.querySelector('#avg-path-select').selectedIndex;
        AppSvg.mode = '';
        const selectData = AppSvg.mvgData.datas[AppSvg.selectedDataIndex];
        if(AppSvg.avgFigure[selectData.c]) {
            AppSvg.curFigure = AppSvg.avgFigure[selectData.c].copy();
        } else {
            AppSvg.curFigure = new Figure([]);
        }
        AppSvg.onDraw();
    }

    static onDraw() {
        const canvas = document.querySelector('#avg-char-canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        ctx.reset();
        AppSvg.drawSvg(ctx, AppSvg.mvgData, { fillChar: true, fillStyle: 'rgba(0, 255, 0, 0.2)', 
            strokeRect: true, strokeStyle: 'rgba(255, 0, 0, 0.2)', }); 

        const scaleMat = Matrix.scale(AppSvg.CANVAS_SIZE / AppSvg.VIEWBOX_SIZE, AppSvg.CANVAS_SIZE / AppSvg.VIEWBOX_SIZE);
        ctx.save();
        Matrix.setTransform(ctx, scaleMat);

        // draw bezier curve
        ctx.beginPath();      
        AppSvg.curFigure.strokes.forEach(stroke => {
            stroke.paths.forEach(path => {
                path.curves.forEach((curve, i) => {
                    curve.createPath(ctx, i === 0);
                });
            });
        }); 
        ctx.stroke();

        if(AppSvg.mode) {
            // draw control points of current path
            const curPath = AppSvg.curFigure.strokes[AppSvg.curFigure.strokes.length - 1].paths[0];
            curPath.curves.forEach((curve, i) => { 
                if(curve.src === Define.CUBIC_BEZIER_CURVE) {// cubic bezier curve
                    curve.points.forEach((point, j) => {
                        if(j === 0 || j === 3) { ctx.fillStyle = 'blue'; }
                        else { ctx.fillStyle = 'green'; }
                        Utility.fillCircle(ctx, point, 1);
                    }); 
                } else {// line segment
                    curve.points.forEach((point, j) => {
                        if(j === 0 || j === 3) {                        
                            ctx.fillStyle = 'blue';
                            Utility.fillCircle(ctx, point, 1);
                        }
                    }); 
                }
            });
        }        

        ctx.restore();
    }

    static drawSvg(ctx, mvgData, options) {
        if(!mvgData || !mvgData.shapes || mvgData.shapes.length === 0) {
            return;
        }

        let shape = mvgData.shapes[0];

        // get data to draw
        const data = AppSvg.mvgData.datas[AppSvg.selectedDataIndex];
        if(!data) { return; } // continue;
        const figure = data.figure;

        let screenRect = Matrix.multiplyRect(shape.mat, figure.rect);

        const transMat = Matrix.translate(-screenRect.x, -screenRect.y);

        let scale, revTransX, revTransY;
        const size = AppSvg.CANVAS_SIZE - 2 * AppSvg.MVG_PADDING;
        
        if(screenRect.width > screenRect.height) {
            scale = size / screenRect.width;
        } else {            
            scale = size / screenRect.height;
        }

        revTransX = (AppSvg.CANVAS_SIZE - screenRect.width * scale) / 2;
        revTransY = (AppSvg.CANVAS_SIZE - screenRect.height * scale) / 2;

        const scaleMat = Matrix.scale(scale, scale);
        const revTransMat = Matrix.translate(revTransX, revTransY);
        let mat = Matrix.multiply(transMat, shape.mat);
        mat = Matrix.multiply(scaleMat, mat);
        mat = Matrix.multiply(revTransMat, mat);

        ctx.save();

        Matrix.setTransform(ctx, mat);

        if(options.fillChar) {// 文字を塗る
            ctx.fillStyle = options.fillStyle ? options.fillStyle : 'green';
            ctx.lineWidth = 10;
            figure.fill(ctx);
        }       
            
        if(options.strokeRect) {
            ctx.strokeStyle = options.strokeStyle ? options.strokeStyle : 'red';
            figure.strokeRect(ctx);
        }         

        ctx.restore();
    }

    static getWorldPosByEvent(e) {
        // screen to world
        const scaleMat = Matrix.scale(AppSvg.CANVAS_SIZE / AppSvg.VIEWBOX_SIZE, AppSvg.CANVAS_SIZE / AppSvg.VIEWBOX_SIZE);
        const invScaleMat = Matrix.inverse(scaleMat);
        const screenPos = { x: e.offsetX, y: e.offsetY };
        const worldPos = Matrix.multiplyVec(invScaleMat, screenPos);
        return worldPos;
    }
}