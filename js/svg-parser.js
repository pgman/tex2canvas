class SvgParser {
    /**
     * 
     * @param {string} equation 
     * @returns 
     */
    static getMathJaxSvgText(equation) {
        // Mathjaxよりsvgを取得する(同期処理)
        const svg = MathJax.tex2svg(equation).firstElementChild;
        if(!svg) { return ''; }

        // エスケープする
        const svgText = unescape(encodeURIComponent(svg.outerHTML));
        return svgText;
    }   

    /**
     * <path d=""> の dを解析する
     * @param {string} d 
     * @return {Array<T>} 
     */
    static parsePathD(d) {
        // https://developer.mozilla.org/ja/docs/Web/SVG/Tutorial/Paths
        
        // 'M213 578L200 573Q186 568 160 563' を
        // 'M213 578', 'L200 573', 'Q186 568 160 563' のように分解する
        const separated = separate(d);
        const datas = [];
        const curPos = { x: 0, y: 0 };
        let preValues = null;
        separated.forEach(elm => {
            // 'Q186 568 160 563' => [186, 568, 160, 563]
            const type = elm[0];
            const values = getValues(elm);
            
            if(type === 'M' || type === 'm') {
                datas.push([]);
                preValues = null;
            } else if(type === 'L' || type === 'H' || type === 'V') {// L x y, H x, V y
                if(type === 'H') {// H x
                    values.push(curPos.y);
                } else if(type === 'V') {// V y
                    values.unshift(curPos.x);
                }
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                ]));
            } else if(type === 'l' || type === 'h' || type === 'v') {// l dx dy, h dx, v dy
                if(type === 'h') {// h dx
                    values.push(0);
                } else if(type === 'v') {// v dy
                    values.unshift(0);
                }
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: curPos.x + values[0], y: curPos.y + values[1], },
                ]));
            } else if(type === 'C') {// C x1 y1, x2 y2, x y
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                    { x: values[4], y: values[5], },
                ]));
            } else if(type === 'c') {// c dx1 dy1, dx2 dy2, dx dy
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: curPos.x + values[0], y: curPos.y + values[1], },
                    { x: curPos.x + values[2], y: curPos.y + values[3], },
                    { x: curPos.x + values[4], y: curPos.y + values[5], },
                ]));
            } else if(type === 'S') {// S x2 y2, x y
                throw '未実装';
            } else if(type === 's') {// s dx2 dy2, dx dy
                throw '未実装';
            } else if(type === 'Q') {// Q x1 y1, x y
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                ]));
            } else if(type === 'q') {// q dx1 dy1, dx dy
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: curPos.x + values[0], y: curPos.y + values[1], },
                    { x: curPos.x + values[2], y: curPos.y + values[3], },
                ]));
            } else if(type === 'T') {// T x y
                if(!preValues) {
                    throw 'error preValues length.';
                }
                let dx, dy;
                if(preValues.length < 4) {
                    dx = 0;
                    dy = 0;
                } else {
                    dx = preValues[preValues.length - 2] - preValues[preValues.length - 4];
                    dy = preValues[preValues.length - 1] - preValues[preValues.length - 3];
                }
                const x1 = preValues[preValues.length - 2] + dx;
                const y1 = preValues[preValues.length - 1] + dy;
                values.unshift(y1);
                values.unshift(x1);
                datas[datas.length - 1].push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                ]));
            } else if(type === 't') {// t dx dy
                throw '未実装';
            } else if(type === 'Z') {

            } else {
                console.log('type is not defined. ', type);
            }

            if(type.toUpperCase() === type) {
                if(values.length >= 2) {                    
                    curPos.x = values[values.length - 2];
                    curPos.y = values[values.length - 1];
                }
            } else {
                if(values.length >= 2) {   
                    curPos.x += values[values.length - 2];
                    curPos.y += values[values.length - 1];
                }
            }
            preValues = JSON.parse(JSON.stringify(values));
        });

        return datas;

        function getValues(str) {
            const splits = str.substring(1).split(/,| /).filter(elm => elm.length !== 0);
            return splits.map(elm => Number(elm));
        }


        function separate(d) {
            const separated = [];
            let startIndex = 0;
            let count = 0;
            let curString = '';
            let loopCnt = 0;// for debug
    
            function isNumeric(s) {
                return '0123456789-.'.indexOf(s) >= 0;
            }
    
            // アルファベットで区切る
            while(true) {
                if(loopCnt++ > 10000) { console.log('bug'); return; }
                curString += d[startIndex + count];
                count++;
                if(startIndex + count >= d.length) {
                    separated.push(curString);
                    break;
                }
                if(d[startIndex + count] !== ' ' && !isNumeric(d[startIndex + count])) {
                    separated.push(curString);
                    startIndex = startIndex + count;
                    count = 0;
                    curString = '';
                }                
            }
            return separated;
        }
    } 
    static getCurvesArrayRect(ca) {
        // ca : [ [curve, curve, ...], [curve, curve, ...], ... ]
        let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE,
            maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;

        ca.forEach(curves => {
            curves.forEach(curve => {
                const rect = curve.rect();
                if(rect.x < minX) { minX = rect.x; }
                if(rect.y < minY) { minY = rect.y; }
                if(rect.x + rect.width > maxX) { maxX = rect.x + rect.width; }
                if(rect.y + rect.height > maxY) { maxY = rect.y + rect.height; }
            });
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // svgを解析して、オブジェクトに変換する
    static parseMathJaxSvg(svgText) {
        // パースする
        const domParser = new DOMParser();
        const parsedSvgDoc = domParser.parseFromString(svgText, 'image/svg+xml');
        const parsedSvg = parsedSvgDoc.childNodes[0];

        // MathJax(このバージョンの)が作成したsvgは<svg><defs>...</defs><g></g></svg>という構成なっているはずなので
        // 子要素の数が2のはずである。
        if(parsedSvg.childNodes.length !== 2) {
            throw 'svg child nodes length is not 2.'
        }
        // ビューボリューム
        const vv = parsedSvg.viewBox.baseVal;
        // SVGの高さ (単位はex?)
        const svgWidth = parsedSvg.width.baseVal.valueAsString;
        const svgHeight = parsedSvg.height.baseVal.valueAsString;

        // <svg>の矩形
        // 単位がexになっているのでdivの子要素として、<svg>の矩形サイズをpx単位で取得する
        const divElm = Utility.createElement('div', svgText, 
            { position: 'absolute', left: '-10000px', top: '-10000px', visibility: 'hidden', });
        document.body.appendChild(divElm);            
        const svgRect = divElm.firstElementChild.getBoundingClientRect();
        document.body.removeChild(divElm);

        // ビューポート変換の定義
        const transMat = Matrix.translate(-vv.x, -vv.y); // ビューボリュームの左上隅を原点へ移動する
        const scaleMat = Matrix.scale(svgRect.width / vv.width, svgRect.height / vv.height);
        const vpMat = Matrix.multiply(scaleMat, transMat);    // matがビューポート変換を実現する

        // <defs> を取得する
        let defs = null;
        if(parsedSvg.childNodes[0].tagName === 'defs') {
            defs = parsedSvg.children[0];
        } else {
            throw 'parse error: def is not found.';
        }

        // <path> を取得する
        // defs.childNodes を列挙する
        const paths = [];
        for(let i = 0; i < defs.childNodes.length; i += 1) {
            const child = defs.childNodes[i];
            if(child.tagName === 'path') {
                const id = child.getAttribute('id');
                const splits = id.split('-');
                if(splits.length !== PATH_ID_SEPARATE_COUNT) {
                    throw 'path id is invalid.'
                }
                // 実際のidにする('MJX-2-TEX-LO-222B' -> '222B') 
                // そうしないと MJX-2-TEX-LO-222B のように MJX-の直後の数字がインクリメントする
                const c = splits[4];
                const d = child.getAttribute('d');
                const curvesArray = SvgParser.parsePathD(d);
                const rect = SvgParser.getCurvesArrayRect(curvesArray);
                paths.push({ id, c, d, curvesArray, rect, });
            }
        }

        // 図形(c, mat)
        let gElm;
        if(parsedSvg.childNodes[1].tagName === 'g') {
            gElm = parsedSvg.childNodes[1];
        } else {
            throw 'parse error: g is not found.';
        }
        const geoms = [];
        let loopCnt = 0;
        const matStacks = [];

        // ツリー構造をたどる
        traceGElm(gElm);

        /**
         * transformの値を取得する
         * @param {Number} str transformの値
         * @param {String} type 'scale' or 'translate'
         * @return {Array<Number>} transformの値を配列にしたもの
         */
        function getTransformOneValues(str, type) {
            const index = str.indexOf(type);
            if(index < 0) { return []; }

            const start = str.slice(index).indexOf('(');
            if(start < 0) { return []; }

            const end = str.slice(index).indexOf(')');
            if(end < 0) { return []; }

            // 数値の文字列
            const sliced = str.slice(index + start + 1, index + end);

            // 1つの数値または2の数値がスペースまたはカンマで区切られている可能性がある
            const splitsBySpace = sliced.split(' ');
            const splitsByCommma = sliced.split(',');
            if(splitsBySpace.length === 2) {// スペース区切り
                return [ Number(splitsBySpace[0]), Number(splitsBySpace[1]) ]
            } else if(splitsByCommma.length === 2) {// カンマ区切り
                return [ Number(splitsByCommma[0]), Number(splitsByCommma[1])]
            } else {// 1つの数値
                return [ Number(sliced) ];
            }
        }

        function getTransformValues(str) {
            const translateIndex = str.indexOf('translate');
            const translateValues = getTransformOneValues(str, 'translate');
            const scaleIndex = str.indexOf('scale');
            const scaleValues = getTransformOneValues(str, 'scale');
            if(translateIndex < 0 && scaleIndex < 0) {// no
                return [];
            } else if(translateIndex >= 0 && scaleIndex < 0) {// translate
                return [ { type: 'translate', values: translateValues, } ];
            } else if(translateIndex < 0 && scaleIndex >= 0) {// scale
                return [ { type: 'scale', values: scaleValues, } ];
            } else if(translateIndex < scaleIndex) {// translate scale
                return [ 
                    { type: 'translate', values: translateValues, },
                    { type: 'scale', values: scaleValues, },
                ];
            } else {// scale translate
                return [ 
                    { type: 'scale', values: scaleValues, },
                    { type: 'translate', values: translateValues, },                        
                ];
            }
        }

        function traceGElm(g) {
            if(loopCnt++ > 10000) {

            }
            // 行列を取得する          
            if(typeof g.getAttribute !== 'function') {
                console.log('getAttribute is not a function.');
                return;
            }      
            let tranformString = g.getAttribute('transform');
            let mat = Matrix.identify();
            if(tranformString) {
                const trans = getTransformValues(tranformString);
                trans.forEach(t => {
                    let m = Matrix.identify();
                    if(t.type === 'translate') {
                        if(t.values.length === 2) {
                            m = Matrix.translate(t.values[0], t.values[1]);
                        } else if(t.values.length === 1)  {
                            m = Matrix.translate(t.values[0], t.values[0]);
                        }                            
                    } else if(t.type === 'scale') {
                        if(t.values.length === 2) {
                            m = Matrix.scale(t.values[0], t.values[1]);
                        } else if(t.values.length === 1)  {
                            m = Matrix.scale(t.values[0], t.values[0]);
                        }     
                    }
                    mat = Matrix.multiply(mat, m);
                });
            }
            matStacks.push(mat);

            if(!g.childNodes || g.childNodes.length === 0) {
                // 今の所、<use>,<rect>のみを拾う
                if(g.nodeName === 'use') {
                    // cを取得する
                    const c = g.getAttribute('data-c');
                    // 現在の行列を求める
                    let curMat = Matrix.identify();
                    for(let i = 0; i < matStacks.length; i += 1) {
                        curMat = Matrix.multiply(curMat, matStacks[i]);
                    }
                    geoms.push({ c, mat: curMat });
                } else if(g.nodeName === 'rect') {

                }
            } else {
                for(let i = 0; i < g.childNodes.length; i += 1) {
                    traceGElm(g.childNodes[i]);
                }
            }
            matStacks.pop();
        }
        
        return {
            parsedSvg,
            vv,
            svgWidth,
            svgHeight,
            svgRect,
            vpMat,
            paths,
            geoms,
        };
    }

}
