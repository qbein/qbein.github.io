'use asm';
'use strict';

var palette = [
	{ r:3, g:18, b:33 },
	{ r:255, g:255, b:255 },
	{ r:144, g:82, b:13 }
];

document.addEventListener("DOMContentLoaded", function() {
  new Mandelbrot(
  	document.getElementById('fractal'),
  	null);
});

function Mandelbrot(el, palette) {
	var zoomTimeout,
			iterations = 256,
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

	if(scaleFactor > 1) {
    el.width = el.offsetWidth * scaleFactor;
    el.height = el.offsetHeight * scaleFactor;
	} else {
		el.width = el.offsetWidth;
		el.height = el.offsetHeight;
	}

	var ctx = el.getContext('2d'),
			width = 5,
			height = 2,
			center = { x: 0, y: 0 },
			canvasWidth = el.width,
			canvasHeight = el.height,
			data = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

	if(!palette) {
		palette = [];
		for(var i=0; i<256; i+=1) {
			palette.push({r: i, g: i, b: i});
		}
	}

	el.addEventListener('click', function(e) {
		centerOn(e);
		draw();
	});

	el.addEventListener('mousewheel', function(e) {
		var delta = 1 - e.deltaY / 100;
		height *= delta;
		width *= delta;
		
		if(zoomTimeout) clearTimeout(zoomTimeout);
		zoomTimeout = setTimeout(function() {
			draw();
		}, 150);

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
		
		if(r || g || b) {
			data.data[i]     = r;
			data.data[i + 1] = g;
			data.data[i + 2] = b;
			data.data[i + 3] = 255;
		}
	}

	function update() {
		ctx.putImageData(data, 0, 0);
	}

	function getRatioX() {
		return width / canvasWidth;
	}

	function getRatioY() {
		return height / canvasHeight;
	}

	function draw() {
		console.log('-- Draw Mandelbrot -- ');
		console.log('Canvas width: ' + canvasWidth + ' height: ' + canvasHeight);
		console.log('Mandelbrot coord center.x: ' + center.x + ', center.y: ' + center.y + ', width: ' + width + ', height: ' + height);

		var start = new Date().getTime(),
				ratioX = getRatioX(),
				ratioY = getRatioY();

		console.log('Canvar to fractal ratioX: ' + ratioX + ', ratioY: ' + ratioY);

		for(var canvasY=0; canvasY<=canvasHeight; canvasY+=1) {
			var fractalY = (canvasY * ratioY) - (height / 2) + center.y;

			for(var canvasX=0; canvasX<=canvasWidth; canvasX+=1) {
				drawPixel(
					canvasX, 
					canvasY, 
					mapColor(
						countIterations(
							// Convert canvas coordinate to fractal coordinate
							(canvasX * ratioX) - (width / 2) + center.x, 
							fractalY
						)
					)
				);
			}
		}

		update();

		console.log('Done in ' + (new Date().getTime() - start) / 1000 + 's');
	}

	function mapColor(i) {
		return i < iterations
			? palette[i%palette.length]
			: { r: 8, g: 8, b: 8 };
	}

	/*
	function getFraction(f) {
		return Math.ceil(((f < 1.0) ? f : (f % Math.floor(f))) * 10000);
	}
	*/

	function countIterations(currentX, currentY) {
		var x = 0, y = 0, n = 0;

		for(n=0; n<iterations; n+=1) {
			var z = x*x - y*y;
			if(z > 4) break;

			var xtmp = z + currentX;
			y = 2*x*y + currentY;
			x = xtmp;
		}

		return n;
		/*
		return n<iterations
			? n + 1 - Math.log(Math.log(z))/Math.log(2)
			: 0;
		*/
	}

	draw();
}

