class Figure {

    /**
     * constructor
     * @param {Array<Stroke>} strokes array of stroke
     */
    constructor(strokes) {
        if(!Array.isArray(strokes)) {
            throw 'invalid parameter.';
        }
        if(strokes.length === 0) {
            throw 'invalid strokes.length.';
        }
        this.strokes = strokes;
    }

    /**
     * get length of figure
     * @returns {number} length of figure
     */
    get length() {
        return this.strokes.reduce((p, c) => p + c.length, 0);
    }

    /**
     * get rect of figure
     * @returns {{ x: number, y: number, width: number, height: number, }} rect of figure
     */
    get rect() {
        MinMax.save();
        MinMax.init();
        this.strokes(stroke => {
            const rect = stroke.rect;
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
        this.strokes.forEach(stroke => { stroke.transform(m); });
    }

    /**
     * split curves at non-smooth points
     * @returns {void} nothing
     */
    splitAtNonSmoothPoints() {
        this.strokes.forEach(stroke => { stroke.splitAtNonSmoothPoints(); });
    }

    /**
     * stretch path
     * @param {number} length length of new line segment
     * @returns {void} nothing 
     */
    stretch(length) {
        this.strokes.forEach(stroke => { stroke.stretch(length); });
    }
}