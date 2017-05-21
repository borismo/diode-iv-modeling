/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "assets/samplefiles/T279K.txt";

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "index.html";

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(4);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!./index.css", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!./index.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = drawGraph;
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

let array;

function drawGraph(canvasId,arrayMult,focusedPlot,plotStyle,scaleType,xTitle,yTitle) {
	
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
		
		canvas = document.getElementById(canvasId),
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
		index = array.length - 1;//last point
		xy = array[index];
		x = xy[0];
		y = xy[1];
		
		xPx = 10 + margin + Math.floor((x - xAxisMin) * xUnitPx);
		if (type == 'logScale') {y = log10(Math.abs(y));}
		if (isFinite(y)) {
			yPx = canvasHeight - margin - Math.floor((y - yAxisMin) * yUnitPx);
			context.fillStyle = plotStyle[i][1]; //color
			context.fillText(plotStyle[i][2],xPx,yPx);
		}
	}
}

function plot (array,context,type,plotStyle,margin,xAxisMin,xAxisMax,canvasWidth,xUnitPx,yAxisMin,yAxisMax,canvasHeight,yUnitPx,yAxisPosition) {
	var xPx, yPx, y, j = 0;
	context.strokeStyle = plotStyle[1];
		for (var i = 0; i < array.length; i++) { //one loop for each data point
			xPx = margin + Math.floor((array[i][0] - xAxisMin) * xUnitPx);
			y = (array[i][1]);
			if (type == 'logScale') {y = log10(Math.abs(y))}
			if (y != '-Infinity') {//y = '-Infinity' when y = 0 and scale is Log
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

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, "/*\r\n * Base structure\r\n */\r\n\r\n/* Move down content because we have a fixed navbar that is 50px tall */\r\nbody {\r\n  padding-top: 60px;\r\n}\r\n\r\n.navbar-brand {\r\n  font-size: 36px;\r\n}\r\n\r\n/*\r\n * Global add-ons\r\n */\r\n\r\n.sub-header {\r\n  padding-bottom: 10px;\r\n  border-bottom: 1px solid #eee;\r\n}\r\n\r\n/*\r\n * Top navigation\r\n * Hide default border to remove 1px line.\r\n */\r\n.navbar-fixed-top {\r\n  border: 0;\r\n  height: 60px;\r\n}\r\n\r\n/*\r\n * Sidebar\r\n */\r\n\r\n@media (min-width: 768px) {\r\n  .sidebar {\r\n    position: fixed;\r\n    top: 60px;\r\n    bottom: 0;\r\n    left: 0;\r\n    z-index: 1000;\r\n    display: block;\r\n    padding: 20px;\r\n    overflow-x: hidden;\r\n    overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */\r\n    background-color: #f5f5f5;\r\n    border-right: 1px solid #eee;\r\n  }\r\n}\r\n\r\n/* Sidebar navigation */\r\n.nav-sidebar {\r\n  margin-right: -21px; /* 20px padding + 1px border */\r\n  margin-bottom: 20px;\r\n  margin-left: -20px;\r\n}\r\n.nav-sidebar > li > a {\r\n  padding-right: 20px;\r\n  padding-left: 20px;\r\n}\r\n.nav-sidebar > .active > a,\r\n.nav-sidebar > .active > a:hover,\r\n.nav-sidebar > .active > a:focus {\r\n  color: #fff;\r\n  background-color: #428bca;\r\n}\r\n\r\n\r\n/*\r\n * Main content\r\n */\r\n\r\n.main {\r\n  padding: 20px;\r\n}\r\n@media (min-width: 768px) {\r\n  .main {\r\n    padding-right: 40px;\r\n    padding-left: 40px;\r\n  }\r\n}\r\n.main .page-header {\r\n  margin-top: 0;\r\n}\r\n\r\n/* fa icons */\r\n.fa-toggle-on, .fa-toggle-off {\r\n  cursor: pointer;\r\n}\r\n\r\n.fa-toggle-on {\r\n  /*color: #f1f1f1;*/\r\n  color: #dddddd;\r\n  color: #8ce196;\r\n}\r\n\r\n.fa-toggle-off {\r\n  color: #dddddd;\r\n}\r\n\r\nbutton.play > span#pause {\r\n  display: none;\r\n}\r\n\r\nbutton.pause > span#play {\r\n  display: none;\r\n}\r\n\r\ndiv.input-group#ds {\r\n  width: 60%;\r\n}\r\n\r\n.panel {\r\n  position: relative;\r\n}\r\n\r\n.panel.nofile:after {\r\n  content: \" \";\r\n  z-index: 10;\r\n  display: block;\r\n  position: absolute;\r\n  height: 100%;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  background: rgba(255, 255, 255, 0.5);\r\n  border-radius: 4px;\r\n}", ""]);

// exports


/***/ }),
/* 5 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		// Test for IE <= 9 as proposed by Browserhacks
		// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
		// Tests for existence of standard globals is to allow style-loader 
		// to operate correctly into non-standard environments
		// @see https://github.com/webpack-contrib/style-loader/issues/177
		return window && document && document.all && !window.atob;
	}),
	getElement = (function(fn) {
		var memo = {};
		return function(selector) {
			if (typeof memo[selector] === "undefined") {
				memo[selector] = fn.call(this, selector);
			}
			return memo[selector]
		};
	})(function (styleTarget) {
		return document.querySelector(styleTarget)
	}),
	singletonElement = null,
	singletonCounter = 0,
	styleElementsInsertedAtTop = [],
	fixUrls = __webpack_require__(7);

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (typeof options.insertInto === "undefined") options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

	var styles = listToStyles(list, options);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list, options) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function insertStyleElement(options, styleElement) {
	var styleTarget = getElement(options.insertInto)
	if (!styleTarget) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}
	var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
	if (options.insertAt === "top") {
		if(!lastStyleElementInsertedAtTop) {
			styleTarget.insertBefore(styleElement, styleTarget.firstChild);
		} else if(lastStyleElementInsertedAtTop.nextSibling) {
			styleTarget.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			styleTarget.appendChild(styleElement);
		}
		styleElementsInsertedAtTop.push(styleElement);
	} else if (options.insertAt === "bottom") {
		styleTarget.appendChild(styleElement);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement(styleElement) {
	styleElement.parentNode.removeChild(styleElement);
	var idx = styleElementsInsertedAtTop.indexOf(styleElement);
	if(idx >= 0) {
		styleElementsInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement(options) {
	var styleElement = document.createElement("style");
	options.attrs.type = "text/css";

	attachTagAttrs(styleElement, options.attrs);
	insertStyleElement(options, styleElement);
	return styleElement;
}

function createLinkElement(options) {
	var linkElement = document.createElement("link");
	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	attachTagAttrs(linkElement, options.attrs);
	insertStyleElement(options, linkElement);
	return linkElement;
}

function attachTagAttrs(element, attrs) {
	Object.keys(attrs).forEach(function (key) {
		element.setAttribute(key, attrs[key]);
	});
}

function addStyle(obj, options) {
	var styleElement, update, remove, transformResult;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    transformResult = options.transform(obj.css);
	    
	    if (transformResult) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = transformResult;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css. 
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement(options));
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement(options);
		update = updateLink.bind(null, styleElement, options);
		remove = function() {
			removeStyleElement(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement(options);
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/* If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
	and there is no publicPath defined then lets turn convertToAbsoluteUrls
	on by default.  Otherwise default to the convertToAbsoluteUrls option
	directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls){
		css = fixUrls(css);
	}

	if(sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 7 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_bobGraph__ = __webpack_require__(3);

// require.context('.', true, /^\.\/.*\.html/);
__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(0);

let main = function () { // eslint-disable-line 
  'use strict';

  const mchEps = machineEpsilon();

  // Elementary charge and Boltzmann constant
  const q = 1.60217653E-19,
    k = 1.3806488E-23;

  let arrayCalc,
    fileOpened = false,
    plotStyle = [],
    userData = {
      estimatedParameters: {
        Rp: undefined
      },
      current: {
        shunt: undefined,
        nonLinear: undefined,
        noIrpNoSCLCarray: undefined
      },
      dataArray: [],
      modifDataArray: []
    },
    parameters = {
      minVolt: undefined,
      maxVolt: undefined,
      stepVolt: undefined,
      iph: undefined,
      t: undefined,
      n1: undefined,
      n2: undefined,
      is1: undefined,
      is2: undefined,
      rp1: undefined,
      rp2: undefined,
      rs: undefined,
      init: function () {
        for (let property in this) {
          const isDataProperty = typeof this[property] !== 'function';
          if (isDataProperty){
            const  $inputNumber = $('[type=number].' + property),
              $inputCheckBox = $('[type=checkbox].' + property);
            this[property] = {
              value: parseFloat($inputNumber.val()),
              checked: $inputCheckBox.is(':checked')
            };
          }
        }
      },
      update: function ($element) {
        for (let property in this) {
          if ($element.hasClass(property)) {
            const elementValue = parseFloat($element.val()),
              inputIsLogRange = $element.hasClass('logscale') && $element.attr('type') === 'range',
              newValue = (inputIsLogRange)? Math.pow(10, elementValue) : elementValue;
            this[property] = {
              value: newValue,
              checked: $element.is(':checked')
            };
          }
        }
      }
    },
    model = {};

  function machineEpsilon() {
    // Calculate Machine Epsilon
    let temp1, temp2;
    temp1 = 1.0;
    do {
      temp1 /= 2;
      temp2 = 1.0 + temp1;
    } while (temp2 > 1.0);
    return temp1;
  }

  $(function () {
    $('input[type=radio].default')
      .attr('checked', true);

    clearFileInput();

    parameters.init();

    model = getModel();

    // When page loaded, calculate a first time
    // IV using the initial parameters
    calcIVandPlot();

    bindEvents();

    var holder = document.getElementById('graph');

    holder.ondragenter = holder.ondragover = function (event) {
      event.preventDefault();
      holder.className = 'hover';
    };

    holder.ondragleave = function (event) {
      event.preventDefault();
      holder.className = '';
    };

    holder.ondrop = function (e) {
      e.preventDefault();
      processFiles(e.dataTransfer.files);
      holder.className = '';
    };
  });

  function bindEvents() {
    $('input[type=range].syncme')
      .on('input', inputEvent)
      .mouseup(rangeInputMouseUp);

    $('input[type=number].syncme')
      .change(inputEvent)
      .keydown(numberInputKeyDown)
      .blur(changeStep);

    $('input[type=number].voltage')
      .change(voltageInputChanged);

    $('input[type=radio].model')
      .change(modelChanged);

    $('input[type=radio].scale')
      .change(changeScaleType);

    $(':file')
      .change(fileInputChanged);

    $('.fa-toggle-on, .fa-toggle-off')
      .click(faToggleClicked);

    $('#useestimatedparams')
      .click(useEstimatedParams);

    $('button#start')
      .click(startButtonClicked);

    $('input#clear')
      .click(clearData);

    $('[type=checkbox]')
      .change(parameterCheckBoxChanged);
  }

  function changeScaleType() {
    // Event handler
    // fired when user clicks on a scale type radio button
    calcIVandPlot();
  }

  function rangeInputMouseUp() {
    // Event handler
    adjustRange(this);
  }

  function numberInputKeyDown(event) {
    const keyCode = event.which,
      upOrDownArrowKeyDown = keyCode == 38 || keyCode == 40;

    if (upOrDownArrowKeyDown) {
      syncInputs(this);
      adjustRange(this);
      calcIVandPlot();
    }
  }

  function calcIVandPlot() {
    const ivResult = calcIV(parameters, getModel());

    arrayCalc = ivResult.arrayCalc;
    plotStyle = ivResult.plotStyle;

    // and plot the result
    combDataAndCalc();
  }

  function fileInputChanged() {
    // Fired when user selects a new file
    // to import
    const file = this.files[0];
    $(this)
      .closest('.input-group')
      .children('input:text')
      .val(file.name);
    processFiles(file);
  }

  function faToggleClicked() {
    // Fired when user clicks on any of the font-awesome toggle icons
    // As of now there are 2 of these icons on the page
    const iElem = this; // <i> element

    $(iElem)
      .toggleClass('fa-toggle-on fa-toggle-off');

    if (iElem.id === 'hideIrp') {
      userData.modifDataArray = toggleIrp(userData.modifDataArray, userData.current.shunt, IprShowed());
      combDataAndCalc();
    }

    if (iElem.id === 'hideNonLinCurr') {
      const toggleResult = toggleNonLinCurr(userData, userData.modifDataArray, nonLinearCurrentShowed());
      userData.dataArray = toggleResult.dataArray;
      userData.modifDataArray = toggleResult.modifDataArray;
      combDataAndCalc();
    }
  }

  function parameterCheckBoxChanged() {
    /* Fired when user clicks on any of the checkbox inputs
    These checkboxes define whether the corresponding diode
    parameter varies or not during optimization
    Therefore, if unchecked, the parameter will not be estimated. */
    findAndEstimateDiodes();
  }

  function syncInputs(sourceElem) {
    // Sync range and number inputs

    const $sourceInput = $(sourceElem),
      isSourceRange = $sourceInput.attr('type') === 'range',
      targetType = (isSourceRange) ? 'number' : 'range',
      sourceValue = $sourceInput.val();

    // Sync companion input
    const $targetInput = $sourceInput
      .closest('.row')
      .find('input.syncme[type=' + targetType + ']'),
      isScaleLog = $targetInput.hasClass('logscale');

    if (isScaleLog) {
      const targetValue = (isSourceRange) ? Math.pow(10, sourceValue).toExponential(2) : log10(sourceValue);
      $targetInput.val(targetValue);
    } else {
      // Linear scale
      $targetInput.val(sourceValue);
    }
  }

  function syncAllInputs() {
    $('input[type=number].syncme')
      .each(function (index, element) {
        syncInputs(element);
      });
  }

  function inputEvent() {
    // Event handler
    // fired when user moves range input or change number input.
    // So "this" is a number or range input element

    const isNumberInput = $(this).attr('type') === 'number';

    if (isNumberInput) {
      adjustRange(this);
    }
    
    syncInputs(this);

    parameters.update($(this));
    
    calcIVandPlot();
  }

  function voltageInputChanged() {
    // Fired when one of the 3 .voltage inputs is changed by user

    parameters
      .update($(this));

    checkVoltageInputs();

    calcIVandPlot();
  }

  function checkVoltageInputs() {
    const minVolt = parameters.minVolt.value,
      maxVolt = parameters.maxVolt.value,
      stepVolt = parameters.stepVolt.value;
    
    // Make sure maxVolt > minVolt
    if (maxVolt < minVolt) {
      document.getElementById('minVolt').value = maxVolt;
      document.getElementById('maxVolt').value = minVolt;
    }

    // Make sure stepVolt != 0
    if (stepVolt == 0) {
      document.getElementById('stepVolt').value = 25;
    }

    // Make sure stepVolt > 0
    if (stepVolt < 0) {
      document.getElementById('stepVolt').value = Math.abs(stepVolt);
    }
  }

  function log10(val) {
    // Returns base 10 logarithmic
    // (Math.log10() method is not supported by IE11)
    // Can stop using this function with a transpiler
    return Math.log(val) / Math.log(10);
  }

  function remDecimals(model, number) {
    // Change a number's precision
    const nbDecimals = nbAfterDot(model);
    return Math.round(number * Math.pow(10, nbDecimals)) * Math.pow(10, -nbDecimals);
  }

  function nbAfterDot(number) {
    // Return the number of digits
    // after decimal separator
    const n = number.toString().indexOf('.');
    if (n == -1) {
      return 0;
    }
    else {
      let i = 0;
      while (number.charAt(n + 1 + i) != '' && isFinite(number.charAt(n + 1 + i))) {
        i++;
      }
      return i;
    }
  }
  
  function getRowDiv($input) {
    // Get parameter inputs'
    // closest common ancestor
    return $input
      .closest('.row');
  }

  function adjustRange(element) {
    // When value reaches input's range limit,
    // modifies range so user is able to use it again

    const $input = $(element),
      inputType = $input.attr('type'),
      $rowDiv = getRowDiv($input);

    let $rangeInput = $input,
      rangeInputElem = element,
      $numberInput = $rowDiv
        .find('[type=number]'),
      numberInputElem = $numberInput.get(0);

    if (inputType === 'number') {
      $rangeInput = $rowDiv
          .find('[type=range]');
      rangeInputElem = $rangeInput.get(0);
      $numberInput = $input;
      numberInputElem = element;
    }

    let rangeChanged = false;

    const rangeMax = parseFloat(rangeInputElem.max),
      rangeMin = parseFloat(rangeInputElem.min),
      numberValue = parseFloat(numberInputElem.value);

    if ($rangeInput.hasClass('linearscale')) {
      if (numberValue >= rangeMax) {
        rangeInputElem.max = remDecimals(numberValue, 1.6 * numberValue);
        rangeInputElem.value = numberValue;
        rangeInputElem.min = remDecimals(numberValue, 0.4 * numberValue);
        rangeChanged = true;
      } else {
        if (numberValue <= rangeMin) {
          rangeInputElem.min = remDecimals(numberInputElem.value, 0.4 * numberInputElem.value);
          rangeInputElem.value = numberInputElem.value;
          rangeInputElem.max = remDecimals(numberInputElem.value, 1.6 * numberInputElem.value);
          rangeChanged = true;
        }
      }
      while (2 * rangeInputElem.step >= (rangeInputElem.max - rangeInputElem.min)) {
        rangeInputElem.max = 2 * rangeInputElem.step + rangeInputElem.max;
      }
    } else {
      // When scale is Log
      if (numberValue >= Math.pow(10, rangeMax)) {
        rangeInputElem.max = Math.round(log10(numberValue) + 3);
        rangeInputElem.value = numberValue;
        rangeInputElem.min = Math.round(log10(numberValue) - 3);
        rangeChanged = true;
      } else {
        if (numberValue <= Math.pow(10, rangeMin)) {
          rangeInputElem.min = Math.round(log10(numberValue) - 3);
          rangeInputElem.value = numberValue;
          rangeInputElem.max = Math.round(log10(numberValue) + 3);
          rangeChanged = true;
        }
      }
    }
    return rangeChanged;
  }

  function changeStep() {
    // Event handle fired when
    // user blurs number input
    let numberInputElem = this,
      $rangeInput = getRowDiv($(numberInputElem))
        .find('[type=range]'),
      value = numberInputElem.value;

    if ($rangeInput.hasClass('linearscale')) {
      numberInputElem.value = parseFloat(value); // For Chrome
      var newStep = Math.pow(10, -1 * nbAfterDot(value));

      numberInputElem.step = newStep;
    }

    $rangeInput.get().step = newStep;
  }

  function modelChanged() {
    // Fired when user changes number of diodes or the equivalent circuit

    // Update model variable
    model = getModel();

    changeInputStatusBasedOnModel();

    calcIVandPlot();

    if (fileOpened) {
      findAndEstimateDiodes();

      calcSqResSum(parameters, userData.dataArray, arrayCalc);
    }
  }

  function changeInputStatusBasedOnModel() {
    if (model.circuit === 'parallel') {
      $('input.rp2')
        .prop('disabled', true);

      const $inputs = $('input.n2, input.is2, #series, #parallel');

      if (!fileOpened) {
        $inputs
          .not('[type=checkbox]');
      }

      $inputs
        .prop('disabled', false);
      
      document.getElementById('start').disabled = false;
    }

    if (model.diodeCount === 1) {
      document.getElementById('series').checked = false;
      document.getElementById('parallel').checked = true;
      
      model.circuit = 'parallel';

      $('input.n2, input.is2, #series, #parallel, input.rp2')
        .prop('disabled', true);

      if (fileOpened) {
        // Will also enable checkboxes
        $('input.n1, input.is1, input.rp1')
        .prop('disabled', false);
      }

      document.getElementById('start').disabled = false;
    }

    if (model.circuit === 'series') {
      $('input.n2, input.is2, input.rp2')
        .prop('disabled', false);

      // Disable fitting inputs because
      // series model not supported for optimization
      disableCheckboxes();
      $('button#start')
        .prop('disabled', true);
    }
  }

  function disableCheckboxes() {
    $('[type=checkbox]')
        .prop('disabled', true);
  }

  function findAndEstimateDiodes() {
    const findDiodesResult = findDiodes(userData, IprShowed(), nonLinearCurrentShowed()),
      estimatedParams = estimD1D2Rs(getAllParams(), userData, findDiodesResult);
      
    displayEstimatedParams(estimatedParams);
  }

  function displayEstimatedParams(estimatedParams) {
    // Display the result of estimD1D2Rs into
    // the results table

    for (let paramName in estimatedParams) {
      const id = paramName.toLowerCase(),
        value = estimatedParams[paramName],
        text = (isParamScaleLog(id)) ? value.toExponential(2) : value.toPrecision(2);

      $('td.estimation#' + id)
        .text(text);
    }
  }

  function isParamScaleLog(elemID) {
    // Returns whether scale type used for
    // a given diode parameter is a logarithmic one
    return $('[type=number]#' + elemID)
        .hasClass('logscale');
  }

  function useEstimatedParams() {
    // Fired when user clicks "Use estimated parameters" button
    $('td.estimation')
      .each(updateInput);

    syncAllInputs();

    parameters.init();

    calcIVandPlot();
  }

  function updateInput(index, element) {
    // Update a parameter input with an estimation

    const $td = $(element),
      paramClass = $td.attr('id'),
      $input = $('input[type=number].' + paramClass);

    if ($input.prop('disabled') === false) {
      const value = parseFloat($td.text());
      $input.val(value);
    }
  }

  function startButtonClicked() {
    // Fired when user clicks on the play/pause button
    // to start or pause the fitting

    const start = $(this)
      .hasClass('play');

    togglePlayButton();

    startPauseVary(start);
  }

  function togglePlayButton() {
    $('#start')
      .toggleClass('play pause');
  }

  /* The two following functions calculate
     the current at a given voltage */

  function Iparallel(V, Iph, prevI, T, n1, n2, Is1, Is2, Rp, Rs) {
    // Double diode (in parallel) model
    var i = 0, I, f, df, r, Id1, Id2, Irp;

    Iph = Iph / 1000; // mA -> A

    if (!prevI) {
      I = Iph;
      prevI = I;
    }

    do {
      if (i > 0) {
        prevI = I;
      }

      Id1 = Is1 * (Math.exp(q * (V + prevI * Rs) / (n1 * k * T)) - 1);
      Id2 = Is2 * (Math.exp(q * (V + prevI * Rs) / (n2 * k * T)) - 1);
      Irp = (V + prevI * Rs) / Rp;

      // f(V,prevI)
      f = Iph - Id1 - Id2 - Irp - prevI;

      // df(V,prevI)/dprevI
      df = -((Is1 * Rs) / (n1 * T * k / q)) * Math.exp((V + prevI * Rs) / (n1 * T * k / q))
        - ((Is2 * Rs) / (n2 * T * k / q)) * Math.exp((V + prevI * Rs) / (n2 * T * k / q))
        - Rs / Rp - 1;

      // f/df
      r = f / df;

      I = prevI - r;

      i++;

    } while (Math.abs(I - prevI) > mchEps && i < 500);

    return [I, Id1, Id2, Irp, Id1 + Id2 + Irp];
  }

  function Iseries(V, T, Iph, n1, n2, Is1, Is2, Rp1, Rp2, Rs) {
    // Double diode (in series) model
    var i = 0, Ia, Ib, V1, V2, Id1, Id2, Irp1, Irp2, H = 10, L = -10;

    do {
      V1 = (H + L) / 2;

      Id1 = Is1 * Math.exp(q * V1 / (n1 * k * T) - 1);
      Irp1 = V1 / Rp1;

      Ia = Id1 + Irp1;

      V2 = V - V1 - Rs * Ia;

      Id2 = Is2 * Math.exp(q * V2 / (n2 * k * T) - 1);
      Irp2 = V2 / Rp2;
      Ib = Id2 + Irp2;

      var diffI = Ib - Ia;

      if (diffI > 0) {
        L = V1;
      } else {
        H = V1;
      }
      i++;

    } while (Math.abs(diffI) > mchEps && i < 500);
    return [Ia, Id1, Id2, Irp1, Irp2];
  }

  function getParam$(paramClass) {
    return $('input[type=number]')
      .filter('.' + paramClass);
  }

  function getParamValue(paramClass) {
    return parseFloat(
      getParam$(paramClass)
        .val()
    );
  }

  function getParamChecked(paramClass) {
    return $('input[type=checkbox]')
      .filter('.' + paramClass)
      .is(':checked');
  }

  function getAllParams() {
    let params = {
      value: {
        iph: undefined,
        t: undefined,
        n1: undefined,
        n2: undefined,
        is1: undefined,
        is2: undefined,
        rp1: undefined,
        rp2: undefined,
        rs: undefined
      },
      checked: {
        iph: undefined,
        t: undefined,
        n1: undefined,
        n2: undefined,
        is1: undefined,
        is2: undefined,
        rp1: undefined,
        rp2: undefined,
        rs: undefined
      }
    };

    for (let paramClass in params.value) {
      params.value[paramClass] = getParamValue(paramClass);
      params.checked[paramClass] = getParamChecked(paramClass);
    }
    return params;
  }

  function setParamValue(paramClass, value) {
    getParam$(paramClass)
        .val(value);
  }

  function getModel() {
    const isSingleDiodeChecked = document.getElementById('singleDiode').checked,
      isParallelChecked = document.getElementById('parallel').checked;
    return {
      diodeCount: (isSingleDiodeChecked) ? 1 : 2,
      circuit: (isParallelChecked) ? 'parallel' : 'series'
    };
  }

  function calcIV(params, model) {
    // Calculates current for a range of voltage values

    const minVolt = params.minVolt.value,
      maxVolt = params.maxVolt.value,
      stepVolt = params.stepVolt.value,
      Iph = params.iph.value,
      T = params.t.value,
      n1 = params.n1.value,
      Is1 = params.is1.value;

    let n2 = params.n2.value,
      Is2 = params.is2.value,
      Rp2 = params.rp2.value;

    if (model.diodeCount === 1) {
      n2 = 1;
      Is2 = 0;
      Rp2;
    }

    var Rp = params.rp1.value,
      Rs = params.rs.value;

    let Ipar, Iser, I, Id1, Id2,
      arrayVI = [],
      arrayVId1 = [],
      arrayVId2 = [],
      arrayVIrp1 = [],
      arrayVIrp2 = [],
      parallel, modelCase;

    if (model.circuit === 'parallel') {
      parallel = true,
        modelCase = 'parallel';
    }

    if (model.diodeCount === 1) {
      parallel = true,
      modelCase = 'single';
    }
    if (model.circuit === 'series') {
      modelCase = 'series';
    }

    for (var V = minVolt; V <= maxVolt; V += stepVolt / 1000) {
      if (parallel) {
        Ipar = Iparallel(V, Iph, I, T, n1, n2, Is1, Is2, Rp, Rs);
        I = - Ipar[0];
        Id1 = Ipar[1];
        Id2 = Ipar[2];
        var Irp = Ipar[3];
        arrayVIrp1.push([V, Irp]);
        // Calculated current is used as the initial current for next voltage,
        // speeds up equation solving, is important for high direct bias
      } else {
        Iser = Iseries(V, T, Iph, n1, n2, Is1, Is2, Rp, Rp2, Rs);
        I = Iser[0];
        Id1 = Iser[1];
        Id2 = Iser[2];
        var Irp1 = Iser[3],
          Irp2 = Iser[4];
        arrayVIrp1.push([V, Irp1]);
        arrayVIrp2.push([V, Irp2]);
      }

      arrayVI.push([V, I]);
      arrayVId1.push([V, Id1]);
      arrayVId2.push([V, Id2]);
    }

    const modelCases = {
      parallel: {
        arrayCalc: [arrayVI, arrayVId1, arrayVId2, arrayVIrp1],
        plotStyle: [
          ['line', 'black', 'I'],
          ['line', 'orange', 'Id1'],
          ['line', 'orange', 'Id2'],
          ['line', 'purple', 'Irp']
        ]
      },
      single: {
        arrayCalc: [arrayVI, arrayVId1, arrayVIrp1],
        plotStyle: [
          ['line', 'black', 'I'],
          ['line', 'orange', 'Id1'],
          ['line', 'purple', 'Irp']
        ]
      },
      series: {
        arrayCalc: [arrayVI, arrayVId1, arrayVId2, arrayVIrp1, arrayVIrp1],
        plotStyle: [
          ['line', 'black', 'I'],
          ['line', 'orange', 'Id1'],
          ['line', 'orange', 'Id2'],
          ['line', 'purple', 'Irp1'],
          ['line', 'purple', 'Irp2']
        ]
      }
    };

    return modelCases[modelCase];
  }

  function scaleType() {
    // Returns the type of scale for y axis
    const scaleIsLinear = document.getElementById('linear').checked;
    return (scaleIsLinear) ? 'linearScale' : 'logScale';
  }

  function processFiles(file) {
    // Fired when file input changed

    let reader = new FileReader();

    reader.onload = readerOnLoad;
    reader.filename = file.name;

    reader.readAsText(file);
  }

  function readerOnLoad(event) {
    // Fired when data is ready

    // Guess T from file name
    let fileName = this.filename;

    while (isNaN(parseFloat(fileName)) && fileName.length > 0) {
      fileName = fileName.substring(1);
    }

    fileName = parseFloat(fileName);

    const defaultT = (isNaN(fileName)) ? 298 : fileName,
      T = prompt('Temperature? (K)', defaultT);

    if (isFinite(T) && T > 0) {
      setParamValue('t', T);
      // document.getElementById('sliderT').value = T;
      userData.dataArray = [];
      userData.modifDataArray = [];

      stringToArray(event.target.result);
    }
  }

  function clearData() {
    // Fired when user clicks on the Clear button

    userData.dataArray = [];
    userData.modifDataArray = [];
    fileOpened = false;
    combDataAndCalc();

    $('.panel')
      .addClass('nofile');

    $('.fa-toggle-on')
      .toggleClass('fa-toggle-on fa-toggle-off');

    if (window.localFile /* FF is picky about that: not importing the file through classic 'browse' button result in an error here */) {
      window.localFile.reset();
    }

    clearFileInput();

    $('.estimation')
      .add('.final')
      .add('#s')
      .add('#ds')
      .empty();

    if ($('#start').hasClass('pause')) {
      togglePlayButton();
    }

    userData.estimatedParameters.Rp = undefined;

    disableCheckboxes();
  }

  function clearFileInput() {
    $('input[type=file]')
      .val(null)
      .closest('div')
      .children('input[type=text]')
      .val('');
  }

  function stringToArray(data) {
    // Convert the dataset from a string
    // to an array of arrays of numbers

    let array = data.split('\n'),
      skipRow,
      dataArray = [];

    for (let stringRow of array) {
      skipRow = false;
      const row = stringRow.split('\t');

      // Make sure each of the first two
      // elements in the row is a number
      for (let j = 0; j < 2; j++) {
        row[j] = Number(row[j]);
        skipRow += isNaN(row[j]);
      }

      if (!skipRow) {
        dataArray.push(row);
      }
    }

    // Removes the semi-transparent
    // overlay div
    $('.panel')
      .removeClass('nofile');

    fileOpened = true;

    // Enable checkboxes for the already
    // enabled parameter inputs
    $('[type=range]:enabled')
      .each(enableCheckboxInput);

    document.getElementById('minVolt').value = dataArray[0][0];
    document.getElementById('maxVolt').value = dataArray[dataArray.length - 1][0] + document.getElementById('stepVolt').value / 1000;

    dataArray = [dataArray];

    userData.dataArray = dataArray;
    userData.modifDataArray = dataArray;

    const ivResult = calcIV(parameters, getModel());

    /**** Estimate parameters ****/

    // Parallel resistance Rp
    const Rp = estimRp(dataArray);
    userData.estimatedParameters.Rp = Rp;

    // Calculate Parallel current and non linear reverse current
    const current = calcIrpAndNonLinRevCurr(dataArray, Rp);
    userData.current.nonLinear = current.nonLinear;
    userData.current.shunt = current.shunt;

    findAndEstimateDiodes();

    calcSqResSum(parameters, dataArray, arrayCalc);

    combDataAndCalc(ivResult);
  }

  function enableCheckboxInput(index, element) {
    getRowDiv($(element))
      .find('[type=checkbox]')
      .prop('disabled', false);
  }

  function IprShowed() {
    return $('#hideIrp').hasClass('fa-toggle-off');
  }

  function nonLinearCurrentShowed() {
    return $('#hideNonLinCurr').hasClass('fa-toggle-off');
  }

  function combDataAndCalc() {
    // Combine uploaded data and calculated IV into one graph
    const canvasID = 'graph',
      data = userData.modifDataArray.concat(arrayCalc),
      primaryPlotIndex = 0,
      xTitle = 'V (V)',
      yTitle = 'I (A)';
    let style;

    if (fileOpened) {
      const dataStyle = [['verticalCross', 'purple', 'Data']];
      style = dataStyle.concat(plotStyle);
    } else {
      style = plotStyle;
    }

    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_bobGraph__["a" /* default */])(canvasID, data, primaryPlotIndex, style, scaleType(), xTitle, yTitle);
  }

  function tableSuccessContext(add) {
    // Add or remove "success" color on
    // parameter's table's 3rd column

    const $td = $('td.final');

    if (add) {
      $td.addClass('success');
    } else {
      $td.removeClass('success');
    }
  }

  function updateParameter ($element) {
    parameters.update($element);
  }

  /*
   *  Fit 
   */

  
  let interval;

  function estimRp(dataArray) {
    // Estimate parallel resistance Rp
    let min = +Infinity,
      array = dataArray[0];

    for (let xy of array) {
      let x = xy[0],
        slope = xy[1] / x;
      if (slope < min && Math.abs(x) > 0.001) {
        min = slope;
      }
    }

    let Rp = 1 / min;
    // var oOM = orderOfMagn(Rp);
    //var roundedRp = Math.round(Rp * 1000 / oOM) * oOM / 1000;

    return Rp;
  }

  function calcIrpAndNonLinRevCurr(dataArray, Rp) {
    let array = dataArray[0],
      nonLinDirCurr = [],
      shuntCurrent = [],
      nonLinCurr = [];

    for (let VI of array) {
      let V = VI[0],
        Irp = V / Rp;
      shuntCurrent.push([V, Irp]);

      if (V < -0.0001) {
        // Only looking at reverse polarization:
        // Non-linear reverse current is total current minus parallel current (which is linear)
        let Inl = VI[1] - Irp; // Inl -> 'nl' = 'Non-Linear'

        // Deduce direct non linear current
        nonLinDirCurr.unshift([-V, -Inl]);

        // Reverse
        nonLinCurr.push([V, Inl]);
      }
    }

    // Combine reverse and direct
    nonLinCurr = nonLinCurr.concat([[0, 0]], nonLinDirCurr);

    return {
      shunt: shuntCurrent,
      nonLinear: nonLinCurr
    }
  }

  function toggleIrp(modifDataArray, shuntCurrent, show) {
    // Show or hide Irp on graph

    let array = modifDataArray[0],
      newArray = [],
      i = 0,
      sign = (show) ? 1 : -1;

    for (let IV of array) {
      newArray.push([IV[0], IV[1] + sign * shuntCurrent[i][1]]);
      i++;
    }

    modifDataArray = [newArray];

    return modifDataArray;
  }

  function toggleNonLinCurr(userData, modifDataArray, show) {

    const nonLinearCurrent =  userData.current.nonLinear;

    var array1 = userData.dataArray[0],
      array2 = userData.modifDataArray[0],
      IV1, IV2,
      newArray1 = [],
      newArray2 = [],
      sign = (show) ? 1 : -1,
      i = 0;
      
    for (let IV1 of array1) {
      newArray1.push([IV1[0], IV1[1] + sign * nonLinearCurrent[i][1]]);
      IV2 = array2[i];
      newArray2.push([IV2[0], IV2[1] + sign * nonLinearCurrent[i][1]]);
      i++;
    }

    return {
      dataArray: [newArray1],
      modifDataArray: [newArray2]
    }
  }

  let SqResSum,
    prevSqResSum = undefined,
    dS,
    delS = [];

  function calcSqResSum(params, dataArray, arrayCalc) {
    // Calculates the sum of squared residuals

    let n1 = params.n1.value,
      Is1 = params.is1.value,
      Rp = params.rp1.value,
      Rs = params.rs.value,
      T = params.t.value,
      single = document.getElementById('singleDiode').checked;

    SqResSum = 0;

    if (single) {
      // Single diode model
      var Is2 = 0,
        n2 = 1;
    } else {
      // Dual diode model
      var Is2 = params.is2.value,
        n2 = params.n2.value;
    }

    if (document.getElementById('series').checked) {
      // Dual, series diode model
      let Rp2 = params.rp2.value;
      n1 = params.n1.value;
    }

    var r, calcI, j = 1, x1, x2, xy1, xy2, y1, y2, slope, x,
      calcIV = arrayCalc[0],
      array = dataArray[0],
      data,
      dSdn1 = 0,
      dSdn2 = 0,
      dSdIs1 = 0,
      dSdIs2 = 0,
      dSdRp = 0,
      dSdRs = 0;
    //d2Sdn2 = 0;
    var A = Is1 * q / (k * T),
      dIdn1, dIdn2, dIdIs1, dIdIs2, dIdRp, dIdRs, exp1, exp2;

    for (var i = 0; i < array.length; i++) {
      //for each data point
      x = array[i][0];

      while (x > calcIV[j][0]) { j++; }
      xy1 = calcIV[j - 1];
      xy2 = calcIV[j];
      x1 = xy1[0];
      x2 = xy2[0];
      y1 = xy1[1];
      y2 = xy2[1];
      data = array[i][1];

      //linear interpolation
      slope = (y2 - y1) / (x2 - x1);
      calcI = y1 + slope * (x - x1);

      r = (calcI - data) / Math.abs(data);

      if (isFinite(r)) {
        exp1 = Math.exp(q * (x - Rs * calcI) / (n1 * k * T));
        exp2 = Math.exp(q * (x - Rs * calcI) / (n2 * k * T));

        dIdn1 = q * (Rs * calcI - x) / (Math.pow(n1, 2) * k * T * (1 + Rs / Rp + q * Is2 * Rs * exp2 / (n2 * k * T)) / (Is1 * exp1) + n1 * Rs * q);
        dSdn1 += 2 * r * dIdn1 / Math.abs(data);

        dIdn2 = q * (Rs * calcI - x) / (Math.pow(n2, 2) * k * T * (1 + Rs / Rp + q * Is1 * Rs * exp1 / (n1 * k * T)) / (Is2 * exp2) + n2 * Rs * q);
        dSdn2 += 2 * r * dIdn2 / Math.abs(data);

        dIdIs1 = (exp1 - 1) / (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + q * Is2 * Rs * exp2 / (n2 * k * T) + Rs / Rp);
        //dIdIs1 = (exp1 - 1) / (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + Rs / Rp);
        dSdIs1 += 2 * r * dIdIs1 / Math.abs(data);

        dIdIs2 = (exp2 - 1) / (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + q * Is2 * Rs * exp2 / (n2 * k * T) + Rs / Rp);
        dSdIs2 += 2 * r * dIdIs2 / Math.abs(data);

        dIdRp = (calcI * Rs - x) / (Math.pow(Rp, 2) * (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + q * Is2 * Rs * exp2 / (n2 * k * T) + Rs / Rp));
        dSdRp += 2 * r * dIdRp / Math.abs(data);

        dIdRs = - calcI * (q * Is1 * exp1 / (n1 * k * T) + q * Is2 * exp2 / (n2 * k * T) + 1 / Rp) / (1 + Rs * (q * Is1 * exp1 / (n1 * k * T) + q * Is2 * exp2 / (n2 * k * T) + 1 / Rp));
        //dIdRs = - calcI * (q * Is1 * exp1 / (n1 * k * T) + 1 / Rp) / (1 + Rs * (q * Is1 * exp1 / (n1 * k * T) + 1 / Rp));
        dSdRs += 2 * r * dIdRs / Math.abs(data);

        SqResSum += Math.pow(r, 2);
      }
      delS = [dSdn1, dSdIs1, dSdRp, dSdRs];
      if (!single) {
        delS.splice(1, 0, dSdn2);
        delS.splice(3, 0, dSdIs2);
      }
    }

    // Display residue
    $('#s').text(SqResSum.toExponential(2));

    prevSqResSum = SqResSum;

    return SqResSum;
  }

  function deriv(array) {
    var der, prev, next, derArray = [], stringArray = 'V\tln(I)\td[ln(I)]/dV';
    for (var i = 1; i < array.length - 1; i++) {//Derivative not calculated for 1st and last point
      prev = array[i - 1];
      next = array[i + 1];
      der = (next[1] - prev[1]) / (next[0] - prev[0]);
      derArray.push([array[i][0], der]);
      stringArray = stringArray.concat('\n' + array[i][0] + '\t' + array[i][1] + '\t' + der);
    }
    return derArray;
  }

  function lnOfArray(array) {
    var xy, y, newArray = [];
    for (var i = 0; i < array.length; i++) {
      xy = array[i];
      y = xy[1];
      if (y != 0) {
        newArray.push([xy[0], Math.log(Math.abs(y))]);
      }
    }

    return newArray;
  }

  function findDiodes(userData, IprShowed, nonLinearCurrentShowed) {
    let modifDataArray = userData.modifDataArray,
      shuntCurrent = userData.current.shunt;

    if (IprShowed) {
      modifDataArray = toggleIrp(modifDataArray, shuntCurrent, false);
    } // diode parameters better evaluated when Rp = infinity

    if (nonLinearCurrentShowed) {
      let result = toggleNonLinCurr(userData, modifDataArray, false);
      modifDataArray = result.modifDataArray;
    }

    let noIrpNoSCLCarray = modifDataArray[0],
      array = modifDataArray[0];

    let array1 = deriv(lnOfArray(array));// 1st order derivative

    array = deriv(array1);//2nd order derivative

    let i = array.length - 2,
      prev,
      dLn = array[i][1],
      dLnMin = 0,
      deltaLnMax = 0,
      j = 0;

    var avDelta = function (array) {
      var sum = 0,
        length = array.length;
      for (var i = 1; i < length; i++) {
        sum += Math.abs(array[i][1] - array[i - 1][1]);
      }
      return sum / (length - 1);
    }
    var avD = avDelta(array);

    var iMin = i,
      fluctIn2ndHalf = false;
    do {
      i = iMin;
      dLn = array[i][1];
      var maxPassed = false;
      do {// looking for minima between 0.04 V and Vmax
        i--;
        prev = dLn;
        dLn = array[i][1];

        fluctIn2ndHalf += Math.abs(dLn - prev) > avD && i < array.length / 2;
        maxPassed += prev > dLn && Math.abs(dLn - prev) < avD;
        var carryOn = !maxPassed || dLn < prev;
      } while (i >= 0 && array[i][0] > 0.04 && carryOn && !fluctIn2ndHalf)
      iMin = i + 1;
      dLnMin = prev;

      var dLnMax = dLnMin;
      prev = -Infinity;
      i = iMin - 1;
      var iMax = iMin;
      while (i >= 0 && array[i][0] > 0.04) {// looking for a maxima between 0.04 V and Vmax
        dLn = array[i][1];

        if (dLn < prev && prev > dLnMax && Math.abs(dLn - prev) < avD) {
          iMax = i;
          dLnMax = prev;
        }
        prev = dLn;
        i--;
      }

      if (dLnMax - dLnMin > deltaLnMax) {
        deltaLnMax = dLnMax - dLnMin;
        var iMaxMax = iMax;
      }
      j++;
    } while (iMax != iMin && j < 10 && !fluctIn2ndHalf)

    if (!iMaxMax) { return 'noDiode'; }

    i = iMax = iMaxMax;
    dLn = array[i][1];
    do {
      prev = dLn;
      i--;
      dLn = array[i][1];
    } while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0)
    var iD1 = i + 2;
    var D1dLn = array1[iD1 + 1][1];

    i = iMax;
    do {
      prev = dLn;
      i++;
      dLn = array[i][1];
    } while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0)
    var iD2 = i - 1;
    var D2dLn = array1[iD2 + 1][1];

    var length = array.length - 2;

    iD2 = length - iD2;
    iD1 = length - iD1;
    /* iD2 (and iD1) are the indexes of the maxima (and minima), starting from the *end* of the original array,
    in case points in reverse are missing after removal of Irp and SCLC */
    
    return {
      noIrpNoSCLCarray: noIrpNoSCLCarray,
      diodes: [D2dLn, D1dLn, iD2, iD1]
    };
  }

  function estimD1D2Rs(params, userData, findDiodesResult) {
    if (document.getElementById('series').checked) {
      // For now, no estimation for series model
      return;
    }
    
    const paramValues = params.value,
      paramChecked = params.checked;

    let maxmin = findDiodesResult.diodes;

    if (maxmin === 'noDiode') {
      // TODO: Display message
      return;
    }
    
    let dualDiode = !document.getElementById('singleDiode').checked,
      array = findDiodesResult.noIrpNoSCLCarray,
      
      D1dLn = maxmin[1],
      D2dLn = maxmin[0],
      VIAtd1 = array[array.length - 4 - maxmin[3]],
      VIAtd2 = array[array.length - 4 - maxmin[2]],
      T = paramValues.t,
      A = q / (k * T),
      n2 = A / D2dLn;

    if (dualDiode) {
      if (paramChecked.n2) {
        var n = n2,
          n2Fixed = '';
      } else {
        var n = n2 = paramValues.n2,
          n2Fixed = ' <span style="color:grey">(fixed)</span>';
      }
      if (paramChecked.n1) {
        var n1 = A / D1dLn,
          n1Fixed = '';
      } else {
        var n1 = paramValues.n1,
          n1Fixed = ' <span style="color:grey">(fixed)</span>';
      }
      if (paramChecked.is1) {
        var Is1 = VIAtd1[1] / (Math.exp((VIAtd1[0] * A / n1) - 1)),
          Is1Fixed = '';
      } else {
        var Is1 = paramValues.is1,
          Is1Fixed = ' <span style="color:grey">(fixed)</span>';
      }
    } else {
      //single diode
      var n = n2;
    }

    if (paramChecked.rs) {
      var Rs = estimRs(array, T, n),
        RsFixed = '';
    } else {
      var Rs = paramValues.rs,
        RsFixed = ' <span style="color:grey">(fixed)</span>';
    }

    if (paramChecked.is2) {
      var Is2 = VIAtd2[1] / (Math.exp((VIAtd2[0] - VIAtd2[1] * Rs) * A / n2) - 1),
        Is2Fixed = '';
    } else {
      var Is2 = paramValues.is2,
        Is2Fixed = ' <span style="color:grey">(fixed)</span>';
    }

    if (paramChecked.rp1) {
      var newRp = userData.estimatedParameters.Rp,
        RpFixed = '';
    } else {
      var newRp = paramValues.rp1,
        RpFixed = ' <span style="color:grey">(fixed)</span>';
    }

    $('td.estimation#rp1').text(newRp.toPrecision(3));
    $('td.estimation#rs').text(Rs.toPrecision(2));
  
    if (dualDiode) {
      return {
        n1: n1,
        n2: n2,
        Is1: Is1,
        Is2: Is2,
        Rp1: newRp,
        Rs: Rs
      };
    } else {
      return {
        n1: n2,
        Is1: Is2,
        Rp1: newRp,
        Rs: Rs
      };
    }
  }

  function estimRs(array, T, n) {
    var dIdV = deriv(array),
      i = array.length - 2,
      dIdVati = dIdV[i - 1][1],
      exp,
      A = q / (n * k * T),
      B, C,
      IVati = array[i],
      I = IVati[1],
      V = IVati[0],
      Rs = 0;

    do {
      exp = Math.exp(A * (V - I * Rs));
      B = A * exp / (exp - 1);
      C = B / (1 / I + Rs * B);
      Rs += 0.01;
    } while (C > dIdVati)
    return Rs;
  }

  function updateParams(params, plot, updateRangeInput) {
    // Update number input and result table

    if (updateRangeInput) {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', false, false);
    }

    for (let param of params) {
      const id = param[0],
        value = param[1];

      let element = $('[type=number].' + id).get(0);
      
      if (updateRangeInput) {
        element.dispatchEvent(evt);
      }

      const $td = $('td#final-' + id),
        isScaleLog = $(element).hasClass('logscale'),
        formattedValue = (isScaleLog) ? value.toExponential(2) : value.toPrecision(2);

      element.value = value;
      $td
        .text(formattedValue);

      updateParameter($(element));
    }

    const ivResult = calcIV(parameters, getModel());

    arrayCalc = ivResult.arrayCalc;
    plotStyle = ivResult.plotStyle;

    calcSqResSum(parameters, userData.dataArray, arrayCalc);
  }

  function vary() {
    // Varies checked diode parameters until
    // sum of square residuals is minimized

    var param, oOO, id, eps = mchEps;

    var n1 = parameters.n1.value,
      n1vary = parameters.n1.checked,
      Is1 = parameters.is1.value,
      Is1vary = parameters.is1.checked,
      Rp = parameters.rp1.value,
      Rpvary = parameters.rp1.checked,
      Rs = parameters.rs.value,
      Rsvary = parameters.rs.checked;
    
    // Single diode model
    let params = [
      ['n1', n1, eps, n1vary],
      ['is1', Is1, eps, Is1vary],
      ['rp1', Rp, eps, Rpvary],
      ['rs', Rs, eps, Rsvary]
    ];

    if (document.getElementById('doubleDiode').checked) {
      // Dual diode model
      var Is2 = parameters.is2.value,
        Is2vary = parameters.is2.checked,
        n2 = parameters.n2.value,
        n2vary = parameters.n2.checked;
      params = [['n1', n1, eps, n1vary], ['n2', n2, eps, n2vary], ['is1', Is1, eps, Is1vary], ['is2', Is2, eps, Is2vary], ['rp1', Rp, eps, Rpvary], ['rs', Rs, eps, Rsvary]];
    }

    var del,
      S,
      newPar,
      j = 0,
      ii = 0,
      sign,
      stop = false;

    interval = setInterval(
      function () {
        S = SqResSum;
        var newPars = [];
        //del = delS;
        for (var i = 0; i < params.length; i++) {
          if (params[i][3]) {
            // This parameter is allowed to vary
            del = delS[i];
            sign = del / Math.abs(del);

            newPar = params[i][1] * Math.pow((1 + params[i][2]), -sign); //update parameter

            updateParams([[params[i][0], newPar]], false, false);

            j = 0;
            while (del / Math.abs(del) != delS[i] / Math.abs(delS[i]) && j < 100 && newPar !== 0) {
              params[i][2] /= 2;
              newPar = params[i][1] * Math.pow((1 + params[i][2]), -sign); //update parameter
              updateParams([[params[i][0], newPar]], false, false);
              j++;
            }

            var jj = 0;
            while (del / Math.abs(del) == delS[i] / Math.abs(delS[i]) && jj < 100 && newPar !== 0) {
              params[i][2] *= 2;
              newPar = params[i][1] * Math.pow((1 + params[i][2]), -sign); //update parameter
              updateParams([[params[i][0], newPar]], false, false);

              jj++;
            }
            params[i][1] = newPar;
            newPars.push(newPar);

            if (isNaN(newPar)) {
              stop += true;
            }
          }
        }

        ii++;

        const dS = SqResSum - S;

        if (typeof S === 'number'){
          $('#ds').text(dS.toExponential(2));
        } else {
          $('#ds').empty();
        }

        const threshold = document.getElementById('threshold').value,
          fitSuccessful = Math.abs(dS) < threshold;

        if (fitSuccessful || ii > 1000 || stop) {
          console.log('fitSuccessful: ' + fitSuccessful);
          console.log('Too many iterations: ' +  (ii > 1000));
          console.log('NaN: ' + stop);

          if (fitSuccessful){
            const addContext = true;
            tableSuccessContext(addContext);
          }
          togglePlayButton();
          const start = false;
          startPauseVary(start);

          // Sync number and range inputs
          syncAllInputs();
        }
        if (document.webkitHidden) {
          // no use to plot: the page is not visible (Webkit only)
        } else {
          combDataAndCalc(/*arrayCalc, plotStyle, scale*/);
        }
      }
      , 1)
  }

  function startPauseVary(start) {
    // start parameter is a boolean

    if (start === true) {
      const addContext = false;
      tableSuccessContext(addContext);
      vary();
    } else {
      clearInterval(interval);
    }
  }

  return {};
}();

/***/ })
/******/ ]);