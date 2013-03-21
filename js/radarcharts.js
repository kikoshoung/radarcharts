var Radarcharts = function(options){
	this.options = options;
	this.init();
}

Radarcharts.prototype = {
	firstTime: true,
	freq: 40,
	config: {
		maxValue: 100, // max value of radarcharts
		padding: 0.2, // padding value of radarcharts
		bg: {
			colors: ["#404040", "#5f5f5f"], // background stripe colors, also can be [value, value, ...]
			num: 5, // number of stripes
			type: 0 // stripe type, fill or stroke, 0: fill, 1: stroke
		},
		border: {
			width: 2, // charts line width
			color: "#adfc58" // charts line color
		},
		title: {
			font: "bold 12px arial", // charts attributes' name font style
			color: "black" // charts attributes' name font color
		},
		size: { // charts size, small | medium | large
			s: [200, 200],
			m: [300, 300],
			l: [400, 400]
		},
		duration: 200 // animation duration /ms
	},
	clone: function(obj){
		return JSON.parse(JSON.stringify(obj));
	},
	init: function(){
		var bgCan = this.bgCan = $('<canvas>抱歉，您使用的浏览器不支持Canvas。</canvas>');
		var bdrCan = this.bdrCan = $('<canvas>抱歉，您使用的浏览器不支持Canvas。</canvas>');
		this.extConfig = {};
		$.extend(this.extConfig, this.config, this.options.config);
		this.bgCtx = bgCan[0].getContext("2d");
		this.bdrCtx = bdrCan[0].getContext("2d");
		this.renderCanvas();
		this.drawBg();
		this.drawBdr();
	},
	renderCanvas: function(){
		var bgCan = this.bgCan,
			bdrCan = this.bdrCan,
			config = this.extConfig,
			options = this.options,
			wrapper = $('<div></div>'),
			renderTo = this.options.renderTo,
			width = this.width = config.size[options.size][0],
			height = this.height = config.size[options.size][1];

		wrapper.css({
			position: "relative",
			width: width,
			height: height
		})
		bgCan.css({
			position: "absolute",
			zIndex: 10
		}).attr({
			width: width,
			height: height
		});
		bdrCan.css({
			position: "absolute",
			zIndex: 11
		}).attr({
			width: width,
			height: height
		});
		this.centerPoint = [width / 2, height / 2];
		
		renderTo.append(wrapper)
		wrapper.append(bgCan);
		wrapper.append(bdrCan);
	},
	drawBg: function(){
		var ctx = this.bgCtx,
			config = this.extConfig,
			bgConfig = config.bg,
			radius = this.radius = this.width * (1 - config.padding) / 2,
			radiusStep = radius / bgConfig.num;
			
		for(var i = 0; i < bgConfig.num; i++){
			var radius = this.radius,
				bgVertices = this.getVertices(radius - i * radiusStep),
				items = this.options.items;

			if(i == 0) this.maxVertices = bgVertices;

			ctx.beginPath();
			ctx.moveTo(bgVertices[0][0], bgVertices[0][1]);

			for(var j = 0; j < bgVertices.length; j++){
				var next = j + 1;
				if(next == bgVertices.length){
					next = 0;
				} 
				ctx.lineTo(bgVertices[next][0], bgVertices[next][1]);
				ctx.strokeStyle = "transparent";

				if(i == bgConfig.num - 1){
					var maxX = this.maxVertices[j][0],
						maxY = this.maxVertices[j][1],
						centerPoint = this.centerPoint,
						baseline = "middle",
						align;

					if(maxX > centerPoint[0] - 1 && maxX < centerPoint[0] + 1){
						align = "center";
						if(maxY > centerPoint[0]) baseline = "top";
						else baseline = "bottom";
					} else if(maxX > centerPoint[0]){
						align = "left";
					} else if(maxX < centerPoint[0]){
						align = "right";
					} 
					ctx.textAlign = align;
					ctx.textBaseline = baseline;
					ctx.font = config.title.font;
		        	ctx.fillStyle = config.title.color;
		        	ctx.fillText(items[j].name, maxX, maxY);
				}
			}

			ctx.fillStyle = bgConfig.colors[(i % bgConfig.colors.length)];
			if(bgConfig.type){
				ctx.strokeStyle = bgConfig.colors[0];
				ctx.stroke();
			} else {
				ctx.fill();
			}
			
			ctx.closePath();
		}
	},
	drawBdr: function(param){
		if(this.timer) clearInterval(this.timer);
		param ? this.firstTime = false : this.firstTime = true;
		if(this.firstTime) clearInterval(this.timer);
		var items = param ? param : this.options.items,
			initItems = this.initItems = this.getInitItems(),
			itemPoints = this.getItemVertices(items), // 属性值对应的点
			increaseSteps = this.getSteps(initItems, items),
			config = this.extConfig,
			me = this;

		this.timer = setInterval(function(){
			var ctx = me.bdrCtx;
			--me.frames;
			if(me.frames >= 0){
				ctx.clearRect(0, 0, me.width, me.height);
				ctx.beginPath();

				for(var i = 0; i < initItems.length; i++){
					initItems[i].value = initItems[i].value + increaseSteps[i];
				}

				itemPoints = me.getItemVertices(initItems)
				ctx.moveTo(itemPoints[0][0], itemPoints[0][1]);
				
				for(var i = 0; i < itemPoints.length; i++){
					var next = i + 1;
					if(next == itemPoints.length){
						next = 0;
					} 
					ctx.lineTo(itemPoints[next][0], itemPoints[next][1]);
					ctx.strokeStyle = config.border.color;
					ctx.lineWidth = config.border.width;
					ctx.stroke();
				}
				ctx.closePath();
			} else {
				clearInterval(me.timer);
			}
		}, me.freq);
	},
	drawBdrFrame: function(param){
		var me = this;
		param ? me.firstTime = false : me.firstTime = true;
		if(me.timer) clearInterval(me.timer);
		var items = param ? param : me.options.items,
			initItems = me.initItems = me.getInitItems(),
			itemPoints = me.getItemVertices(items), // 属性值对应的点
			increaseSteps = me.getSteps(initItems, items); 
			ctx = me.bdrCtx,
			config = this.extConfig;

		me.timer = setInterval(function(){
			--me.frames;
			if(me.frames >= 0){
				ctx.clearRect(0, 0, me.width, me.height);
				ctx.beginPath();

				for(var i = 0; i < initItems.length; i++){
					initItems[i].value = initItems[i].value + increaseSteps[i];
				}

				itemPoints = me.getItemVertices(initItems)
				ctx.moveTo(itemPoints[0][0], itemPoints[0][1]);
				
				for(var i = 0; i < itemPoints.length; i++){
					var next = i + 1;
					if(next == itemPoints.length){
						next = 0;
					} 
					ctx.lineTo(itemPoints[next][0], itemPoints[next][1]);
					ctx.strokeStyle = config.border.color;
					ctx.stroke();
				}
				ctx.closePath();
			} else {
				clearInterval(me.timer);
			}
		}, me.freq);
	},
	getVertices: function(radius){
		var	items = this.options.items,
			len = items.length,
			centerPoint = this.centerPoint,
			vertices = [];

		for(var i = 0; i < len; i++){
			var angle = i * (360 / len) + 180,
				x = Math.sin(Math.PI * angle / 180) * radius + centerPoint[0],
				y = Math.cos(Math.PI * angle / 180) * radius + centerPoint[1];

			vertices.push([x, y])
		}
		return vertices;
	},
	getInitItems: function(){
		var len = this.options.items.length,
			items = [];

		if(this.firstTime){
			for(var i = 0; i < len; i++){
				items.push({
					value: 0
				});
			}
		} else {
			items = this.clone(this.initItems);
		}
		return items;
	},
	getItemVertices: function(items){
		var maxVertices = this.maxVertices,
			vertices = [];
				
		for(var i = 0; i < maxVertices.length; i++){
			var percentage = items[i].value / this.extConfig.maxValue,
				centerPoint = this.centerPoint,
				ctx = this.ctx,
				radius = this.radius,
				angle = i * (360 / maxVertices.length) + 180,
				x = Math.sin(Math.PI * angle / 180) * radius * percentage + centerPoint[0],
				y = Math.cos(Math.PI * angle / 180) * radius * percentage + centerPoint[1];

			vertices.push([x, y]);
		}
		return vertices;
	},
	getSteps: function(now, next){
		var steps = [];
			len = now.length,
			duration = this.extConfig.duration,
			freq = this.freq,
			frames = this.frames = Math.ceil(duration / freq);

		for(var i = 0; i < len; i++){
			var step = (next[i].value - now[i].value) / frames;
			steps.push(step);
		}

		return steps;
	}
}







