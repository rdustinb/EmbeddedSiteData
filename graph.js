// Calculation Functions
function calculateMinMax(_Array, origMax, origMin){
  var _Min = origMin;
  var _Max = origMax;

  for(var LwaterMark=0; LwaterMark<_Array.length; LwaterMark++){
    if(_Array[LwaterMark] < _Min) _Min = _Array[LwaterMark];
    if(_Array[LwaterMark] > _Max) _Max = _Array[LwaterMark];
  }
  return [_Max, _Min];
}

function genRandomSensor(_Max, _Min){
  return Math.floor(Math.random() * (_Max - _Min) + _Min);
}

function genTestData(){
  for(var Lroom in __systemData){
    for(var Lsensor in __systemData[Lroom]){
      if(Lsensor == "temperature"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(72,68);
        }
      }else if(Lsensor == "humidity"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(42,35);
        }
      }else if(Lsensor == "barometric"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(1060,1000);
        }
      }else if(Lsensor == "uv"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(9,4);
        }
      }else if(Lsensor == "airquality"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(75,25);
        }
      }
    }
  }
}

// Drawing Functions
function drawSensorWidget(_ctx,_Sensor,_widgetWidth,_widgetHeight){
  var maxMultiplier = 0.70;
  var curveThickDividerLarge = 80;
  var curveThickDividerSmall = 300;
  var sensorLabels = {
    "temperature": "Temperature",
    "humidity":    "Humidity",
    "barometric":  "Pressure",
    "uv":          "UV Index",
    "airquality":  "Air Quality"
  };
  var colors = {
    "temperature": '#bb4422',
    "humidity":    '#2244bb',
    "barometric":  '#8888dd',
    "uv":          '#999999',
    "airquality":  '#999999'
  };
  var trendColors = {
    "temperature": '#dd8866',
    "humidity":    '#6688dd',
    "barometric":  '#ccccff',
    "uv":          '#888833',
    "airquality":  '#bb44bb'
  };
  var limitColors = ['#229922','#bbbb00','#bb6600','#bb0000','#900090','#800000'];
  var multiplier = {
    "uv":          [1.0,0.80,0.56,0.40,0.24,0.0],
    "airquality":  [1.0,0.90,0.80,0.70,0.60,0.40,0.0]
  };
  var hiLow = {
    "temperature": {"hi": 80,   "lo": 50},
    "humidity":    {"hi": 70,   "lo": 5},
    "barometric":  {"hi": 1100, "lo": 950},
    "uv":          {"hi": 13,   "lo": 0},
    "airquality":  {"hi": 500,  "lo": 0}
  };
  var scaleCount = {
    "temperature": 1,
    "humidity":    1,
    "barometric":  1,
    "uv":          5, // 1-2 ; 3-5 ; 6-7 ; 8-10 ; 11+
    "airquality":  6, // 0-50 ; 51-100 ; 101-150 ; 151-200 ; 201-300 ; 301-500
  };
  var trendLimits = {
    "temperature": {"downquick": -3,   "downslow": -1,   "upslow": 1,   "upquick": 3},
    "humidity":    {"downquick": -3,   "downslow": -1,   "upslow": 1,   "upquick": 3},
    "barometric":  {"downquick": -3.6, "downslow": -1.5, "upslow": 1.5, "upquick": 3.6},
    "uv":          {"downquick": -2,   "downslow": -1,   "upslow": 1,   "upquick": 2},
    "airquality":  {"downquick": -5,   "downslow": -2,   "upslow": 2,   "upquick": 5}
  };
  var positionNumbers = {
    "temperature": [0.85, 0.86, 0.31, 0.99, 0.29, 0.95],
    "humidity":    [0.77, 0.78, 0.59, 0.99, 0.57, 0.95],
    "barometric":  [0.69, 0.70, 0.21, 0.79, 0.19, 0.75],
    "uv":          [0.61, 0.62, 0.69, 0.79, 0.67, 0.75],
    "airquality":  [0.53, 0.54, 0.46, 0.59, 0.44, 0.55]
    //"temperature": [0.85, 0.86, 0.34, 0.99, 0.32, 0.95],
    //"humidity":    [0.75, 0.76, 0.56, 0.99, 0.54, 0.95],
    //"barometric":  [0.65, 0.66, 0.24, 0.79, 0.22, 0.75],
    //"uv":          [0.55, 0.56, 0.66, 0.79, 0.64, 0.75],
    //"airquality":  [0.45, 0.46, 0.46, 0.59, 0.44, 0.55]
  };
  var currentCharacter = {
    "temperature": "°",
    "humidity":    "%",
    "barometric":  "mbar",
    "uv":          "idx",
    "airquality":  "ppm"
  };
  var enableDraw = {
    // Current value curve, sample trend curve, scale curve, current value number, trend arrow
    "temperature": [1, 1, 0, 1, 0, 1, 1],
    "humidity":    [1, 1, 0, 1, 0, 1, 1],
    "barometric":  [1, 1, 0, 0, 0, 0, 0],
    "uv":          [1, 0, 1, 0, 1, 0, 0],
    "airquality":  [1, 0, 1, 0, 1, 0, 0]
  };

  for(var dictKey in _Sensor){
    if(dictKey == "label")
      continue;
    if(enableDraw[dictKey][0] == 1)
      drawSensorLabel(
        _ctx,
        _widgetHeight*positionNumbers[dictKey][0],
        _widgetWidth,
        _widgetHeight,
        sensorLabels[dictKey],
        maxMultiplier,
        curveThickDividerLarge
      );
    // Draw the curve for the current value, scaled from left to right according to the limits in hiLow
    if(enableDraw[dictKey][1] == 1)
      drawCurrentCurve(
        _ctx,
        _Sensor[dictKey],
        colors[dictKey],
        _widgetHeight*positionNumbers[dictKey][0],
        _widgetWidth,
        _widgetHeight,
        hiLow[dictKey]["hi"],
        hiLow[dictKey]["lo"],
        maxMultiplier,
        curveThickDividerLarge
      );
    // Draw the curve for the current value which is color according to the limits
    if(enableDraw[dictKey][2] == 1)
      drawCurrentCurveColoredByLimits(
        _ctx,
        _Sensor[dictKey],
        _widgetHeight*positionNumbers[dictKey][0],
        _widgetWidth,
        _widgetHeight,
        hiLow[dictKey]["hi"],
        hiLow[dictKey]["lo"],
        multiplier[dictKey],
        limitColors,
        maxMultiplier,
        curveThickDividerLarge
      );
    // Draw the trend of this sensor over the last 50 stored values
    if(enableDraw[dictKey][3] == 1)
      drawSensorTrend(
        _ctx,
        _Sensor[dictKey],
        trendColors[dictKey],
        _widgetHeight*positionNumbers[dictKey][1],
        _widgetWidth,
        _widgetHeight,
        hiLow[dictKey]["hi"],
        hiLow[dictKey]["lo"],
        maxMultiplier,
        curveThickDividerSmall
      );
    // Draw the scale curve
    if(enableDraw[dictKey][4] == 1)
      drawScaleCurve(
        _ctx,
        _widgetHeight*positionNumbers[dictKey][1],
        _widgetWidth,
        _widgetHeight,
        multiplier[dictKey],
        limitColors,
        maxMultiplier,
        curveThickDividerSmall
      );
    // Print the current value as a number with a special character
    if(enableDraw[dictKey][5] == 1)
      drawCurrentData(
        _ctx,
        _Sensor[dictKey],
        _widgetWidth,
        _widgetWidth*positionNumbers[dictKey][2],
        _widgetHeight*positionNumbers[dictKey][3],
        currentCharacter[dictKey]
      );
    // Draw the trend arrow for the current sensor and historic data stored
    if(enableDraw[dictKey][6] == 1)
      drawTrendArrow(
        _ctx,
        _Sensor[dictKey],
        _widgetWidth,
        _widgetWidth*positionNumbers[dictKey][4],
        _widgetHeight*positionNumbers[dictKey][5],
        trendLimits[dictKey]["downquick"],
        trendLimits[dictKey]["downslow"],
        trendLimits[dictKey]["upslow"],
        trendLimits[dictKey]["upquick"]
      );
  }
}

