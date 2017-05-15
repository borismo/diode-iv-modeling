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
    parameters = undefined;

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

    parameters = initParameters();

    // When page loaded, calculate a first time
    // IV using the initial parameters, and plot
    // the result
    const plot = true;
    calcIV(plot);

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

  function initParameters() {
    let params = {
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
      rs: undefined
    };

    for (let property in params) {
      const $inputNumber = $('[type=number].' + property),
        $inputCheckBox = $('[type=checkbox].' + property);
      params[property] = {
        value: Number($inputNumber.val()),
        checked: $inputCheckBox.is(':checked')
      };
    }
    return params;
  }

  function bindEvents() {
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
    calcIV(true);
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
      calcIV(true);
    }
  }

  function fileInputChanged(event) {
    const file = this.files[0];
    $(this)
      .closest('.input-group')
      .children('input:text')
      .val(file.name);
    processFiles(file);
  }

  function faToggleClicked(event) {
    const iElem = this; // <i> element

    $(iElem)
      .toggleClass('fa-toggle-on fa-toggle-off');

    if (iElem.id === 'hideIrp') {
      userData.modifDataArray = fit.toggleIrp(userData.modifDataArray, userData.current.shunt, IprShowed());
      combDataAndCalc();
    }

    if (iElem.id === 'hideNonLinCurr') {
      const toggleResult = fit.toggleNonLinCurr(userData, userData.modifDataArray, nonLinearCurrentShowed());
      userData.dataArray = toggleResult.dataArray
      userData.modifDataArray = toggleResult.modifDataArray
      combDataAndCalc();
    }
  }

  function parameterCheckBoxChanged(event) {
    findAndEstimateDiodes();
  }

  function syncInputs(sourceElem) {
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
    // fired when user moves range input or change number input
    // So "this" is a number or range input element

    const isNumberInput = $(this).attr('type') === 'number';

    if (isNumberInput) {
      adjustRange(this);
    }

    syncInputs(this);
    calcIV(true);
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

  function remDecimals(model, number) {
    var nbDecimals = nbAfterDot(model);
    return Math.round(number * Math.pow(10, nbDecimals)) * Math.pow(10, -nbDecimals);
  }

  function nbDecimals(number) {
    var i = -1;
    while (number != 0) {
      i++;
      number = Math.round(1e8 * (number - Math.floor(number))) * 1e-7;
    }

    return i;
  }

  function nbAfterDot(number) {
    var n = number.toString().indexOf('.');
    if (n == -1) {
      return 0;
    }
    else {
      var i = 0;
      while (number.charAt(n + 1 + i) != '' && isFinite(number.charAt(n + 1 + i))) {
        i++;
      }
    }
    return i;
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

  function SyncSlidernBox(element, recalculate) {
    //alert("caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{')));
    //log.innerHTML += [element.id,recalculate]+'<br>';

    if (element.id.indexOf('slider') == -1) {//box changed
      var sliderChanged = false;

      var elToSync = document.getElementById('slider' + element.id);
      //round
      // var val = parseFloat(element.value),
      // oOO = orderOfMagn(val);
      // if (element.className.indexOf('LogScale') != -1){element.step = oOO / 100;}
      // var	precision = Math.round(-log10(element.step / oOO) + 1);
      // if (!isFinite(precision)) {precision = 3};
      // val = parseFloat(val.toPrecision(precision));

      if (adjustRange(element, false)) { var time = 100 } else { var time = 0 }
      setTimeout(function () {// setTimeOut needed for Opera, otherwise value is not updated when range input's max and min modified
        if (element.className.indexOf('LogScale') != -1) {//Are we dealing with a Log Scale?
          elToSync.value = log10(element.value);
          //element.value = val.toExponential(precision - 1);
        } else {
          elToSync.value = element.value;
        }
      }, time);
    } else {
      // Range input changed
      var sliderChanged = true,
        elToSync = document.getElementById(element.id.replace('slider', ''));
      if (element.className.indexOf('LogScale') == -1) {//Linear Scale?
        elToSync.value = element.value;
      } else {
        elToSync.value = Math.pow(10, element.value).toExponential(2);
      }
    }

    if (recalculate) {
      calcIV(true);
      if (!document.getElementById('clear').disabled && element.id.indexOf('T') != -1) { // <=> T has been changed and a experimental file is opened
        fit.estimD1D2Rs(getAllParams(), fit.findDiodes());
      }
    }
  }

  function changeModel(event) {
    // Fired when user changes number of diodes or the equivalent circuit

    if (document.getElementById('parallel').checked) {
      disableAndCalc(['rp2', 'sliderRp2']);
      var array = ['n2', 'slidern2', 'is2', 'sliderIs2', 'series', 'parallel'];

      if (fileOpened) {
        array = array.concat(['n1CheckBox', 'Is1CheckBox', 'Rp1CheckBox', 'RsCheckBox', 'n2CheckBox', 'Is2CheckBox']);
      }
      enableAndCalc(array);
    }

    if (document.getElementById('singleDiode').checked) {
      document.getElementById('series').checked = false;
      document.getElementById('parallel').checked = true;
      disableAndCalc(['n2', 'slidern2', 'is2', 'sliderIs2', 'rp2', 'sliderRp2', 'series', 'parallel', 'n2CheckBox', 'Is2CheckBox']);
      if (!document.getElementById('clear').disabled) {
        enableAndCalc(['n1CheckBox', 'Is1CheckBox', 'Rp1CheckBox', 'RsCheckBox']);
      }
      document.getElementById('start').disabled = false;
    }
    if (document.getElementById('series').checked) {
      enableAndCalc(['n2', 'slidern2', 'is2', 'sliderIs2', 'rp2', 'sliderRp2', 'series', 'parallel'])
      disableAndCalc(['IphCheckBox', 'TCheckBox', 'n1CheckBox', 'Is1CheckBox', 'Rp1CheckBox', 'Rp2CheckBox', 'RsCheckBox', 'n2CheckBox', 'Is2CheckBox']);
      document.getElementById('start').disabled = true;
    }

    calcIV(true);

    if (fileOpened) {
      findAndEstimateDiodes();

      fit.calcSqResSum(getAllParams(), userData.dataArray, arrayCalc);
    }
  }

  function findAndEstimateDiodes() {
    const findDiodesResult = fit.findDiodes(userData, IprShowed(), nonLinearCurrentShowed()),
      estimatedParams = fit.estimD1D2Rs(getAllParams(), userData, findDiodesResult);
      
    displayEstimatedParams(estimatedParams);
  }

  function displayEstimatedParams(estimatedParams) {
    // Display the result of fit.estimD1D2Rs into
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
    // Fired when user clicks "Use estimated paameters" button
    $('td.estimation')
      .each(updateInput);

    syncAllInputs();

    const plot = true;
    calcIV(plot);
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

  function startButtonClicked(event) {
    // Fired when user clicks on the play/pause button
    // to start or pause the fitting

    const start = $(this)
      .hasClass('play');

    togglePlayButton();

    fit.startPauseVary(start);
  }

  function togglePlayButton() {
    $('#start')
      .toggleClass('play pause');
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

  // Functions that calculate the current at a given voltage
  // double diode (in parallel) model
  function Iparallel(V, Iph, prevI, T, n1, n2, Is1, Is2, Rp, Rs) {
    var i = 0, I, f, df, r, Id1, Id2, Irp;
    Iph = Iph / 1000 // mA -> A
    if (!prevI) {
      I = Iph; prevI = I;
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

    } while (Math.abs(I - prevI) > mchEps && i < 500)

    return [I, Id1, Id2, Irp, Id1 + Id2 + Irp];
  };
  // Double diode (in series) model
  function Iseries(V, T, Iph, n1, n2, Is1, Is2, Rp1, Rp2, Rs) {
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

  function calcIV(paramsValues) {
    // Calculates current for a range of voltage values

    const minVolt = parseFloat(document.getElementById('minVolt').value),
      maxVolt = parseFloat(document.getElementById('maxVolt').value),
      stepVolt = parseFloat(document.getElementById('stepVolt').value),
      Iph = getParamValue('iph'),
      T = parseFloat($('input[type=number].t').val()),
      n1 = parseFloat($('input[type=number].n1').val()),
      Is1 = parseFloat($('input[type=number].is1').val());
    
    let n2 = parseFloat($('input[type=number].n2').val()),
      Is2 = parseFloat($('input[type=number].is2').val()),
      Rp2 = parseFloat($('input[type=number].rp2').val());

    if (document.getElementById('singleDiode').checked) {
      n2 = 1;
      Is2 = 0;
      Rp2;
    }

    var Rp = parseFloat($('input[type=number].rp1').val()),
      Rs = parseFloat($('input[type=number].rs').val());

    var Ipar, Iser, I, Id1, Id2,
      arrayVI = [],
      arrayJustV = [],
      arrayJustI = [],
      arrayJustSum = [],
      arrayVId1 = [],
      arrayVId2 = [],
      arrayVIrp1 = [],
      arrayVIrp2 = [];

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

    arrayCalc = modelCases[model].arrayCalc;
    plotStyle = modelCases[model].plotStyle;

    if (fileOpened) {
      fit.calcSqResSum(getAllParams(), userData.dataArray, arrayCalc);
    }

    if (plot) {

      combDataAndCalc();
    }
  }

  function scaleType() {
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

    disableAndCalc(['IphCheckBox', 'TCheckBox', 'n1CheckBox', 'Is1CheckBox', 'Rp1CheckBox', 'Rp2CheckBox', 'RsCheckBox', 'n2CheckBox', 'Is2CheckBox']);
  }

  function clearFileInput() {
    $('input[type=file]')
      .val(null)
      .closest('div')
      .children('input[type=text]')
      .val('');
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
      if (!skipRow) {
        dataArray.push(row);
      }
    }

    $('.panel')
      .removeClass('nofile');

    fileOpened = true;

    if (!document.getElementById('series').checked) {
      array = ['n1CheckBox', 'Is1CheckBox', 'Rp1CheckBox', 'RsCheckBox'];
      if (!document.getElementById('singleDiode').checked) {
        array = array.concat(['n2CheckBox', 'Is2CheckBox']);
      }
      enableAndCalc(array);
    }

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

    findAndEstimateDiodes();

    fit.calcSqResSum(getAllParams(), dataArray, arrayCalc);

    combDataAndCalc();
  }

  function IprShowed() {
    return $('#hideIrp').hasClass('fa-toggle-off');
  }

  function nonLinearCurrentShowed() {
    return $('#hideNonLinCurr').hasClass('fa-toggle-off');
  }

  function combDataAndCalc() {
    const canvasID = 'graph',
      data = userData.modifDataArray.concat(arrayCalc),
      primaryPlotIndex = 0,
      dataStyle = [['verticalCross', 'purple', 'Data']],
      xTitle = 'V (V)',
      yTitle = 'I (A)';

      if (fileOpened) {
        const dataStyle = [['verticalCross', 'purple', 'Data']];
        var style = dataStyle.concat(plotStyle);
      } else {
        var style = plotStyle;
      }
      
    drawGraph(canvasID, data, primaryPlotIndex, style, scaleType(), xTitle, yTitle);
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

  return {
    calcIV: calcIV,
    combDataAndCalc: combDataAndCalc,
    getAllParams: getAllParams,
    k: k,
    mchEps: mchEps,
    q: q,
    syncAllInputs: syncAllInputs,
    tableSuccessContext: tableSuccessContext,
    togglePlayButton: togglePlayButton
  };
}();