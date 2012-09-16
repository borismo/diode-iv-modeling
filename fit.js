var Rp,
	Irp = [],
	nonLinCurr = [],
	shuntCurrent = [];

function estimRp() {
	var min = +Infinity,
		slope,
		xy, x,
		array = dataArray[0];
	for (var i = 0; i < array.length; i++) {
		xy = array[i];
		x = xy[0];
		slope = xy[1] / x;
		if (slope < min && Math.abs(x) > 0.001) {min = slope;}
	}
	Rp = 1 / min;
	var oOM = orderOfMagn(Rp);
	var roundedRp = Math.round(Rp * 1000 / oOM) * oOM / 1000;
	
	calcIrpAndNonLinRevCurr()
	return Rp;
}

function calcIrpAndNonLinRevCurr() {
	var array = dataArray[0],
		Irp, Inl, 	// Inl -> 'nl' = 'Non-Linear'
		nonLinDirCurr = [];
	shuntCurrent = [];
	nonLinCurr = [];
	for (var i = 0; i < array.length; i++) {
		VI = array[i];
		V = VI[0];
		Irp = V / Rp;
		shuntCurrent.push([V,Irp]);
		Inl = VI[1] - Irp;
		
		if (V < -0.0001) {
			nonLinDirCurr.unshift([-V,-Inl]);
			nonLinCurr.push([V,Inl]);
		}
	}
	nonLinCurr = nonLinCurr.concat([[0,0]],nonLinDirCurr);
}	

function removeIrp() {
	if (Rp == undefined) {estimRp();}
	var	button = document.getElementById('removeIrp'),
		array = modifDataArray[0],
		IV, newArray = [];

	if (button.value == 'Hide Irp') {
		var sign = -1;
		button.value = 'Show Irp';
	}	else {
			var sign = 1;
			button.value = 'Hide Irp';
		}
		
		for (var i = 0; i < array.length; i++) {
			IV = array[i];
			newArray.push([IV[0],IV[1] + sign * shuntCurrent[i][1]]);
		}
	modifDataArray = [newArray];

	combDataAndCalc(arrayCalc,plotStyle,scale);
}

function removeNonLinCurr() {
	if (Rp == undefined) {estimRp();}
	var array1 = dataArray[0],
		array2 = modifDataArray[0],
		IV1, IV2,
		newArray1 = [],
		newArray2 = [],
		button = document.getElementById('removeNonLinCurr');
	if (button.value == 'Remove non-linear reverse current') {
		var sign = -1;
		button.value = 'Add back non-linear reverse current';
	}
		else {
			var sign = 1;
			button.value = 'Remove non-linear reverse current';
		}
	for (var i = 0; i < array.length; i++) {
		IV1 = array1[i];
		newArray1.push([IV1[0],IV1[1] + sign * nonLinCurr[i][1]]);
		IV2 = array2[i];
		newArray2.push([IV2[0],IV2[1] + sign * nonLinCurr[i][1]]);
	}
	dataArray = [newArray1];
	modifDataArray = [newArray2];
	calcSqResSum();
	combDataAndCalc(arrayCalc,plotStyle,scale);
}

function calcSqResSum() {
	var r, calcI, j = 1,x1,x2,xy1,xy2,y1,y2,slope,x,SqResSum = 0,
		calcIV = arrayCalc[0],
		array = dataArray[0],
		el = document.getElementById('squaredResSum');

	for (var i = 0; i < array.length; i++) {
		x = array[i][0];
		while (x > calcIV[j][0]) {j++;}
		xy1 = calcIV[j-1];
		xy2 = calcIV[j];
		x1 = xy1[0];
		x2 = xy2[0];
		y1 = xy1[1];
		y2 = xy2[1];
		slope = (y2 - y1) / (x2 - x1);
		calcI = y1 + slope * (x - x1);
		r = Math.pow(calcI - array[i][1],2);
		SqResSum += r;
	}
	var dS = SqResSum - parseFloat(el.innerHTML.substring(4));
	if (!isNaN(dS)) {
		if (dS < 0) {var str = '(<span class="green">'+dS.toExponential(2)+'</span>)'}
			else {var str = '(<span class="red">+'+dS.toExponential(2)+'</span>)'}
	} else {var str = '';}
	el.innerHTML = 'S = '+SqResSum.toExponential(2)+' A<sup>2</sup> '+str;
}

