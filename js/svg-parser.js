class SvgParser {
    
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
        const paths = [];
        let path = null;
        const curPos = { x: 0, y: 0 };
        let preValues = null;
        separated.forEach(elm => {
            // 'Q186 568 160 563' => [186, 568, 160, 563]
            const type = elm[0];
            let values = getValues(elm.replaceAll('-',',-'));
            
            if(type === 'M' || type === 'm') {
                path = new Path([]);
                paths.push(path);                
                preValues = null;
            } else if(type === 'L' || type === 'H' || type === 'V') {// L x y, H x, V y
                if(type === 'H') {// H x
                    values.push(curPos.y);
                } else if(type === 'V') {// V y
                    values.unshift(curPos.x);
                }
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                ]));
            } else if(type === 'l' || type === 'h' || type === 'v') {// l dx dy, h dx, v dy
                if(type === 'h') {// h dx
                    values.push(0);
                } else if(type === 'v') {// v dy
                    values.unshift(0);
                }
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: curPos.x + values[0], y: curPos.y + values[1], },
                ]));
            } else if(type === 'C') {// C x1 y1, x2 y2, x y
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                    { x: values[4], y: values[5], },
                ]));
            } else if(type === 'c') {// c dx1 dy1, dx2 dy2, dx dy
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: curPos.x + values[0], y: curPos.y + values[1], },
                    { x: curPos.x + values[2], y: curPos.y + values[3], },
                    { x: curPos.x + values[4], y: curPos.y + values[5], },
                ]));
            } else if(type === 'S') {// S x2 y2, x y
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
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                    { x: values[4], y: values[5], },
                ]));
            } else if(type === 's') {// s dx2 dy2, dx dy
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
                const x1 = dx;
                const y1 = dy;
                values.unshift(y1);
                values.unshift(x1);
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: curPos.x + values[0], y: curPos.y + values[1], },
                    { x: curPos.x + values[2], y: curPos.y + values[3], },
                    { x: curPos.x + values[4], y: curPos.y + values[5], },
                ]));
            } else if(type === 'Q') {// Q x1 y1, x y
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                ]));
            } else if(type === 'q') {// q dx1 dy1, dx dy
                path.curves.push(new Curve([
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
                path.curves.push(new Curve([
                    { x: curPos.x, y: curPos.y, },
                    { x: values[0], y: values[1], },
                    { x: values[2], y: values[3], },
                ]));
            } else if(type === 't') {// t dx dy
                console.log(`d of path is ${type}. this is not supported.`);
                throw '未実装';
            } else if(type === 'Z') {

            } else {
                console.log('type is not defined. ', type);
            }

            if(type.toUpperCase() === type) {// 大文字は絶対座標
                if(values.length >= 2) {                    
                    curPos.x = values[values.length - 2];
                    curPos.y = values[values.length - 1];
                }
            } else {// 小文字は相対座標
                if(values.length >= 2) {   
                    curPos.x += values[values.length - 2];
                    curPos.y += values[values.length - 1];
                }
                values = values.map((value, i) => {
                    if(i % 2 === 0) { return value + curPos.x; }
                    else { return value + curPos.y; }
                });
            }
            preValues = JSON.parse(JSON.stringify(values));
        });

        return new Stroke(paths);

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
            if(curStr){ //} && sep.indexOf(d[curPos]) >= 0) {// 区切り文字
                ret.push(curStr);
            }
        
            return ret;
        }
    } 

    /**
     * 曲線群の矩形を取得
     * @param {Array<Array<Curve>>} ca 曲線群
     * @returns {{x: number, y: number, }} 
     */
    static getCurvesArrayRect(curvesArray) {
        MinMax.save();
        MinMax.init();    
        curvesArray.forEach(curves => {
            curves.forEach(curve => {
                const rect = curve.rect();
                MinMax.regist({ x: rect.x, y: rect.y, });
                MinMax.regist({ x: rect.x + rect.width, y: rect.y + rect.height, });
            });
        });      
        const rect = MinMax.getRect();
        MinMax.restore();  
        return rect;
    }    

    static async loadSvg(code) {
        return fetch(Define.KANJI_SVG_FOLDER + code + '.svg')
        .then(e => { 
            if(e.ok) { return e.text(); }
            throw 'no get svg file.';			
        })
        .then(xml => {
            const curves = SvgParser.parseKvg(xml);
            return new Promise(resolve => { resolve(curves); })
        });
    }

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
        let code = splits[4]; // 39

        if(mjx !== 'MJX' || isNaN(Number(num)) || tex !== 'TEX') {
            // idが不正
            throw 'id is invalid.';
        }
        
        /**
         * 記号メモ
         * MJX-29-TEX-N-32 のように MJX-の後ろの数値は増えるので TEX以下をメモとして残す。
         * TEX-N-2B: +, TEX-N-2212: -, TEX-N-2217: *, TEX-N-2F: /, TEX-LO-222B: \int
         **/	

        if(type === 'N' && code.length === 2 && '30' <= code && code <= '39') {// N-30 ～ N-39: 0 ～ 9
            //console.log('normal number.');
        } else if(type === 'I' && code.length === 5 && '1D44E' <= code && code <= '1D467') {// I-1D44E ～ I-1D467: a ～ z
            // a: 1D44E => 00061, z: 1D467 => 0007a
            const diff = Number(`0x${code}`) - Number('0x1D44E');
            code = (Number('0x00061')+ diff).toString(16);
            //code = Utility.zeroPadding(code, Define.SVG_FILE_NAME_LENGTH);
        } else if(type === 'I' && code.length === 5 && '1D434' <= code && code <= '1D44D') {// I-1D434 ～ I-1D44D: A ～ Z
            // A: 1D434 => 00041, Z: 1D44D => 0005a
            const diff = Number(`0x${code}`) - Number('0x1D434');
            code = (Number('0x00041')+ diff).toString(16);
            //code = Utility.zeroPadding(code, Define.SVG_FILE_NAME_LENGTH);
        } else if(type === 'B' && code.length === 5 && '1D41A' <= code && code <= '1D433') {// B-1D41A ～ B-1D433: {\bf a} ～ {\bf z}
            //console.log('bold lowercase alphabet.');
        } else if(type === 'B' && code.length === 5 && '1D400' <= code && code <= '1D419') {// B-1D400 ～ B-1D419: {\bf A} ～ {\bf Z}
            //console.log('bold uppercase alphabet.');
        }        
        return code;        
    }

    /**
     * KanjiVGのSVGファイルを解析する
     * @param {string} svg svgファイルのテキスト
     * @returns {Array<Array<Curve>T>} 曲線群 
     */
    static parseKvg(svg) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'text/xml');
            
        // array like object を array に変換
        const pathArray = Array.from(doc.children[0].getElementsByTagName('path'));
        if(pathArray.length === 0) {
            throw 'path is not found.'
        }

        // get id
        let id = doc.children[0].children[0].children[0].id;
        const splits = id.split(':');
        if(splits.length !== 2) {
            throw 'id is invalid.';
        }
        // get c
        let c = splits[1];

        // <path>でループ
        // pathArray を列挙する
        const paths = [];
        for(let i = 0; i < pathArray.length; i += 1) {
            const id = pathArray[i].getAttribute('id');
            const d = pathArray[i].getAttribute('d');
            const curvesArray = SvgParser.parsePathD(d);
            const rect = SvgParser.getCurvesArrayRect(curvesArray);
            paths.push({ id, d, curvesArray, rect, });
        }        

        // 矩形を求める
        MinMax.save();
        MinMax.init();  
        for(let i = 0; i < paths.length; i += 1) {
            const path = paths[i];
            const r = path.rect;
            MinMax.regist({ x: r.x, y: r.y, });
            MinMax.regist({ x: r.x + r.width, y: r.y + r.height, });
        }
        const rect = MinMax.getRect();
        MinMax.restore();
        return { id, c, paths, rect, };
    }

}