function drawSensorLabel(_ctx,_box,_width,_height,_label,_maxMultiplier,_thickDivider){
  var _thickness = _width/_thickDivider;
  var textAngle = (Math.PI-(Math.PI*_maxMultiplier));
  var rotateAngle = (Math.PI-(Math.PI*_maxMultiplier))-(Math.PI/2);
  // This is the location of the end of the curve of the sensor
  var _x = (_width/2)-_box*Math.cos(Math.PI-(Math.PI*_maxMultiplier));
  var _y = _height-Math.sin(Math.PI-(Math.PI*_maxMultiplier))*_box;
  // Now create a right triangle of height and width based on the length
  // of the string to be displayed and it also has to do with the angle
  // of the curve we are labeling.
  //                ....
  //             ....
  //             t .right angle between transverse plane of text and
  //           x .   . curve
  //         e   .     .
  //       TX.....       . C Angle
  //        |  ____________.X___________
  //   C Angle - PI/2
  // x = length = Text Length * cos(C Angle - PI/2)
  // y = height = Text Length * sin(C Angle - PI/2)
  var _translateX = ((_label.length+1)*_width/61) * Math.sin(textAngle);
  var _translateY = ((_label.length+1)*_width/61) * Math.cos(textAngle);
  // Next we need to adjust for the thickness of the curve we are trying to align to
  //               .   
  //              |  . Thickness
  //              |    .
  //              |______X   C Angle
  //
  // X Additive Offset = sin(C)*Thickness
  // Y Additive Offset = cos(C)*Thickness
  var _thicknessXAdditive = _thickness * Math.sin(textAngle);
  var _thicknessYAdditive = _thickness * Math.cos(textAngle);
  // Now combine the original location and the translation due to the
  // text length
  var _x = _x - _translateX + _thicknessXAdditive;
  var _y = _y + _translateY + _thicknessYAdditive;
  // Display the Current Value
  _ctx.font = (_width/40)+"px Courier";
  _ctx.fillStyle = '#999999';
  _ctx.translate(_x, _y);
  _ctx.rotate(rotateAngle);
  _ctx.fillText(_label, 0, 0);
  _ctx.rotate(-rotateAngle);
  _ctx.translate(-_x, -_y);
}

