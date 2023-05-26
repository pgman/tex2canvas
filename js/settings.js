class Settings {
    static LINE_WIDTH_ARRAY = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ];
    static SIGMA_ARRAY = [ 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4 ];
    static THRESHOLD_ARRAY = [ 0, 0.001, 0.002, 0.005, 0.01, 0.02, 0.03, 0.04, 0.05, 0.1, 0.2, 0.5 ];
    static PPS_ARRAY = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30 ];
    static SCALE_ARRAY = [ 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5 ];
    static PADDING_ARRAY = [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 ];
    static FPS_ARRAY = [ 1, 2, 3, 4, 5, 10, 16, 24, 30, 45, 60, 120, 180, 240 ];
    static COLOR_WHITE = { r: 255, g: 255, b: 255, a: 190, };
    static COLOR_YELLOW = { r: 255, g: 255, b: 146, a: 190, };
    static COLOR_PINK = { r: 247, g: 171, b: 173, a: 190, };
    static COLOR_BLUE = { r: 126, g: 203, b: 220, a: 190, };
    static COLOR_ARRAY = [ 
        { name: 'white', value: Settings.COLOR_WHITE, },
        { name: 'yellow', value: Settings.COLOR_YELLOW, },
        { name: 'pink', value: Settings.COLOR_PINK, },
        { name: 'blue', value: Settings.COLOR_BLUE, }
    ];

    static lineWidth = 5;
    static sigma = 2;
    static boundaryThreshold = 0.1;
    static internalThreshold = 0.05;
    static scale = 3;
    static padding = 20;
    static pps = 3;
    static fps = 60;
    static color = Settings.COLOR_WHITE;

    //static afterFunc = null;

    static load(key) {
        const json = localStorage.getItem(key);
        if(json) {
            const obj = JSON.parse(json);
            for (let key in obj) {
                Settings[key] = obj[key];
            }
        }
    }

    static save(key) {
        const obj = {
            lineWidth: Settings.lineWidth,
            sigma: Settings.sigma,
            boundaryThreshold: Settings.boundaryThreshold,
            internalThreshold: Settings.internalThreshold,
            scale: Settings.scale,
            padding: Settings.padding,
            pps: Settings.pps,
            fps: Settings.fps,
            color: Settings.color,
        };
        localStorage.setItem(key, JSON.stringify(obj));
    }

    static createHtml(selector) {
        let html;
        html = `<div style="margin-bottom: 8px;">
                    lineWidth:&nbsp;
                    <select id="line-width-select"></select>&nbsp;&nbsp;
                    sigma:&nbsp;
                    <select id="sigma-select"></select>&nbsp;&nbsp;
                    boundary threshold:&nbsp;
                    <select id="boundary-threshold-select"></select>&nbsp;&nbsp;
                    internal threshold:&nbsp;
                    <select id="internal-threshold-select"></select>&nbsp;&nbsp;
                    px per second:&nbsp;
                    <select id="pps-select"></select>&nbsp;&nbsp;
                </div>
                <div>
                    scale:&nbsp;
                    <select id="scale-select"></select>&nbsp;&nbsp;
                    padding:&nbsp;
                    <select id="padding-select"></select>&nbsp;&nbsp;
                    fps:&nbsp;
                    <select id="fps-select"></select>&nbsp;&nbsp;
                    color:&nbsp;
                    <select id="color-select"></select>&nbsp;&nbsp;
                </div>`;
        const wrapper = document.querySelector(selector);
        wrapper.innerHTML = html;
        html = Settings.LINE_WIDTH_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.lineWidth ? 'selected' : ''}>${c}px</option>`;
        }, '');
        document.querySelector('#line-width-select').innerHTML = html;

        html = Settings.SIGMA_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.sigma ? 'selected' : ''}>${c}px</option>`;
        }, '');
        document.querySelector('#sigma-select').innerHTML = html;

        html = Settings.THRESHOLD_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.boundaryThreshold ? 'selected' : ''}>${(c * 100).toFixed(2) + '%'}</option>`;
        }, '');
        document.querySelector('#boundary-threshold-select').innerHTML = html;
    
        html = Settings.THRESHOLD_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.internalThreshold ? 'selected' : ''}>${(c * 100).toFixed(2) + '%'}</option>`;
        }, '');
        document.querySelector('#internal-threshold-select').innerHTML = html;

        html = Settings.PPS_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.pps ? 'selected' : ''}>${c}pps</option>`;
        }, '');
        document.querySelector('#pps-select').innerHTML = html;
    
        html = Settings.SCALE_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.scale ? 'selected' : ''}>x ${c}</option>`;
        }, '');
        document.querySelector('#scale-select').innerHTML = html;
       
        html = Settings.PADDING_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.padding ? 'selected' : ''}>${c}px</option>`;
        }, '');
        document.querySelector('#padding-select').innerHTML = html;

        html = Settings.FPS_ARRAY.reduce((p, c) => {
            return p + `<option value="${c}" ${c === Settings.fps ? 'selected' : ''}>${c}</option>`;
        }, '');
        document.querySelector('#fps-select').innerHTML = html;

        html = Settings.COLOR_ARRAY.reduce((p, c) => {
            return p + `<option value="${c.name}" ${JSON.stringify(c.value) === JSON.stringify(Settings.color) ? 'selected' : ''}>${c.name}</option>`;
        }, '');
        document.querySelector('#color-select').innerHTML = html;
    }

    static attachEvents(afterFunc) {
        //Settings.afterFunc = afterFunc;
        document.querySelector('#line-width-select').addEventListener('change', Settings.onChange);
        document.querySelector('#sigma-select').addEventListener('change', Settings.onChange);
        document.querySelector('#boundary-threshold-select').addEventListener('change', Settings.onChange);
        document.querySelector('#internal-threshold-select').addEventListener('change', Settings.onChange);
        document.querySelector('#pps-select').addEventListener('change', Settings.onChange);
        document.querySelector('#scale-select').addEventListener('change', Settings.onChange);
        document.querySelector('#padding-select').addEventListener('change', Settings.onChange);
        document.querySelector('#fps-select').addEventListener('change', Settings.onChange);
        document.querySelector('#color-select').addEventListener('change', Settings.onChange);
    }

    static onChange() {
        Settings.lineWidth = Number(document.querySelector('#line-width-select').value);
        Settings.sigma = Number(document.querySelector('#sigma-select').value);    
        Settings.boundaryThreshold = Number(document.querySelector('#boundary-threshold-select').value);
        Settings.internalThreshold = Number(document.querySelector('#internal-threshold-select').value);
        Settings.pps = Number(document.querySelector('#pps-select').value);
        Settings.scale = Number(document.querySelector('#scale-select').value);
        Settings.padding = Number(document.querySelector('#padding-select').value);
        Settings.fps = Number(document.querySelector('#fps-select').value);
        const colorName = document.querySelector('#color-select').value;
        const color = Settings.getColorByName(colorName);
        Settings.color = color.value;
        //if(Settings.afterFunc){ Settings.afterFunc(); }
    }

    /**
     * name から色を検索する
     * @param {string} name 
     * @returns {{ name: string, value: Object, }} 色情報 
     */
    static getColorByName(name) {
        const color = Settings.COLOR_ARRAY.find(c => c.name === name);
        if(!color) {// 色が取得できない場合白を返す
            return { name: 'white', value: Settings.COLOR_WHITE, };
        }
        return color;
    };

    /**
     * value から色を検索する
     * @param {Object} value 
     * @returns {{ name: string, value: Object, }} 色情報 
     */
    static getColorByValue(value) {
        const color = Settings.COLOR_ARRAY.find(c => c.value.r === value.r && c.value.g === value.g && c.value.b === value.b && c.value.a === value.a);
        if(!color) {// 色が取得できない場合白を返す
            return { name: 'white', value: Settings.COLOR_WHITE, };
        }
        return color;
    }
}