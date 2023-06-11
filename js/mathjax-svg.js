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
        //const svgText = unescape(encodeURIComponent(svg.outerHTML));
        const svgText = svg.outerHTML;
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
        const shapes = [];
        let loopCnt = 0;
        const matStacks = [];
        // ツリー構造をたどる(基本的に<g>を辿って<use>等を取得する)
        traceElm(parsedSvg);
        
        return {
            parsedSvg,
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

        /**
         * <svg> タグの行列を取得する
         * @param {SVGElement} svgElm svg要素
         * @param {number} pxPerEx 1exが何pxか
         * @returns {Array<number>} 行列
         */
        function getSvgMatrix(svgElm, pxPerEx = 200.25 / 22.684) {
            // ビューボリューム
            const vb = svgElm.viewBox.baseVal;
            if(vb.x === 0 && vb.y === 0 && vb.width === 0 && vb.height === 0) {
                //throw 'viewBox is not defined.'
                console.log('viewBox is not defined.');
                return Matrix.identify();
            }
            // SVGの高さ (単位はexか単位がない場合が多い)
            const svgWidth = svgElm.width.baseVal.valueAsString;
            const svgHeight = svgElm.height.baseVal.valueAsString;

            // x, y
            const svgX = svgElm.getAttribute('x');
            const svgY = svgElm.getAttribute('y');

            // ビューポート変換の定義
            const transMat = Matrix.translate(-vb.x, -vb.y); // ビューボックスの左上隅を原点へ移動する
            let svgWidthPx, svgHeightPx;
            if(svgWidth.includes('ex')) {
                svgWidthPx = parseFloat(svgWidth.replace('ex', '')) * pxPerEx;
            } else {
                svgWidthPx = parseFloat(svgWidth.replace('ex', ''));
            }
            if(svgHeight.includes('ex')) {
                svgHeightPx = parseFloat(svgHeight.replace('ex', '')) * pxPerEx;
            } else {
                svgHeightPx = parseFloat(svgHeight.replace('ex', ''));
            }
            const scaleMat = Matrix.scale(svgWidthPx / vb.width, svgHeightPx / vb.height);
            let vpMat = Matrix.multiply(scaleMat, transMat);    // matがビューポート変換を実現する    
            if(svgX && svgY) {
                const svgXYTransMat = Matrix.translate(parseFloat(svgX), parseFloat(svgY));
                vpMat = Matrix.multiply(svgXYTransMat, vpMat);
            }
            return vpMat;
        }

        /**
         * タグの行列を取得する
         * @param {Element} elm 要素
         * @returns {Array<number>} 行列
         */
        function getElmMatrix(elm) {
            let tranformString = elm.getAttribute('transform');
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
            return mat;
        }

        function traceElm(elm) {
            if(loopCnt++ > 10000) {
                throw 'inifinity loop!';
            }
            // 行列を取得する          
            if(typeof elm.getAttribute !== 'function') {
                console.log('getAttribute is not a function.');
                return;
            }  
            let mat;    
            if(elm.tagName === 'svg') {
                mat = getSvgMatrix(elm);
            } else {
                mat = getElmMatrix(elm);
            }
            matStacks.push(mat);  

            if(!elm.childNodes || elm.childNodes.length === 0) {
                // 今の所、<use>,<rect>のみを拾う
                if(elm.nodeName === 'use') {
                    // cを取得する
                    const c = elm.getAttribute('data-c');
                    // xlink:hrefを取得する
                    const xlinkHref = elm.getAttribute('xlink:href');
                    // 現在の行列を求める
                    let curMat = Matrix.identify();
                    for(let i = 0; i < matStacks.length; i += 1) {
                        curMat = Matrix.multiply(curMat, matStacks[i]);
                    }
                    let parentSvg = {
                        mat: null,
                        width: 0, height: 0,
                    };
                    if(elm.parentNode && elm.parentNode.nodeName === 'svg') {// 親要素がsvg
                        parentSvg.mat = getSvgMatrix(elm.parentNode);
                        if(elm.parentNode.getAttribute('width')) {
                            parentSvg.width = Number(elm.parentNode.getAttribute('width'));
                        }
                        if(elm.parentNode.getAttribute('height')) {
                            parentSvg.height = Number(elm.parentNode.getAttribute('height'));
                        }
                    }
                    shapes.push({ tagName: 'use', c, xlinkHref, mat: curMat, parentSvg, originalMat: mat, });
                } else if(elm.nodeName === 'rect') {
                    const x = Number(elm.getAttribute('x'));
                    const y = Number(elm.getAttribute('y'));
                    const width = Number(elm.getAttribute('width'));
                    const height = Number(elm.getAttribute('height'));
                    // 現在の行列を求める
                    let curMat = Matrix.identify();
                    for(let i = 0; i < matStacks.length; i += 1) {
                        curMat = Matrix.multiply(curMat, matStacks[i]);
                    }
                    shapes.push({ tagName: 'rect', rect: {x, y, width, height }, mat: curMat });
                } 
            } else if(elm.nodeName === 'text') {// <text>
                // <text data-variant="normal" transform="scale(1,-1)" font-size="884px" font-family="serif">お</text>
                // 現在の行列を求める
                let curMat = Matrix.identify();
                for(let i = 0; i < matStacks.length; i += 1) {
                    curMat = Matrix.multiply(curMat, matStacks[i]);
                }
                shapes.push({ tagName: 'text', text: elm.innerHTML, fontSize: elm.getAttribute('font-size'), mat: curMat, });
            } else {
                for(let i = 0; i < elm.childNodes.length; i += 1) {
                    traceElm(elm.childNodes[i]);
                }
            }
            matStacks.pop();
        }
    }

    static getCodeType(code) {
        
        if('30' <= code && code <= '39') {// N-30 ～ N-39: 0 ～ 9
            return 'number';
        } else if('1D44E' <= code && code <= '1D467') {// I-1D44E ～ I-1D467: a ～ z
            return 'character';
        } else if('1D434' <= code && code <= '1D44D') {// I-1D434 ～ I-1D44D: A ～ Z
            return 'character';
        } else if('1D41A' <= code && code <= '1D433') {// B-1D41A ～ B-1D433: {\bf a} ～ {\bf z}
            return 'character';
        } else if('1D400' <= code && code <= '1D419') {// B-1D400 ～ B-1D419: {\bf A} ～ {\bf Z}
            return 'character';
        } else {
            return 'symbol';
        }
        
    }
}