function drawCurrentCurve(_ctx,_Sensor,_color,_box,_width,_height,_hi,_lo,_maxMultiplier,_thickDivider){
  var _currentVal  = _Sensor[_Sensor.length-1];
  var _thickness = _width/_thickDivider;
  var _maxScale = Math.PI*_maxMultiplier;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle = _maxScale-((_currentVal-_lo)/(_hi-_lo))*_maxScale;

  // Background Arch
  _ctx.fillStyle = '#161412';
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, 0, -_maxScale, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, -_maxScale, 0, false);
  _ctx.closePath();
  _ctx.fill();

  // Current Value Arch
  _ctx.fillStyle = _color;
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, -_endPointAsAngle, -_maxScale, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, -_maxScale, -_endPointAsAngle, false);
  _ctx.closePath();
  _ctx.fill();
  // where is the rounded end?
  _ctx.beginPath();
  var __x = Math.cos(_endPointAsAngle)*(_box-_thickness) + _width/2;
  var __y = _height - Math.sin(_endPointAsAngle)*(_box-_thickness);
  _ctx.arc(__x, __y, _thickness, 0, 2*Math.PI);
  _ctx.closePath();
  _ctx.fill();
}

function drawCurrentCurveColoredByLimits(_ctx,_Sensor,_box,_width,_height,_hi,_lo,_multiplier,_limitColors,_maxMultiplier,_thickDivider){
  var _currentVal  = _Sensor[_Sensor.length-1];
  var _thickness = _width/_thickDivider;
  var _maxScale = Math.PI*_maxMultiplier;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle = _maxScale-((_currentVal-_lo)/(_hi-_lo))*_maxScale;
  var _color;
  for(var i=0; i<_multiplier.length-1; i++){
    if(_multiplier[i]*_maxScale >= _endPointAsAngle) _color = _limitColors[i];
    else break;
  }

  // Background Arch
  _ctx.fillStyle = '#161412';
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, 0, -_maxScale, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, -_maxScale, 0, false);
  _ctx.closePath();
  _ctx.fill();

  // Current Value Arch
  _ctx.fillStyle = _color;
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, -_endPointAsAngle, -_maxScale, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, -_maxScale, -_endPointAsAngle, false);
  _ctx.closePath();
  _ctx.fill();
  // where is the rounded end?
  _ctx.beginPath();
  var __x = Math.cos(_endPointAsAngle)*(_box-_thickness) + _width/2;
  var __y = _height - Math.sin(_endPointAsAngle)*(_box-_thickness);
  _ctx.arc(__x, __y, _thickness, 0, 2*Math.PI);
  _ctx.closePath();
  _ctx.fill();
}

