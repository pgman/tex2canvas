class Utility {
    /**
     * 2点間の距離を求める
     * @param {{ x:number, y: number }} pos0 線分の始点
     * @param {{ x:number, y: number }} pos1 線分の終点
     * @return {number} 2点間の距離を返す
     */
    static distance(pos0, pos1) {
       return Math.sqrt(Math.pow(pos0.x - pos1.x, 2) + Math.pow(pos0.y - pos1.y, 2));
    }

    /**
	 * 線形補間する
	 * @param {{ x:number, y: number }} pos0 線分の始点
	 * @param {{ x:number, y: number }} pos1 線分の終点
	 * @param {number} t 補間パラメータ
	 * @return {{ x:number, y: number }} 線形補間された座標を返す
	 */
	static linearInterpolation(pos0, pos1, t) {
		return { 
			x: (1 - t) * pos0.x + t * pos1.x,
			y: (1 - t) * pos0.y + t * pos1.y
		};
	}

	/**
	 * 数値かどうか
	 * @param {string} s 文字列
	 * @returns {boolean} 0123456789+-.のいづれかか？
	 */
	static isNumeric(s) {
		return '0123456789+-.'.indexOf(s) >= 0;
	}

    /**
	 * canvasを作成する
	 * @param {number} width 幅
	 * @param {number} height 高さ
	 * @return {Object} canvas
	 */
	static createCanvas(width, height) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	/**
	 * Canvasをクリアする
	 * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
	 * @returns {void} なし
	 */
    static clearCanvas = ctx => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);	
	}

	/**
	 * 要素作成
	 * @param {string} tagName タグの名称 
	 * @param {string} innerHtml 要素のinnerHTML 
	 * @param {string} styles 要素のスタイル 
	 * @returns {Object} 要素
	 */
	static createElement(tagName, innerHtml, styles) {
		const elm = document.createElement(tagName);
		elm.innerHTML = innerHtml;
		Object.keys(styles).forEach(prop => { elm.style[prop] = styles[prop]; });
		return elm;
	}

    /**
     * 円を塗りつぶす
     * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
     * @param {{ x: number, y: number, }} pos 円の中心座標 
     * @param {number} radius 円の半径
     * @returns {void} なし 
     */
    static fillCircle(ctx, pos, radius) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2, false);
        ctx.fill();
    }

    /**
	 * 線分を描画する
	 * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
	 * @param {{ x: number, y: number }} pos0 線分の始点座標
	 * @param {{ x: number, y: number }} pos1 線分の終点座標
	 * @return {void} なし
	 */
	static drawLine(ctx, pos0, pos1) {
		ctx.beginPath();
		ctx.moveTo(pos0.x, pos0.y);
		ctx.lineTo(pos1.x, pos1.y);
		ctx.stroke();
	}	

    /**
     * パスをstrokeする
     * @param {CanvasRenderingContext2D} ctx Canvasのコンテキスト
     * @param {Array<{ x: number, y: number, }>} points 点群
     * @param {boolean} close パスを閉じるかどうか 
     */
    static strokePath(ctx, points, close = true) {
        ctx.save();
        ctx.beginPath();
        points.forEach((p, i) => {
            if(i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        });
        if(close) {
            ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
    }

    /**
	 * 点配列を拡大する
	 * @param {Array<T>} curves 点群
	 * @param {number} rate 拡大率
	 * @return {Array<T>} 拡大された点群
	 */
	static zoomCurves(curves, rate) {
		return curves.map(array => 
			array.map(inarray => 
				inarray.map(pos => {
					return { x: pos.x * rate, y: pos.y * rate };
				})
			)			
		);
	}

    /**
     * 点が矩形内に存在するか
     * @param {{ x: number, y: number, }} pos 点 
     * @param {{ x: number, y: number, width: number, height: number}} rect 矩形 
     * @returns {boolean} 点が矩形内に存在するか
     */
    static isPosInRect(pos, rect) {
		if(rect.x <= pos.x && pos.x <= rect.x + rect.width
		&& rect.y <= pos.y && pos.y <= rect.y + rect.height) {
			return true;
		} else {
			return false;
		}
	}

    /**
     * 正規分布に従う乱数を生成する(ボックスミューラー法)
     * @param {number} mean 平均 
     * @param {number} sigma 標準偏差 
     * @returns {number} 乱数
     */
	static normalDistribution(mean, sigma) {
	    const x = Math.random();
	    const y = Math.random();
	    const z1 = Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y);
	    const z2 = Math.sqrt(-2 * Math.log(x)) * Math.sin(2 * Math.PI * y);
	    return [ mean + z1 * sigma, mean + z2 * sigma ];
	}

	/**
     * 文字の UTF-16 コードを16進数で取得
     * ex. '山' -> '05c71'
     * @param {string} str 文字列(長さは1であること) 
     * @returns {string} 16進数の文字列(長さは5) 
     */
	static getCodeByChar(str) {
		let ret;
		if(str.length !== 1) { return ''; }
		ret = str.charCodeAt(0).toString(16);	// 16進数で取得
		ret = Utility.zeroPadding(ret, 5);	// 0 padding する
		return ret;
	}

    /**
     * 全角文字かどうか
     * strが文字列の場合、すべて全角なら true, そうでなければ false 
     * @param {string} str 文字列
     * @returns {boolean} 全角かどうか 
     */
    static isZenkaku(str) {
        if(str.match(/^[^\x01-\x7E\uFF61-\uFF9F]+$/)) {// 全角文字
            return true;
        } else {// 全角文字以外
            return false;
        }
    }

    // debug 中
    static getCharByCode(code) {    }

	/**
     * 0 paddingする
     * @param {number} num 数値 
     * @param {number} length 長さ
     * @returns 0 padding された文字列
     */
	static zeroPadding(num, length) {
    	return ('0000000000' + num).slice(-length);
	}

    /**
     * src の矩形のアスペクト比に合わせて縦を基準にdstの矩形を調整する
     * @param {{ x: number, y: number, width: number, height: number, }} src 基準となる矩形
     * @param {{ x: number, y: number, width: number, height: number, }} dst srcにフィットさせる矩形
     * @returns {{ x: number, y: number, width: number, height: number, }} フィットした矩形
     */
    static fitVerticalRect(src, dst) {
        // src の矩形のアスペクト比に合わせて縦を基準にdstの矩形を調整する
        // なので、dst.yとdst.heightは変わらない
        const dstCenterX = dst.x + dst.width / 2;
        const srcAspect = src.width / src.height;
        const dstWidth = dst.height * srcAspect;
        return {
            x: dstCenterX - dstWidth / 2,
            y: dst.y,
            width: dstWidth,
            height: dst.height,
        };
    }

    /**
     * src の矩形のアスペクト比に合わせて横を基準にdstの矩形を調整する
     * @param {{ x: number, y: number, width: number, height: number, }} src 基準となる矩形
     * @param {{ x: number, y: number, width: number, height: number, }} dst srcにフィットさせる矩形
     * @returns {{ x: number, y: number, width: number, height: number, }} フィットした矩形
     */
    static fitHorizontalRect(src, dst) {
        // src の矩形のアスペクト比に合わせて横を基準にdstの矩形を調整する
        // なので、dst.xとdst.widthは変わらない
        const dstCenterY = dst.y + dst.height / 2;
        const srcAspect = src.width / src.height;
        const dstHeight = dst.width / srcAspect;
        return {
            x: dst.x,
            y: dstCenterY - dstHeight / 2,
            width: dst.width,
            height: dstHeight,
        };
    }

    /**
     * 画像を読み込む
     * @param {string} dataUrl url
     * @returns {Promise<Image>} 画像
     */
    static loadImage(dataUrl) {
	    return new Promise(function(resolve, reject) {
			const image = new Image();
			image.onload = () => { resolve(image); };
			image.src = dataUrl;
	    });
	}

    /**
     * オブジェクトを.jsonとして、ユーザー指定の箇所へ保存
     * @param {any} obj オブジェクト
     * @param {string} fileName ファイル保存ダイアログに表示されるデフォルトのファイル名
     * @returns {void} なし
     */
    static saveJsonFile(obj, fileName) {
        // テキストデータの Blob オブジェクトを生成
        const blob = new Blob([JSON.stringify(obj)], { type: 'text/plain' });
        Utility.saveBlob(blob, fileName);
    }

    /**
     * .json をファイルダイアログを開いて読み込む
     * @returns {Promise<Object>} オブジェクト(エラー発生時はnull) 
     */
    static async loadJsonFile() {
        const fileoptions = {
            multiple : false, // 複数のファイルを選択しない
            excludeAcceptAllOption : false,  // 使い道が見いだせないのでとりあえず無視
            types : [// ファイルの種類のフィルター
                {
                    description : 'Application config file',  // ファイルの説明                    
                    accept : { 'application/json': ['.json'], } // MIME typeと対象の拡張子                    
                }
            ],
        };
        try {
            const fileHandles = await window.showOpenFilePicker(fileoptions);
            if(fileHandles.length !== 1) {
                throw 'file count is not one.'
            }
            const file = await fileHandles[0].getFile();
            const text = await file.text();
            if(text) {
                return JSON.parse(text);
            } else {
                return null;
            }
        } catch(e) {// ファイル未選択            
            return null;
        }
    }

    /**
     * Blob をファイルダイアログを開いて保存する
     * @param {Blob} blob Blob
     * @param {string} fileName ファイル名
     * @returns {void} なし 
     */
    static async saveBlob(blob, fileName) {
        try {
            const fh = await window.showSaveFilePicker({ suggestedName: fileName });   // ファイル保存ダイアログを表示して FileSystemFileHandle オブジェクトを取得
            const stream = await fh.createWritable();        // FileSystemWritableFileStream オブジェクトを取得
            await stream.write(blob);   // blob を書き込む
            await stream.close();   // ファイルを閉じる
        } catch(e) {            
            return; // ファイル未選択
        }
    }

    /**
     * Blob をダウンロードする
     * @param {Blob} blob Blob
     * @param {string} fileName ファイル名
     * @returns {void} なし 
     */
    static downloadBlob(blob, fileName) {
        const link = document.createElement('a');
        link.download = fileName; // ダウンロードファイル名称
        link.href = URL.createObjectURL(blob); // オブジェクト URL を生成
        link.click(); // クリックイベントを発生させる
        URL.revokeObjectURL(link.href); // オブジェクト URL を解放
    }

    /**
     * イメージデータを作成する(canvasを経由して作成する)
     * @param {number} width 幅
     * @param {number} height 高さ
     * @returns {ImageData} イメージデータ 
     */
    static createImageData(width, height) {    
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, width, height);
        return imageData;
    }

    /**
     * 使える声の配列を得る(※非同期で読み込まれて且つそのloadイベントが存在しないため、タイマーで監視する)
     * @returns {Promise<Array<Object>>} 使える声の配列
     */
    static getVoices() {
        return new Promise(resolve => {
            const intervalId = setInterval(() => {
                const voices = speechSynthesis.getVoices();
                if(voices.length) {
                    clearInterval(intervalId);
                    resolve(voices);
                }
            }, 100);
        });
    }    

    /**
     * ローカルストレージへ保存
     * @param {string} key 
     * @param {Object} data 
     * @returns {void} なし
     */
    static saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * ローカルストレージからロード
     * @param {string} key 
     * @returns {Object} データ
     */
    static loadFromLocalStorage(key) {
        let ret = {};
        const jsonStr = localStorage.getItem(key);
        if(jsonStr) {
            ret = JSON.parse(jsonStr);
        }
        return ret;
    }

    /**
     * ラジアンを度に変換
     * @param {number} rad ラジアン 
     * @returns {number} 度
     */
    static rad2deg(rad) { return rad * 180 / Math.PI; }

    /**
     * 度をラジアンに変換
     * @param {number} deg 度
     * @returns {number} ラジアン
     */
    static deg2rad(deg) { return deg / 180 * Math.PI; }

    /**
     * 補間する
     * @param {number} start 開始の値
     * @param {number} end 終了の値 
     * @param {number} rate 割合
     * @returns {number} 補間された値 
     */
    static interpolation(start, end, rate) {
        return (end - start) * rate + start;
    }

    /**
     * 線分を分割し、点群を発生させる
     * @param {{ x: number, y: number, }} start 始点 
     * @param {{ x: number, y: number, }} end 終点
     * @param {number} length 分割する長さ
     * @param {number} epsilon 最後に発生する微小線分の閾値(この値より小さい線分は存在しない)
     * @returns {Array<{ x: number, y: number, }>} 点群
     */
    static divideLineSegment(start, end, length, epsilon = 1e-5) {
        const vec = Vector.subtract(end, start);
        const unit = Vector.unit(vec);
        const dist = Vector.dist(start, end);
        const n = Math.floor(dist / length); // 切り捨て
        const ret = [];
                  
        for(let i = 0; i <= n; i += 1) {
            const scaledVec = Vector.scale(unit, length * i);  
            const newPos = Vector.add(start, scaledVec);
            ret.push(newPos);
        }
        ret.push(end);
        if(ret.length >= 2) {
            const lastDist = Vector.dist(ret[ret.length - 2], ret[ret.length - 1]);
            if(lastDist < epsilon) {
                ret.pop();
            }
        }
        return ret;
    }

    /**
     * 塗られているピクセルのインデックスの配列を渡す
     * @param {HTMLCanvasElement} canvas キャンバス
     * @returns {Array<number>} インデックスの配列 
     */
    static getFilledPixels(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        const indexes = [];
        for(let i = 0; i < data.length / 4; i += 1) {
            if(data[i * 4 + 3] !== 0) {// 塗られているとする
                indexes.push(i);
            }
        }
        return indexes;
    }

    /**
     * 値の範囲を制限する
     * @param {number} value 値 
     * @param {number} min 最小値
     * @param {number} max 最大値
     * @returns {number} 値
     */
    static limit(value, min, max) {
        if(value < min) { return min; }
        else if(max < value) { return max; }
        else { return value; }
    }

    /**
     * キャンバスとコンテキストを取得する
     * @param {string} id ID
     * @returns {Array<Object>} キャンバスとコンテキストの配列
     */
    static getCanvasContextById(id) {
        const canvas = document.getElementById(id);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        return [canvas, ctx];
    }

    /**
     * 一様分布に従う乱数を生成する
     * @param {number} min 最小値 
     * @param {number} max 最大値 
     * @returns {number} 乱数
     */
    static randomUniform(min, max) {
        return min + (max - min) * Math.random();
    }

    /**
     * 正規分布に従う乱数を生成する
     * @param {number} mean 平均
     * @param {number} sigma 標準偏差
     * @param {number} range 標準偏差のn倍まで有効範囲とする(有効範囲を無効にするなら10程度にしておくとよい。デフォルト値は2)
     */
    static randomNormal(mean, sigma, range = 2) {
        if(range < 1) { throw 'range must be over 1.'; }
        while(true) {
            const [rand] = Utility.normalDistribution(mean, sigma);
            const diff = Math.abs(rand - mean);
            if(diff <= sigma * range) {
                return rand;
            } 
        } 
    }

    /**
     * 漢字のみか判定する
     * @param {string} text 文字列 
     * @returns {boolean} 漢字のみかどうか(true: 漢字のみで構成されている, false: 漢字以外のものが含まれている)
     */
    static isKanji(text) {
        const regexp = /^([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)+$/mu;
        return regexp.test(text);
    }

    /**
     * 平仮名のみか判定する
     * @param {string} text 文字列 
     * @returns {boolean} 平仮名のみかどうか(true: 平仮名のみで構成されている, false: 平仮名以外のものが含まれている)
     */
    static isHiragana(text) {
        const regexp = /^[\u{3000}-\u{301C}\u{3041}-\u{3093}\u{309B}-\u{309E}]+$/mu;
        return regexp.test(text);
    }

    /**
     * カタカナのみか判定する
     * @param {string} text 文字列 
     * @returns {boolean} カタカナのみかどうか(true: カタカナのみで構成されている, false: カタカナ以外のものが含まれている)
     */
    static isKatakana(text) {
        const regexp = /^[\u{3000}-\u{301C}\u{30A1}-\u{30F6}\u{30FB}-\u{30FE}]+$/mu;
        return regexp.test(text);
    }

    /**
     * 画像ファイルをファイルダイアログを開いて読み込む
     * @returns {Promise<Object>} オブジェクト(エラー発生時はnull) 
     */
    static async loadImageFile() {
        const fileoptions = {
            multiple : false, // 複数のファイルを選択しない
            excludeAcceptAllOption : false,  // 使い道が見いだせないのでとりあえず無視
            types : [// ファイルの種類のフィルター
                {
                    description : 'png file',  // ファイルの説明                    
                    accept : { 'image/png': ['.png'], } // MIME typeと対象の拡張子                    
                },
                {
                    description : 'jpeg file',  // ファイルの説明                    
                    accept : { 'image/jpeg': ['.jpeg', '.jpg'], } // MIME typeと対象の拡張子                    
                }
            ],
        };
        try {
            const fileHandles = await window.showOpenFilePicker(fileoptions);
            if(fileHandles.length !== 1) {
                throw 'file count is not one.'
            }
            const file = await fileHandles[0].getFile();

            // ファイルのブラウザ上でのURLを取得する
            const blobUrl = window.URL.createObjectURL(file);
            // 画像読み込み
            const img = await Utility.loadImage(blobUrl);

            if(img) {
                return [img, file.name];
            } else {
                return [null, ''];
            }
        } catch(e) {// ファイル未選択            
            return [null, ''];
        }
    }

    /**
     * 画像の色情報を取得する
     * @param {ImageData} imageData イメージデータ
     * @returns {Array<Object>} 色情報
     */
    static getColorInfo(imageData) {
        const ret = [];
        const data = imageData.data;
        for(let i = 0; i < data.length / 4; i += 1) {
            const color = [ data[i * 4 + 0], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3] ];
            const found = ret.find(c => c.color[0] === color[0] && c.color[1] === color[1] && c.color[2] === color[2] && c.color[3] === color[3]);
            if(!found) {
                ret.push({ color, count: 0 });
            } else {
                found.count += 1;
            }
        }
        ret.sort((a, b) => b.count - a.count);
        return ret;
    }

    /**
     * 画像が全て同じ色か確認する
     * 透過は(0,0,0,0)であることの確認する。他の画素は(255,255,255)であることを確認する
     * @param {ImageData} imageData イメージデータ
     * @param {Array<number>} color rgbデータ
     * @returns {boolean} 全て白か
     */
    static isSameColor(imageData, color) {
        const data = imageData.data;
        for(let i = 0; i < data.length / 4; i += 1) {
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === 0 && g === 0 && b === 0 && a === 0) {
                continue;
            } else if(r === color[0] && g === color[1] && b === color[2] && a !== 0) {
                continue;
            } else {
                return false;
            }
        }
        return true;
    }

    /**
     * 色を置換する
     * @param {CanvasRenderingContext2D} ctx コンテキスト 
     * @param {Array<number>} src 置き換えられる色 
     * @param {Array<number>} dst 置換する色
     * @returns {void} なし
     */
    static replceColor(ctx, src, dst) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length / 4; i += 1) {
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === src[0] && g === src[1] && b === src[2] && a !== 0) {
                data[i * 4 + 0] = dst[0];
                data[i * 4 + 1] = dst[1];
                data[i * 4 + 2] = dst[2];
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    static existX(imageData, x, startY, height) {
        const data = imageData.data;

        for(let y = startY; y < startY + height; y += 1) {
            const i = x + y * imageData.width;
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];
            if(r === 0 && g === 0 && b === 0 && a === 0) {
                continue;
            } else {
                return true;
            }
        }
        return false;
    }

    static existY(imageData, y, startX, width) {
        const data = imageData.data;

        for(let x = startX; x < startX + width; x += 1) {
            const i = x + y * imageData.width;
            const r = data[i * 4 + 0],
                g = data[i * 4 + 1],
                b = data[i * 4 + 2],
                a = data[i * 4 + 3];

            if(r === 0 && g === 0 && b === 0 && a === 0) {
                continue;
            } else {
                return true;
            }
        }
        return false;   // その行は色が存在しない
    }

    /**
     * トリミングしたキャンバスを作成する
     * @param {HTMLCanvasElement} canvas キャンバス 
     * @param {{x: number, y: number, width: number, height: number, }} rect 矩形 
     * @returns {HTMLCanvasElement} トリミングしたキャンバス
     */
    static trimCanvas(canvas, rect) {
        const trimmed = Utility.createCanvas(rect.width, rect.height);
        const ctx = trimmed.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height,
            0, 0, trimmed.width, trimmed.height);
        return trimmed;
    }

    

}
	

	

	

	

	

	

	

	
