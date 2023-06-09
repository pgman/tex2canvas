class Model {

    // 定数
    static BLACK_BOARD_IMAGE_PATH = 'images/black_board.jpg';
    static CHALK_IMAGE_PATH = 'images/hand3.png';
    static ERASER_IMAGE_PATH = 'images/eraser.png';
    static KVG_FILE = 'kvg-file.txt';
    
    // 変数
    static blackBoardImg = null;
    static chalkImg = null;
    static eraserImg = null;
    static svgCheck = false;    // SVG の表示
    static equation = '';       // 式
    static display = true;
    static svgText = '';        // 数式を MathJax で svg に変換した文字列
    static kvgCodes = [];       // KanjiVGのファイル名から.svgを除いたコードの配列
    static avgData = {};        // アプリで定義した曲線群
    static datas = [];
    static mvgData = null;      // 設定内容
    static animDatas = [];
    static animIntervalId = -1; // アニメーション用インターバルID
    static posArray = [];
    static mvgCheck = false;
    static avgCheck = false;
    static handCheck = true;
    static chalkCheck = true;

    static async init() {
        Model.blackBoardImg = await Utility.loadImage(Model.BLACK_BOARD_IMAGE_PATH);
        Model.chalkImg = await Utility.loadImage(Model.CHALK_IMAGE_PATH);

        const angle = -29;
        const radian = angle * Math.PI / 180;
        const rotate = Matrix.rotate(radian);
        const trans = Matrix.translate(96, 118);
        const mat = Matrix.multiply(trans, rotate);
        Eraser.init(mat, 82, 200, 10, Model.ERASER_IMAGE_PATH);

        Model.eraserImg = await Utility.loadImage(Model.ERASER_IMAGE_PATH);

        Model.avgData = Utility.loadFromLocalStorage('tex2canvas');

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
        Model.datas = await Model.loadDatas(); 
        if(Model.datas.length === 0) { return; }
        View.drawDatas(Model.datas); 
        Model.animDatas = Model.getAnimDatas(Model.datas);
    }

    static getAnimDatas(datas) {
        const ret = [];
        let dbgCnt = 0;
        datas.forEach(data => {
            if(data.type === 'avg') {
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
                    //console.log(dbgCnt++);
                    //if(dbgCnt === 3) { debugger; }
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
            } else if(data.type === 'kvg') {
                const strokeArray = [];
                data.kvg.paths.forEach(path => {   
                    path.curvesArray.forEach((curves, i) => {
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
                });
                ret.push(strokeArray);
            }
        });
        return ret;
    }

    static async loadDatas() {
        // 設定内容の保存
        Settings.save('tex2canvas-settings');
        // AppSvgの保存
        Utility.saveToLocalStorage('tex2canvas', Model.avgData);
        // 数式(MathJax用)を保存
        localStorage.setItem('tex2canvas-equation', Model.equation);
        
        // svg に変換(MathJax.tex2svg を呼ぶだけ)
        Model.svgText = MathJaxSvg.getMathJaxSvgText(Model.equation, Model.display);
        // エラーがないか調べる
        const error = MathJaxSvg.getError(Model.svgText);
        if(error) {
            alert(error);
            return;
        }
        // パースする
        Model.mvgData = MathJaxSvg.parseMathJaxSvg(Model.svgText);
    
        const kvgData = [];
        for(let i = 0; i < Model.mvgData.paths.length; i += 1) {
            const path = Model.mvgData.paths[i];
            let code = SvgParser.toKanjiVGCodeById(path.id);
            code = Utility.zeroPadding(code, 5);
            try {
                if(Model.kvgCodes.indexOf(code) >= 0) {
                    const ret = await SvgParser.loadSvg(code);
                    kvgData.push(ret);
                } else {
                    console.log(`KVG ${code} is not defined.`);
                }                
            } catch(e) {
                console.log(`${code} is error.`);
                throw 'error';
            }          
        }

        // <text>
        for(let i = 0; i < Model.mvgData.shapes.length; i += 1) {
            const shape = Model.mvgData.shapes[i];
            if(shape.tagName !== 'text') { continue; }
            if(shape.text.length !== 1) { continue; }
            // あ -> 03042
            const code = Utility.getCodeByChar(shape.text);
            try {
                if(Model.kvgCodes.indexOf(code) >= 0) {
                    const ret = await SvgParser.loadSvg(code);
                    kvgData.push(ret);
                } else {
                    console.log(`${code} is not defined.`);
                }                
            } catch(e) {
                console.log(`${code} is error.`);
                throw 'error';
            }          
        }
    
        return Model.getDatas(Model.mvgData, kvgData);
    }

    static getDatas(mvgData, kvgData) {
        const ret = [];
    
        // ret に kvgDataのインデックスと変換行列を格納していく
        mvgData.shapes.forEach(shape => {
            if(shape.tagName === 'use') {// <use>
                // 描画するpathを取得する
                //const path = mvgData.paths.find(p => p.c === shape.c);
                const path = mvgData.paths.find(p => p.id === shape.xlinkHref.replace('#', ''));
                
                if(!path) { return; } // continue;       
    
                // MathJax のshape.rectをスクリーン座標系へ変換する                
                const screenRect = Matrix.multiplyRect(shape.mat, path.rect); // スクリーン座標系の矩形
    
                const id = shape.xlinkHref.substring(1);
                let kvgCode = SvgParser.toKanjiVGCodeById(id);
                kvgCode = Utility.zeroPadding(kvgCode, Define.SVG_FILE_NAME_LENGTH);
                let splits = id.split('-');
                const avgCode = splits[4]; 
    
                if(Model.avgData[avgCode]) {
                    // calc rect
                    const curvesArray = Model.avgData[avgCode].map(curves => {
                        return curves.map(elm => new Curve(elm.points));
                    });
                    const rect = getCurvesArrayRect(curvesArray);
                    // push data
                    ret.push({ type: 'avg', curvesArray, mat: getNewMatrix(screenRect, rect), });
                } else {
                    // get kvg paths
                    const data = kvgData.find(data => data.c === kvgCode); 
                    if(!data) { 
                        console.log('kvg paths are not found.');
                        return;
                    }
                    // push data
                    ret.push({ type: 'kvg', kvg: data, mat: getNewMatrix(screenRect, data.rect), });
                }
            } else if(shape.tagName === 'rect') {
                // MathJax のshape.rectをスクリーン座標系へ変換する
                const screenRect = Matrix.multiplyRect(shape.mat, shape.rect); // スクリーン座標系の矩形
                const curvesArray = [
                    [new Curve([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 60, y: 0 }, { x: 90, y: 0 }]) ]
                ];
                const rect = getCurvesArrayRect(curvesArray);
                    
                ret.push({ type: 'avg', curvesArray, mat: getNewMatrix(screenRect, rect), });
            } else if(shape.tagName === 'text') {// <text>    
                // rect を適当に決めてみる(本当はfont-sizeから決めるべき？)
                const fontSize = parseInt(shape.fontSize);
                const rect = { x: 0, y: -fontSize, width: fontSize, height: fontSize };
                // MathJax のshape.rectをスクリーン座標系へ変換する
                const screenRect = Matrix.multiplyRect(shape.mat, rect); // スクリーン座標系の矩形      
                
                const kvgCode = Utility.getCodeByChar(shape.text);

                // get kvg paths
                const data = kvgData.find(data => data.c === kvgCode); 
                if(!data) { 
                    console.log('kvg paths are not found.');
                    return;
                }
                const tmpRect = { x: 0, y: 0, width: 119, height: 119, };
                Rect.addMargin(tmpRect, -12);   // これ適当(kvgが矩形に対してやや小さく定義しているので、矩形を小さくする必要がある)
                // push data
                ret.push({ type: 'kvg', kvg: data, mat: getNewMatrix(screenRect, tmpRect), });
            }
        });
    
        return ret;
    }
}
