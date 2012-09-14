function changePrecision(precision,number) {
	return Math.round(number * Math.pow(10,precision))/Math.pow(10,precision);
}

// returns the min value of an array
function min(array) {
	var min = '+Infinity',
		element;

	for (var i = 1; i < array.length; i++) {
		element = array[i];
		if (element < min && element != '-Infinity') {
			min = element;
			
		};
	};
	//alert(min);
	return min;
}

// returns the max value of an array
function max(array) {
	var max;
	for (var i = 0; i < array.length; i++) {
		if (!max || array[i] > max) {
		max = array[i];
		};
	};
	return max;
};

function orderOfMagn(value) {
	return Math.pow(10,Math.floor(log10(Math.abs(value))));
}

function log10(val) {
	return Math.log(val) / Math.log(10);
}

function drawGraph(arrayMult,focusedPlot,plotStyle,scaleType,xTitle,yTitle) {

	//array will be used to build the graph area, max and min, distance between 2 ticks etc.
	array = arrayMult[focusedPlot];
	var xArray = [],
		yArray = [],
		y, xy;

	for (var i = 0; i <= array.length - 1; i++) {
		xy = array[i];
		y = xy[1];
		if (scaleType == 'logScale') {
			if (y != 0) { //when scale is Log, don't include the points for which y = 0
				xArray.push(xy[0]);
				yArray.push(log10(Math.abs(y)));
			}
		}	else {
				xArray.push(xy[0]);
				yArray.push(y);
			}
	}

	var yMin = min(yArray);
	if (scaleType == 'logScale' && yMin < -15) {
		var index = yArray.indexOf(yMin);
		xArray.splice(index,1);
		yArray.splice(index,1);
	}
	var xMin = min(xArray),
		xMax = max(xArray),
		yMin = min(yArray),
		yMax = max(yArray),
		
		//alert(xMin);
		xyStep = calcStep(xMin,xMax,yMin,yMax),
		xStep = xyStep[0],
		yStep = xyStep[1],
		
		axesMaxMin = calcAxesMaxMin(xMin,xMax,xStep,yMin,yMax,yStep),
		xAxisMin = axesMaxMin[0],
		xAxisMax = axesMaxMin[1],
		yAxisMin = axesMaxMin[2],
		yAxisMax = axesMaxMin[3],
		
		canvas = document.getElementById('graph'),
		context = canvas.getContext('2d'),
		canvasWidth = canvas.width,
		canvasHeight = canvas.height,
		margin = 40.5,
		unitPx = calcUnitPx (xAxisMin,xAxisMax,canvasWidth,yAxisMin,yAxisMax,canvasHeight,margin),
		xUnitPx = unitPx[0],
		yUnitPx = unitPx[1];
		
		canvas.height = canvasHeight; //clears the canvas
		
	var	axesPosition = drawAxis(context,scaleType,margin,xAxisMin,xAxisMax,canvasWidth,xUnitPx,xTitle,yAxisMin,yAxisMax,canvasHeight,yUnitPx,yTitle),
		xAxisPosition = axesPosition[0],
		xTicksSide = axesPosition[1] / Math.abs(axesPosition[1]),
		yAxisPosition = axesPosition[2],
		yTicksSide = axesPosition[3] / Math.abs(axesPosition[3]);
		
		drawTicks (context,scaleType,margin,xAxisMin,xAxisMax,xStep,canvasWidth,xUnitPx,xAxisPosition,xTicksSide,yAxisMin,yAxisMax,yStep,canvasHeight,yUnitPx,yAxisPosition,yTicksSide)
		
		legend (context,scaleType,arrayMult,plotStyle,margin,xAxisMin,xUnitPx,yAxisMin,yUnitPx,canvasHeight);
		
		for (var i = 0; i < arrayMult.length; i++) {
			plot (arrayMult[i],context,scaleType,plotStyle[i],margin,xAxisMin,xAxisMax,canvasWidth,xUnitPx,yAxisMin,yAxisMax,canvasHeight,yUnitPx,yAxisPosition)
		}
}

