class KanjiVG {
    /**
     * load KanjiVG File
     * @param {string} code KanjiVG code 
     * @returns {Promise<Figure>} figure
     */
    static async loadFile(code) {
        try {
            const ret = await fetch(Define.KANJI_SVG_FOLDER + code + '.svg');
            if(ret.ok) {
                const xml = await ret.text();
                const figure = KanjiVG.parse(code, xml);
                return figure;
            } else {
                throw 'no get svg file.';	
            }
        } catch(e) {
            console.error('error');
            return null;
        }
    }

    /**
     * parse KanjiVG file
     * @param {string} code KanjiVG code 
     * @param {string} xml text of KanjiVG file
     * @returns {Figure} figure 
     */
    static parse(code, xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
            
        // array like object to array
        const pathTags = Array.from(doc.children[0].getElementsByTagName('path'));
        if(pathTags.length === 0) {
            throw 'path is not found.'
        }

        // get id
        const id = doc.children[0].children[0].children[0].id;
        const splits = id.split(':');
        if(splits.length !== 2) {
            throw 'id is invalid.';
        }
        // get c
        const c = splits[1];
        if(c !== code) {// no match
            throw 'c and code do not match.';
        }

        // loop of <path>
        const strokes = [];
        for(let i = 0; i < pathTags.length; i += 1) {
            const d = pathTags[i].getAttribute('d');
            const stroke = SvgParser.parsePathD(d);
            strokes.push(stroke);
        }   
        return new Figure(strokes);
    }
}