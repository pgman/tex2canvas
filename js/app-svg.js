class AppSvg {
    /**
     * ローカルストレージへ保存
     * @param {string} key 
     * @param {Object} data 
     * @returns {void} なし
     */
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    
    /**
     * ローカルストレージからロード
     * @param {string} key 
     * @returns {Object} データ
     */
    static load(key) {
        let ret = {};
        const jsonStr = localStorage.getItem(key);
        if(jsonStr) {
            ret = JSON.parse(jsonStr);
        }
        return ret;
    }
}