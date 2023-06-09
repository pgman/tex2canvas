class AppSvg {

    static show(mvgData) {
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
            <div style="border: 2px solid black; width: ${AppSvg.CANVAS_SIZE}px; height: ${AppSvg.CANVAS_SIZE}px;">
                <canvas id="avg-char-canvas"></canvas>
            </div>
        `;     

        const charCanvas = document.querySelector('#avg-char-canvas');
        charCanvas.width = AppSvg.CANVAS_SIZE;
        charCanvas.height = AppSvg.CANVAS_SIZE;
        charCanvas.style.display = 'inline';
        
        AppSvg.attachEvent();

        AppSvg.onInit(mvgData);
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
                    AppSvg.curvesArray.push(AppSvg.tempCurves);
                    AppSvg.tempCurves = [];
                    AppSvg.onDraw();
                    return;
                }
                AppSvg.tempCurves.push(new Curve([ worldPos, worldPos, worldPos, worldPos, ]));
            }
            AppSvg.onDraw();
        });

        // mousemove
        document.querySelector('#avg-char-canvas').addEventListener('mousemove', e => {
            if(AppSvg.mode === '') { return; }
            const worldPos = AppSvg.getWorldPosByEvent(e);
    
            if(AppSvg.mode === 'interpolation') {
                if(AppSvg.tempCurves.length === 0) {
                    return;
                } 
                const p = AppSvg.tempCurves[AppSvg.tempCurves.length - 1].points;
                p[3] = worldPos;
    
                if(AppSvg.tempCurves.length === 1) {
                    const p = AppSvg.tempCurves[AppSvg.tempCurves.length - 1].points;
                    const v = Vector.subtract(p[2], p[1]);
                    p[1] = Vector.add(p[0], Vector.scale(v, 1 / 3));
                    p[2] = Vector.add(p[0], Vector.scale(v, 2 / 3));
                } else if(AppSvg.tempCurves.length >= 2) {
                    const p = AppSvg.tempCurves[AppSvg.tempCurves.length - 2].points;
                    const q = AppSvg.tempCurves[AppSvg.tempCurves.length - 1].points;
                    const p0q3 = Vector.subtract(q[3], p[0]);
                    p[2] = Vector.add(p[3], Vector.scale(p0q3, -1 / 6));
                    q[1] = Vector.add(p[3], Vector.scale(p0q3, 1 / 6));
                    if(AppSvg.tempCurves.length === 2) {
                        p[1] = Vector.center(p[0], p[2]);
                    }
                    q[2] = Vector.center(q[1], q[3]);
                }
                AppSvg.onDraw();
            } else if(AppSvg.mode === 'line') {
                if(AppSvg.tempCurves.length === 0) {
                    return;
                } 
                const p = AppSvg.tempCurves[AppSvg.tempCurves.length - 1].points;
                p[3] = worldPos;
                const v = Vector.subtract(p[2], p[1]);
                p[1] = Vector.add(p[0], Vector.scale(v, 1 / 3));
                p[2] = Vector.add(p[0], Vector.scale(v, 2 / 3));
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

        document.querySelector('#avg-interpolation-button').addEventListener('click', e => {
            AppSvg.mode = 'interpolation';
            AppSvg.tempCurves = [];
            AppSvg.onDraw();
        });
    
        document.querySelector('#avg-line-button').addEventListener('click', e => {
            AppSvg.mode = 'line';
            AppSvg.tempCurves = [];
            AppSvg.onDraw();
        });
    
        document.querySelector('#avg-cancel-button').addEventListener('click', e => {
            AppSvg.mode = '';
            AppSvg.tempCurves = [];
            AppSvg.onDraw();
        });   
        
        document.querySelector('#avg-save-button').addEventListener('click', e => {
            if(AppSvg.selectedPathIndex === -1) { return; }
            const path = AppSvg.mvgData.paths[AppSvg.selectedPathIndex];
            Model.avgData[path.c] = JSON.parse(JSON.stringify(AppSvg.curvesArray));
            Utility.saveToLocalStorage('tex2canvas', Model.avgData);
        });  
        
        document.querySelector('#avg-clear-button').addEventListener('click', e => {
            AppSvg.mode = '';
            AppSvg.curvesArray = [];
            AppSvg.tempCurves = [];
            AppSvg.onDraw();
        });  

        document.querySelector('#avg-path-select').addEventListener('change', AppSvg.onChange);   
        
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
    static selectedPathIndex = -1;

    static onInit(mvgData) {
        // コピーする
        AppSvg.mvgData = mvgData;

        if(!AppSvg.mvgData || !AppSvg.mvgData.shapes || AppSvg.mvgData.shapes.length === 0) {
            console.error('error');
            AppSvg.selectedPathIndex = -1;
            document.querySelector('#avg-path-select').innerHTML = '';
            return;
        }

        let html = '';
        AppSvg.mvgData.paths.forEach((path, i) => {
            html += `<option ${i === 0 ? 'selected' : ''} value='${path.c}'>${path.c}</option>`;
        });
        document.querySelector('#avg-path-select').innerHTML = html;
        AppSvg.selectedPathIndex = 0;

        AppSvg.mode = '';
        AppSvg.curvesArray = [];
        AppSvg.tempCurves = [];
        const currentPath = AppSvg.mvgData.paths[AppSvg.selectedPathIndex];
        if(Model.avgData[currentPath.c]) {
            AppSvg.curvesArray = Model.avgData[currentPath.c].map(curves => {
                return curves.map(elm => new Curve(elm.points));
            });
        } 

        AppSvg.onDraw(); 

        // const img = document.createElement('img');
        // img.onload = e => { AppSvg.onDraw(); };
        //img.src = 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + AppSvg.svgText); 
    
    }

    static onChange() {
        AppSvg.selectedPathIndex = document.querySelector('#avg-path-select').selectedIndex;
        AppSvg.mode = '';
        AppSvg.curvesArray = [];
        AppSvg.tempCurves = [];
        const currentPath = AppSvg.mvgData.paths[AppSvg.selectedPathIndex];
        if(Model.avgData[currentPath.c]) {
            AppSvg.curvesArray = Model.avgData[currentPath.c].map(curves => {
                return curves.map(elm => new Curve(elm.points));
            });
        } 
        AppSvg.onDraw();
    }

    static onDraw() {
        const canvas = document.querySelector('#avg-char-canvas');
        const ctx = canvas.getContext('2d');

        ctx.reset();
        AppSvg.drawSvg(ctx, AppSvg.mvgData, { fillChar: true, fillStyle: 'rgba(0, 255, 0, 0.2)', 
            strokeRect: true, strokeStyle: 'rgba(255, 0, 0, 0.2)', }); 

        const scaleMat = Matrix.scale(AppSvg.CANVAS_SIZE / AppSvg.VIEWBOX_SIZE, AppSvg.CANVAS_SIZE / AppSvg.VIEWBOX_SIZE);
        ctx.save();
        Matrix.setTransform(ctx, scaleMat);

        ctx.beginPath();      
        AppSvg.curvesArray.forEach(curves => {
            curves.forEach((curve, i) => { 
                curve.path(ctx, i === 0); 
            });
        });        
        ctx.stroke();

        ctx.beginPath();        
        AppSvg.tempCurves.forEach((curve, i) => { 
            curve.path(ctx, i === 0); 
        });
        ctx.stroke();

        AppSvg.tempCurves.forEach((curve, i) => { 
            curve.points.forEach((point, j) => {
                if(j === 0 || j === 3) { ctx.fillStyle = 'blue'; }
                else { ctx.fillStyle = 'green'; }
                Utility.fillCircle(ctx, point, 1);
            }); 
        });

        ctx.restore();
    }

    static drawSvg(ctx, mvgData, options) {
        if(!mvgData || !mvgData.shapes || mvgData.shapes.length === 0) {
            return;
        }

        let shape = mvgData.shapes[0];

        // 描画するpathを取得する
        const path = AppSvg.mvgData.paths[AppSvg.selectedPathIndex];
        if(!path) { return; } // continue;

        let screenRect = Matrix.multiplyRect(shape.mat, path.rect);

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
            ctx.strokeStyle = options.strokeStyle ? options.strokeStyle : 'red';
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
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