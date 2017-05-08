let main = function () {
  'use strict';

  const mchEps = machineEpsilon();

  let arrayCalc,
    fileOpened = false,
    dataStyle = [],
    plotStyle = [],
    reCalcIV = true,
    scale = undefined,
    userData = {
      estimatedParams: [],
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
    };

  // Elementary charge and Boltzmann constant
  const q = 1.60217653E-19,
    k = 1.3806488E-23;

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
    // When page loaded, calculate a first time
    // IV using the initial parameters, and plot
    // the result
    const plot = true;  
    calcIV(plot);
    
    //Opera fix: nicely rounds initial Is1 and Is2
      var	id = ['is1', 'n1', 'n2', 'is2', 'threshold', 'rs', 'rp1', 'rp2'];
      for (var i = 0; i < 8; i++) {
        var element = document.getElementById(id[i]),
          nb = parseFloat(element.value),
          oOO = orderOfMagn(nb);
        element.value = nb.toPrecision(Math.round(-log10(element.step / oOO) + 1));
      }

    // Bind events
    $('input[type=range].syncme')
      .on('input', inputEvent)
      .mouseup(rangeInputMouseUp);

    $('input[type=number].syncme')
      .change(inputEvent)
      .keydown(numberInputKeyDown)
      .blur(changeStep);

    $('input[type=number].voltage')
      .change(checkVoltageAndCalc);

    $('input[type=radio].model')
      .change(changeModel);
    
    $('input[type=radio].scale')
      .change(changeScaleType);

    /*$('input#removeIrp')
      .click(removeIrpClicked)

    $('button#updateParams')
      .click(updateParamsClicked);*/

    $(':file')
      .change(fileInputChanged);

    $('.fa-toggle-on, .fa-toggle-off')
      .click(faToggleClicked);

    $('#useestimatedparams')
      .click(useEstimatedParams);

    $('button#start')
      .click(startButtonClicked)

    id = ['TCheckBox','IphCheckBox','n1CheckBox','n2CheckBox','Is1CheckBox','Is2CheckBox','Rp1CheckBox','Rp2CheckBox','RsCheckBox'];
    for (var i = 0; i < id.length; i++) {
      var el = document.getElementById(id[i]);
      el.addEventListener('change',function(e){
                      if (!document.getElementById('clear').disabled) { // <=> a experimental file has been opened
                        fit.estimD1D2Rs(findDiodes());
                      }
                    }, false);
    }

      var holder = document.getElementById('graph');

      holder.ondragenter = holder.ondragover = function (event) {
        event.preventDefault();
        holder.className = 'hover';
      }
      
      holder.ondragleave = function (event) {
        event.preventDefault();
        holder.className = '';
      }
      
      holder.ondrop =	function (e) {
                      e.preventDefault();
                      processFiles(e.dataTransfer.files);
                      holder.className = '';
                    }
  });

    function changeScaleType(event) {
      calcIV(true);
    }

    function rangeInputMouseUp (event) {
      adjustRange(this);
    }

    function numberInputKeyDown (event){
      const keyCode = event.which,
        upOrDownArrowKeyDown = keyCode == 38 || keyCode == 40;

      if (upOrDownArrowKeyDown) {
        syncInputs(this);
        adjustRange(this);
        calcIV(true);
      }
    }

    function removeIrpClicked(event) {
      let plot = true;
      fit.removeIrp(userData.modifDataArray, userData.current.shunt, plot);
    }

    function removeNonLinCurrClicked (event){
      const CalculsqResSum = true,
         plot = true
      fit.removeNonLinCurr(userData, CalculsqResSum, plot);
    }

    function updateParamsClicked(event) {
      reCalcIV = false;

      const plot = true,
        updateRangeInput = true;
      fit.updateParams(userData.estimatedParams, plot, updateRangeInput);

      reCalcIV = true;
    }

    function fileInputChanged (event) {
      const file = this.files[0];
      $(this)
        .closest('.input-group')
        .children('input:text')
        .val(file.name);
      processFiles(file);
    }

    function faToggleClicked(event) {
      const $i = $(this) // <i> element
        .toggleClass('fa-toggle-on fa-toggle-off');
    }

    function syncInputs (sourceElem) {
      const $sourceInput = $(sourceElem),
        isSourceRange = $sourceInput.attr('type') === 'range',
        targetType = (isSourceRange) ? 'number' : 'range',
        sourceValue = $sourceInput.val();
      
      // Sync companion input
      const $targetInput = $sourceInput
          .closest('.row')
          .find('input.syncme[type=' + targetType + ']'),
        isScaleLog = $targetInput.hasClass('logscale');
      
      if(isScaleLog) {
        const targetValue = (isSourceRange)? Math.pow(10, sourceValue).toExponential(2) : log10(sourceValue);
        $targetInput.val(targetValue);
      } else {
        // Linear scale
        $targetInput.val(sourceValue);
      }
    }

    function inputEvent(event) {
      // Fired when user moves range input or change number input
      // So "this" is a number or range input

      const isNumberInput = $(this).attr('type') === 'number';

      if (isNumberInput) {
        adjustRange(this);
      }

      syncInputs(this);

      if (reCalcIV) {
        calcIV(true);
      }
    }

    function checkVoltageAndCalc(event) {

      var minVolt = document.getElementById('minVolt').value,
        maxVolt = document.getElementById('maxVolt').value,
        stepVolt = document.getElementById('stepVolt').value;

      if (maxVolt < minVolt) {
        document.getElementById('minVolt').value = maxVolt;
        document.getElementById('maxVolt').value = minVolt;
      }

      if (stepVolt == 0) { document.getElementById('stepVolt').value = 25; }

      if (stepVolt < 0) { document.getElementById('stepVolt').value = Math.abs(stepVolt); }

      calcIV(true);
    }

  function log10(val) {
    return Math.log(val) / Math.log(10);
  }

  function remDecimals(model,number) {
    var nbDecimals = nbAfterDot (model);
    return Math.round(number * Math.pow(10,nbDecimals)) * Math.pow(10,-nbDecimals);
  }

  function nbDecimals(number) {
    var i = -1;
    while (number != 0) {
      i++;
      number = Math.round(1e8*(number - Math.floor(number)))*1e-7;
    }
    
  return i;
  }

  function nbAfterDot(number) {
    var n = number.toString().indexOf('.');
    if (n == -1) {return 0}
      else {
        var i = 0;
        while (number.charAt(n + 1 + i) != '' && isFinite(number.charAt(n + 1 + i))) {
          i++;
        }
      }
    return i;
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

  function adjustRange(element) {
    const inputType = $(element).attr('type');

    if (inputType === 'range') {
      var slider = element,
        number = document.getElementById(element.id.replace('slider',''));
    }	else {
        var slider = document.getElementById('slider'+element.id),
          number = element;
      }
    var rangeChanged = false;
    
    if ($(slider).hasClass('linearscale')) {
      if (parseFloat(number.value) >= parseFloat(slider.max)) {
        slider.max = remDecimals (number.value, 1.6 * number.value);
        slider.value = number.value;
        slider.min = remDecimals (number.value, 0.4 * number.value);
        rangeChanged = true;
      } else {
        if (parseFloat(number.value) <= parseFloat(slider.min)) {
          slider.min = remDecimals (number.value, 0.4 * number.value);
          slider.value = number.value;
          slider.max = remDecimals (number.value, 1.6 * number.value);
          rangeChanged = true;
        }
      }
      while (2 * slider.step >= (slider.max - slider.min)) {
        slider.max = 2 * slider.step + slider.max;
      }
    } 	else { //when scale is Log
        if (parseFloat(number.value) >= Math.pow(10,parseFloat(slider.max))) {
          slider.max = Math.round(log10(number.value) + 3);
        slider.value = number.value;
          slider.min = Math.round(log10(number.value) - 3);
          rangeChanged = true;
        } 	else {
            if (parseFloat(number.value) <= Math.pow(10,parseFloat(slider.min))) {
              slider.min = Math.round(log10(number.value) - 3);
        slider.value = number.value;
              slider.max = Math.round(log10(number.value) + 3);
              rangeChanged = true;
            }
          }
      }
      
      return rangeChanged;
  }

  function changeStep(event) {
    let element = this;
    var slider = document.getElementById('slider'+element.id),
      val = element.value;
    
    if (element.className.indexOf('LogScale') == -1){ //Linear Scale
      element.value = parseFloat(val);//for Chrome
      var newStep = Math.pow(10,-1 * nbAfterDot(val));
      //alert(newStep);
      element.step = newStep;
    }
    
    slider.step = newStep;
  }

  function SyncSlidernBox(element,recalculate) {
    //alert("caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{')));
    //log.innerHTML += [element.id,recalculate]+'<br>';
    
    if (element.id.indexOf('slider') == -1) {//box changed
      var sliderChanged = false;
      
      var elToSync = document.getElementById('slider'+element.id);
      //round
      // var val = parseFloat(element.value),
        // oOO = orderOfMagn(val);
      // if (element.className.indexOf('LogScale') != -1){element.step = oOO / 100;}
      // var	precision = Math.round(-log10(element.step / oOO) + 1);
      // if (!isFinite(precision)) {precision = 3};
      // val = parseFloat(val.toPrecision(precision));
      
      if (adjustRange(element,false)) {var time = 100} else {var time = 0}
      setTimeout(function(){// setTimeOut needed for Opera, otherwise value is not updated when range input's max and min modified
        if (element.className.indexOf('LogScale') != -1){//Are we dealing with a Log Scale?
          elToSync.value = log10(element.value);
          //element.value = val.toExponential(precision - 1);
        } 	else {
          elToSync.value = element.value;
          }
      },time);
    } 	else {//slider changed
        var sliderChanged = true,
          elToSync = document.getElementById(element.id.replace('slider',''));
        if (element.className.indexOf('LogScale') == -1){//Linear Scale?
          elToSync.value = element.value;
        }	else {
            elToSync.value = Math.pow(10, element.value).toExponential(2);
          }
      }		

    if (recalculate) {
      calcIV(true);
      if (!document.getElementById('clear').disabled && element.id.indexOf('T') != -1) { // <=> T has been changed and a experimental file is opened
        fit.estimD1D2Rs(findDiodes());
      }
    }
  }

  function changeModel(event) {
    if (document.getElementById('parallel').checked) {
      disableAndCalc(['Rp2','sliderRp2']);
      var array = ['n2','slidern2','Is2','sliderIs2','series','parallel'];
      if (!document.getElementById('clear').disabled) {
        array = array.concat(['n1CheckBox','Is1CheckBox','Rp1CheckBox','RsCheckBox','n2CheckBox','Is2CheckBox']);
      }
      enableAndCalc(array)
      document.getElementById('varParams').disabled = false;
    }
    if (document.getElementById('singleDiode').checked) {
      document.getElementById('series').checked = false;
      document.getElementById('parallel').checked = true;
      disableAndCalc(['n2','slidern2','Is2','sliderIs2','Rp2','sliderRp2','series','parallel','n2CheckBox','Is2CheckBox']);
      if (!document.getElementById('clear').disabled) {
        enableAndCalc(['n1CheckBox','Is1CheckBox','Rp1CheckBox','RsCheckBox']);
      }
      document.getElementById('varParams').disabled = false;
    }
    if (document.getElementById('series').checked) {
      enableAndCalc(['n2','slidern2','Is2','sliderIs2','Rp2','sliderRp2','series','parallel'])
      disableAndCalc(['IphCheckBox','TCheckBox','n1CheckBox','Is1CheckBox','Rp1CheckBox','Rp2CheckBox','RsCheckBox','n2CheckBox','Is2CheckBox']);
      document.getElementById('varParams').disabled = true;
    }
    
    calcIV(true);
    if (!document.getElementById('clear').disabled) { // <=> a experimental file has been opened
      fit.estimD1D2Rs(findDiodes());
    }
  }

  function useEstimatedParams(event) {
    // Fired when user clicks "Use estimated paameters" button
    $('td.estimation')
      .each(updateInput);
    
    const plot = true;
    calcIV(plot);
  }

  function updateInput(index, element) {
    // Update a parameter input with an estimation

    const $td = $(element),
      id = $td.attr('id'),
      value = parseFloat($td.text());
      
    $('input[type=number]#' + id)
      .val(value);
  }

  function startButtonClicked(event) {
    // Fired when user clicks on the play/pause button
    // to start or pause the fitting

    const start = $(this)
      .toggleClass('play pause')
      .hasClass('pause');

    fit.startPauseVary(start);
  }

  function disableAndCalc(arrayOfId) {
    for (var i = 0; i < arrayOfId.length; i++) {
      var e = document.getElementById(arrayOfId[i]);
      if (e) { //this is in case slider was removed because not supported by browser
        e.disabled = true;
      }
    }	
  }

  function enableAndCalc(arrayOfId) {
    //if (document.getElementById('series').checked) {arrayOfId.concat(['Rp2','sliderRp2']);}
    for (var i = 0; i < arrayOfId.length; i++) {
      var e = document.getElementById(arrayOfId[i]);
      if (e) { //this is in case slider was removed because not supported by browser
        e.disabled = false;
      }
    }
  }

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
    //log.innerHTML = log.innerHTML+V+'\t'+I+'<br>';
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
      
      var diffI = Ib - Ia;
      
      if (diffI > 0) {L = V1;}
        else {H = V1;}
      i++;
      
    } while (Math.abs(diffI) > mchEps && i < 500);
    return [Ia,Id1,Id2,Irp1,Irp2];
  }

  function calcIV(plot) {
    // Calculates current for a range of voltage values
    // "plot" parameter is a boolean

    const minVolt = parseFloat(document.getElementById('minVolt').value),
      maxVolt = parseFloat(document.getElementById('maxVolt').value),
      stepVolt = parseFloat(document.getElementById('stepVolt').value),
      Iph = parseFloat(document.getElementById('Iph').value),
      T = parseFloat(document.getElementById('T').value),
      n1 = parseFloat(document.getElementById('n1').value),
      Is1 = parseFloat(document.getElementById('is1').value);

    if (document.getElementById('singleDiode').checked) {
      var n2 = 1,
        Is2 = 0,
        Rp2;
    } else {
      var n2 = parseFloat(document.getElementById('n2').value),
        Is2 = parseFloat(document.getElementById('is2').value),
        Rp2 = parseFloat(document.getElementById('rp2').value);
    }
      
    var	Rp = parseFloat(document.getElementById('rp1').value),
      Rs = parseFloat(document.getElementById('rs').value);
      
    var Ipar,Iser,I,Id1,Id2,
      arrayVI = [],
      arrayJustV = [],
      arrayJustI = [],
      arrayJustSum = [],
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
      
    for (var V = minVolt; V <= maxVolt; V += stepVolt / 1000) {
      
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
      arrayVId1.push([V,Id1]);
      arrayVId2.push([V,Id2]);
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

    arrayCalc = modelCases[model].arrayCalc;
    plotStyle = modelCases[model].plotStyle;

    if (fileOpened) {
      // <=> a experimental file has been opened
      fit.calcSqResSum(userData.dataArray, arrayCalc);
      //fit.estimD1D2Rs();
    }

    if (plot) {
      const scaleIsLinear = document.getElementById('linear').checked;

      scale = (scaleIsLinear)? 'linearScale' : 'logScale';
        
      combDataAndCalc(/*arrayCalc, modelCases[model].plotStyle, scale*/);
    }
  }

  function processMultFiles(files) {
    
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
      document.getElementById('T').value = T;
      document.getElementById('sliderT').value = T;
      userData.dataArray = [];
      userData.modifDataArray = [];

      stringToArray(event.target.result);
    }
  }

  function clearData() {
    userData.dataArray = [];
    userData.modifDataArray = [];
    dataStyle = [];
    combDataAndCalc(/*arrayCalc,plotStyle, scale*/);
    document.getElementById('clear').disabled = true;
    var button = document.getElementById('removeIrp');
    button.value = 'Hide Irp';
    button.disabled = true;
    button = document.getElementById('removeNonLinCurr');
    button.value = 'Remove non-linear reverse current';
    button.disabled = true;
    if (window.localFile /* FF is picky about that: not importing the file through classic 'browse' button result in an error here */) {
      window.localFile.reset();
    }
    Rp = undefined;
    document.getElementById('squaredResSum').innerHTML = '';
    document.getElementById('paramEstim').innerHTML = '';
    document.getElementById('updateParams').style.visibility = 'hidden';
    document.getElementById('varParams').style.visibility = 'hidden';
    document.getElementById('threshold').style.visibility = 'hidden';
    document.getElementById('thresholdLabel').style.visibility = 'hidden';
    log.innerHTML = '';
    
    disableAndCalc(['IphCheckBox','TCheckBox','n1CheckBox','Is1CheckBox','Rp1CheckBox','Rp2CheckBox','RsCheckBox','n2CheckBox','Is2CheckBox']);
  }

  function stringToArray(data) {
    let array = data.split('\n'),
      row = [],
      skipRow,
    dataArray = [];
    for (var i = 0; i < array.length; i++) {
      skipRow = false;
      row = array[i].split('\t');
      for (var j = 0; j < 2; j++) {
        row[j] = Number(row[j]);
        skipRow += isNaN(row[j]);
      }
      if (!skipRow) {dataArray.push(row);}
    }
    
    $('.panel')
      .removeClass('nofile');
    
    fileOpened = true;

/*    document.getElementById('removeIrp').disabled = false;
    document.getElementById('removeNonLinCurr').disabled = false;
    document.getElementById('varParams').style.visibility = 'visible';
    document.getElementById('removeIrp').value = 'Hide Irp';
    document.getElementById('removeNonLinCurr').value = 'Remove non-linear reverse current';
    document.getElementById('threshold').style.visibility = 'visible';
    document.getElementById('thresholdLabel').style.visibility = 'visible';*/
    
    if (!document.getElementById('series').checked) {
      array = ['n1CheckBox','Is1CheckBox','Rp1CheckBox','RsCheckBox'];
      if (!document.getElementById('singleDiode').checked) {
        array = array.concat(['n2CheckBox','Is2CheckBox']);
      }
      enableAndCalc(array);		
    }
    
    dataStyle = [['verticalCross','purple','Data']];
    
    document.getElementById('minVolt').value = dataArray[0][0];
    document.getElementById('maxVolt').value = dataArray[dataArray.length - 1][0] + document.getElementById('stepVolt').value / 1000;

    dataArray = [dataArray];

    userData.dataArray = dataArray;
    userData.modifDataArray = dataArray;
    calcIV(false);
    
    /**** Estimate parameters ****/

    // Parallel resistance Rp
    const Rp = fit.estimRp(dataArray);
    userData.estimatedParameters.Rp = Rp;

    // Calculate Parallel current and non linear reverse current
    const current = fit.calcIrpAndNonLinRevCurr(dataArray, Rp);
    userData.current.nonLinear = current.nonLinear;
    userData.current.shunt = current.shunt;

    const findDiodesResult = fit.findDiodes(userData, IprShowed()),
      estimatedParams = fit.estimD1D2Rs(userData, findDiodesResult);

    userData.estimatedParams = estimatedParams;

    fit.calcSqResSum(dataArray, arrayCalc);

    document.getElementById('clear').disabled = false;

    combDataAndCalc(/*arrayCalc, plotStyle, scale*/);
  }

  function IprShowed() {
    return $('#hideIrp').hasClass('fa-toggle-off');
  }

  function combDataAndCalc(/*arrayCalc, plotStyle, scale*/) {
    drawGraph('graph', userData.modifDataArray.concat(arrayCalc), 0, dataStyle.concat(plotStyle), scale, 'V (V)', 'I (A)');
    //log.innerHTML = "caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{'));
    //log.scrollTop = log.scrollHeight;
  }

  return {
    calcIV: calcIV,
    combDataAndCalc: combDataAndCalc,
    k: k,
    mchEps: mchEps,
    q: q
  }
}();