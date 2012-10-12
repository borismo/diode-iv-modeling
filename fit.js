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

function removeIrp(plot) {

	var	button = document.getElementById('removeIrp'),
		array = modifDataArray[0],
		IV, newArray = [];

	if (button.value === 'Hide Irp') {
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

	if (plot) {combDataAndCalc(arrayCalc,plotStyle,scale);}
}

function removeNonLinCurr(CalculsqResSum,plot) {
	
	var array1 = dataArray[0],
		array2 = modifDataArray[0],
		IV1, IV2,
		newArray1 = [],
		newArray2 = [],
		button = document.getElementById('removeNonLinCurr');
	if (button.value === 'Remove non-linear reverse current') {
		var sign = -1;
		button.value = 'Add back non-linear reverse current';
	}
		else {
			var sign = 1;
			button.value = 'Remove non-linear reverse current';
		}
	for (var i = 0; i < array1.length; i++) {
		IV1 = array1[i];
		newArray1.push([IV1[0],IV1[1] + sign * nonLinCurr[i][1]]);
		IV2 = array2[i];
		newArray2.push([IV2[0],IV2[1] + sign * nonLinCurr[i][1]]);
	}
	dataArray = [newArray1];
	modifDataArray = [newArray2];
	
	if (CalculsqResSum) {calcSqResSum();}
	
	if (plot) {combDataAndCalc(arrayCalc,plotStyle,scale);}
}

var prevSqResSum,dS;

function calcSqResSum() {
	//alert("caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{')));
	var n1 	= parseFloat(document.getElementById('n1').value),
		Is1	= parseFloat(document.getElementById('Is1').value),
		Rp = parseFloat(document.getElementById('Rp').value),
		Rs = parseFloat(document.getElementById('Rs').value),
		T = parseFloat(document.getElementById('T').value),
		single = document.getElementById('singleDiode').checked;
		
	if (single) { //single diode model
		var Is2 = 0,
			n2 = 1;
	} 	else {var	Is2 = parseFloat(document.getElementById('Is2').value),
					n2 = parseFloat(document.getElementById('n2').value);
		}
	
	if (document.getElementById('series').checked) {//dual, series diode model
		var Rp2 = parseFloat(document.getElementById('Is2').value),
			n1 	= parseFloat(document.getElementById('n1').value);
	}
	
	var r, calcI, j = 1,x1,x2,xy1,xy2,y1,y2,slope,x,
		calcIV = arrayCalc[0],
		array = dataArray[0],
		el = document.getElementById('squaredResSum'),
		stringArray = '',
		data,
		dSdn1 = 0,
		dSdn2 = 0,
		dSdIs1 = 0,
		dSdIs2 = 0,
		dSdRp = 0,
		dSdRs = 0;
	SqResSum = 0;
	//d2Sdn2 = 0;
	var A = Is1 * q / (k * T),
		dIdn1,dIdn2,dIdIs1,dIdIs2,dIdRp,dIdRs,exp1,exp2;
	
	for (var i = 0; i < array.length; i++) {//for each data point
		x = array[i][0];
		while (x > calcIV[j][0]) {j++;}
		xy1 = calcIV[j-1];
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
			
			dIdn1 = q * (Rs * calcI - x) / (Math.pow(n1,2) * k * T * (1 + Rs / Rp + q * Is2 * Rs * exp2 / (n2 * k * T)) / (Is1 * exp1) + n1 * Rs * q);
			dSdn1 += 2 * r * dIdn1 / Math.abs(data);
			
			dIdn2 = q * (Rs * calcI - x) / (Math.pow(n2,2) * k * T * (1 + Rs / Rp + q * Is1 * Rs * exp1 / (n1 * k * T)) / (Is2 * exp2) + n2 * Rs * q);
			dSdn2 += 2 * r * dIdn2 / Math.abs(data);
			
			dIdIs1 = (exp1 - 1) / (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + q * Is2 * Rs * exp2 / (n2 * k * T) + Rs / Rp);
			//dIdIs1 = (exp1 - 1) / (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + Rs / Rp);
			dSdIs1 += 2 * r * dIdIs1 / Math.abs(data);
			
			dIdIs2 = (exp2 - 1) / (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + q * Is2 * Rs * exp2 / (n2 * k * T) + Rs / Rp);
			dSdIs2 += 2 * r * dIdIs2 / Math.abs(data);
			
			dIdRp = (calcI * Rs - x) / (Math.pow(Rp,2) * (1 + q * Is1 * Rs * exp1 / (n1 * k * T) + q * Is2 * Rs * exp2 / (n2 * k * T) + Rs / Rp));
			dSdRp += 2 * r * dIdRp / Math.abs(data);
			
			dIdRs = - calcI * (q * Is1 * exp1 / (n1 * k * T) + q * Is2 * exp2 / (n2 * k * T) + 1 / Rp) / (1 + Rs * (q * Is1 * exp1 / (n1 * k * T) + q * Is2 * exp2 / (n2 * k * T) + 1 / Rp));
			//dIdRs = - calcI * (q * Is1 * exp1 / (n1 * k * T) + 1 / Rp) / (1 + Rs * (q * Is1 * exp1 / (n1 * k * T) + 1 / Rp));
			dSdRs += 2 * r * dIdRs / Math.abs(data);
			
			SqResSum += Math.pow(r,2);
		}
		delS = [dSdn1,dSdIs1,dSdRp,dSdRs];
		if (!single) {
			delS.splice(1,0,dSdn2);
			delS.splice(3,0,dSdIs2);
		}
		//alert(delS);
		//log.innerHTML = log.innerHTML+x+' '+calcI+' '+data+' '+r+'<br>';
		//stringArray = stringArray.concat('\n'+calcI+'\t'+data);
	}
	
	dS = SqResSum - prevSqResSum;
	//alert(stringArray);
	if (isNaN(dS)) {var str = '';} //1st time SqResSum is calculated
		else {
			if (dS < 0) {var str = ' (<span class="green">'+dS.toExponential(2)+'</span>)'}
				else {var str = ' (<span class="red">+'+dS.toExponential(2)+'</span>)'}
		}
	el.innerHTML = 'S = '+SqResSum.toExponential(2)+str;
	
	prevSqResSum = SqResSum;
}

