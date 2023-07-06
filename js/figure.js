class Figure {

    /**
     * constructor
     * @param {Array<Stroke>} strokes array of stroke
     */
    constructor(strokes) {
        if(!Array.isArray(strokes)) {
            throw 'invalid parameter.';
        }
        // if(strokes.length === 0) {
        //     throw 'invalid strokes.length.';
        // }
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
        this.strokes.forEach(stroke => {
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

    /**
     * deep copy
     * @returns {Figure} figure
     */
    copy() {
        const newFigure = new Figure([]);
        this.strokes.forEach(stroke => {
            const newStroke = new Stroke([]);
            newFigure.strokes.push(newStroke);
            stroke.paths.forEach(path => {
                const newPath = new Path([]);
                newStroke.paths.push(newPath);
                path.curves.forEach(curve => {
                    const newCurve = curve.copy();
                    newPath.curves.push(newCurve);
                });
            });
        });
        return newFigure;
    }

    /**
     * figure to string of json
     * @returns {string} string of json
     */
    stringify() {
        const array = this.toQuadrupleArray();
        return JSON.stringify(array);
    }

    /**
     * string of json to figure
     * @param {string} jsonStr string of json
     * @returns {Figure} figure
     */
    static parse(jsonStr) {
        if(!jsonStr) { return null; }
        const array = JSON.parse(jsonStr);
        return Figure.fromQuadrupleArray(array);
    }

    /**
     * figure to quadruple array
     * @returns {Array<Array<Array<Array<{ x: number, y: number, }>>>>} quadruple array
     */
    toQuadrupleArray() {
        const curFigure = [];
        this.strokes.forEach(stroke => {
            const curStroke = [];
            curFigure.push(curStroke);            
            stroke.paths.forEach(path => {
                const curPath = [];
                curStroke.push(curPath);
                path.curves.forEach(curve => {
                    const curCurve = curve.raw();
                    curPath.push(curCurve);
                });
            });
        });
        return curFigure;
    }

    /**
     * quadruple array to figure
     * @param {Array<Array<Array<Array<{ x: number, y: number, }>>>>} array array
     * @returns {Figure} figure
     */
    static fromQuadrupleArray(array) {
        const figure = new Figure([]);
        array.forEach(elmStroke => {
            const stroke = new Stroke([]);
            figure.strokes.push(stroke);
            elmStroke.forEach(elmPath => {
                const path = new Path([]);
                stroke.paths.push(path);
                elmPath.forEach(elmCurve => {
                    const curve = new Curve(elmCurve.points);
                    path.curves.push(curve);
                });
            });
        });
        return figure;
    }

    /**
     * fill
     * @param {CanvasRenderingContext2D} ctx context
     * @returns {void} nothing
     */
    fill(ctx) {
        ctx.beginPath();
        this.strokes.forEach(stroke => {
            stroke.paths.forEach(path => {
                path.curves.forEach((curve, i) => {
                    curve.createPath(ctx, i === 0);
                });
            });
        });
        ctx.closePath();
        ctx.fill();
    }

    /**
     * stroke rect
     * @param {CanvasRenderingContext2D} ctx context
     * @returns {void} nothing
     */
    strokeRect(ctx) {
        const rect = this.rect;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
}