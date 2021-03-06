'use strict';

import drawGraph from 'bobGraph';

// Use webpack loaders to copy needed files to docs directory
require('index.html');
require('index.css');
require('assets/samplefiles/T279K.txt');

// Immediately Invoked Function Expression
(function () {
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
      // Methods:
      init: initParameters,
      update: updateParameter
    },
    model = {};

  // Set parameter object's methods as non-enumerable so they
  // do not show up in a (for in) loop
  Object.defineProperty(parameters, 'init', { enumerable: false });
  Object.defineProperty(parameters, 'update', { enumerable: false });

  function initParameters() {
    // Used as a method by parameter object
    for (let property in this) {
      const $inputNumber = $('[type=number].' + property),
        $inputCheckBox = $('[type=checkbox].' + property);
      this[property] = {
        value: parseFloat($inputNumber.val()),
        checked: $inputCheckBox.is(':checked')
      };
    }
  }

  function updateParameter($element) {
    // Used as a method by parameter object
    for (let property in this) {
      if ($element.hasClass(property)) {
        const elementValue = parseFloat($element.val()),
          inputIsLogRange = $element.hasClass('logscale') && $element.attr('type') === 'range',
          newValue = (inputIsLogRange) ? Math.pow(10, elementValue) : elementValue;
        this[property] = {
          value: newValue,
          checked: $element.is(':checked')
        };
        break;
      }
    }
  }

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
    // When page is loaded

    $('input[type=radio].default')
      .attr('checked', true);

    clearFileInput();

    parameters.init();

    model = getModel();

    // Calculate a first time
    // IV using the initial parameters
    calcIVandPlot();

    bindEvents();
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
    // Could stop using this function with a transpiler
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
    let i = 0, I, f, df, r, Id1, Id2, Irp;

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
    let i = 0, Ia, Ib, V1, V2, Id1, Id2, Irp1, Irp2, H = 10, L = -10;

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
    };
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

    const nonLinearCurrent = userData.current.nonLinear;

    let array1 = userData.dataArray[0],
      array2 = userData.modifDataArray[0],
      IV2,
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
    };
  }

  let SqResSum,
    delS = [];

  function calcSqResSum(params, dataArray, arrayCalc) {
    // Calculates the sum of squared residuals

    let n1 = params.n1.value,
      Is1 = params.is1.value,
      Rp = params.rp1.value,
      Rs = params.rs.value,
      T = params.t.value,
      single = document.getElementById('singleDiode').checked,
      n2, Is2;

    SqResSum = 0;

    if (single) {
      // Single diode model
      Is2 = 0;
      n2 = 1;
    } else {
      // Dual diode model
      Is2 = params.is2.value;
      n2 = params.n2.value;
    }

    if (document.getElementById('series').checked) {
      // Dual, series diode model
      n1 = params.n1.value;
    }

    let r, calcI, j = 1, x1, x2, xy1, xy2, y1, y2, slope, x,
      calcIV = arrayCalc[0],
      array = dataArray[0],
      data,
      dSdn1 = 0,
      dSdn2 = 0,
      dSdIs1 = 0,
      dSdIs2 = 0,
      dSdRp = 0,
      dSdRs = 0;

    let dIdn1, dIdn2, dIdIs1, dIdIs2, dIdRp, dIdRs, exp1, exp2;

    for (let row of array) {
      // For each data point
      x = row[0];

      while (x > calcIV[j][0]) { j++; }
      xy1 = calcIV[j - 1];
      xy2 = calcIV[j];
      x1 = xy1[0];
      x2 = xy2[0];
      y1 = xy1[1];
      y2 = xy2[1];
      data = row[1];

      // Linear interpolation
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

    // 1st order derivative
    let array1 = deriv(lnOfArray(array));

    // 2nd order derivative
    array = deriv(array1);

    let i = array.length - 2,
      prev,
      dLn = array[i][1],
      dLnMin = 0,
      deltaLnMax = 0,
      j = 0;

    let avDelta = function (array) {
      var sum = 0,
        length = array.length;
      for (var i = 1; i < length; i++) {
        sum += Math.abs(array[i][1] - array[i - 1][1]);
      }
      return sum / (length - 1);
    };

    const avD = avDelta(array);

    var iMin = i,
      fluctIn2ndHalf = false;
    do {
      i = iMin;
      dLn = array[i][1];
      var maxPassed = false;
      do {
        // Looking for minima between 0.04 V and Vmax
        i--;
        prev = dLn;
        dLn = array[i][1];

        fluctIn2ndHalf += Math.abs(dLn - prev) > avD && i < array.length / 2;
        maxPassed += prev > dLn && Math.abs(dLn - prev) < avD;
        var carryOn = !maxPassed || dLn < prev;
      } while (i >= 0 && array[i][0] > 0.04 && carryOn && !fluctIn2ndHalf);

      iMin = i + 1;
      dLnMin = prev;

      let dLnMax = dLnMin;

      prev = -Infinity;
      i = iMin - 1;
      var iMax = iMin;

      while (i >= 0 && array[i][0] > 0.04) {
        // Looking for a maxima between 0.04 V and Vmax
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
    } while (iMax != iMin && j < 10 && !fluctIn2ndHalf);

    if (!iMaxMax) {
      return 'noDiode';
    }

    i = iMax = iMaxMax;
    dLn = array[i][1];
    do {
      prev = dLn;
      i--;
      dLn = array[i][1];
    } while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0);

    let iD1 = i + 2,
      D1dLn = array1[iD1 + 1][1];

    i = iMax;

    do {
      prev = dLn;
      i++;
      dLn = array[i][1];
    } while (Math.abs(dLn) < Math.abs(prev) || dLn >= 0);

    let iD2 = i - 1,
      D2dLn = array1[iD2 + 1][1];

    const length = array.length - 2;

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
      n2 = A / D2dLn,
      n, n1, Is1, Rs, Is2;

    if (dualDiode) {
      if (paramChecked.n2) {
        n = n2;
      } else {
        n = n2 = paramValues.n2;
      }
      if (paramChecked.n1) {
        n1 = A / D1dLn;
      } else {
        n1 = paramValues.n1;
      }
      if (paramChecked.is1) {
        Is1 = VIAtd1[1] / (Math.exp((VIAtd1[0] * A / n1) - 1));
      } else {
        Is1 = paramValues.is1;
      }
    } else {
      // Single diode
      n = n2;
    }

    if (paramChecked.rs) {
      Rs = estimRs(array, T, n);
    } else {
      Rs = paramValues.rs;
    }

    if (paramChecked.is2) {
      Is2 = VIAtd2[1] / (Math.exp((VIAtd2[0] - VIAtd2[1] * Rs) * A / n2) - 1);
    } else {
      Is2 = paramValues.is2;
    }

    let newRp;

    if (paramChecked.rp1) {
      newRp = userData.estimatedParameters.Rp;
    } else {
      newRp = paramValues.rp1;
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
    } while (C > dIdVati);

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

      parameters.update($(element));
    }

    const ivResult = calcIV(parameters, getModel());

    arrayCalc = ivResult.arrayCalc;
    plotStyle = ivResult.plotStyle;

    calcSqResSum(parameters, userData.dataArray, arrayCalc);
  }

  function vary() {
    // Varies checked diode parameters until
    // sum of square residuals is minimized

    const eps = mchEps;

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

        if (typeof S === 'number') {
          $('#ds').text(dS.toExponential(2));
        } else {
          $('#ds').empty();
        }

        const threshold = document.getElementById('threshold').value,
          fitSuccessful = Math.abs(dS) < threshold;

        if (fitSuccessful || ii > 1000 || stop) {
          if (fitSuccessful) {
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
          // No use to plot: the page is not visible (Webkit only)
        } else {
          combDataAndCalc(/*arrayCalc, plotStyle, scale*/);
        }
      }
      , 1);
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
})();