function toggleresidualPlot() {
	if (document.getElementById('showResGraph').checked) {
		document.getElementById('residual').style.display = '';
		calcSqResSum();
	}	else {
			document.getElementById('residual').style.display = 'none';
		}
}

function deriv(array) {
	//alert("caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{')));
	var der,prev,next,derArray = [], stringArray = 'V\tln(I)\td[ln(I)]/dV';
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
	//var string = 'V\td[ln(I)]/dV';
	for (var i = 0; i < array.length; i++) {
		xy = array[i];
		y = xy[1];
		if (y != 0) {
			newArray.push([xy[0],Math.log(Math.abs(y))]);
			//string = string.concat('\n'+xy[0]+'\t'+Math.log(Math.abs(y)));
		}
	}
	
	return newArray;
}

function findDiodesbac(array) {//argument 'array' must be d[ln(I)]/dV
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
	alert([max,min,iMax,iMin])
	return [max,min,iMax,iMin];
}

function findDiodesbac() {
	
	var	IprShowed = document.getElementById('removeIrp').value === 'Hide Irp',
		nonLinearShuntCurrRemoved = document.getElementById('removeNonLinCurr').value == 'Add back non-linear reverse current';
	
	
		if (IprShowed) {removeIrp(false);} // diode parameters better evaluated when Rp = infinity
		if (!nonLinearShuntCurrRemoved) {removeNonLinCurr(false,false);}
		noIrpNoSCLCarray = modifDataArray[0];
		var array = modifDataArray[0];
		if (IprShowed) {removeIrp(false);}
		if (!nonLinearShuntCurrRemoved) {removeNonLinCurr(false,false);}
	
	var array = deriv(lnOfArray(array));
	
	var i = array.length - 2,
		max = array[i],
		prev = -Infinity,
		l = log,
		dLn;
	
	//l.innerHTML = '';
	var iMax = i + 1;
	while (i >= 0 && array[i][0] > 0.04) {// looking for a maxima between 0.04 V and Vmax
		dLn = array[i][1];
		// l.innerHTML += [array[i][0],dLn]+'<br>';
		if (dLn < prev && prev > max[1] && prev - dLn < 5) {
			iMax = i + 1;
			max = array[iMax];
			
			l.innerHTML += 'd2 found at ' + array[iMax][0] + ' V<br>'
		}
		prev = array[i][1];
		i--;
	}
	
	var min = max;
	prev = +Infinity;
	i = iMax - 1;
	while (i >= 0 && array[i][0] > 0.04 && array[i][1] > 0) {// looking for a minima between 0.04 V and Vmax
		dLn = array[i][1];
		if (dLn > prev && prev < min[1] && dLn - prev < 5 && dLn > 0) {
			var iMin = i + 1;
			min = array[iMin];
			l.innerHTML += 'd1 found at ' + array[iMin][0] + ' V<br>'
		}
		prev = array[i][1];
		i--;
	}
	//alert(iMin);
	
	iMax = array.length - iMax - 1;
	iMin = array.length - iMin - 1;
	//iMax (and iMin) are the indexes of the maxima (and minima), starting from the *end* of the original array, in case points in reverse are missing after removal of Irp and SCLC
	// alert([max,min,iMax,iMin]);
	return [max,min,iMax,iMin];
}

