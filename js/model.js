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
    static datas = [];
    static mvgData = null;    // 設定内容
    static animDatas = [];
    static animIntervalId = -1; // アニメーション用インターバルID
    static settings = {

    };

    static async init() {
        Model.blackBoardImg = await Utility.loadImage(Model.BLACK_BOARD_IMAGE_PATH);
        Model.chalkImg = await Utility.loadImage(Model.CHALK_IMAGE_PATH);

        Model.avgData = AppSvg.load('tex2canvas');

        Settings.load('tex2canvas-settings');   

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

    static async load() {
        Model.datas = await loadDatas(); 
        if(Model.datas.length === 0) { return; }
        View.drawDatas(Model.datas); 
        Model.animDatas = Model.getAnimDatas(Model.datas);
    }

    static getAnimDatas(datas) {
        const ret = [];
        datas.forEach(data => {
            if(data.type === 'app') {
                const strokeArray = [];
                data.curvesArray.forEach((curves, i) => {
                    let posArray = [];
                    curves.forEach((curve, j) => { 
                        let points = curve.divide();
                        const transMat = Matrix.translate(Settings.padding, Settings.padding);
                        const scaleMat = Matrix.scale(Settings.scale, Settings.scale);
                        let mat = Matrix.multiply(scaleMat, data.mat);
                        mat = Matrix.multiply(transMat, mat);
                        points = points.map(p => Matrix.multiplyVec(mat, p));
                        if(posArray.length === 0) {
                            posArray = posArray.concat(points);
                        } else {// 既に登録されている場合
                            // 前の最後の線分の終点と、今回の最初の線分の始点が一致する可能性がある
                            const last = posArray[posArray.length - 1];
                            const start = points[0];
                            const equal = Vector.equals(last, start);
                            if(equal) {
                                points.shift();
                            } 
                            posArray = posArray.concat(points);
                        }
                    });
                    const pixelData = Pixel.getAnimationPixelData({
                        posArray: posArray, 
                        lineWidth: Settings.lineWidth, 
                        strokeStyle: { r: Settings.color.r, g: Settings.color.g, b: Settings.color.b, a: Settings.color.a, }, 
                        boundaryThreshold: Settings.boundaryThreshold,   
                        internalThreshold: Settings.internalThreshold,
                        sigma: Settings.sigma, 
                        pps: Settings.pps,  
                        removeType: 'zero', // 'zero' or 'random'
                    });
                    strokeArray.push(pixelData);
                });
                ret.push(strokeArray);
            }
        });
        return ret;
    }
}