function deriv(array) {
	var der,prev,next,derArray = [], stringArray = '';
	for (var i = 1; i < array.length - 1;i++) {//Derivative not calculated for 1st and last point
		prev = array[i-1];
		next = array[i+1];
		der = (next[1] - prev[1]) / (next[0] - prev[0]);
		derArray.push([array[i][0],der]);
		stringArray = stringArray.concat('\n'+array[i][0]+'\t'+array[i][1]+'\t'+der);
	}
	//alert (stringArray);
	return derArray;
}

function lnOfArray(array) {
	var xy, y, newArray = [];
	for (var i = 0; i < array.length; i++) {
		xy = array[i];
		y = xy[1];
		if (y != 0) {
			newArray.push([xy[0],Math.log(Math.abs(y))]);
		}
	}
	return newArray;
}

function findDiodes(array) {//argument 'array' must be d[ln(I)]/dV
	var i = array.length - 1,
		max = array[i];
		i+= -1;
	while (array[i][1] > max[1]) {
		max = array[i];
		i+= -1;		
	}
	var iMax = i + 1, //+1 is because array of derivative starts one point later (and ends one point earlier) than the original array
		min = max;
	while (array[i][1] < min[1]) {
		min = array[i];
		i+= -1;		
	}
	var iMin = i + 1;
	return [max,min,iMax,iMin];
}

function estimD1D2Rs() {
	var Rp = estimRp();
	
	removeIrp();
	var array = modifDataArray[0];
	removeIrp();
		
	var	maxmin = findDiodes(deriv(lnOfArray(array))),
		d1 = maxmin[1],
		d2 = maxmin[0],
		slopeD2 = d2[1],
		VIAtd1 = array[maxmin[3]],
		VIAtd2 = array[maxmin[2]],
		T = document.getElementById('T').value,
		A = q / (k * T),
		n1 = A / d1[1],
		n2 = A / slopeD2,
		Rs = estimRs(array,T), // Rs for n2 fixed at 1
		Is1 = VIAtd1[1] / (Math.exp(VIAtd1[0] * A / n1) - 1),
		i = array.length - 2,
		I = array[i][1], V = array[i][0],
		Is2 = I / (Math.exp((V - I * Rs) * A) - 1); // Is2 for n2 fixed at 1
	document.getElementById('paramEstim').innerHTML = 	'<b>Estimated parameters<br>(for now, parallel diodes model only):</b>'
														+'<br>n<sub>1</sub> = '+n1.toPrecision(2)
														+'<br>n<sub>2</sub> = '+n2.toPrecision(2)+' <span style="color:grey">(1 will be used instead)</span>'
														+'<br>Is<sub>1</sub> = '+Is1.toExponential(2)
														+'<br>Is<sub>2</sub> = '+Is2.toExponential(2)+' <span style="color:grey">(Estimated with n<sub>2</sub> = 1)</span>'
														+'<br>R<sub>p</sub> = '+Rp.toPrecision(3)
														+'<br>R<sub>s</sub> = '+Rs.toPrecision(2)+' <span style="color:grey">(Estimated with n<sub>2</sub> = 1)</span>';
	document.getElementById('updateParams').style.visibility = 'visible';
	estimParams = [['n1',n1],['Is1',Is1],['Is2',Is2],['Rp',Rp],['Rs',Rs]];
}

function estimRs(array,T) {
	var dIdV = deriv(array),
		i = array.length - 2,
		dIdVati = dIdV[i-1][1],
		exp, A, B, C,
		IVati = array[i],
		I = IVati[1], V = IVati[0],
		Rs = 0;
	do {
		A = q/(k*T);
		exp = Math.exp(A * (V - I * Rs));
		B = A * exp / (exp - 1);
		C = B / (1 / I + Rs * B);
		Rs+= 0.01;
	} while (C > dIdVati)
	return Rs;
}

function updateParams() {
	var params = estimParams, par, id;
	for (var i = 0; i < params.length; i++) {
		par = params[i];
		id = par[0];
		document.getElementById(id).value = par[1];
		SyncSlidernBox(id,'slider'+id);
	}
	calcIV();
}