function findDiodesbac2() {
	
	var	IprShowed = document.getElementById('removeIrp').value == 'Hide Irp',
		nonLinearShuntCurrRemoved = document.getElementById('removeNonLinCurr').value === 'Add back non-linear reverse current';
	
		if (IprShowed) {removeIrp(false);} // diode parameters better evaluated when Rp = infinity
		if (!nonLinearShuntCurrRemoved) {removeNonLinCurr(false,false);}
		noIrpNoSCLCarray = modifDataArray[0];
		var array = modifDataArray[0];
		if (IprShowed) {removeIrp(false);}
		if (!nonLinearShuntCurrRemoved) {removeNonLinCurr(false,false);}
	
	var array1 = deriv(lnOfArray(array)),// 1st order derivative
		array = deriv(array1),//2nd order derivative
		i = array.length - 2,
		min = array[i],
		prev = 0,
		l = log,
		dLn,
		dLnMin = 0;
	
	//l.innerHTML = '';
	var iMin = i + 1;
	while (i >= 0 && array[i][0] > 0.04) {// looking for a minima between 0.04 V and Vmax
		dLn = array[i][1];
		l.innerHTML += [array[i][0],dLn]+'<br>';
		if (dLn > prev && prev < dLnMin) {
			var iMin = i + 1;
			dLnMin = prev;
			l.innerHTML += 'minimum found at ' + array[iMin][0] + ' V<br>';
		}
		prev = dLn
		i--;
	}
	
	var dLnMax = dLnMin;
	prev = -Infinity;
	i = iMin - 1;
	var iMax = iMin;
	while (i >= 0 && array[i][0] > 0.04) {// looking for a maxima between 0.04 V and Vmax
		dLn = array[i][1];
		
		if (dLn < prev && prev > dLnMax) {
			iMax = i + 1;
			dLnMax = prev;
			l.innerHTML += 'max found at ' + array[iMax][0] + ' V<br>';
		}
		prev = dLn;
		i--;
	}
	//alert(iMin);
	i = iMax;
	do {
		prev = dLn;
		i--;
		dLn = array[i][1];
	} while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0)
	l.innerHTML += 'D1 at ' + array[i+1][0] + ' V<br>';
	var iD1 = i + 1;
	var D1dLn = array1[iD1 + 1][1];
	
	i = iMax;
	do {
		prev = dLn;
		i++;
		dLn = array[i][1];
	} while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0)
	l.innerHTML += 'D2 at ' + array[i-1][0] + ' V<br>';
	var iD2 = i-1;
	var D2dLn = array1[iD2+1][1];
	
	var length = array.length - 2;
	
	iD2 = length - iD2;
	iD1 = length - iD1;
	/* iD2 (and iD1) are the indexes of the maxima (and minima), starting from the *end* of the original array,
	in case points in reverse are missing after removal of Irp and SCLC */
	
	return [D2dLn,D1dLn,iD2,iD1];
}