function calcStep (xMin,xMax,yMin,yMax) {

	var oOfMagn = orderOfMagn(xMax - xMin),
		xStep = oOfMagn * 0.2,
		xAxisMax,
		xAxisMin;
		
	if (xMax - xMin > oOfMagn * 4 / 3) {
		xStep = oOfMagn * 0.5;
	}
	if (xMax - xMin > oOfMagn * 10 / 3) {
		xStep = oOfMagn;
	}
	if (xMax - xMin > oOfMagn * 20 / 3) {
		xStep = oOfMagn * 2;
	}
	
	oOfMagn = orderOfMagn(yMax - yMin);
	var	yStep = oOfMagn * 0.2,
		yAxisMax,
		yAxisMin;
		
	if (yMax - yMin > oOfMagn * 4 / 3) {
		yStep = oOfMagn * 0.5;
	}
	if (yMax - yMin > oOfMagn * 10 / 3) {
		yStep = oOfMagn ;
	}
	if (yMax - yMin > oOfMagn * 20 / 3) {
		yStep = oOfMagn * 2;
	}

	return [xStep,yStep];
}

function calcAxesMaxMin (xMin,xMax,xStep,yMin,yMax,yStep) {

	var min = [xMin,yMin],
		max = [xMax,yMax],
		step = [xStep,yStep],
		axisMin = [0,0],
		axisMax = [0,0];

	for (var i = 0; i <= 1; i++) {
		if (min[i] <= 0) {
			while (axisMin[i] >= min[i]) {
				axisMin[i] = axisMin[i] - step[i];
			}
			axisMax[i] = axisMin[i];
			while (axisMax[i] <= max[i]) {
				axisMax[i] = axisMax[i] + step[i];
			}
		} 	else {
				while (axisMax[i] <= max[i]) {
					axisMax[i] = axisMax[i] + step[i];
				}
				axisMin[i] = axisMax[i];
				while (axisMin[i] >= min[i]) {
					axisMin[i] = axisMin[i] - step[i];					
				}
			}
	}
	return [axisMin[0],axisMax[0],axisMin[1],axisMax[1]];
}

function calcUnitPx (xAxisMin,xAxisMax,canvasWidth,yAxisMin,yAxisMax,canvasHeight,margin) {
	var xUnitPx = (canvasWidth - 2 * margin) / (xAxisMax - xAxisMin),
		yUnitPx = (canvasHeight - 2 * margin) / (yAxisMax - yAxisMin);
	
	return [xUnitPx,yUnitPx];
}

function xDataToCanvas (value,margin,unitPx) {
	return margin + Math.floor(value * unitPx);
}

function yDataToCanvas (value,margin,unitPx,canvasHeight) {
	return canvasHeight - margin - Math.floor(value * unitPx);
}		

