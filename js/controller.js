class Controller {
    static init() {
        Settings.attachEvents();  

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
            Model.load();
        });

        // play ボタン押下時の処理
        document.querySelector('#play-button').addEventListener('click', async () => {
            play();
        });
        
        // mouse ボタン押下時の処理
        document.querySelector('#mouse-button').addEventListener('click', async () => {
            let moveFlag = false;
            document.querySelector('#erase-canvas').addEventListener('mousedown', mousedown);
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
            const eraseCanvas = document.querySelector('#erase-canvas');
            const eraseCtx = eraseCanvas.getContext('2d');
            function mousedown(e) {
                if(moveFlag) { return; }
                moveFlag = true;
                Model.posArray = [];
                Model.posArray.push({ x: e.offsetX, y: e.offsetY, });
            }
            function mousemove(e) {
                if(!moveFlag) { return; }
                Model.posArray.push({ x: e.offsetX, y: e.offsetY, });
                View.drawPosArray(Model.posArray);
            }
            function mouseup(e) {
                if(!moveFlag) { return; }
                document.querySelector('#erase-canvas').removeEventListener('mousedown', mousedown);
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                localStorage.setItem('debug-erase', JSON.stringify(Model.posArray));
            }
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
                AppSvg.save('tex2canvas', Model.avgData);
            } else {
                console.log('cancelされた');
            }
        });
    }
}