class SvgParser {
    /**
     * 数式よりsvgテキストを取得する
     * @param {string} equation 数式
     * @returns {string} svgテキスト
     */
    static getMathJaxSvgText(equation, display) {
        // const output = document.getElementById('output');
        // output.innerHTML = '';
        // var options = MathJax.getMetricsFor(output);
        // options.display = display;
        //MathJax.texReset();
        // Mathjaxよりsvgを取得する(同期処理)
        const svg = MathJax.tex2svg(equation, {display}).firstElementChild;
        if(!svg) { return ''; }

        //MathJax.startup.document.clear();
        //MathJax.startup.document.updateDocument();

        // エスケープする
        const svgText = unescape(encodeURIComponent(svg.outerHTML));
        return svgText;
    }   

    static async getMathJaxSvgTextAsync(equation, display) {
        // const output = document.getElementById('output');
        // output.innerHTML = '';
        // var options = MathJax.getMetricsFor(output);
        // options.display = display;
        //MathJax.texReset();
        const svg = await MathJax.tex2svgPromise(equation, {display});
        if(!svg) { return ''; }

        //MathJax.startup.document.clear();
        //MathJax.startup.document.updateDocument();

        // エスケープする
        //const svgText = unescape(encodeURIComponent(svg.outerHTML));
        const svgText = unescape(encodeURIComponent(svg.firstElementChild.outerHTML));
        return svgText;
    }

    /**
     * <path d=""> の dを解析する
     * @param {string} d dの文字列
     * @return {Array<T>} 曲線群
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
            return splits.map(elm => Function('return ('+elm+');')());
        }

        function separate(d) {
            const sep = 'MmLlHhVvCcSsQqTtZ';
            // 文字列を1文字ずつ送っていって、sepに該当するならその前のものを配列に格納する
            const ret = [];
            let curStr = '';
            let curPos = 0;
        
            let loopCnt = 0; // for Debug
            while(true) {
                if(loopCnt++ > 10000) { throw 'loop error.'; }
        
                if(curStr && sep.indexOf(d[curPos]) >= 0) {// 区切り文字
                    ret.push(curStr);
                    curStr = '';
                } 
                curStr += d[curPos];
                if(curPos + 1 >= d.length) { break; }
                curPos++;
            }
            if(curStr && sep.indexOf(d[curPos]) >= 0) {// 区切り文字
                ret.push(curStr);
            }
        
            return ret;
        }

        /*
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
        */
    } 

    /**
     * 曲線群の矩形を取得
     * @param {Array<Array<Curve>>} ca 曲線群
     * @returns {{x: number, y: number, }} 
     */
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

        // ここでコードを取得する
        paths.forEach(path => {
            SvgParser.toKanjiVGCodeById(path.id);
        });
        
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
    }

    static async loadSvg(code) {
        return fetch(Define.KANJI_SVG_FOLDER + code + '.svg')
        .then(e => { 
            if(e.ok) { return e.text(); }
            throw 'no get svg file.';			
        })
        .then(xml => {
            //console.log(xml);
            SvgParser.parseKanjiVG(xml);
        });
    }
/**
 * 記号メモ
 * MJX-29-TEX-N-32 のように MJX-の後ろの数値は増えるので TEX以下をメモとして残す。
 * TEX-N-2B: +, TEX-N-2212: -, TEX-N-2217: *, TEX-N-2F: /, TEX-LO-222B: \int
 **/	

    /**
     * MathJaxのsvgに定義されている path の id から code を取得する 
     * @param {string} id path の id
     * @return {void} コード
     */
    static toKanjiVGCodeById(id) {
        // - で区切られている
        const splits = id.split('-');
        if(splits.length !== 5) {
            throw 'id is not 5 separated by hyphens.'
        }

        // - で分ける ex. MJX-1-TEX-N-39
        const mjx = splits[0];  // MJX
        const num = splits[1];  // 1
        const tex = splits[2];  // TEX
        const type = splits[3]; // N
        const code = splits[4]; // 39

        if(mjx !== 'MJX' || isNaN(Number(num)) || tex !== 'TEX') {
            // idが不正
            throw 'id is invalid.';
        }

        if(type === 'N' && code.length === 2 && '30' <= code && code <= '39') {// N-30 ～ N-39: 0 ～ 9
            console.log('normal number.');
        } else if(type === 'I' && code.length === 5 && '1D44E' <= code && code <= '1D467') {// I-1D44E ～ I-1D467: a ～ z
            console.log('lowercase alphabet.');
        } else if(type === 'I' && code.length === 5 && '1D434' <= code && code <= '1D44D') {// I-1D434 ～ I-1D44D: A ～ Z
            console.log('uppercase alphabet.');
        } else if(type === 'B' && code.length === 5 && '1D41A' <= code && code <= '1D433') {// B-1D41A ～ B-1D433: {\bf a} ～ {\bf z}
            console.log('bold lowercase alphabet.');
        } else if(type === 'B' && code.length === 5 && '1D400' <= code && code <= '1D419') {// B-1D400 ～ B-1D419: {\bf A} ～ {\bf Z}
            console.log('bold uppercase alphabet.');
        }

        console.log(id);
        
        return code;        
    }

    /**
     * KanjiVGのSVGファイルを解析する
     * @param {string} svg svgファイルのテキスト
     * @returns {Array<Array<Curve>T>} 曲線群 
     */
    static parseKanjiVG(svg) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "text/xml");
            
        // array like object を array に変換
        const pathArray = Array.from(doc.children[0].getElementsByTagName('path'));
        // <path>でループ

        // pathArray を列挙する
        const paths = [];
        for(let i = 0; i < pathArray.length; i += 1) {
            const path = pathArray[i];
            if(path.tagName === 'path') {
                const id = path.getAttribute('id');
                const d = path.getAttribute('d');
                const curvesArray = SvgParser.parsePathD(d);
                const rect = SvgParser.getCurvesArrayRect(curvesArray);
                paths.push({ id, d, curvesArray, rect, });
            }
        }

        return paths;	
    }

}