function drawAxis (context,type,margin,xAxisMin,xAxisMax,canvasWidth,xUnitPx,xTitle,yAxisMin,yAxisMax,canvasHeight,yUnitPx,yTitle) {
	context.font = '10px Arial';
	context.strokeStyle = 'black';
	context.lineWidth = 1;
	var yAxisPosition,
		xAxisPosition,
		yTitlePosition,
		xTitlePosition,
		yTitleSide,
		xTitleSide;
	
	//determine yAxis position
	if (xAxisMin <= 0 && xAxisMax >= 0) {yAxisPosition = 0;}
		else {
			if (xAxisMin > 0) {yAxisPosition = xAxisMin;}
				else {yAxisPosition = xAxisMax;}
		}
	
	//draw y Axis
	context.beginPath(); // prevents weird behavior with IE9
	context.moveTo(Math.floor((yAxisPosition - xAxisMin) * xUnitPx) + margin,canvasHeight - margin);
	context.lineTo(Math.floor((yAxisPosition - xAxisMin) * xUnitPx) + margin,margin);

	//determine x title position and y title's side
	if (xAxisMax - yAxisPosition >= yAxisPosition - xAxisMin) {xTitlePosition = (xAxisMax + yAxisPosition)/2; yTitleSide = -30;}
		else {xTitlePosition = (yAxisPosition + xAxisMin)/2; yTitleSide = +30;}
	//alert(xTitlePosition);
	
	//determine xAxis position
	if (yAxisMin <= 0 && yAxisMax >= 0 && type == 'linearScale') {xAxisPosition = 0;}
		else {
			if (yAxisMin > 0 || type == 'logScale') {xAxisPosition = yAxisMin;}
				else {xAxisPosition = yAxisMax;}
		}
	
	//draw x Axis
	
	context.moveTo(margin,canvasHeight - margin - Math.floor((xAxisPosition - yAxisMin) * yUnitPx));
	context.lineTo(canvasWidth - margin,canvasHeight - margin - Math.floor((xAxisPosition - yAxisMin) * yUnitPx));
	
	//determine y title position and x title's side
	if (yAxisMax - xAxisPosition >= xAxisPosition - yAxisMin) {yTitlePosition = (yAxisMax + xAxisPosition)/2; xTitleSide = 25;}
		else {yTitlePosition = (xAxisPosition + yAxisMin)/2; xTitleSide = -25;}
	
	//write x title
	context.textAlign = 'center';
	if (xTitleSide > 0 ) {context.textBaseline = 'top';}
		else {context.textBaseline = 'bottom';}
	context.fillText(xTitle,margin + Math.floor((xTitlePosition - xAxisMin) * xUnitPx),canvasHeight - margin - Math.floor((xAxisPosition - yAxisMin) * yUnitPx) + xTitleSide);
	
	//write y title
	context.rotate(-Math.PI / 2); //rotate the whole canvas to write y title vertically
	context.textAlign = 'center';
	if (yTitleSide > 0 ) {context.textBaseline = 'top';}
		else {context.textBaseline = 'bottom';}
	
	var x = margin + Math.floor((yAxisPosition - xAxisMin) * xUnitPx) + yTitleSide,
		y = canvasHeight - margin - Math.floor((yTitlePosition - yAxisMin) * yUnitPx);
	context.fillText(yTitle,-y,x);
	context.rotate(Math.PI / 2);


	return [xAxisPosition,xTitleSide,yAxisPosition,yTitleSide];
}

function drawTicks (context,type,margin,xAxisMin,xAxisMax,xStep,canvasWidth,xUnitPx,xAxisPosition,xTicksSide,yAxisMin,yAxisMax,yStep,canvasHeight,yUnitPx,yAxisPosition,yTicksSide) {
	var xPx,
		yPx,
		tickLabel;
	
	//x Axis
	context.textAlign = 'center';
	if (xTicksSide > 0 ) {context.textBaseline = 'top';}
		else {context.textBaseline = 'bottom';}
	
	//major ticks
	for (var x = xAxisMin; x <= xAxisMax; x+= xStep) {
		xPx = margin + Math.floor((x - xAxisMin) * xUnitPx);
		yPx = canvasHeight - margin - Math.floor((xAxisPosition - yAxisMin) * yUnitPx);
		context.moveTo(xPx,yPx);
		context.lineTo(xPx,yPx + 2 * xTicksSide);
		
		if (x == xAxisPosition && xAxisPosition != yAxisMin && xAxisPosition != yAxisMax) {xPx = xPx - 10 * yTicksSide} //avoids the messy zero labels at the axes' intersections
		tickLabel = changePrecision(7,x);
		context.fillText(tickLabel, xPx, yPx + 5 * xTicksSide); //tick label
	}
	
	//minor ticks
	for (var x = xAxisMin; x < xAxisMax; x+= xStep / 2) {
		xPx = margin + Math.floor((x - xAxisMin) * xUnitPx);
		yPx = canvasHeight - margin - Math.floor((xAxisPosition - yAxisMin) * yUnitPx);
		context.moveTo(xPx,yPx);
		context.lineTo(xPx,yPx + 1 * xTicksSide);
	}
	
	//y Axis
	context.textBaseline = 'middle';
	if (yTicksSide > 0 ) {context.textAlign = 'left';}
		else {context.textAlign = 'right';}
	//major ticks
	for (var y = yAxisMin; y <= yAxisMax; y+= yStep) {
		yPx = canvasHeight - margin - Math.floor((y - yAxisMin) * yUnitPx);
		xPx = margin + Math.floor((yAxisPosition - xAxisMin) * xUnitPx);
		context.moveTo(xPx,yPx);
		context.lineTo(xPx + 2 * yTicksSide,yPx);
		
		if (type == 'logScale' && y < yAxisMax) {
			for (var j = 1; j <= 10; j++) {
					var yMinor = Math.floor(yPx - yStep * yUnitPx * log10(j/10) - yStep * yUnitPx) + 0.5;
					
					context.moveTo(xPx, yMinor);
					context.lineTo(xPx + 1 * yTicksSide, yMinor);
				}
		}
		tickLabel = changePrecision(7,y);
		if (type == 'logScale') {tickLabel = '1E' + y;}
		if (y == xAxisPosition && yAxisPosition != xAxisMin && yAxisPosition != xAxisMax) {yPx = yPx - 10 * xTicksSide} //avoids the messy labels at the axes' intersections
		context.fillText(tickLabel, xPx + 5 * yTicksSide, yPx); //tick label
	}
	//minor ticks
	if (type == 'linearScale') {
		for (var y = yAxisMin; y < yAxisMax; y+= yStep / 2) {
		
			yPx = canvasHeight - margin - Math.floor((y - yAxisMin) * yUnitPx);
			xPx = margin + Math.floor((yAxisPosition - xAxisMin) * xUnitPx);
		
			context.moveTo(xPx,yPx);
			context.lineTo(xPx + 1 * yTicksSide,yPx);
		}
	}
	context.stroke();
}