function drawSensorTrend(_ctx,_Sensor,_color,_box,_width,_height,_hi,_lo,_maxMultiplier,_thickDivider){
  // Get min and max for the sensor
  var _min = 1000;
  var _max = -1000;
  for(var i=_Sensor.length-2; i>_Sensor.length-52; i--){
    if(_Sensor[i] > _max){
      _max = _Sensor[i];
    }
    if(_Sensor[i] < _min){
      _min = _Sensor[i];
    }
  }

  var _thickness = _width/_thickDivider;
  var _maxScale = Math.PI*_maxMultiplier;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle   = _maxScale-((_max-_lo)/(_hi-_lo))*_maxScale;
  var _startPointAsAngle = _maxScale-((_min-_lo)/(_hi-_lo))*_maxScale;

  // Current Value Arch
  _ctx.fillStyle = _color;
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, -_endPointAsAngle, -_startPointAsAngle, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, -_startPointAsAngle, -_endPointAsAngle, false);
  _ctx.closePath();
  _ctx.fill();
  // where is the rounded end?
  _ctx.beginPath();
  var __x = Math.cos(_endPointAsAngle)*(_box-_thickness) + _width/2;
  var __y = _height - Math.sin(_endPointAsAngle)*(_box-_thickness);
  _ctx.arc(__x, __y, _thickness, 0, 2*Math.PI);
  _ctx.closePath();
  _ctx.fill();
  // where is the rounded end?
  _ctx.beginPath();
  var __x = Math.cos(_startPointAsAngle)*(_box-_thickness) + _width/2;
  var __y = _height - Math.sin(_startPointAsAngle)*(_box-_thickness);
  _ctx.arc(__x, __y, _thickness, 0, 2*Math.PI);
  _ctx.closePath();
  _ctx.fill();
}

function drawScaleCurve(_ctx,_box,_width,_height,_multiplier,_limitColors,_maxMultiplier,_thickDivider){
  var _thickness = _width/_thickDivider;
  var _maxScale = Math.PI*_maxMultiplier;

  // Background Arch
  for(var i=0; i<_multiplier.length-1; i++){
    _ctx.fillStyle = _limitColors[i];
    _ctx.beginPath();
    _ctx.arc(_width/2, _height, _box, -_maxScale*_multiplier[i+1], -_maxScale*_multiplier[i], true);
    _ctx.arc(_width/2, _height, _box-2*_thickness, -_maxScale*_multiplier[i], -_maxScale*_multiplier[i+1], false);
    _ctx.closePath();
    _ctx.fill();
  }
}

