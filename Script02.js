var rangeSupport = true;

window.onload = function () {
	machineEpsilon();
	calcIV();
	
	//Opera fix: nicely rounds initial Is1 and Is2
	var id = ['Is1','Is2'];
	for (var i = 0; i < 2; i++) {
		var element = document.getElementById(id[i]);
		var nb = element.value;
		var oOO = orderOfMagn(nb);
		element.value = Math.round(100 * nb / oOO) * oOO / 100;
	}
	
	var i = document.createElement('input');
	i.setAttribute('type', 'range');
	if (i.type == 'text') {
		rangeSupport = false;
		
		var c = document.getElementById('currentCalculation').getElementsByTagName('input'),array = [];
			for (var i = 0; i < c.length; i++) {
				if (c[i].id.search('slider') != -1) {
					c[i].parentNode.removeChild(c[i]);
				}
			}
	}
	if (typeof FileReader == 'undefined') {
		document.getElementById('fileInput').disabled = true;
	}
	document.getElementById('clear').disabled = true;
}

function checkVoltageAndCalc () {

	var minVolt = document.getElementById('minVolt').value,
		maxVolt = document.getElementById('maxVolt').value,
		stepVolt = document.getElementById('stepVolt').value;
		
	if (maxVolt < minVolt) {
		document.getElementById('minVolt').value = maxVolt;
		document.getElementById('maxVolt').value = minVolt;
	}
	
	if (stepVolt == 0) {document.getElementById('stepVolt').value = 25;}
	
	if (stepVolt < 0) {document.getElementById('stepVolt').value = Math.abs(stepVolt);}
	
	calcIV();
}

function adjustRange (elementToChange,changedElement) {
	var formObject = document.forms['parameters'];
	var slider = formObject.elements[elementToChange], number = formObject.elements[changedElement];
	if (slider.className == 'linearScaleSlider') {
		if (parseFloat(number.value) >= parseFloat(slider.max)) {
			slider.max = remDecimals (number.value, 1.6 * number.value);
			slider.min = remDecimals (number.value, 0.4 * number.value);
		} else {
			if (parseFloat(number.value) <= parseFloat(slider.min)) {
				slider.min = remDecimals (number.value, 0.4 * number.value);
				slider.max = remDecimals (number.value, 1.6 * number.value);
			}
		}
		while (2 * slider.step >= (slider.max - slider.min)) {
			slider.max = 2 * slider.step + slider.max;
		}
	} 	else { //when scale is Log
			if (parseFloat(number.value) >= Math.pow(10,parseFloat(slider.max))) {
				slider.max = Math.round(log10(number.value) + 3);
				slider.min = Math.round(log10(number.value) - 3);
			} 	else {
					if (parseFloat(number.value) <= Math.pow(10,parseFloat(slider.min))) {
						slider.min = Math.round(log10(number.value) - 3);
						slider.max = Math.round(log10(number.value) + 3);
					}
				}
		}
}

function log10(val) {
  return Math.log(val) / Math.log(10);
}

function remDecimals (model,number) {
	var nbDecimals = nbAfterDot (model);
	return Math.round(number * Math.pow(10,nbDecimals)) * Math.pow(10,-nbDecimals);
}

function nbDecimals (number) {
	var i = -1;
	while (number != 0) {
		i++;
		number = Math.round(1e8*(number - Math.floor(number)))*1e-7;
	}
	
return i;
}

function nbAfterDot (number) {
	var n = number.toString().indexOf('.');
	if (n == -1) {return 0} else {
		return number.toString().slice(n+1,number.length).length;
		}
}