function legend (context,type,arrayMult,plotStyle,margin,xAxisMin,xUnitPx,yAxisMin,yUnitPx,canvasHeight) {
	context.textBaseline = 'middle';
	context.textAlign = 'left';
	var x, y, xPx, yPx = '+Infinity', index, xy, array = [];
	for (var i = 0; i < arrayMult.length;i++) {
		array = arrayMult[i];
		index = array.length - 1;
		xy = array[index];
		x = xy[0];
		y = xy[1];
		xPx = 10 + margin + Math.floor((x - xAxisMin) * xUnitPx);
		if (type == 'logScale') {y = log10(Math.abs(y));}
		yPx = canvasHeight - margin - Math.floor((y - yAxisMin) * yUnitPx);
		context.fillStyle = plotStyle[i][1]; //color
		context.fillText(plotStyle[i][2],xPx,yPx);
	}
}

function plot (array,context,type,plotStyle,margin,xAxisMin,xAxisMax,canvasWidth,xUnitPx,yAxisMin,yAxisMax,canvasHeight,yUnitPx,yAxisPosition) {
	var xPx, yPx, y, j = 0;
	context.strokeStyle = plotStyle[1];
		for (var i = 0; i < array.length; i++) { //one loop for each data point
			xPx = margin + Math.floor((array[i][0] - xAxisMin) * xUnitPx);
			y = (array[i][1]);
			if (type == 'logScale') {y = log10(Math.abs(y))}
			if (y != "-Infinity") {//y = "-Infinity" when y = 0 and scale is Log
				yPx = canvasHeight - margin - Math.floor((y - yAxisMin) * yUnitPx);
				switch (plotStyle[0]) {
					case 'line':
						if (j == 0) { // j==0 <=> 1st plotted point, not necessarily 1st point in the array 
							context.beginPath();
							context.moveTo(xPx, yPx);
						}
						context.lineTo(xPx, yPx);
						break;
					case 'circles':
						context.beginPath();
						context.arc(xPx,yPx,3,0,2 * Math.PI);
						context.stroke();
						break;
					case 'diagonalCross':
						context.beginPath();
						context.moveTo(xPx - 2,yPx - 2);
						context.lineTo(xPx + 2, yPx + 2);
						context.moveTo(xPx + 2,yPx - 2);
						context.lineTo(xPx - 2, yPx + 2);
						context.stroke();
						break;
					case 'verticalCross':
						context.beginPath();
						context.moveTo(xPx,yPx - 2);
						context.lineTo(xPx, yPx + 2);
						context.moveTo(xPx + 2,yPx);
						context.lineTo(xPx - 2, yPx);
						context.stroke();
						break;
				}
				j++;
			}
		}
	if (plotStyle[0] == 'line') {context.stroke();}
}