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
            AppSvg.show(Model.mvgData);
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
            View.drawMVG();
        });

        // play ボタン押下時の処理
        document.querySelector('#play-button').addEventListener('click', async () => {
            play();
        });

        // erase ボタン押下時の処理
        document.querySelector('#erase-button').addEventListener('click', async () => {            
            const [ chalkCanvas, chalkCtx ] = Utility.getCanvasContextById('chalk-canvas');
            const size = { width: chalkCanvas.width, height: chalkCanvas.height, };
            
            // 塗られているピクセルのインデックスを取得
            const indexes = Utility.getFilledPixels(chalkCanvas);
            if(indexes.length === 0) { return; }    // 塗られていなければ何もしない

            // 黒板消しの回転行列を決める(ここは手動で決めさせてもよい)
            const rotMat = Eraser.getRotateMatrixByIndexes(indexes, size);
            // アニメーション用のフレーム情報を求める
            const points = Eraser.getMatrices(indexes, size, rotMat);

            // 現在のイメージデータを取得する
            const imageData = chalkCtx.getImageData(0, 0, chalkCtx.canvas.width, chalkCtx.canvas.height);
            const data = imageData.data;

            let animCnt = 0;
            let intervalId = setInterval(() => {
                chalkCtx.reset();    
                // チョークを消す
                const point = points[animCnt];
                point.indexes.forEach(i => {
                    data[i * 4 + 3] = 0;
                });
                // 消されたチョークを描画
                chalkCtx.putImageData(imageData, 0, 0);

                // 黒板消しを描画
                Eraser.draw(chalkCtx, Matrix.multiply(point.mat, rotMat));

                animCnt += 1;
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

        // MVG のチェックボックスが変更されたときの処理
        document.querySelector('#mvg-check').addEventListener('change', () => {
            Model.mvgCheck = document.querySelector('#mvg-check').checked;
            View.toggleElement(document.querySelector('#mvg-canvas'), Model.mvgCheck, 'inline');
        });        

        // AVG のチェックボックスが変更されたときの処理
        document.querySelector('#avg-check').addEventListener('change', () => {
            Model.avgCheck = document.querySelector('#avg-check').checked;
            View.toggleElement(document.querySelector('#avg-canvas'), Model.avgCheck, 'inline');
        });    

        // Hand のチェックボックスが変更されたときの処理
        document.querySelector('#hand-check').addEventListener('change', () => {
            Model.handCheck = document.querySelector('#hand-check').checked;
            View.toggleElement(document.querySelector('#hand-canvas'), Model.handCheck, 'inline');
        });   
        
        // Chalk のチェックボックスが変更されたときの処理
        document.querySelector('#chalk-check').addEventListener('change', () => {
            Model.chalkCheck = document.querySelector('#chalk-check').checked;
            View.toggleElement(document.querySelector('#chalk-canvas'), Model.chalkCheck, 'inline');
        });   
    }
}