function findDiodes() {
	
	var	IprShowed = document.getElementById('removeIrp').value === 'Hide Irp',
		nonLinearShuntCurrRemoved = document.getElementById('removeNonLinCurr').value === 'Add back non-linear reverse current';
	
		if (IprShowed) {removeIrp(false);} // diode parameters better evaluated when Rp = infinity
		if (!nonLinearShuntCurrRemoved) {removeNonLinCurr(false,false);}
		noIrpNoSCLCarray = modifDataArray[0];
		var array = modifDataArray[0];
		if (IprShowed) {removeIrp(false);}
		if (!nonLinearShuntCurrRemoved) {removeNonLinCurr(false,false);}
	
	var array1 = deriv(lnOfArray(array)),// 1st order derivative
		array = deriv(array1),//2nd order derivative
		i = array.length - 2,
		prev,
		l = log,
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
	//l.innerHTML += 'average: '+avD+'<br>';
	
	var iMin = i,
		fluctIn2ndHalf = false;
	do {i = iMin;
		dLn = array[i][1];
		var maxPassed = false;
		do {// looking for minima between 0.04 V and Vmax
			i--;
			prev = dLn;
			dLn = array[i][1];
			//l.innerHTML += [array[i][0],dLn]+'<br>';
			fluctIn2ndHalf += Math.abs(dLn - prev) > avD && i < array.length / 2;
			maxPassed += prev > dLn && Math.abs(dLn - prev) < avD;
			var carryOn = !maxPassed || dLn < prev;
		} while (i >= 0 && array[i][0] > 0.04 && carryOn && !fluctIn2ndHalf)
		// alert(fluctIn2ndHalf);
		iMin = i + 1;
		dLnMin = prev;

		// l.innerHTML += 'min: '+iMin+' '+dLnMin+'<br>';
		
		var dLnMax = dLnMin;
		prev = -Infinity;
		i = iMin - 1;
		var iMax = iMin;
		while (i >= 0 && array[i][0] > 0.04) {// looking for a maxima between 0.04 V and Vmax
			dLn = array[i][1];
			
			if (dLn < prev && prev > dLnMax && Math.abs(dLn - prev) < avD) {
				iMax = i;
				dLnMax = prev;
				// l.innerHTML += 'max found at ' + array[iMax + 1][0] + ' V<br>';
			}
			prev = dLn;
			i--;
		}
		
		// l.innerHTML += 'iMax: ' + iMax + '<br>';
		// l.innerHTML += 'iMin: ' + iMin + '<br>';
		if (dLnMax - dLnMin > deltaLnMax) {
			deltaLnMax = dLnMax - dLnMin;
			var iMaxMax = iMax;
			// l.innerHTML += 'Keep<br>';
		}
		j++;
	} while (iMax != iMin && j < 10 && !fluctIn2ndHalf)
	
	if(!iMaxMax) {return 'noDiode';}
	
	i = iMax = iMaxMax;
	dLn = array[i][1];
	do {
		prev = dLn;
		i--;
		dLn = array[i][1];
	} while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0)
	var iD1 = i + 2;
	l.innerHTML += 'D1 at ' + array[iD1][0] + ' V<br>';
	var D1dLn = array1[iD1 + 1][1];
	
	i = iMax;
	do {
		prev = dLn;
		i++;
		dLn = array[i][1];
	} while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0)
	var iD2 = i - 1;
	l.innerHTML += 'D2 at ' + array[iD2][0] + ' V<br>';
	var D2dLn = array1[iD2+1][1];
	
	var length = array.length - 2;
	
	iD2 = length - iD2;
	iD1 = length - iD1;
	/* iD2 (and iD1) are the indexes of the maxima (and minima), starting from the *end* of the original array,
	in case points in reverse are missing after removal of Irp and SCLC */
	
	return [D2dLn,D1dLn,iD2,iD1];
}

