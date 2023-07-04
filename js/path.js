class Path {

    /**
     * constructor
     * @param {Array<Curve>} curves array of curve
     */
    constructor(curves) {
        if(!Array.isArray(curves)) {
            throw 'invalid parameter.';
        }
        // if(curves.length === 0) {
        //     throw 'invalid curves.length.';
        // }
        this.curves = curves;
        this.imageData = null;
        this.segments = [];
    }

    /**
     * get length of path
     * @returns {number} length of path
     */
    get length() {
        return this.curves.reduce((p, c) => p + c.length, 0);
    }

    /**
     * get rect of path
     * @returns {{ x: number, y: number, width: number, height: number, }} rect of path
     */
    get rect() {
        MinMax.save();
        MinMax.init();
        this.curves.forEach(curve => {
            const rect = curve.rect;
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
        this.curves.forEach(curve => { curve.transform(m); });
    }

    /**
     * update segments (for animation)
     * @param {{ width: number, height: number, }} size size of canvas
     * @param {number} lineWidth line width
     * @param {number} step width of step
     * @returns {void} nothing
     */
    updateSegments(size, lineWidth, step) {
        if(!this.imageData) {
            throw 'invalid this.imageData.';
        }
        // get whole length
        const wholeLength = this.length;
        // get segments
        let curLength = 0;
        this.segments = [];
        this.curves.forEach(curve => {
            const startXRate = curLength / wholeLength;
            curLength += curve.length;
            const endXRate = curLength / wholeLength;
            const tempSegments = curve.getSegments(this.imageData, size, lineWidth, lineWidth, startXRate, endXRate, step);
            this.segments = this.segments.concat(tempSegments);   // concatenate
        });
    }

    /**
     * stretch path of both sides
     * @param {number} length length 
     */
    stretchBothSizes(length) {
        this.stretch(true, length);
        this.stretch(false, length);
    }

    /**
     * stretch path (by line segment) - private
     * @param {boolean} isStart is start?
     * @param {number} length length of new line segment
     * @returns {void} nothing 
     */
    stretch(isStart, length) {
        let start, end, method;
        if(isStart) {// insert line segment before start of path
            const curve = this.curves[0];   // start of curves
            const points = curve.points;
            // first derivative at start point(t === 0)
            let vec = CubicBezierCurve.firstDerivativeByT(points, 0);
            vec = Vector.scale(vec, -1);
            const unit = Vector.unit(vec);
            vec = Vector.scale(unit, length);
            // get start and end of new segment
            start = Vector.add(points[0], vec);
            end = points[0];
            method = 'unshift';
        } else {// insert line segment after end of path
            const curve = this.curves[this.curves.length - 1];  // end of curves
            const points = curve.points;
            // first derivative at end point(t === 1)
            let vec = CubicBezierCurve.firstDerivativeByT(points, 1);
            const unit = Vector.unit(vec);
            vec = Vector.scale(unit, length);
            // get start and end of new segment
            start = points[3];
            end = Vector.add(points[3], vec);
            method = 'push';
        }
        // define new curve
        const curve = new Curve([start, end]);
        // unshift or push
        this.curves[method](curve); 
    }    

    /**
     * find non smoothed curve index
     * @returns {number} index(not found -1)
     */
    findNonSmoothCurveIndex() {
        for(let i = 0; i < this.curves.length; i += 1) {
            if(i === this.curves.length - 1) { continue; }
            const cur = this.curves[i].points;
            const next = this.curves[i + 1].points;
            const smoothed = CubicBezierCurve.isSmoothed(cur, next);
            if(!smoothed) { return i; }  // no smoothed
        }
        return -1;  // smoothed
    }

    /**
     * split by curve index and return array of path
     * @param {number} index index
     * @returns {Array<Path>} array of path
     */
    splitByCurveIndex(index) {
        if(typeof index !== 'number' || index< 0 || index >= this.curves.length) {
            throw 'invalid index.';
        }
        const first = this.curves.slice(0, index + 1);
        const second = this.curves.slice(index + 1);
        if(first.length === 0 || second.length === 0) {
            throw 'invalid split';
        } 
        return [ new Path(first), new Path(second) ];
    }
}