class View {
    static init() {
    }
    static drawPosArray(posArray) {
        
        const eraseCanvas = document.querySelector('#erase-canvas');
        const eraseCtx = eraseCanvas.getContext('2d', { willReadFrequently: true });
                
        eraseCtx.save();
        eraseCtx.strokeStyle = 'white';
        eraseCtx.lineWidth = 6;
        eraseCtx.lineCap = 'round';
        eraseCtx.lineJoin = 'round';
        eraseCtx.beginPath();
        posArray.forEach((pos, i) => {
            if(i === 0) { eraseCtx.moveTo(pos.x, pos.y); }
            else { eraseCtx.lineTo(pos.x, pos.y); }
        });
        eraseCtx.stroke();
        eraseCtx.restore();
    }

    static drawPreData(ctx, data, options) {
        const figure = data.figure;

        // translate and scale
        const transMat = options.translate ? Matrix.translate(options.translate.x, options.translate.y) : Matrix.identify();
        const scaleMat = options.scale ? Matrix.scale(options.scale, options.scale) : Matrix.identify();
        let mat = Matrix.multiply(scaleMat, data.mat);
        mat = Matrix.multiply(transMat, mat);
    
        ctx.save();
    
        Matrix.setTransform(ctx, mat);
    
        ctx.strokeStyle = options.color ? `rgb(${options.color[0]},${options.color[1]},${options.color[2]})` : 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = options.lineWidth ? options.lineWidth / mat[0] : 5 / mat[0];

        // stroke path
        figure.strokes.forEach(stroke => {
            stroke.paths.forEach(path => {
                ctx.beginPath();
                path.curves.forEach((curve, i) => {
                    curve.createPath(ctx, i === 0);
                });
                ctx.stroke();
            });
        });

        //if(options.strokeRect) {// stroke rect
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 4;
            figure.strokeRect(ctx);
        //}
    
        ctx.restore();
    }

    /**
     * draw mvg data
     * @param {CanvasRenderingContext2D} ctx context 
     * @param {*} mvgData mvg data
     * @param {*} options options
     */
    static drawMvgData(ctx, mvgData, options) {
        ctx.save();
        // translate and scale
        const transMat = options.translate ? Matrix.translate(options.translate.x, options.translate.y) : Matrix.identify();
        const scaleMat = options.scale ? Matrix.scale(options.scale, options.scale) : Matrix.identify();
        Matrix.setTransform(ctx, transMat);    
        Matrix.transform(ctx, scaleMat);
    
        mvgData.shapes.forEach(shape => {           

            if(!shape.xlinkHref) {
                return;
            }
    
            // get data to draw
            const data = mvgData.datas.find(d => d.id === shape.xlinkHref.replace('#', ''));
            if(!data) { 
                ctx.restore();
                return; // continue;
            }
            // cache
            const figure = data.figure;

            ctx.save();
            // matrix of object
            Matrix.transform(ctx, shape.mat);
            
            if(options.fillFigure) {// fill figure
                ctx.fillStyle = 'green';
                ctx.beginPath();
                figure.strokes.forEach(stroke => {
                    stroke.paths.forEach(path => {
                        path.curves.forEach((curve, i) => {
                            curve.createPath(ctx, i === 0);
                        });
                    });
                });
                ctx.closePath();
                ctx.fill();
            }       
            
            if(options.strokeRect) {// stroke rect
                const rect = figure.rect;
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 10;
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }
            ctx.restore();                 
        });    
        ctx.restore();
    }