function estimD1D2Rs(maxmin) {
	
	if (document.getElementById('series').checked) {return;} //for now, no estimation for series model
	var	dualDiode = !document.getElementById('singleDiode').checked,
	
		array = noIrpNoSCLCarray;
	
	if (maxmin === 'noDiode') {
		document.getElementById('paramEstim').innerHTML = 'Sorry, the diodes could not be found';
		return ;
	}
	
	var	D1dLn = maxmin[1],
		D2dLn = maxmin[0],
		VIAtd1 = array[array.length - 4 - maxmin[3]],
		VIAtd2 = array[array.length - 4 - maxmin[2]],
		T = document.getElementById('T').value,
		A = q / (k * T),
		n2 = A / D2dLn;
		
		if (dualDiode) {
			if (document.getElementById('n2CheckBox').checked) {
				var n = n2,
					n2Fixed = '';				
			}	else {
				var	n = n2 = parseFloat(document.getElementById('n2').value),
					n2Fixed = ' <span style="color:grey">(fixed)</span>';
					}
			if (document.getElementById('n1CheckBox').checked) {
				var n1 = A / D1dLn,
					n1Fixed = '';
			}	else {
					var n1 = parseFloat(document.getElementById('n1').value),
						n1Fixed = ' <span style="color:grey">(fixed)</span>';
				}
			if (document.getElementById('Is1CheckBox').checked) {
				var	Is1 = VIAtd1[1] / (Math.exp((VIAtd1[0] * A / n1) - 1)),
					Is1Fixed = '';
			} 	else {
					var Is1 = parseFloat(document.getElementById('Is1').value),
						Is1Fixed = ' <span style="color:grey">(fixed)</span>';
				}
		} 	else {//single diode
				var n = n2;
			}
	if (document.getElementById('RsCheckBox').checked) {
		var	Rs = estimRs(array,T,n),
			RsFixed = '';
	} 	else {
		var	Rs = parseFloat(document.getElementById('Rs').value),
			RsFixed = ' <span style="color:grey">(fixed)</span>';
		}
	if (document.getElementById('Is2CheckBox').checked) {
		var	Is2 = VIAtd2[1] / (Math.exp((VIAtd2[0] - VIAtd2[1] * Rs) * A / n2) - 1),
			Is2Fixed = '';
	} 	else {
		var	Is2 = parseFloat(document.getElementById('Is2').value),
			Is2Fixed = ' <span style="color:grey">(fixed)</span>';
		}	
	if (document.getElementById('Rp1CheckBox').checked) {
		var	newRp = Rp,
			RpFixed = '';
	} 	else {
		var	newRp = parseFloat(document.getElementById('Rp').value),
			RpFixed = ' <span style="color:grey">(fixed)</span>';
		}
	if (dualDiode) {
		document.getElementById('paramEstim').innerHTML = 	'<b>Estimated parameters<br>(parallel dual-diode model):</b>'
															+'<br>n<sub>1</sub> = '+n1.toPrecision(2)+n1Fixed
															+'<br>n<sub>2</sub> = '+n2.toPrecision(2)+n2Fixed
															+'<br>Is<sub>1</sub> = '+Is1.toExponential(2)+Is1Fixed
															+'<br>Is<sub>2</sub> = '+Is2.toExponential(2)+Is2Fixed
															+'<br>R<sub>p</sub> = '+newRp.toPrecision(3)+RpFixed
															+'<br>R<sub>s</sub> = '+Rs.toPrecision(2)+RsFixed;
		document.getElementById('updateParams').style.visibility = 'visible';
		estimParams = [['n1',n1],['n2',n2],['Is1',Is1],['Is2',Is2],['Rp',newRp],['Rs',Rs]];
	} 	else {
			document.getElementById('paramEstim').innerHTML = 	'<b>Estimated parameters<br>(Single-diode model):</b>'
																+'<br>n = '+n2.toPrecision(2)
																+'<br>I<sub>s</sub> = '+Is2.toExponential(2)
																+'<br>R<sub>p</sub> = '+Rp.toPrecision(3)
																+'<br>R<sub>s</sub> = '+Rs.toPrecision(2)
			document.getElementById('updateParams').style.visibility = 'visible';
			estimParams = [['n1',n2],['Is1',Is2],['Rp',newRp],['Rs',Rs]];
		}
}

