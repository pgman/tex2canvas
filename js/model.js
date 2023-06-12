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
    static fitRectCheck = false;
    // アフィン変換用定数
    static avgAffine = true;   // アフィン変換を実施するかのフラグ
    static avgRotationAngleMean = 0;
    static avgRotationAngleSigma = Math.PI / 180 * 5;    // 回転角度の標準偏差
    static avgScaleMean = 1;
    static avgScaleSigma = 0.05;    // 拡大率の標準偏差
    static avgSkewXMean = 0;
    static avgSkewXSigma = Math.PI / 180 * 2;    // skewXの標準偏差
    static avgSkewYMean = 0;
    static avgSkewYSigma = Math.PI / 180 * 2;    // skewYの標準偏差
    static avgTranslateXSigma = 2;    // x方向の移動量の標準偏差
    static avgTranslateYSigma = 2;    // y方向の移動量の標準偏差
    // 漢字
    static kvgKanjiScaleSigma = 0.025;
    static kvgKanjiScaleMean = 1.15;
    static kvgNoKanjiScaleSigma = 0.025;
    static kvgNoKanjiScaleMean = 0.95;

    /**
     * 初期化
     * @returns {Promise<void>} なし
     */
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
        datas.forEach(data => {
            if(data.type === 'avg') {
                const codeType = MathJaxSvg.getCodeType(data.code);
                const affine = getAvgAffineMatrix(codeType);                
                const strokeArray = [];
                data.curvesArray.forEach((curves, i) => {
                    let posArray = [];
                    curves.forEach((curve, j) => { 
                        let points = curve.divide();
                        const transMat = Matrix.translate(Settings.padding, Settings.padding);
                        const scaleMat = Matrix.scale(Settings.scale, Settings.scale);
                        const mat = Matrix.multiplyArray([transMat, scaleMat, data.mat, affine]);
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
                    const pixelData = getAnimationPixelData(posArray);
                    strokeArray.push(pixelData);
                });
                ret.push(strokeArray);
            } else if(data.type === 'kvg') {
                const strokeArray = [];
                const affine = getKvgAffineMatrix(data.text);
                data.kvg.paths.forEach(path => {   
                    path.curvesArray.forEach((curves, i) => {
                        let posArray = [];
                        curves.forEach((curve, j) => { 
                            let points = curve.divide();
                            const transMat = Matrix.translate(Settings.padding, Settings.padding);
                            const scaleMat = Matrix.scale(Settings.scale, Settings.scale);
                            const mat = Matrix.multiplyArray([transMat, scaleMat, data.mat, affine]);
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
                        const pixelData = getAnimationPixelData(posArray);
                        strokeArray.push(pixelData);
                    });
                });
                ret.push(strokeArray);
            }
        });
        return ret;

        /**
         * KVG用アフィン変換行列を取得する
         * @param {string} text 文字列 
         * @returns {Array<number>} 行列
         */
        function getKvgAffineMatrix(text) {
            let affine;
            const center = { x: 119 / 2, y: 119 / 2, }; 
            if(Utility.isKanji(text)) {// 漢字
                const scale = Utility.randomNormal(Model.kvgKanjiScaleMean, Model.kvgKanjiScaleSigma);
                const scaleMat = Matrix.scale(scale, scale, center);
                affine = Matrix.multiplyArray([scaleMat]); 
            } else if(Utility.isHiragana(text) || Utility.isKatakana(text)) {// 平仮名 or カタカナ
                const scale = Utility.randomNormal(Model.kvgNoKanjiScaleMean, Model.kvgNoKanjiScaleSigma);
                const scaleMat = Matrix.scale(scale, scale, center);
                affine = Matrix.multiplyArray([scaleMat]); 
            } else {// 漢字でも平仮名でもカタカナでもない
                affine = Matrix.identify();
            }
            return affine;
        }

        /**
         * AVG用アフィン変換行列を取得する
         * @param {string} codeType コードの種別 
         * @returns {Array<number>} 行列
         */
        function getAvgAffineMatrix(codeType) {
            let affine;
            if(Model.avgAffine && (codeType === 'number' || codeType === 'character')) {
                const center = { x: 119 / 2, y: 119 / 2, }; 
                const angle = Utility.randomNormal(Model.avgRotationAngleMean, Model.avgRotationAngleSigma);
                const rotMat = Matrix.rotate(angle, center);
                const scale = Utility.randomNormal(Model.avgScaleMean, Model.avgScaleSigma);
                const scaleMat = Matrix.scale(scale, scale, center);
                const angleX = Utility.randomNormal(Model.avgSkewXMean, Model.avgSkewXSigma);
                const angleY = Utility.randomNormal(Model.avgSkewYMean, Model.avgSkewYSigma);
                const skewMat = Matrix.skew(angleX, angleY, center);
                const translateX = Utility.randomNormal(0, Model.avgTranslateXSigma);
                const translateY = Utility.randomNormal(0, Model.avgTranslateYSigma);
                const translateMat = Matrix.translate(translateX, translateY);
                affine = Matrix.multiplyArray([translateMat, skewMat, rotMat, scaleMat]); 
            } else {
                affine = Matrix.identify();
            }
            return affine;
        }

        /**
         * アニメーション用のデータを作成する
         * @param {Array<{ x: number, y: number, }} posArray 点配列 
         * @returns {Object} アニメーション用データ
         */
        function getAnimationPixelData(posArray) {
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
            return pixelData;
        }
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
        let skipFlag = false;
    
        // ret に kvgDataのインデックスと変換行列を格納していく
        mvgData.shapes.forEach((shape, i) => {
            if(skipFlag) {
                skipFlag = false;
                return;
            }
            if(shape.tagName === 'use') {// <use>
                // 描画するpathを取得する
                //const path = mvgData.paths.find(p => p.c === shape.c);
                const path = mvgData.paths.find(p => p.id === shape.xlinkHref.replace('#', ''));
                
                if(!path) { return; } // continue;       
    
                // MathJax のshape.rectをスクリーン座標系へ変換する
                let screenRect;
                if(shape.parentSvg && shape.parentSvg.mat && shape.parentSvg.width && shape.parentSvg.height) {
                    // 簡易クリッピング(どうも<svg>でクリップする必要があるっぽい)
                    const mat = Matrix.multiply(shape.parentSvg.mat, shape.originalMat);
                    const inv = Matrix.inverse(mat);
                    const tempRect = Matrix.multiplyRect(mat, path.rect);
                    const size = {};
                    if(tempRect.width >= shape.parentSvg.width) {
                        size.width = shape.parentSvg.width;
                    }
                    if(tempRect.height >= shape.parentSvg.height) {
                        size.height = shape.parentSvg.height;
                    }
                    Rect.changeSize(tempRect, size, true);
                    const rect = Matrix.multiplyRect(inv, tempRect);
                    screenRect = Matrix.multiplyRect(shape.mat, rect);
                } else {
                    screenRect = Matrix.multiplyRect(shape.mat, path.rect); // スクリーン座標系の矩形
                }
                screenRect = refineScreenRect(screenRect);
    
                // コードを取得する
                const [avgCode, kvgCode] = getCodes(shape);
    
                if(Model.avgData[avgCode]) {
                    // calc rect
                    const curvesArray = Model.avgData[avgCode].map(curves => {
                        return curves.map(elm => new Curve(elm.points));
                    });
                    const rect = getCurvesArrayRect(curvesArray);
                    // push data
                    ret.push({ type: 'avg', code: avgCode, curvesArray, mat: getNewMatrix(screenRect, rect), });

                    // 縦線用データを作成する
                    if(avgCode === '239D' || avgCode === '23A0' || avgCode === '23A3' || avgCode === '23A6') {
                        if(i - 1 < 0 || i + 1 >= mvgData.shapes.length) { return; }
                        const preShape = mvgData.shapes[i - 1];
                        const nextShape = mvgData.shapes[i + 1];
                        const [preAvgCode] = getCodes(preShape);
                        const [nextAvgCode] = getCodes(nextShape);
                        if(!(preAvgCode === '239B' && avgCode === '239D' && nextAvgCode === '239C')
                        && !(preAvgCode === '239E' && avgCode === '23A0' && nextAvgCode === '239F')
                        && !(preAvgCode === '23A1' && avgCode === '23A3' && nextAvgCode === '23A2')
                        && !(preAvgCode === '23A4' && avgCode === '23A6' && nextAvgCode === '23A5')) {
                            return;
                        }
                        const preData = ret[ret.length - 2];
                        const curData = ret[ret.length - 1];
                        
                        const preLastCurves = preData.curvesArray[preData.curvesArray.length - 1];
                        const preLastCurve = preLastCurves[preLastCurves.length - 1];
                        const preLastPoint = preLastCurve.points[preLastCurve.points.length - 1];
                        
                        const curFirstCurves = curData.curvesArray[0];
                        const curFirstCurve = curFirstCurves[0];
                        const curFirstPoint = curFirstCurve.points[0];

                        const insertedStart = Matrix.multiplyVec(preData.mat, preLastPoint);
                        const insertedEnd = Matrix.multiplyVec(curData.mat, curFirstPoint);

                        const curvesArray = [
                            [new Curve([insertedStart, 
                                        Utility.linearInterpolation(insertedStart, insertedEnd, 1 / 3),
                                        Utility.linearInterpolation(insertedStart, insertedEnd, 2 / 3), 
                                        insertedEnd]) ]
                        ];
                        
                        const popped = ret.pop();
                        ret.push({ type: 'avg', code: 'original', curvesArray, mat: Matrix.identify(), });
                        ret.push(popped);
                        skipFlag = true;
                    }                        
                } else {
                    // get kvg paths
                    const data = kvgData.find(data => data.c === kvgCode); 
                    if(!data) { 
                        console.log('kvg paths are not found.');
                        return;
                    }
                    // push data
                    ret.push({ type: 'kvg', code: kvgCode, text: '', kvg: data, mat: getNewMatrix(screenRect, data.rect), });
                }
            } else if(shape.tagName === 'rect') {
                // MathJax のshape.rectをスクリーン座標系へ変換する
                let screenRect = Matrix.multiplyRect(shape.mat, shape.rect); // スクリーン座標系の矩形
                screenRect = refineScreenRect(screenRect);
                const curvesArray = [
                    [new Curve([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 60, y: 0 }, { x: 90, y: 0 }]) ]
                ];
                const rect = getCurvesArrayRect(curvesArray);
                    
                ret.push({ type: 'avg', code: 'rect', curvesArray, mat: getNewMatrix(screenRect, rect), });
            } else if(shape.tagName === 'text') {// <text>    
                // rect を適当に決めてみる(本当はfont-sizeから決めるべき？)
                const fontSize = parseInt(shape.fontSize);
                const rect = { x: 0, y: -fontSize, width: fontSize, height: fontSize };
                // MathJax のshape.rectをスクリーン座標系へ変換する
                let screenRect = Matrix.multiplyRect(shape.mat, rect); // スクリーン座標系の矩形      
                screenRect = refineScreenRect(screenRect);
                const kvgCode = Utility.getCodeByChar(shape.text);

                // get kvg paths
                const data = kvgData.find(data => data.c === kvgCode); 
                if(!data) { 
                    console.log('kvg paths are not found.');
                    return;
                }
                const tmpRect = { x: 0, y: 0, width: 119, height: 119, };
                Rect.addMargin(tmpRect, -12);   // これ適当(kvgが矩形に対してやや小さく定義しているので、矩形を小さくする必要がある)
                const textMat = getNewMatrix(screenRect, tmpRect);
                const transMat = Matrix.translate(0, 12);
                // push data
                ret.push({ type: 'kvg', code: 'text', text: shape.text, kvg: data, mat: Matrix.multiply(textMat, transMat), });
            }
        });
    
        return ret;

        /**
         * 画面用矩形を修正する
         * @param {{ x: number, y: number, width: number, height: number, }} argScreenRect 矩形
         * @returns {{ x: number, y: number, width: number, height: number, }} 矩形
         */
        function refineScreenRect(argScreenRect) {
            const screenRect = JSON.parse(JSON.stringify(argScreenRect));
            if(Model.fitRectCheck) {// 矩形内に収まるようにする
                Rect.addMargin(screenRect, -Settings.lineWidth / 2 / Settings.scale);
            }
            return screenRect;
        }

        function getCodes(shape) {
            const id = shape.xlinkHref.substring(1);
            let kvgCode = SvgParser.toKanjiVGCodeById(id);
            kvgCode = Utility.zeroPadding(kvgCode, Define.SVG_FILE_NAME_LENGTH);
            const splits = id.split('-');
            const avgCode = splits[4]; 
            return [avgCode, kvgCode];
        }
    }
}
