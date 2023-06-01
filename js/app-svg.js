class AppSvg {

    static show() {
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
                <input id="avg-text" type="text">
                <button id="avg-search-button">search</button>
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
            if(!AppSvg.currentCode) { return; }
            Model.avgData[AppSvg.currentCode] = JSON.parse(JSON.stringify(AppSvg.curvesArray));
            Utility.saveToLocalStorage('tex2canvas', Model.avgData);
        });  
        
        document.querySelector('#avg-clear-button').addEventListener('click', e => {
            AppSvg.mode = '';
            AppSvg.curvesArray = [];
            AppSvg.tempCurves = [];
            AppSvg.onDraw();
        });  
    

        document.querySelector('#avg-text').addEventListener('keypress', e => {
            if(e.keyCode === 13) {
                AppSvg.onSearch();
            }
        });
    
        // テキストでCtrl + Sした時の処理
        document.querySelector('#avg-text').addEventListener('keydown', e => {
            if(e.ctrlKey && e.key === 's') {
                e.preventDefault(); // Prevent the Save dialog to open
                AppSvg.onSearch();
            }
        });

        document.querySelector('#avg-search-button').addEventListener('click', AppSvg.onSearch);    
    }

    static DIALOG_WIDTH = 404;
    static DIALOG_HEIGHT = 520;
    static VIEWBOX_SIZE = 119;
    static CANVAS_SIZE = 400;
    static MVG_PADDING = 20;
    static svgText = '';
    static svgData = null;
    static currentCode = '';
    static mode = '';
    static curvesArray = [];
    static tempCurves = [];

    static onSearch() {
        const canvas = document.querySelector('#avg-char-canvas');
        const ctx = canvas.getContext('2d');

        // 数式(MathJax用)
        const equation = document.querySelector('#avg-text').value;
        // svgに変換
        AppSvg.svgText = MathJaxSvg.getMathJaxSvgText(equation, true);
        // パースする
        AppSvg.mvgData = MathJaxSvg.parseMathJaxSvg(AppSvg.svgText);

        if(!AppSvg.mvgData || !AppSvg.mvgData.shapes || AppSvg.mvgData.shapes.length === 0) {
            AppSvg.currentCode = '';
            console.error('error');
            return;
        }
        if(AppSvg.mvgData.shapes.length === 1) {
            AppSvg.currentCode = AppSvg.mvgData.shapes[0].c;
        } else {
            AppSvg.currentCode = AppSvg.mvgData.shapes[1].c;
        }
        AppSvg.mode = '';
        AppSvg.curvesArray = [];
        AppSvg.tempCurves = [];
        if(Model.avgData[AppSvg.currentCode]) {
            AppSvg.curvesArray = Model.avgData[AppSvg.currentCode].map(curves => {
                return curves.map(elm => new Curve(elm.points));
            });
        } 

        const img = document.createElement('img');
        img.onload = e => { AppSvg.onDraw(); };
        img.src = 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + AppSvg.svgText); 
    
    }

    static onDraw() {
        const canvas = document.querySelector('#avg-char-canvas');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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

        let shape;
        if(mvgData.shapes.length === 1) {
            shape = mvgData.shapes[0];
        } else {
            shape = mvgData.shapes[1];
        }        

        // 描画するpathを取得する
        const path = mvgData.paths.find(p => p.c === shape.c);
        if(!path) { return; } // continue;

        let mat = Matrix.multiply(mvgData.vpMat, shape.mat);

        let screenRect = Matrix.multiplyRect(mat, path.rect);

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
        mat = Matrix.multiply(transMat, mat);
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