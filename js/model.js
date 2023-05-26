class Model {

    // 定数
    static BLACK_BOARD_IMAGE_PATH = 'images/black_board.jpg';
    static CHALK_IMAGE_PATH = 'images/hand3.png';
    static KVG_FILE = 'kvg-file.txt';
    
    // 変数
    static blackBoardImg = null;
    static chalkImg = null;
    static equation = '';   // 式
    static display = true;
    static svgText = '';    // 数式を MathJax で svg に変換した文字列
    static kvgCodes = [];   // KanjiVGのファイル名から.svgを除いたコードの配列
    static avgData = {};    // アプリで定義した曲線群
    // 設定内容
    static settings = {

    };

    static async init() {
        Model.blackBoardImg = await Utility.loadImage(Model.BLACK_BOARD_IMAGE_PATH);
        Model.chalkImg = await Utility.loadImage(Model.CHALK_IMAGE_PATH);

        Model.avgData = AppSvg.load('tex2canvas');

        try {
            const res = await fetch(Model.KVG_FILE);
            const data = await res.text();
            let splitter;
            const nIndex = data.indexOf('\n');
            const rnIndex = data.indexOf('\r\n');
            if(rnIndex < 0 && nIndex >= 0) {
                splitter = '\n';
            } else {
                splitter = '\r\n';
            }
            Model.kvgCodes = data.split(splitter).filter(d => d).map(d => d.replaceAll('.svg', ''));
        } catch(e) {
    
        }

        Model.equation = localStorage.getItem('tex2canvas-equation');
    }
}