// returns the min value of an array
function min(array) {
	var min;
	for (var i = 0; i < array.length; i++) {
		if (!min || array[i] < min) {
		min = array[i];
		};
	};
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

function changeStep (event,number) {
	var targetID = event.currentTarget.id;
	var sliderID = 'slider'+targetID;
	var lastChar = number.length-1;
	if (number.charAt(lastChar) == '.') {
		document.getElementById(targetID).value = number.slice(0,lastChar);
	};
	var newStep = Math.pow(10,-1 * nbAfterDot (number));
	if (rangeSupport) {
		document.getElementById(sliderID).step = document.getElementById(targetID).step = newStep;
	}
}

function SyncSlidernBox(changedElement,elementToChange) {
	if (rangeSupport) {
		var sliderChanged = true;
		var formObject = document.forms['currentCalculation'];
		var element1 = formObject.elements[elementToChange], element2 = formObject.elements[changedElement];
		if (changedElement.indexOf('slider') == -1) {
			sliderChanged = false;
			adjustRange (elementToChange, changedElement);
			}
			
		if (element2.className == 'LogScale' || element1.className == 'LogScale'){
			if (sliderChanged) {
				element1.value = Math.pow(10, element2.value).toExponential(2);
			} 	else {
					element1.value = log10(element2.value);
				}
		} 	else {
				element1.value = element2.value;
			}
	}
		calcIV();
}

//Calculate Machine Epsilon
var mchEps;
function machineEpsilon() {
	var temp1, temp2;
	temp1 = 1.0;
	do {
		mchEps = temp1;
		temp1 /= 2;
		temp2 = 1.0 + temp1;
		} while (temp2 > 1.0);
	};
 
function disableAndCalc(arrayOfId) {
			for (var i = 0; i < arrayOfId.length; i++) {
				var e = document.getElementById(arrayOfId[i]);
				if (e) { //this is in case slider was removed because not supported by browser
					e.disabled = true;
				}
			}
	calcIV();
}

function enableAndCalc(arrayOfId) {
	if (document.getElementById('series').checked) {arrayOfId.concat(['Rp2','sliderRp2']);}
	for (var i = 0; i < arrayOfId.length; i++) {
		var e = document.getElementById(arrayOfId[i]);
		if (e) { //this is in case slider was removed because not supported by browser
			e.disabled = false;
		}
	}
	calcIV();
}

// elementary charge and Boltzmann constant
var q = 1.60217653E-19, k = 1.3806488E-23;

//Functions that calculate the current at a given voltage
//double diode (in parallel) model
function Iparallel(V,Iph,prevI,T,n1,n2,Is1,Is2,Rp,Rs) {
	var i = 0, I, f, df, r, Id1, Id2, Irp;
	Iph = Iph / 1000 // mA -> A
	if (!prevI) {I = Iph; prevI = I;}
	
	do {
		if (i > 0) {prevI = I}
		//if (V>1){alert(prevI);}
		Id1 = Is1*(Math.exp(q*(V+prevI*Rs)/(n1*k*T))-1);
		Id2 = Is2*(Math.exp(q*(V+prevI*Rs)/(n2*k*T))-1);
		Irp = (V+prevI*Rs)/Rp;

		//f(V,prevI)
		f = Iph-Id1-Id2-Irp-prevI;

		//df(V,prevI)/dprevI
		df =-((Is1*Rs)/(n1*T*k/q))*Math.exp((V+prevI*Rs)/(n1*T*k/q))
			-((Is2*Rs)/(n2*T*k/q))*Math.exp((V+prevI*Rs)/(n2*T*k/q))
			-Rs/Rp-1;

		//f/df
		r=f/df;
		
		I=prevI-r;

		i++;

	} while (Math.abs(I-prevI) > mchEps && i < 500)
	
	return [I,Id1,Id2,Irp,Id1+Id2+Irp];
};
//double diode (in series) model
function Iseries(V,T,Iph,n1,n2,Is1,Is2,Rp1,Rp2,Rs) {
	var i=0, Ia, Ib, V1, V2, Id1, Id2, Irp1, Irp2, H = 10, L = -10;

	do {
		V1 = (H + L) / 2;
	
		Id1 = Is1 * Math.exp(q * V1 / (n1 * k * T) - 1);
		Irp1 = V1 / Rp1;

		Ia = Id1 + Irp1;

		V2 = V - V1 - Rs * Ia;

		Id2 = Is2 * Math.exp( q * V2 / (n2 * k * T) - 1);
		Irp2 = V2 / Rp2;
		Ib = Id2 + Irp2;
		
		diffI = Ib - Ia;
		
		if (diffI > 0) {L = V1;}
			else {H = V1;}
		i++;
		
	} while (Math.abs(diffI) > mchEps && i < 500);
	return [Ia,Id1,Id2,Irp1,Irp2];
}

//Calculate current for a range of voltage values
function calcIV() {
	
	var	minVolt 	= parseFloat(document.getElementById('minVolt').value),
		maxVolt 	= parseFloat(document.getElementById('maxVolt').value),
		stepVolt 	= parseFloat(document.getElementById('stepVolt').value),
		Iph 		= parseFloat(document.getElementById('Iph').value),
		T			= parseFloat(document.getElementById('T').value),
		n1 			= parseFloat(document.getElementById('n1').value),
		Is1 		= parseFloat(document.getElementById('Is1').value);
		
	if (document.getElementById('singleDiode').checked) {var n2 = 1,Is2 = 0, Rp2;}
		else {
			var n2 	= parseFloat(document.getElementById('n2').value),
				Is2 = parseFloat(document.getElementById('Is2').value),
				Rp2 = parseFloat(document.getElementById('Rp2').value);
		}
		
	var	Rp = parseFloat(document.getElementById('Rp').value),
		Rs = parseFloat(document.getElementById('Rs').value);
		
	var Ipar,Iser,I,Id1,Id2,
		arrayVI = [],
		arrayJustV =[],
		arrayJustI =[],
		arrayJustSum =[],
		arrayVId1 = [],
		arrayVId2 = [],
		arrayVIrp1 = [],
		arrayVIrp2 = [];
		//var stringArray = 'V (V)\tI (A)\n';
		
		if (document.getElementById('parallel').checked) {
			var parallel = true,
				model = 'parallel';
		}
		if (document.getElementById('singleDiode').checked) {
			var parallel = true,
				model = 'single';
		}
		if (document.getElementById('series').checked) {
			var model = 'series';
		}
		
	for (var V = minVolt; V <= maxVolt; V += stepVolt/1000) {
		
		if (parallel) {
			Ipar = Iparallel(V,Iph,I,T,n1,n2,Is1,Is2,Rp,Rs);
			I = - Ipar[0];
			Id1 = Ipar[1];
			Id2 = Ipar[2];
			var Irp = Ipar[3];
			arrayVIrp1.push([V,Irp]);
			//Calculated current is used as the initial current for next voltage,
			//speeds up equation solving, is important for high direct bias
		} 	else {
				Iser = Iseries(V,T,Iph,n1,n2,Is1,Is2,Rp,Rp2,Rs);
				I = Iser[0];
				Id1 = Iser[1];
				Id2 = Iser[2];
				var Irp1 = Iser[3],
					Irp2 = Iser[4];
				arrayVIrp1.push([V,Irp1]);
				arrayVIrp2.push([V,Irp2]);
			}
		
		arrayVI.push([V,I]);
		//stringArray = stringArray.concat('\n'+V+'\t'+I);
		arrayVId1.push([V,Id1]);
		arrayVId2.push([V,Id2]);
	}
	
	switch (model) {
		case 'parallel':
			arrayCalc = [arrayVI,arrayVId1,arrayVId2,arrayVIrp1];
			plotStyle = [['line','black','I'],['line','orange','Id1'],['line','orange','Id2'],['line','purple','Irp']];			
			break;
		case 'single':
			arrayCalc = [arrayVI,arrayVId1,arrayVIrp1];
			plotStyle = [['line','black','I'],['line','orange','Id1'],['line','purple','Irp']];
			break;
		case 'series':
			arrayCalc = [arrayVI,arrayVId1,arrayVId2,arrayVIrp1,arrayVIrp1];
			plotStyle = [['line','black','I'],['line','orange','Id1'],['line','orange','Id2'],['line','purple','Irp1'],['line','purple','Irp2']];
			break;
	}

	if (!document.getElementById('clear').disabled) {
		calcSqResSum();
	}
	
	if (document.getElementById('linear').checked) {scale = 'linearScale';}
		else {scale = 'logScale';}
		
	combDataAndCalc(arrayCalc,plotStyle,scale);
}

function processFiles(files) {
	var file = files[0],
		reader = new FileReader();
		
	reader.onload = function (e) {
		// When this event fires, the data is ready.
		stringToArray(e.target.result);
	}
	reader.readAsText(file);
	
	document.getElementById('removeIrp').disabled = false;
	document.getElementById('removeNonLinCurr').disabled = false;
}

var dataArray = [],
	modifDataArray = [],
	dataStyle = [];
	
function clearData() {
	dataArray = [];
	modifDataArray = [];
	dataStyle = [];
	combDataAndCalc(arrayCalc,plotStyle,scale);
	document.getElementById('clear').disabled = true;
	var button = document.getElementById('removeIrp');
	button.value = 'Hide Irp';
	button.disabled = true;
	button = document.getElementById('removeNonLinCurr');
	button.value = 'Remove non-linear reverse current';
	button.disabled = true;
	window.localFile.reset();
	Rp = undefined;
	document.getElementById('squaredResSum').innerHTML = '';
	document.getElementById('paramEstim').innerHTML = '';
	document.getElementById('updateParams').style.visibility = 'hidden';
}

function stringToArray(data) {
	var array = data.split('\n');
	var line = [];
	dataArray = [];
	for (var i = 0; i < array.length; i++) {
		line = array[i].split('\t');
		for (var j = 0; j < line.length; j++) {
			line[j] = parseFloat(line[j]);
		}
		dataArray.push(line);
	}
	
	dataStyle = [['verticalCross','purple','Data']];
	
	var T = prompt('Temperature? (K)','298');
	while (isNaN(T) || T <= 0) {
		T = prompt('Temperature should be a greater than 0 number','298');
	}
	document.getElementById('T').value = T;
	document.getElementById('sliderT').value = T;
	
	document.getElementById('minVolt').value = dataArray[0][0];// - document.getElementById('stepVolt').value / 1000;
	document.getElementById('maxVolt').value = dataArray[dataArray.length - 1][0] + document.getElementById('stepVolt').value / 1000;
	calcIV();

	dataArray = [dataArray];
	modifDataArray = dataArray;
	
	estimD1D2Rs();
	calcSqResSum();
	document.getElementById('clear').disabled = false;
	combDataAndCalc(arrayCalc,plotStyle,scale);
}

function combDataAndCalc(arrayCalc,plotStyle,scale) {
	drawGraph(modifDataArray.concat(arrayCalc),0,dataStyle.concat(plotStyle),scale,'V (V)','I (A)');
}