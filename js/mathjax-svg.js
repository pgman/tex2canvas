/**
 * ・数式からSVGを作成（MathJax呼ぶだけ）
 * ・SVGを解析
 */
class MathJaxSvg {
    /**
     * 数式よりsvgテキストを取得する
     * @param {string} equation 数式
     * @returns {string} svgテキスト
     */
    static getMathJaxSvgText(equation, display) {
        // Mathjaxよりsvgを取得する(同期処理)
        const svg = MathJax.tex2svg(equation, {display}).firstElementChild;
        if(!svg) { return ''; }

        // エスケープする
        const svgText = unescape(encodeURIComponent(svg.outerHTML));
        return svgText;
    }   

    /**
     * エラーが起こっているか検知する
     * @param {string} svgText MathJaxで生成されたSVG
     * @returns {string} エラーメッセージ(英語)。エラーなしの場合は空文字列 
     */
    static getError(svgText) {
        // パースする
        const domParser = new DOMParser();
        const parsedSvgDoc = domParser.parseFromString(svgText, 'image/svg+xml');
        const parsedSvg = parsedSvgDoc.childNodes[0];
        const errorElm = parsedSvg.querySelector('[data-mml-node="merror"]');
        let errorMessage = '';
        if(errorElm) {
            errorMessage = errorElm.getAttribute('data-mjx-error');
        }
        return errorMessage;
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
        if(vv.x === 0 && vv.y === 0 && vv.width === 0 && vv.height === 0) {
            throw 'viewBox is not defined.'
        }
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
                if(splits.length !== Define.PATH_ID_SEPARATE_COUNT) {
                    throw 'path id is invalid.'
                }
                // 実際のidにする('MJX-2-TEX-LO-222B' -> '222B') 
                // そうしないと MJX-2-TEX-LO-222B のように MJX-の直後の数字がインクリメントする
                const c = splits[4];
                const d = child.getAttribute('d');
                if(d) {// dが未定義の場合がある(\ (半角スペース)など)
                    const curvesArray = SvgParser.parsePathD(d);
                    const rect = SvgParser.getCurvesArrayRect(curvesArray);
                    paths.push({ id, c, d, curvesArray, rect, });
                }                
            }
        }

        // 図形(c, mat)
        let gElm;
        if(parsedSvg.childNodes[1].tagName === 'g') {
            gElm = parsedSvg.childNodes[1];
        } else {
            throw 'parse error: g is not found.';
        }
        const shapes = [];
        let loopCnt = 0;
        const matStacks = [];

        // ツリー構造をたどる
        traceGElm(gElm);
        
        return {
            parsedSvg,
            vv,
            svgWidth,
            svgHeight,
            svgRect,
            vpMat,
            paths,
            shapes,
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
            let sliced = str.slice(index + start + 1, index + end);
            // カンマスペース' ,'はカンマに置換する
            sliced = sliced.replaceAll(', ', ',');

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
            let tmpStr = str;
            const indexes = [];
            let dbgcnt = 0;
            while(true) {
                if(dbgcnt++ > 1000) {
                    throw 'inifinity loop.';
                }
                const tmpIndexes = [ 'translate', 'scale', 'matrix' ].map(type => {
                    return { 
                        type,
                        index: tmpStr.indexOf(type),
                        values: getTransformOneValues(tmpStr, type),
                    };
                }).filter(elm => elm.index >= 0);
                tmpIndexes.sort((a, b) => a.index - b.index);
                if(tmpIndexes.length === 0) {
                    break;
                } else {
                    const first = tmpIndexes[0];
                    indexes.push(tmpIndexes[0]);
                    tmpStr = tmpStr.substring(first.index + first.type.length);
                }
            };
            return indexes;
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
                    // xlink:hrefを取得する
                    const xlinkHref = g.getAttribute('xlink:href');
                    // 現在の行列を求める
                    let curMat = Matrix.identify();
                    for(let i = 0; i < matStacks.length; i += 1) {
                        curMat = Matrix.multiply(curMat, matStacks[i]);
                    }
                    shapes.push({ tagName: 'use', c, xlinkHref, mat: curMat });
                } else if(g.nodeName === 'rect') {
                    const x = Number(g.getAttribute('x'));
                    const y = Number(g.getAttribute('y'));
                    const width = Number(g.getAttribute('width'));
                    const height = Number(g.getAttribute('height'));
                    // 現在の行列を求める
                    let curMat = Matrix.identify();
                    for(let i = 0; i < matStacks.length; i += 1) {
                        curMat = Matrix.multiply(curMat, matStacks[i]);
                    }
                    shapes.push({ tagName: 'rect', rect: {x, y, width, height }, mat: curMat });
                }
            } else {
                for(let i = 0; i < g.childNodes.length; i += 1) {
                    traceGElm(g.childNodes[i]);
                }
            }
            matStacks.pop();
        }
    }
}