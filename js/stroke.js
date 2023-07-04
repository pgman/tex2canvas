class Stroke {

    /**
     * constructor
     * @param {Array<Path>} paths array of path
     */
    constructor(paths) {
        if(!Array.isArray(paths)) {
            throw 'invalid parameter.';
        }
        // if(paths.length === 0) {
        //     throw 'invalid paths.length.';
        // }
        this.paths = paths;
    }

    /**
     * get length of stroke
     * @returns {number} length of stroke
     */
    get length() {
        return this.paths.reduce((p, c) => p + c.length, 0);
    }

    /**
     * get rect of stroke
     * @returns {{ x: number, y: number, width: number, height: number, }} rect of stroke
     */
    get rect() {
        MinMax.save();
        MinMax.init();
        this.paths.forEach(path => {
            const rect = path.rect;
            MinMax.regist({ x: rect.x, y: rect.y, });
            MinMax.regist({ x: rect.x + rect.width, y: rect.y + rect.height, });
        });
        const rect = MinMax.getRect();
        MinMax.restore();
        return rect;
    }

    /**
     * Affine transformation
     * @param {Array<number>} m matrix
     * @returns {void} nothing
     */
    transform(m) {
        this.paths.forEach(path => { path.transform(m); });
    }

    /**
     * split curves at non-smooth points
     * @returns {void} nothing
     */
    splitAtNonSmoothPoints() {
        const paths = this.paths;
        for(let i = 0; i < paths.length; i += 1) {
            const path = paths[i];
            // find non smooth curve index
            const index = path.findNonSmoothCurveIndex();
            if(index < 0) { continue; }  // not found (equals 'smoothed')
            // split path by curve index
            const newPaths = path.splitByCurveIndex(index);
            // remove path from paths
            paths.splice(i, 1);
            // insert new path into paths
            paths.splice(i, 0, ...newPaths);
        }
    }

    /**
     * stretch path
     * @param {number} length length of new line segment
     * @returns {void} nothing 
     */
    stretch(length) {
        this.paths.forEach(path => { path.stretchBothSizes(length); });
    }
}