function estimRs(array,T,n) {
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
		//alert(IVati);
	do {
		exp = Math.exp(A * (V - I * Rs));
		B = A * exp / (exp - 1);
		C = B / (1 / I + Rs * B);
		Rs += 0.01;
	} while (C > dIdVati)
	//alert(C);
	return Rs;
}

function useEstimParam() {
	if (rangeSupport) {
		var id = ['Iph','T','n1','n2','Is1','Is2','Rp','Rp2','Rs','sliderIph','sliderT','slidern1','slidern2','sliderIs1','sliderIs2','sliderRp','sliderRp2','sliderRs'];
		for (var i = 0; i < id.length; i++) {
			var el = document.getElementById(id[i]);
			el.removeEventListener('change',syncSlidernboxReCalc, false);
			el.addEventListener('change',syncSlidernboxNoCalc, false);
		}
	}
	
	updateParams(estimParams,true,true);
	
	if (rangeSupport) {
		var id = ['Iph','T','n1','n2','Is1','Is2','Rp','Rp2','Rs','sliderIph','sliderT','slidern1','slidern2','sliderIs1','sliderIs2','sliderRp','sliderRp2','sliderRs'];
		for (var i = 0; i < id.length; i++) {
			var el = document.getElementById(id[i]);
			el.addEventListener('change',syncSlidernboxReCalc, false);
			el.addEventListener('change',syncSlidernboxNoCalc, false);
		}
	}
}

function updateParams(params,plot,updateRangeInput) {
	var par,
		id;
	if (updateRangeInput) {
		var evt = document.createEvent('HTMLEvents');
		evt.initEvent('change', false, false);
	}
	for (var i = 0; i < params.length; i++) {
		par = params[i];
		id = par[0];
		var el = document.getElementById(id);
		el.value = par[1];
		//SyncSlidernBox(el,false);
		if (updateRangeInput) {
			el.dispatchEvent(evt);
		}
	}
	calcIV(plot);
}

