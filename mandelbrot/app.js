(function() {
	'use asm';
	'use strict';

	function tween(b, a, fraction) {
		return b+(a-b)*fraction;
	}

	function tweenColor(color1, color2, fraction) {
		return {
			r: tween(color1.r, color2.r, fraction),
			g: tween(color1.g, color2.g, fraction),
			b: tween(color1.b, color2.b, fraction)
		}
	}

	var iterations = 128,
			palette = [],
			colors = [
				{ r:3, 	 g:18,  b:33 },
				{ r:3, 	 g:74,  b:100 },
				{ r:255, g:255, b:255 },
				{ r:144, g:82,  b:13 },
			];

	// Generate a wider palette based on the number of iterations
	colors.forEach(function(c, i) {
		var k = (i+1) % colors.length;
		var steps = iterations / colors.length;
		for(var j=0; j<steps; j+=1) {
			palette.push(tweenColor(c, colors[k], j/steps));
		}
	});

	document.addEventListener("DOMContentLoaded", function() {
	  var mandelbrot = new Mandelbrot(
	  	document.getElementById('fractal'),
	  	palette);
	});

	function Mandelbrot(el, palette) {
		var self = this,
				defaultColor = { r: 0, g: 0, b: 0 },
				ctx = el.getContext('2d'),
				scaleFactor = backingScale(ctx);

		function backingScale(context) {
	    if ('devicePixelRatio' in window) {
	        if (window.devicePixelRatio > 1) {
	            return window.devicePixelRatio;
	        }
	    }
	    return 1;
		}

		var ctx = el.getContext('2d'),
				canvasWidth, 
				canvasHeight,
				aspect, 
				width, 
				height, 
				center, 
				data;

		refreshDimensions();

		if(!palette) {
			palette = [];
			for(var i=255;i>=0; i-=15) {
				palette.push({ r: i, g: i, b: i });
			}
		}

		function refreshDimensions() {
			if(scaleFactor > 1) {
		    el.width = el.offsetWidth * scaleFactor;
		    el.height = el.offsetHeight * scaleFactor;
			} else {
				el.width = el.offsetWidth;
				el.height = el.offsetHeight;
			}

			canvasWidth = el.width;
			canvasHeight = el.height;
			aspect = canvasWidth / canvasHeight;
			width = width || 5;
			height = width / aspect;
			center = center || { x: 0, y: 0 };
			data = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
		}

		var deferredActions = {};
		function deferred(callback, delay, key) {
			if(!key) key = callback;
			if(deferredActions.hasOwnProperty(key)) {
				clearTimeout(deferredActions[key]);
			}
			deferredActions[key] = setTimeout(callback, delay || 0);
		}

		window.addEventListener('resize', function(e) {
			refreshDimensions();
			self.draw();
		});

		el.addEventListener('click', function(e) {
			centerOn(e);
			self.draw();
		});


		document.body.addEventListener('keyup', function(e) {
			if(e.keyCode == 0x28 || e.keyCode == 0x26) {
				var delta = 0.7;
				if(e.keyCode == 0x26) {
					height *= delta;
					width *= delta;	
				} else {
					height /= delta;
					width /= delta;	
				}
			}
			else if(e.keyCode == 0x25 || e.keyCode == 0x27) {
				if(e.keyCode == 0x27) {
					iterations *= 2;
				} else {
					iterations /= 2;
				}
			}
			else {
				return;
			}

			self.draw();
			
			e.preventDefault();
		});

		function centerOn(e) {
			center.x += ((e.offsetX * scaleFactor) - (canvasWidth / 2)) * getRatioX();
			center.y += ((e.offsetY * scaleFactor) - (canvasHeight / 2)) * getRatioY();
		}

		function valueOr(value, _default) {
			return value ? value : _default;
		}

		function drawPixel(x, y, rgb) {
			var i = (x + y * canvasWidth) * 4,
					r = valueOr(rgb.r, 0),
					g = valueOr(rgb.g, 0),
					b = valueOr(rgb.b, 0);
			
			data.data[i]     = r;
			data.data[i + 1] = g;
			data.data[i + 2] = b;
			data.data[i + 3] = 255;
		}

		function update(y) {
			ctx.putImageData(data,0,y);
		}

		function getRatioX() {
			return width / canvasWidth;
		}

		function getRatioY() {
			return height / canvasHeight;
		}

		this.draw = function() {
			console.log('-- Draw Mandelbrot -- ');
			console.log('Canvas width: ' + canvasWidth + ' height: ' + canvasHeight);
			console.log('Mandelbrot coord center.x: ' + center.x + ', center.y: ' + center.y + ', width: ' + width + ', height: ' + height);

			var	ratioX = getRatioX(),
					ratioY = getRatioY();

			var start = new Date().getTime();
	
			deferred(function() {
				renderSection(0, ratioX, ratioY, function() {
					console.log('Done in ' + (new Date().getTime() - start) / 1000 + 's');
					update(0);
				});
			}, 0, 'render');
		}

		function renderSection(canvasY, ratioX, ratioY, callback) {
			console.log('Rendering section..');

			var start = new Date().getTime(),
					done = true;

			var renderFunc = function() { renderSection(canvasY, ratioX, ratioY, callback) };

			while(renderLine(canvasY++, ratioY, ratioX)) {
				if((new Date().getTime() - start) > 200) {
					update(0);
					deferred(renderFunc, 0, 'render');
					//setTimeout(renderFunc, 0);
					//renderFunc(); // renderSection(canvasY, ratioX, ratioY, callback);
					done = false;
					break;
				}
			}
			
			if(done && callback) {
				callback();
			}
		}

		function renderLine(canvasY, ratioY, ratioX) {				
			var fractalY = (canvasY * ratioY) - (height / 2) + center.y;

			for(var canvasX=0; canvasX<=canvasWidth; canvasX+=1) {
				drawPixel(
					canvasX, 
					canvasY, 
					mapColor(
						iterateMandelbrot(
							// Convert canvas coordinate to fractal coordinate
							(canvasX * ratioX) - (width / 2) + center.x, 
							fractalY
						)
					)
				);
			}

			if(canvasY>canvasHeight) {
				return false;
			}

			return true;
		}


		function mapColor(i) {
			if(i == Infinity) {
				return defaultColor;
			}
			
			var idx1 = Math.floor(i) % palette.length;
			var idx2 = Math.ceil(i) % palette.length;

			return tweenColor(palette[idx1], palette[idx2], getFraction(i));
		}

		function getFraction(f) {
			return f - Math.floor(f);
		}

		function iterateMandelbrot(cX, cY) {
			var z, 
					n = 0,
					zX = cX,
					zY = cY;

			for(; n<iterations; n+=1) {
				z = zX*zX + zY*zY;

				// Using the "normal" escape radius of 4 (2^2) causes severe
				// banding when generating smooth iteration values
				if(z > 100) {
					break;
				}

				var tmp = zX*zX-zY*zY;
				zY = 2*zX*zY + cY;
				zX = tmp + cX;
			} 

			return n < iterations && n > 0
				? n + 1 - Math.log(Math.log(Math.sqrt(z)))/Math.log(2.0)
				: Infinity;
		}

		self.draw();
	}
})();