    /**
     * draw svg text
     * @param {CanvasRenderingContext2D} ctx context
     * @param {string} svgText
     * @returns {Promise<void>} nothing
     */
    static drawSvg(ctx, svg, options) {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = e => { 
                // translate and scale
                const transMat = options.translate ? Matrix.translate(options.translate.x, options.translate.y) : Matrix.identify();
                const scaleMat = options.scale ? Matrix.scale(options.scale, options.scale) : Matrix.identify();
                Matrix.setTransform(ctx, transMat);    
                Matrix.transform(ctx, scaleMat);
                ctx.drawImage(img, 0, 0);
                const imageData = GraphicsApi.getImageData(ctx);
                if(options.color) {
                    Graphics.replaceColor(imageData, [0, 0, 0], options.color);
                }                
                ctx.putImageData(imageData, 0, 0);
                resolve();
            };
            img.onerror = () => { reject(); }

            const xmlHeader = '<' + '?xml version="1.0" encoding="UTF-8" standalone="no" ?' + '>\n';
            const svgSourceCodeToDownload = xmlHeader + svg.outerHTML;
            const base64SourceCode = base64Encode(bytesFromText(svgSourceCodeToDownload));            
			img.src = 'data:image/svg+xml;base64,' + base64SourceCode;
            //img.src = 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + svgText); 
        });
        function base64Encode(bytes) {
			const map = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'];

			// Add all complete triplets
			let text = '';
			for (var i = 0; i < bytes.byteLength - 2; i += 3) {
				var value = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
				text += map[(value >> 18) & 0x3f];
				text += map[(value >> 12) & 0x3f];
				text += map[(value >> 6) & 0x3f];
				text += map[value & 0x3f];
			}

			// Add the remaining bytes
			const remaining = bytes.byteLength - i;
			if (remaining == 2) {
				const value = bytes[i] << 8 | bytes[i + 1];
				text += map[(value >> 10) & 0x3f];
				text += map[(value >> 4) & 0x3f];
				text += map[(value << 2) & 0x3f];
				text += '=';
			} else if (remaining == 1) {
				const value = bytes[i];
				text += map[(value >> 2) & 0x3f];
				text += map[(value << 4) & 0x3f];
				text += '==';
			}

			// Return the text
			return text;
		}

		// Returns the number of bytes required to encode a UTF-8 char.
		function utf8CharLength(charCode) {	// Uint ⇒ Uint
			return charCode < 0x80 ? 1 : charCode < 0x800 ? 2 : charCode < 0x10000 ? 3 : charCode < 0x200000 ? 4 : charCode < 0x4000000 ? 5 : 6;
		}

		// Adds a single char to a byte array at position "offset". Returns the new offset after adding the char.
		function addUtf8CharToBytes(bytes, offset, charCode) {	// Uint8Array, Uint, Uint ⇒ Uint
			let position = offset;
			if (charCode < 0x80) {
				bytes[position++] = charCode;
			} else if (charCode < 0x800) {
				bytes[position++] = 0xc0 | (charCode >>> 6);
				bytes[position++] = 0x80 | (charCode & 0x3f);
			} else if (charCode < 0x10000) {
				bytes[position++] = 0xe0 | (charCode >>> 12);
				bytes[position++] = 0x80 | ((charCode >>> 6) & 0x3f);
				bytes[position++] = 0x80 | (charCode & 0x3f);
			} else if (charCode < 0x200000) {
				bytes[position++] = 0xf0 | (charCode >>> 18);
				bytes[position++] = 0x80 | ((charCode >>> 12) & 0x3f);
				bytes[position++] = 0x80 | ((charCode >>> 6) & 0x3f);
				bytes[position++] = 0x80 | (charCode & 0x3f);
			} else if (charCode < 0x4000000) {
				// Must never appear in a valid UTF-8 sequence
				bytes[position++] = 0xf8 | (charCode >>> 24);
				bytes[position++] = 0x80 | ((charCode >>> 18) & 0x3f);
				bytes[position++] = 0x80 | ((charCode >>> 12) & 0x3f);
				bytes[position++] = 0x80 | ((charCode >>> 6) & 0x3f);
				bytes[position++] = 0x80 | (charCode & 0x3f);
			} else {
				// Must never appear in a valid UTF-8 sequence
				bytes[position++] = 0xfc | (charCode >>> 30);
				bytes[position++] = 0x80 | ((charCode >>> 24) & 0x3f);
				bytes[position++] = 0x80 | ((charCode >>> 18) & 0x3f);
				bytes[position++] = 0x80 | ((charCode >>> 12) & 0x3f);
				bytes[position++] = 0x80 | ((charCode >>> 6) & 0x3f);
				bytes[position++] = 0x80 | (charCode & 0x3f);
			}
			return position;
		}

		// Converts a string into a byte array using UTF-8 encoding.
		function bytesFromText(text) {	// String ⇒ Uint8Array
			let length = 0;
			for (let i = 0; i < text.length; i++)
				length += utf8CharLength(text.charCodeAt(i));

			let offset = 0;
			const bytes = new Uint8Array(length);
			for (let i = 0; i < text.length; i++)
				offset = addUtf8CharToBytes(bytes, offset, text.charCodeAt(i));

			return bytes;
		}
    }
}