function vary() {
	
	var param, oOO,id,string = '', l=log, eps = mchEps;
	
	var n1 	= parseFloat(document.getElementById('n1').value),
		n1vary = document.getElementById('n1CheckBox').checked,
		Is1	= parseFloat(document.getElementById('Is1').value),
		Is1vary = document.getElementById('Is1CheckBox').checked,
		Rp = parseFloat(document.getElementById('Rp').value),
		Rpvary = document.getElementById('Rp1CheckBox').checked,
		Rs = parseFloat(document.getElementById('Rs').value),
		Rsvary = document.getElementById('RsCheckBox').checked;
		
		params = [['n1',n1,eps,n1vary],['Is1',Is1,eps,Is1vary],['Rp',Rp,eps,Rpvary],['Rs',Rs,eps,Rsvary]]; // single diode model
		
	if (!document.getElementById('singleDiode').checked) { //dual diode model
		var Is2 = parseFloat(document.getElementById('Is2').value),
			Is2vary = document.getElementById('Is2CheckBox').checked,
			n2 = parseFloat(document.getElementById('n2').value),
			n2vary = document.getElementById('n2CheckBox').checked;
		params = [['n1',n1,eps,n1vary],['n2',n2,eps,n2vary],['Is1',Is1,eps,Is1vary],['Is2',Is2,eps,Is2vary],['Rp',Rp,eps,Rpvary],['Rs',Rs,eps,Rsvary]];
	}
	if (document.getElementById('series').checked) {//dual, series diode model
		var Rp2 = parseFloat(document.getElementById('Is2').value),
			n1 	= parseFloat(document.getElementById('n1').value);
		params = [['n1',n1],['n2',n2],['Is1',Is1],['Is2',Is2],['Rp',Rp],['Rp2',Rp2],['Rs',Rs]];
	}
	
	var del,
		S,
		newPar,
		j = 0,
		ii = 0,
		sign,
		string = 'Iteration S |dS|',
		stop = false;
		
	for (var i = 0; i < params.length; i++) {
		string += ' '+params[i][0];
	}
	
	/* window.performance = window.performance || {};
	performance.now = (function() 	{
				  return performance.now()       ||
						 performance.mozNow()    ||
						 performance.msNow()     ||
						 performance.oNow()      ||
						 performance.webkitNow() ||
						 false;
							})();
	alert(performance.now); */
	
	v = setInterval(
		function(){
			S = SqResSum;
			var newPars = [];
			//del = delS;
			for (var i = 0; i < params.length; i++) {//for each parameter
				if (params[i][3]){// is this parameter allowed to vary?
					del = delS[i];
					sign = del / Math.abs(del);
					
					newPar = params[i][1] * Math.pow((1 + params[i][2]),-sign); //update parameter
					
					updateParams([[params[i][0],newPar]],false,false);
					
					j = 0;
					while (del / Math.abs(del) != delS[i] / Math.abs(delS[i]) && j < 100 && newPar !== 0) {
						params[i][2] /= 2;
						newPar = params[i][1] * Math.pow((1 + params[i][2]),-sign); //update parameter
						updateParams([[params[i][0],newPar]],false,false);
						//l.innerHTML = l.innerHTML+params[i][0]+' ### '+j+' '+params[i][2]+' '+del+'<br>';
						j++;
					}
					//l.innerHTML = l.innerHTML+params[i][0]+' '+j+' '+del+'<br>';
					
					var jj = 0;
					while (del / Math.abs(del) == delS[i] / Math.abs(delS[i]) && jj < 100 && newPar !== 0) {
						params[i][2] *= 2;
						newPar = params[i][1] * Math.pow((1 + params[i][2]),-sign); //update parameter
						updateParams([[params[i][0],newPar]],false,false);
						
						//l.innerHTML = l.innerHTML+params[i][0]+' *** '+jj+' '+newPar+' '+params[i][2]+sign+' '+' <br>';
						jj++;
					}
					params[i][1] = newPar;
					newPars.push(newPar);
					
					if (isNaN(newPar)) {
						stop += true;
						log.innerHTML += 'Sorry, '+params[i][0]+' is NaN ('+newPar+').<br>';
						l.scrollTop = l.scrollHeight;
					}
				}
			}
			
			string += '<br>'+ii+' '+SqResSum+' '+Math.abs(dS)+' '+newPars.join(' ');
			
			// l.innerHTML = l.innerHTML+ii+' '+SqResSum+' '+newPars.join('\t')+'<br>';
			// l.scrollTop = l.scrollHeight;
			ii++;
			
			var threshold = document.getElementById('threshold').value;
			if (Math.abs(SqResSum - S) < threshold || ii > 1000 || stop) {
				startPauseVary();
				log.innerHTML += '<br>'+string+'<br>';
				l.scrollTop = l.scrollHeight;
				
				var id = ['Iph','T','n1','n2','Is1','Is2','Rp','Rp2','Rs']
				for (var i = 0; i < id.length; i++) {
					SyncSlidernBox(document.getElementById(id[i]),false);
				}
			}
			if (document.webkitHidden) {
				// no use to plot: the page is not visible (Webkit only)
			} 	else {combDataAndCalc(arrayCalc,plotStyle,scale);}
		}
	,1)
}

function startPauseVary() {
	var el = document.getElementById('varParams');
	
	if (el.innerHTML == 'Stop') {
		clearInterval(v);
		el.innerHTML = 'Minimize S';
	} 	else {
			el.innerHTML = 'Stop';
			vary();			
		}
}