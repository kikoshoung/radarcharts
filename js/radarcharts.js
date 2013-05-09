(function(){
	// some constant
	var FREQUENCY = 20, // frequency of animation (HZ), [20 - 40] is recommended, in my opinion, 20HZ is smooth enough
		OPACITY = [0.4, 0.8, 1],
		NOT_SUPPORTED_TIP = 'Sorry, canvas is not supported in your browser.', // if not supported in one's browser, this tip will be shown
		VERTICES_FAULT_TOLERANCE_VALUE = 1; // (px)

	// default config of chart
	var CONFIG = {
		// chart size, [width, height], '100%' | 300 | '300px'
		size: ['100%', '100%'],

		// chart's padding value (percentage)
		paddingPercentage: 0.2,

		// animation duration of the plot line (millisecond)
		duration: 300,

		// style of chart, support font style only till now, work on title and legend elements
		style: {
			font: 'normal 12px Arial',
			// a standard font style will be like this
			// --> font: 'italic bold 20px/30px Arial',
			
			color: 'black'
		},

		// chart title options
		title: {
			text: 'Radar chart title',
			width: '60%',
			font: 'normal 20px Arial',
			color: 'inherit',
			padding: '10px 10%',
			margin: '0 10%',
			textAlign: 'center',
			border: '1px solid #a5a5a5',
			borderRadius: '5px'
		},

		// chart legend options
		legend: {
			color: 'inherit',
			border: '1px solid #a5a5a5',
			borderRadius: '5px',
			margin: '0 20%',
			padding: 0
		},

		// background options
		background: {
			// background type, 'circle' | 'polygon'
			type: 'polygon',

			// background stripes colors, [value, value, ...]
			colors: ['#e5e5e5'],

			// background stripes' border
			border: {
				width: '1px',
				color: '#a5a5a5'
			},

			// number of background stripes in a chart
			num: 1
		},

		// axis options
		axis: {
			width: '1px',
			color: '#a5a5a5'
		},

		// marker options
		marker: {
			radius: '4px',
			border: {
				width: '2px',
				color: 'white'
			},
			onClick: null
		},

		// header options
		header: {
			color: 'inherit',
			offset: '5px',
			font: 'normal 14px Arial'
		},

		// ploter options
		ploter: {
			width: '2px',
			fill: true,

			// plot line colors lib
			colors: ['#289af3', '#E4780B', '#71bbf5', '#FDA30D', '#134973', '#E4390B', '#365873', '#FD1C0D', '#207ac0', '#FC8A4B', '#1953dc', '#7B2C00', '#1d24fa', '#7B4425', '#19badc', '#C84700' ,'#1dfae5', '#fb5900']
		},

		// tooltip options
		tooltip: {
			width: 'auto',
			border: '2px solid transparent',
			borderRadius: '5px',
			color: 'inherit',

			// html string with replacement
			format: '<b>{series.name}</b><br/>{point.name}: {point.value} / {options.maxValue}'
		}
	};

	// create a html element with param we passed in
	var createElement = function(name, attr, innerHTML){
		var elem = document.createElement(name);

		if(attr){
			for(var i in attr){
				elem.setAttribute(i, attr[i]);
			}
		}
		if(innerHTML) {
			elem.innerHTML = innerHTML;
		}

		return elem;
	}

	// clone an object deeply
	var clone = function(original){
		if(typeof original != 'object' || !original || original.nodeType) return original;

		var clonedObject = original.constructor === Array ? [] : {};

		for(var i in original){
			clonedObject[i] = arguments.callee(original[i])
		}

		return clonedObject;
	}

	// merge two objects 
	var merge = function(master, defaults){
		var merged = clone(defaults);

		for(var j in master){
			if(merged[j] instanceof Object && master[j]){
				if(merged[j] instanceof Array){
					merged[j] = clone(master[j]);
				} else {
					merged[j] = arguments.callee(master[j], merged[j]);
				}
			} else {
				merged[j] = master[j];
			}
		}
		return merged;
	}

	// get an array that contains vertices' position value
	var getVertices = function(options, obj, radius){
		var vertices = [],
			centerPoint = obj.centerPoint,
			len = obj.dataLength, 
			padding = options.paddingPercentage,
			radius = radius ? radius : 0,
			size = options.size;

		for(var i = 0; i < len; i++){
			var degrees = i * (360 / len),
				r = typeof radius === 'object' ? radius[i] : radius,
				x = sin(degrees) * r + centerPoint[0],
				y = cos(degrees) * r + centerPoint[1];

			vertices.push([x, size[1] - y])
		}
		return vertices;
	}

	// get the incremental gap value in every single frame
	var getVerticesGap = function(options, ploter, seriesIndex){
		var res = [],
			series = options.series[seriesIndex],
			dataLength = ploter.dataLength,
			preSeries = options.preSeries,
			padding = options.paddingPercentage,
			size = options.size,
			centerPoint = ploter.centerPoint,
			frameNum = ploter.frameNum,
			scale = (centerPoint[0] < centerPoint[1] ? centerPoint[0] : centerPoint[1]) / options.maxValue,
			xGap,
			yGap;

		preSeries = preSeries ? preSeries[seriesIndex] : {name: series.name, data: getInitPreSeries(series, ploter)};
		for(var i = 0; i < dataLength; i++){
			var	degrees = i * (360 / dataLength),
				gap = (series.data[i] - preSeries.data[i]) / ploter.frameNum * scale;
			
			xGap = sin(degrees) * gap * (1 - padding);
			yGap = cos(degrees) * gap * (1 - padding);
			res.push([xGap, - yGap]);
		}
		return res;
	}

	var getRadius = function(centerPoint, padding){
		return (centerPoint[0] < centerPoint[1] ? centerPoint[0] : centerPoint[1]) * (1 - padding);
	}

	var sin = function(degrees){
		return Math.sin(Math.PI * degrees / 180);
	}
	var cos = function(degrees){
		return Math.cos(Math.PI * degrees / 180);
	}

	// ensure that 'value' is an int type value
	var parseSeries = function(series){
		var seriesLength = series.length,
			dataLength = series[0].data.length,
			maxValue;

		for(var j = 0; j < seriesLength; j++){
			for(var i = 0; i < dataLength; i++){
				series[j].data[i] = parseFloat(series[j].data[i]);
				if(maxValue){
					maxValue = series[j].data[i] > maxValue ? series[j].data[i] : maxValue;
				} else {
					maxValue = series[j].data[i];
				}
			}
		}
		return maxValue;
	}

	// parse the size value of options, '100.5' --> 100.5, '100.5px' --> 100.5
	var getSize = function(value, wrapperWidth){
		if(typeof value === 'string'){
			if(value.charAt(value.length - 1) === '%'){
				return parseFloat(value) / 100 * wrapperWidth;
			} else {
				return parseFloat(value);
			}
		} 
		return value;
	}

	var getRadiusArr = function(options, obj, seriesIndex){
		if(!options.preSeries){
			return 0;
		}
		var preSeries = options.preSeries[seriesIndex],
			dataLength = obj.dataLength,
			centerPoint = obj.centerPoint,
			res = [],
			scale = (centerPoint[0] < centerPoint[1] ? centerPoint[0] : centerPoint[1]) / options.maxValue * (1 - options.paddingPercentage);
		for(var i = 0; i < dataLength; i++){
			res.push(preSeries.data[i] * scale);
		}
		return res;
	}

	var getInitPreSeries = function(series, ploter){
		var res = [],
			dataLength = ploter.dataLength;

		for(var i = 0; i < dataLength; i++){
			res.push(0);
		}
		return res;
	}

	var getPosition = function(elem){
		var position = [elem.offsetLeft, elem.offsetTop],
			offsetParent = elem.offsetParent,
			tem;

		if(offsetParent) {
			tem = getPosition(offsetParent);
			position[0] += tem[0];
			position[1] += tem[1];
		}	

		return position;
	}

	// form cssText for an element, so we can change the style attribute in one time
	var getCssText = function(obj){
		var map = {
				width: 'width',
				height: 'height',
				color: 'color',
				font: 'font',
				border: 'border',
				padding: 'padding',
				margin: 'margin',
				borderRadius: 'border-radius',
				textAlign: 'text-align'
			},
			cssText = '';

		for(var i in obj){
			if(map[i]){
				cssText += map[i] +': '+ obj[i] +';';
			}
		}

		return cssText;
	}

	var hasClass = function(elem, cls) {
        return elem.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    }

    var addClass = function(elem, cls) {
        if (!hasClass(elem, cls)) elem.className += " " + cls;
    }

    var removeClass = function(elem, cls) {
        if (hasClass(elem, cls)) {
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            elem.className = elem.className.replace(reg, ' ');
        }
    }

	var isMouseOnPoint = function(point, mouse, options){
		var pointX = Math.round(point[0]),
			pointY = Math.round(point[1]),
			mouseX = mouse[0],
			mouseY = mouse[1],
			range = options.marker ? parseInt(options.marker.radius) + parseInt(options.marker.border.width) : 5;

		if(mouseX <= pointX + range && mouseX >= pointX - range && mouseY <= pointY + range && mouseY >= pointY - range){

			return true;
		} else return false;
	}

	var validateParam = function(options){
		var paramList = ['renderTo', 'categories', 'series'],
			len = paramList.length;
		for(var i = 0; i < len; i++){
			if(!options[paramList[i]]) throw 'Error: Can not find param "'+ paramList[i] +'" in options.';
		}
	}

	// Cavas Class
	var Canvas = function(){}
	Canvas.prototype = {
		init: function(){
			this.cacheVariable();
			this.draw();
		},
		cacheVariable: function(){
			var options = this.options;
			this.size = options.size;
			this.elem = createElement('canvas', {
				width: this.size[0],
				height: this.size[1]
			}, NOT_SUPPORTED_TIP);

			this.options.wrapper.appendChild(this.elem);

			this.ctx = this.elem.getContext('2d');
			this.ctx.translate(0.5, 0.5);
			this.frameNum = Math.ceil(options.duration / FREQUENCY);
			this.centerPoint = [this.size[0] / 2, this.size[1] / 2];
			this.dataLength = options.series[0].data.length;
		}
	}

	// Background Class
	var Background = function(options){
		this.options = options;
		this.init();
	}
	Background.prototype = new Canvas;
	Background.prototype.draw = function(){
		var options = this.options;

		if(options.background) this.drawBackground();
		if(options.axis) this.drawAxis();
		if(options.header) this.drawHeader();
	}
	Background.prototype.redraw = function(data){
		this.elem.getContext('2d').clearRect(0, 0, this.size[0], this.size[1]);
		this.options.data = data;
		this.draw();
	}
	Background.prototype.drawBackground = function(){
		var options = this.options,
			ctx = this.ctx,
			size = this.size,
			bgOpt = options.background,
			centerPoint = [size[0] / 2, size[1] / 2],
			stripesNum = bgOpt.num ? bgOpt.num : bgOpt.colors.length,
			radius = getRadius(centerPoint, options.paddingPercentage),
			bgType = bgOpt.type === 'circle' ? 'circle' : 'polygon';

		for(var i = 0; i < stripesNum; i++){
			var vertices = getVertices(options, this, radius * (stripesNum - i) / stripesNum),
				len = vertices.length;

			ctx.beginPath();
			if(bgType === 'polygon') {
				ctx.moveTo(vertices[0][0], vertices[0][1]);
				for(var j = 0; j < len; j++){
					var next = j + 1 != len ? j + 1 : 0;
					ctx.lineTo(vertices[next][0], vertices[next][1]);
				}
			} else {
				ctx.arc(centerPoint[0], centerPoint[1], radius * (stripesNum - i) / stripesNum, 0, 2 * Math.PI);
			}
			ctx.closePath();


			if(bgOpt.colors){
				ctx.fillStyle = bgOpt.colors[i % bgOpt.colors.length];
				ctx.fill();
			}
			if(bgOpt.border){
				ctx.strokeStyle = bgOpt.border.color ? bgOpt.border.color : 'transparent';
				ctx.lineWidth = bgOpt.border.width ? parseInt(bgOpt.border.width) : 1;
				ctx.stroke();
			}

		}
	},
	Background.prototype.drawHeader = function(){
		var options = this.options,
			ctx = this.ctx,
			size = this.size,
			centerPoint = this.centerPoint,
			radius = options.header.offset ? parseInt(options.header.offset) + getRadius(centerPoint, options.paddingPercentage) : getRadius(centerPoint, options.paddingPercentage),
			len = this.dataLength,
			vertices = getVertices(options, this, radius),
			baseline = 'middle',
			align = 'center',
			tolerance = VERTICES_FAULT_TOLERANCE_VALUE;

		for(var i = 0; i < len; i++){
			var x = vertices[i][0],
				y = vertices[i][1];

			if(x > centerPoint[0] - tolerance && x < centerPoint[0] + tolerance){
				align = 'center';
			} else if(x > centerPoint[0] - tolerance){
				align = 'left';
			} else if(x < centerPoint[0] + tolerance){
				align = 'right';
			}
			if(y > centerPoint[1] - tolerance && y < centerPoint[1] + tolerance){
				baseline = 'middle';
			} else if(y > centerPoint[1] - tolerance){
				baseline = 'top';
			} else if(y < centerPoint[1] + tolerance){
				baseline = 'bottom';
			}  
			
			ctx.textBaseline = baseline;
			ctx.textAlign = align;
			ctx.font = options.header.font;
		    ctx.fillStyle = options.header.color === 'inherit' ? options.style.color : options.header.color;
		    ctx.fillText(options.categories[i], vertices[i][0], vertices[i][1]);
		}
	}
	Background.prototype.drawAxis = function(){
		var options = this.options,
			ctx = this.ctx,
			size = this.size,
			centerPoint = this.centerPoint,
			len = this.dataLength,
			vertices = getVertices(options, this, getRadius(centerPoint, options.paddingPercentage)),
			axisOpt = options.axis;

		for(var i = 0; i < len; i++){
			ctx.beginPath();
			ctx.moveTo(centerPoint[0], centerPoint[1]);
			ctx.lineTo(vertices[i][0], vertices[i][1]);
			ctx.strokeStyle = axisOpt.color;
			ctx.lineWidth = parseInt(axisOpt.width);
			ctx.stroke();
			ctx.closePath();
		}
	}

	// Ploter Class
	var Ploter = function(options){
		this.options = options;
		this.init();
	}
	// prototype of chart object's constructor
	Ploter.prototype = new Canvas;
	Ploter.prototype.draw = function(){
		var options = this.options,
			frameNum = this.frameNum,
			dataLength = this.dataLength,
			series = options.series,
			seriesLength = series.length,
			legendEnableArr = options.legendEnableArr,
			size = this.size,
			me = this,
			verticesGap = [],
			radiusArr = [],
			preVertices = [],
			verticesByRound;

		for(var k = 0; k < seriesLength; k++){
			radiusArr.push(getRadiusArr(options, this, k));
			preVertices.push(getVertices(options, this, radiusArr[k]));
			verticesGap.push(getVerticesGap(options, this, k));
		}


		if(this.timer) clearInterval(this.timer);
		this.timer = setInterval(function(){
			me.animationEnded = false;
			frameNum--;
			if(frameNum < 0) {
				// cache for redraw animation
				options.preSeries = series;

				// cache for tooltip
				options.vertices = preVertices;

				// tell the mousemove handler whether the animation is ended
				me.animationEnded = true;

				clearInterval(me.timer);
				return;
			}

			me.ctx.clearRect(0, 0, size[0], size[1]);
			// loop in series
			for(var i = 0; i < seriesLength; i++){
				if(legendEnableArr[i]){
					verticesByRound = [];
					// loop in every 'data' of current series
					for(var j = 0; j < dataLength; j++){
						preVertices[i][j][0] += verticesGap[i][j][0];
						preVertices[i][j][1] += verticesGap[i][j][1];
						verticesByRound.push([preVertices[i][j][0], preVertices[i][j][1]])
					}
					me.drawByFrame(verticesByRound, i);
				}
			}
		}, FREQUENCY)
	}
	Ploter.prototype.drawByFrame = function(vertices, seriesIndex){
		var	ctx = this.ctx,
			dataLength = this.dataLength,
			ploterOpt = this.options.ploter;

		ctx.beginPath();
		ctx.moveTo(vertices[0][0], vertices[0][1]);
		for(var i = 0; i < dataLength; i++){
			var next = i + 1 != dataLength ? i + 1 : 0;
			ctx.lineTo(vertices[next][0], vertices[next][1]);
		}
		ctx.closePath();
		ctx.strokeStyle = ploterOpt.colors ? ploterOpt.colors[seriesIndex] : 'transparent';
		ctx.lineWidth = ploterOpt.width ? parseInt(ploterOpt.width) : 2;
		ctx.globalAlpha = OPACITY[1];
		ctx.stroke();
		if(ploterOpt.fill){
			ctx.fillStyle = ctx.strokeStyle;
			ctx.globalAlpha = OPACITY[0];
			ctx.fill();
		}
		
		if(this.options.marker) {
			this.drawMarkers(vertices, seriesIndex);
		}
	}
	Ploter.prototype.drawMarkers = function(vertices, seriesIndex){
		var	len = vertices.length;

		for(var i = 0; i < len; i++){
			this.drawSingleMarker(vertices, seriesIndex, i);
		}
	}
	Ploter.prototype.drawSingleMarker = function(vertices, seriesIndex, dataIndex, scale){
		var	ctx = this.ctx,
			ploterOpt = this.options.ploter,
			markerOpt = this.options.marker,
			scale = scale ? scale : 1;

		ctx.beginPath();
		ctx.arc(vertices[dataIndex][0], vertices[dataIndex][1], parseInt(markerOpt.radius) * scale, 0, 2 * Math.PI);
		ctx.closePath();
		if(markerOpt.border){
			ctx.strokeStyle = markerOpt.border.color;
			ctx.lineWidth = parseInt(markerOpt.border.width) * 2;
		}
		ctx.globalAlpha = OPACITY[2];
		ctx.stroke();
		ctx.fillStyle = ploterOpt.colors ? ploterOpt.colors[seriesIndex] : 'transparent';
		ctx.fill();
	}
	Ploter.prototype.redraw = function(series){
		this.options.series = series;
		this.draw();
	}

	// Tooltip Class
	var Tooltip = function(options, owner){
		this.options = options;
		this.owner = owner;
		this.init();
	}
	Tooltip.prototype = {
		init: function(){
			var elem = this.elem = createElement('div', {class: 'radarcharts-tooltip'}),
				options = this.options,
				tooltipOpt = this.options.tooltip,
				owner = this.owner,
				cssText = getCssText(tooltipOpt) + 'display: none; position: absolute; left: 0; top: 0; background-color: white; font-size: 12px; padding: 5px 10px; pointer-events: none; white-space:nowrap;';

			elem.style.cssText = cssText;
			this.hide();
			options.wrapper.appendChild(elem);

			owner.ploter.elem.onmousemove = function(e){
				if(owner.ploter.animationEnded) owner.mousemoveHandler(e, options)
			}
			owner.ploter.elem.onclick = function(e){
				owner.clickHandler(e, options)
			}
		},
		show: function(vertices, seriesIndex, dataIndex){
			this.elem.style.display = 'block';
			this.render(seriesIndex, dataIndex);
			this.move(vertices[seriesIndex][dataIndex]);
		},
		hide: function(){
			this.elem.style.display = 'none';
		},
		move: function(toPos){
			var elem = this.elem;
			elem.style.left = (toPos[0] - elem.clientWidth / 2) +'px';
			elem.style.top = (toPos[1] - elem.clientHeight - 10) +'px';
		},
		render: function(seriesIndex, dataIndex){
			elem = this.elem;
			
			elem.innerHTML = this.parseFormat(seriesIndex, dataIndex);
			elem.style.borderColor = this.options.ploter.colors[seriesIndex];
		},
		parseFormat: function(seriesIndex, dataIndex){
			var options = this.options,
				format = options.tooltip.format,
				match = format.match(/\{(series|point|options)\.[a-zA-Z]+\}/g),
				len = match ? match.length : 0,
				splitter = /[{\.}]/,
				offeredObj = {
					series: options.series[seriesIndex],
					point: {
						name: options.categories[dataIndex],
						value: options.series[seriesIndex].data[dataIndex]
					},
					options: options
				},
				res;

			for(var i = 0; i < len; i++){
				var replaceTarget = match[i],
					parts = (' '+ replaceTarget).split(splitter),
					field = offeredObj[parts[1]],
					prop = parts[2],
					replacement = field[prop];

				format = format.replace(replaceTarget, replacement);
			}

			return format;
		}
	}

	// Chart Class
	var Chart = function(options){
		this.options = merge(options || {}, CONFIG);
		validateParam(options);
		this.init();
	}
	Chart.prototype = {
		init: function(){
			var options = this.options;
			options.maxValue = options.maxValue ? options.maxValue : parseSeries(options.series);
			this.setChartSize(options, options.renderTo.clientWidth);
			if(options.title) this.setTitle();
			this.setWrapper(options);
			this.setContainer(options);
			this.setDefaultLegendEnableArr();
			this.background = new Background(options);
			this.ploter = new Ploter(options);
			this.setPloter();
			if(options.tooltip) this.tooltip = new Tooltip(options, this);
			if(options.legend) this.setLegend(options);
		},
		setChartSize: function(options, wrapperWidth){
			if(!options.size) {
				options.size = [wrapperWidth, wrapperWidth];
				return;
			}

			var value,
				width = getSize(options.size[0], wrapperWidth),
				height = getSize(options.size[1], wrapperWidth);
			options.size = [width, height];
		},
		setContainer: function(options){
			options.renderTo.appendChild(options.wrapper);
			options.renderTo.style.cssText = getCssText(options.style);
			options.renderTo.style.width = options.size[0] +'px';
		},
		setWrapper: function(options){
			options.wrapper = createElement('div', {class: 'radarcharts-wrapper'});
			options.wrapper.style.position = 'relative';
		},
		setPloter: function(){
			this.ploter.elem.style.position = 'absolute';
			this.ploter.elem.style.top = 0;
			this.ploter.elem.style.left = 0;
		},
		redraw: function(series, redrawoOpt){
			if(redrawoOpt){
				if(redrawoOpt.refresh) this.ploter.options.preSeries = undefined;
			}
			this.ploter.redraw(series);
			this.renderLegend(this.options);
		},
		setTitle: function(){
			var elem = createElement('p', {class: 'radarcharts-title'}),
				titleOpt = this.options.title,
				cssText = getCssText(titleOpt);

			elem.innerHTML = titleOpt.text;
			elem.style.cssText = cssText;
			this.options.renderTo.appendChild(elem);
		},
		setDefaultLegendEnableArr: function(){
			var seriesLength = this.options.series.length,
				arr = [];

			for(var i = 0; i < seriesLength; i++){
				arr.push(true);
			}
			this.options.legendEnableArr = arr;
		},
		clickHandler: function(e, options){
			var ploterElem = e.target,
				ploterElemPos = getPosition(ploterElem),
				pointPos = [e.pageX - ploterElemPos[0], e.pageY - ploterElemPos[1]],
				currentMarker = options.currentMarker;

			if(currentMarker && options.marker.onClick){
				options.marker.onClick(options.series, currentMarker.seriesIndex, currentMarker.dataIndex);
			}
		},
		mousemoveHandler: function(e, options){
			var options = this.options,
				size = options.size,
				ploter = this.ploter,
				seriesLength = options.series.length,
				dataLength = ploter.dataLength,
				vertices = ploter.options.vertices,
				ploterElem = e.target,
				ploterElemPos = getPosition(ploterElem),
				pointPos = [e.pageX - ploterElemPos[0], e.pageY - ploterElemPos[1]],
				seriesIndex,
				dataIndex;

			if(options.currentMarker){
				if(isMouseOnPoint(options.currentMarker.vertices, pointPos, options)){
					return;
				} else {
					options.currentMarker = null;
					this.tooltip.hide();
				}
			}

			for(var i = 0; i < seriesLength; i++){
				if(options.legendEnableArr[i]){
					for(var j = 0; j < dataLength; j++){
						if(isMouseOnPoint(vertices[i][j], pointPos, options)){
							seriesIndex = i;
							dataIndex = j;
						}
					}
				}	
			}

			if(seriesIndex != undefined && dataIndex != undefined){
				this.tooltip.show(vertices, seriesIndex, dataIndex);
				options.currentMarker = {
					seriesIndex: seriesIndex,
					dataIndex: dataIndex,
					vertices: vertices[seriesIndex][dataIndex]
				}
			}
		},
		setLegend: function(options){
			var legendWrapper = this.legendWrapper = createElement('div'),
				legendOpt = options.legend,
				legendWrapperCssText = getCssText(legendOpt) + 'text-align: center; font-size: 12px;';

			this.renderLegend(options);
			this.addEventForLegend(legendWrapper);
			legendWrapper.style.cssText = legendWrapperCssText;
			this.options.renderTo.appendChild(legendWrapper);
		},
		renderLegend: function(options){
			if(!options.legend) return;

			var ploterOpt = options.ploter,
				series = options.series,
				len = series.length,
				legendEnableArr = options.legendEnableArr,
				legendWrapper = this.legendWrapper,
				legendCssText = 'display: inline-block; cursor: pointer; margin: 2px 5px;',
				legendNameCssText = legendLineCssText = 'float: left; height: 16px; line-height: 16px;',
				legend,
				legendName,
				legendLine;

			legendWrapper.innerHTML = '';	
			for(var i = 0; i < len; i++){
				legend = createElement('div', {class: 'radarcharts-legend'});
				legendName = createElement('span');
				legendLine = createElement('span');
				legendName.innerHTML = series[i].name;
				legendName.style.cssText = legendNameCssText;
				legendLine.style.cssText = legendLineCssText + 'margin-right: 2px; height: 8px; width: 30px; border-bottom: 2px solid'+ (ploterOpt ? ploterOpt.colors[i] : 'transparent') +';';
				legend.style.cssText = legendCssText;
				legend.appendChild(legendLine);
				legend.appendChild(legendName);

				legendWrapper.appendChild(legend);
				if(!legendEnableArr[i]) this.disableLegend(legend);
			}
		},
		addEventForLegend: function(legendWrapper){
			var	me = this;

			legendWrapper.onclick = function(e){
				var target = e.target,
					legend = this.childNodes,
					series = clone(me.options.series),
					legendEnableArr = me.options.legendEnableArr;

				if(hasClass(target.parentNode,'radarcharts-legend')) target = target.parentNode;
				if(hasClass(target, 'radarcharts-legend')){
					for(i = 0; i < legend.length; i++){
						if(legend[i] == target){
							if(!hasClass(target, 'disabled')){
								me.disableLegend(target);
								legendEnableArr[i] = false;
							} else {
								me.enableLegend(target);
								legendEnableArr[i] = true;
							}
							me.ploter.redraw(series);
						}
					}	
				}
			}
		},
		disableLegend: function(target){
			addClass(target, 'disabled');
			target.style.opacity = OPACITY[0];
		},
		enableLegend: function(target){
			removeClass(target, 'disabled');
			target.style.opacity = OPACITY[2];
		},
		destroy: function(){
			this.ploter.elem.onmousemove = null;
			this.legendWrapper.onclick = null;
			this.options.renderTo.innerHTML = '';
		}
	}

	// export Chart Class for window object from this closure
	window.Radarcharts = Chart;

	// export for jQuery coding style
	if(window.jQuery) {
		$.fn.Radarcharts = function(options){
			options.renderTo = this[0];
			return new Radarcharts(options);
		}
	}

})()




