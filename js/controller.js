class Controller {
    /**
     * 初期化用メソッド
     * @returns {void} なし
     */
    static init() {
        Settings.attachEvents();  

        // svg-checkbox 変更時の処理
        document.querySelector('#svg-checkbox').addEventListener('change', e => {
            Model.svgCheck = document.querySelector('#svg-checkbox').checked;
            if(Model.svgCheck) {
                document.querySelector('#textarea').value = vkbeautify.xml(Model.svgText);
            } else {
                document.querySelector('#textarea').value = Model.equation;
            }
        });

        // edit-avg-button ボタン押下時の処理
        document.querySelector('#edit-avg-button').addEventListener('click', async () => {
            AppSvg.show();
        });

        // テキストでCtrl + Sした時の処理
        document.querySelector('#textarea').addEventListener('keydown', async e => {
            if(e.ctrlKey && e.key === 's') {
                e.preventDefault(); // Prevent the Save dialog to open
                Settings.onChange();
            }
        });

        // tex2svg ボタン押下時の処理
        document.querySelector('#tex2svg-button').addEventListener('click', async () => {
            Settings.onChange();
            await Model.load();
            //View.drawMVG();
        });

        // play ボタン押下時の処理
        document.querySelector('#play-button').addEventListener('click', async () => {
            play();
        });
        
        // mouse ボタン押下時の処理
        document.querySelector('#mouse-button').addEventListener('click', async () => {
            let moveFlag = false;
            let stroke = [];
            document.querySelector('#erase-canvas').addEventListener('mousedown', mousedown);
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
            function mousedown(e) {
                if(moveFlag) { return; }
                moveFlag = true;
                stroke = [];
                stroke.push({ x: e.offsetX, y: e.offsetY, });
            }
            function mousemove(e) {
                if(!moveFlag) { return; }
                stroke.push({ x: e.offsetX, y: e.offsetY, });
                Model.strokeArray.forEach(stroke => { View.drawPosArray(stroke); });
                View.drawPosArray(stroke);
            }
            function mouseup(e) {
                if(!moveFlag) { return; }
                
                Model.strokeArray.push(JSON.parse(JSON.stringify(stroke)));
                document.querySelector('#erase-canvas').removeEventListener('mousedown', mousedown);
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                localStorage.setItem('debug-stroke', JSON.stringify(Model.strokeArray));
            }
        });

        // clear ボタン押下時の処理
        document.querySelector('#clear-button').addEventListener('click', async () => {
            const eraserCanvas = document.querySelector('#erase-canvas');
            const eraserCtx = eraserCanvas.getContext('2d');
            eraserCtx.reset();
            Model.strokeArray = [];
            localStorage.setItem('debug-stroke', JSON.stringify(Model.strokeArray));
        });

        // erase ボタン押下時の処理
        document.querySelector('#erase-button').addEventListener('click', async () => {
            const eraserCanvas = document.querySelector('#erase-canvas');
            const eraserCtx = eraserCanvas.getContext('2d');
            const indexes = Utility.getFilledPixels(eraserCanvas);
            // eraserの回転行列を決める(ここは手動で決めさせてもよい)
            const mat = Eraser.getLeftMatrix(indexes, eraserCanvas.width);
            // debug用に矩形を求める
            const rectPoints = Eraser.getRect(eraserCanvas.width, indexes, mat);
            // アニメーション用のフレーム情報を求める
            const points = Eraser.getMatrices(indexes, mat, { width: eraserCanvas.width, height: eraserCanvas.height, });
            console.log(points.length);

            // アニメーションを実装する
            // canvasをコピーする
            const imageData = eraserCtx.getImageData(0, 0, eraserCtx.canvas.width, eraserCtx.canvas.height);
            const data = imageData.data;

            let animCnt = 0;
            let intervalId = setInterval(() => {
                const eraserCanvas = document.querySelector('#erase-canvas');
                const eraserCtx = eraserCanvas.getContext('2d');
                eraserCtx.reset();    

                const point = points[animCnt++];
                point.indexes.forEach(i => {
                    data[i * 4 + 3] = 0;
                });
                eraserCtx.putImageData(imageData, 0, 0);

                // 黒板消しを描画
                Eraser.draw(eraserCtx, Matrix.multiply(point.mat, mat));

                // デバッグ用最大最小描画
                // eraserCtx.save();
                // eraserCtx.strokeStyle = 'green';
                // Utility.strokePath(eraserCtx, rectPoints);
                // eraserCtx.restore();
                if(animCnt >= points.length) {
                    clearInterval(intervalId);
                    intervalId = -1;
                }                
            }, 1000 / 60);
        });
    
        // save app svg ボタン押下時の処理
        document.querySelector('#save-app-svg-button').addEventListener('click', async () => {
            Utility.saveJsonFile(Model.avgData, 'avg.json');
        });

        // textarea 変更
        document.querySelector('#textarea').addEventListener('input', () => {
            Model.equation = document.querySelector('#textarea').value;
        });

        // #display-checkbox 変更
        document.querySelector('#display-checkbox').addEventListener('change', () => {
            Model.display = document.querySelector('#display-checkbox').checked;
        });

        // load app svg ボタン押下時の処理
        document.querySelector('#load-app-svg-button').addEventListener('click', async () => {
            const tmpAvgData = await Utility.loadJsonFile();
            if(tmpAvgData) {
                Model.avgData = tmpAvgData;
                Utility.saveToFromLocalStorage('tex2canvas', Model.avgData);
            } else {
                console.log('cancelされた');
            }
        });
    }
}