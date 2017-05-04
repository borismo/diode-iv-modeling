let main = function () {
  'use strict';

  let log;

  let mchEps = machineEpsilon();

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
  
  function syncSlidernboxReCalc(event) {
    let element = this,
      id = element.id;
    SyncSlidernBox(element, true);
    id = id.replace('slider', '');
    if (!document.getElementById(id + 'CheckBox').checked && !document.getElementById('clear').disabled) {
      estimD1D2Rs(findDiodes());
    }
  }

  function syncSlidernboxNoCalc(e) {
    var element = e.target;
    SyncSlidernBox(element,false);
  }
  
  $(function () {
    log = document.getElementById('logDiv');
    log.innerHTML = '';
  
    calcIV(true);
    
    var unsupported = [];
    
    //Check if File API supported
    if (typeof FileReader === 'undefined') {
      unsupported.push('File API');
      document.getElementById('fileInput').disabled = true;
      var string = 'import your own data and ',
        fileAPI = false;
    } 	else {
        var string = '',
          fileAPI = true;
        log.innerHTML += 'You can import your own IV data (text file with 2 tab-separated columns) with the button above or simply by dragging and dropping the file onto the graph.<br>'
      }
    
    if (unsupported.length) {
      var str = unsupported.join(', '),
        string = '';
      log.innerHTML += "Your browser doesn't seem to support some of the HTML5 standards ("+str+"). Upgrade to <a class='orange' href='http://www.opera.com/browser/' target='_blank'>Opera</a> or <a class='orange' href='https://www.google.com/intl/en/chrome/browser/' target='_blank'>Chrome</a> to be able to "+string+"play with the parameters more easily. But you're still welcome to have a look around.<br>If your administrator doesn't allow you to change your browser, you can head to the portable versions (<a class='orange' href='http://www.opera-usb.com/operausben.htm' target='_blank'>Opera@USB</a> and <a class='orange' href='http://portableapps.com/apps/internet/google_chrome_portable' target='_blank'>Chrome Portable</a>).<br>";
    }
    
    log.innerHTML += "<br><span style='color:cyan'>Tip: </span>Check the box next to a parameter's value to let it vary during optimization. <br>";
    
    //Opera fix: nicely rounds initial Is1 and Is2
      var	id = ['Is1', 'n1', 'n2', 'Is2', 'threshold', 'Rs', 'Rp', 'Rp2'];
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
      .change(changeModel)
      
    id = ['linear','log'];
    for (var i = 0; i < id.length; i++) {
      var el = document.getElementById(id[i]);
      el.addEventListener('change',function(e){
                      calcIV(true);
                    }, false);
    }
    
    id = ['TCheckBox','IphCheckBox','n1CheckBox','n2CheckBox','Is1CheckBox','Is2CheckBox','Rp1CheckBox','Rp2CheckBox','RsCheckBox'];
    for (var i = 0; i < id.length; i++) {
      var el = document.getElementById(id[i]);
      el.addEventListener('change',function(e){
                      if (!document.getElementById('clear').disabled) { // <=> a experimental file has been opened
                        estimD1D2Rs(findDiodes());
                      }
                    }, false);
    }
    
    if (fileAPI) {
    
      var el = document.getElementById('fileInput');
      el.addEventListener('change',	function(e){
                        var files = e.target.files;
                        if (files.length > 1) {processMultFiles(files);}
                          else {processFiles(files);}
                      }, false);

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
    }
  });

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

    function syncInputs (sourceElem) {
      const $sourceInput = $(sourceElem),
        isSourceRange = $sourceInput.attr('type') === 'range',
        sourceValue = $sourceInput.val();
      
      // Sync companion input
      const $targetInput = $sourceInput
          .siblings('input.syncme'),
        isScaleLog = $targetInput.hasClass('logscale');
      
      if(isScaleLog) {
        const targetValue = (isSourceRange)? Math.pow(10, sourceValue).toExponential(2) : log10(sourceValue);
        $targetInput.val(targetValue);
      } else {
        // Linear scale
        $targetInput.val(sourceValue);
      }
    }

    function inputEvent(event){
      if ($(this).attr('type') === 'number'){
        adjustRange(this);
      }
      syncInputs (this);
      calcIV(true);
    }

  function checkVoltageAndCalc (event) {
    
    var minVolt = document.getElementById('minVolt').value,
      maxVolt = document.getElementById('maxVolt').value,
      stepVolt = document.getElementById('stepVolt').value;
      
    if (maxVolt < minVolt) {
      document.getElementById('minVolt').value = maxVolt;
      document.getElementById('maxVolt').value = minVolt;
    }
    
    if (stepVolt == 0) {document.getElementById('stepVolt').value = 25;}
    
    if (stepVolt < 0) {document.getElementById('stepVolt').value = Math.abs(stepVolt);}
    
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

  function adjustRangebac(elementToChange,changedElement) {
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
        estimD1D2Rs(findDiodes());
      }
    }
  }

  function SyncSlidernBoxbac(changedElement,elementToChange,recalculate) {
    var sliderChanged = true,
      formObject = document.forms['currentCalculation'],
      element1 = formObject.elements[elementToChange],
      element2 = formObject.elements[changedElement];
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

    if (recalculate) {
      calcIV(true);
      if (!document.getElementById('clear').disabled && changedElement.indexOf('T') != -1) { // <=> a experimental file has been opened
        estimD1D2Rs(findDiodes());
      }
    }
  }

  function changeModel(event) {
    if (document.getElementById('parallel').checked) {
      disableAndCalc(['Rp2','sliderRp2']);
      document.getElementById('Rp2label').style = 'color:grey';
      var array = ['n2','slidern2','Is2','sliderIs2','series','parallel'];
      if (!document.getElementById('clear').disabled) {
        array = array.concat(['n1CheckBox','Is1CheckBox','Rp1CheckBox','RsCheckBox','n2CheckBox','Is2CheckBox']);
      }
      enableAndCalc(array)
      document.getElementById('n2label').style = 'color:black';
      document.getElementById('Is2label').style = 'color:black';
      document.getElementById('seriesLabel').style = 'color:black';
      document.getElementById('parallelLabel').style = 'color:black';
      document.getElementById('varParams').disabled = false;
    }
    if (document.getElementById('singleDiode').checked) {
      document.getElementById('series').checked = false;
      document.getElementById('parallel').checked = true;
      disableAndCalc(['n2','slidern2','Is2','sliderIs2','Rp2','sliderRp2','series','parallel','n2CheckBox','Is2CheckBox']);
      if (!document.getElementById('clear').disabled) {
        enableAndCalc(['n1CheckBox','Is1CheckBox','Rp1CheckBox','RsCheckBox']);
      }
      document.getElementById('Rp2label').style = 'color:grey';
      document.getElementById('n2label').style = 'color:grey';
      document.getElementById('Is2label').style = 'color:grey';
      document.getElementById('seriesLabel').style = 'color:grey';
      document.getElementById('parallelLabel').style = 'color:grey';
      document.getElementById('varParams').disabled = false;
    }
    if (document.getElementById('series').checked) {
      enableAndCalc(['n2','slidern2','Is2','sliderIs2','Rp2','sliderRp2','series','parallel'])
      disableAndCalc(['IphCheckBox','TCheckBox','n1CheckBox','Is1CheckBox','Rp1CheckBox','Rp2CheckBox','RsCheckBox','n2CheckBox','Is2CheckBox']);
      document.getElementById('Rp2label').style = 'color:black';
      document.getElementById('varParams').disabled = true;
    }
    
    calcIV(true);
    if (!document.getElementById('clear').disabled) { // <=> a experimental file has been opened
      estimD1D2Rs(findDiodes());
    }
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

  // elementary charge and Boltzmann constant
  var q = 1.60217653E-19,
    k = 1.3806488E-23;

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
      
      diffI = Ib - Ia;
      
      if (diffI > 0) {L = V1;}
        else {H = V1;}
      i++;
      
    } while (Math.abs(diffI) > mchEps && i < 500);
    return [Ia,Id1,Id2,Irp1,Irp2];
  }

  //Calculate current for a range of voltage values
  function calcIV(plot) {
    //alert("caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{')));
    
    var	minVolt 	= parseFloat(document.getElementById('minVolt').value),
      maxVolt 	= parseFloat(document.getElementById('maxVolt').value),
      stepVolt 	= parseFloat(document.getElementById('stepVolt').value),
      Iph 		= parseFloat(document.getElementById('Iph').value),
      T			= parseFloat(document.getElementById('T').value),
      n1 			= parseFloat(document.getElementById('n1').value),
      Is1 		= parseFloat(document.getElementById('Is1').value);
      //log.innerHTML += T+' K calc<br>';
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
        arrayCalc: [arrayVI,arrayVId1,arrayVId2,arrayVIrp1],
        plotStyle: [['line','black','I'],['line','orange','Id1'],['line','orange','Id2'],['line','purple','Irp']]
      },
      single: {
        arrayCalc: [arrayVI,arrayVId1,arrayVIrp1],
        plotStyle: [['line','black','I'],['line','orange','Id1'],['line','purple','Irp']]
      },
      series: {
        arrayCalc: [arrayVI,arrayVId1,arrayVId2,arrayVIrp1,arrayVIrp1],
        plotStyle: [['line','black','I'],['line','orange','Id1'],['line','orange','Id2'],['line','purple','Irp1'],['line','purple','Irp2']]
      }
    };

    if (!document.getElementById('clear').disabled) { // <=> a experimental file has been opened
      calcSqResSum();
      //estimD1D2Rs();
    }
    if (plot) {
      const scaleIsLinear = document.getElementById('linear').checked,
        scale = (scaleIsLinear)? 'linearScale' : 'logScale';
        
      combDataAndCalc(modelCases[model].arrayCalc, modelCases[model].plotStyle, scale);
    }
  }

  function processMultFiles(files) {
    
  }

  function processFiles(files) {
    var file = files[0],
      fileName, defaultT,
      reader = new FileReader();
      reader.onload = function (e) {
      // When this event fires, the data is ready.
      
      //Guess T from file name
      // fileName = escape(file.name);
      fileName = file.name;
      //alert(fileName);
      while (isNaN(parseFloat(fileName)) && fileName.length > 0) {fileName = fileName.substring(1);}
      fileName = parseFloat(fileName);
      if (isNaN(fileName)) {defaultT = 298} else {defaultT = fileName;}
      
      var T = prompt('Temperature? (K)',defaultT);
      if (isFinite(T) && T > 0) {
        document.getElementById('T').value = T;
        document.getElementById('sliderT').value = T;
        dataArray = [];
        modifDataArray = [];
    
        stringToArray(e.target.result);
      }
    }
    reader.readAsText(file);
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
    var array = data.split('\n'),
      row = [],
      skipRow;
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
    
    document.getElementById('removeIrp').disabled = false;
    document.getElementById('removeNonLinCurr').disabled = false;
    document.getElementById('varParams').style.visibility = 'visible';
    document.getElementById('removeIrp').value = 'Hide Irp';
    document.getElementById('removeNonLinCurr').value = 'Remove non-linear reverse current';
    document.getElementById('threshold').style.visibility = 'visible';
    document.getElementById('thresholdLabel').style.visibility = 'visible';
    
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
    calcIV(false);

    dataArray = [dataArray];
    modifDataArray = dataArray;
    
    estimRp();
    
    estimD1D2Rs(findDiodes());
    calcSqResSum();
    document.getElementById('clear').disabled = false;
    combDataAndCalc(arrayCalc,plotStyle,scale);
  }

  function combDataAndCalc(arrayCalc,plotStyle,scale) {
    drawGraph('graph',modifDataArray.concat(arrayCalc),0,dataStyle.concat(plotStyle),scale,'V (V)','I (A)');
    //log.innerHTML = "caller is " + arguments.callee.caller.toString().slice(0,arguments.callee.caller.toString().indexOf('{'));
    //log.scrollTop = log.scrollHeight;
  }
}();