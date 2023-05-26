class Controller {
    static init() {
        // tex2svg ボタン押下時の処理
        document.querySelector('#tex2svg-button').addEventListener('click', async () => {
            //Settings.onChange();
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