function drawCurrentData(_ctx,_Sensor,_width,_x,_y,_unit){
  // Display the Current Value
  _ctx.font = (_width/14)+"px Courier";
  _ctx.fillStyle = '#999999';
  _ctx.fillText(_Sensor[_Sensor.length-1]+_unit, _x, _y);
}

function drawTrendArrow(_ctx,_Sensor,_width,_x,_y,_downQuick,_downSlow,_upSlow,_upQuick){
  var _valChange = 0;
  var _trendSamples = 12; // one hour of samples
  var _square = _width/50;
  for(var LavgTrend=(_Sensor.length-_trendSamples); LavgTrend<_Sensor.length; LavgTrend++){
    _valChange = _valChange + _Sensor[LavgTrend];
  }
  _valChange = _Sensor[_Sensor.length-1] - (_valChange/_trendSamples);

  _ctx.fillStyle = '#999999';
  _ctx.beginPath();
  if(_valChange < _downQuick){
    // Down quickly
    //    1_______2
    //     \     /
    //      \   /
    //       \ /
    //    4___3___5
    //     \     /
    //      \   /
    //       \ /
    //        6
    var _trendX1 = _x-_square/2;
    var _trendY1 = _y-_square;
    var _trendX2 = _x+_square/2;
    var _trendY2 = _y-_square;
    var _trendX3 = _x;
    var _trendY3 = _y;
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
    _ctx.closePath();
    _ctx.fill();
    var _trendX4 = _x-_square/2;
    var _trendY4 = _y;
    var _trendX5 = _x+_square/2;
    var _trendY5 = _y;
    var _trendX6 = _x;
    var _trendY6 = _y+_square;
    _ctx.beginPath();
    _ctx.moveTo( _trendX4, _trendY4 );
    _ctx.lineTo( _trendX5, _trendY5 );
    _ctx.lineTo( _trendX6, _trendY6 );
  }else if(_valChange < _downSlow){
    // Down slowly
    //    1_______2
    //     \     /
    //      \   /
    //       \ /
    //        3
    var _trendX1 = _x-_square/2;
    var _trendY1 = _y-_square/2;
    var _trendX2 = _x+_square/2;
    var _trendY2 = _y-_square/2;
    var _trendX3 = _x;
    var _trendY3 = _y+_square/2;
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
  }else if(_valChange < _upSlow){
    // Steady
    //        ___
    //      /     \
    //     |   1   |
    //      \ ___ /
    //
    var _trendX = _x;
    var _trendY = _y;
    _ctx.arc(_trendX, _trendY, _square/2, 0, 2*Math.PI, 0);
  }else if(_valChange < _upQuick){
    // Up slowly
    //        3
    //       / \
    //      /   \
    //     /     \
    //    1_______2
    var _trendX1 = _x-_square/2;
    var _trendY1 = _y+_square/2;
    var _trendX2 = _x+_square/2;
    var _trendY2 = _y+_square/2;
    var _trendX3 = _x;
    var _trendY3 = _y-_square/2;
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
  }else{
    // Up quickly
    //        6
    //       / \
    //      /   \
    //     /     \
    //    4___3___5
    //       / \
    //      /   \
    //     /     \
    //    1_______2
    var _trendX1 = _x-_square/2;
    var _trendY1 = _y+_square;
    var _trendX2 = _x+_square/2;
    var _trendY2 = _y+_square;
    var _trendX3 = _x;
    var _trendY3 = _y;
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
    _ctx.closePath();
    _ctx.fill();
    var _trendX4 = _x-_square/2;
    var _trendY4 = _y;
    var _trendX5 = _x+_square/2;
    var _trendY5 = _y;
    var _trendX6 = _x;
    var _trendY6 = _y-_square;
    _ctx.beginPath();
    _ctx.moveTo( _trendX4, _trendY4 );
    _ctx.lineTo( _trendX5, _trendY5 );
    _ctx.lineTo( _trendX6, _trendY6 );
  }
  _ctx.closePath();
  _ctx.fill();
}
