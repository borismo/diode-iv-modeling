var Rp
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
	document.getElementById('estimatedRp').innerHTML = 'R<sub>p</sub> &asymp; '+roundedRp.toExponential();
	
	calcIrpAndNonLinRevCurr()
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
	var	button = document.getElementById('removeIrp'),
		array = modifDataArray[0],
		IV, newArray = [];

	if (button.value == 'Remove Irp') {
		var sign = -1;
		button.value = 'Add Irp back';
	}
		else {
			var sign = 1;
			button.value = 'Remove Irp';
		}
		
		for (var i = 0; i < array.length; i++) {
		IV = array[i];
		newArray.push([IV[0],IV[1] + sign * shuntCurrent[i][1]]);
	}
	modifDataArray = [newArray];
	combDataAndCalc(arrayCalc,plotStyle,scale);
}

function removeNonLinCurr() {
	if (Rp == undefined) {estimRp()}
	var array = modifDataArray[0],
		IV, newArray = [],
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
		IV = array[i];
		newArray.push([IV[0],IV[1] + sign * nonLinCurr[i][1]]);
	}
	modifDataArray = [newArray];
	combDataAndCalc(arrayCalc,plotStyle,scale);
}