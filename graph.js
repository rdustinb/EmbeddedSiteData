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
  var maxMultiplier = 2.00;
  var curveThickDividerLarge = 10;
  var curveThickDividerSmall = 25;
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
    "temperature": [0.43, 0.31, 0.5],
    "humidity":    [0.43, 0.77, 0.5],
    "barometric":  [],
    "uv":          [],
    "airquality":  []
  };
  var currentCharacter = {
    "temperature": "°",
    "humidity":    "%",
    "barometric":  "mbar",
    "uv":          "idx",
    "airquality":  "ppm"
  };

  if(Object.keys(_Sensor).length == 3){
    for(var dictKey in _Sensor){
      if(dictKey == "label"){
        drawLocationLabel(
          _ctx,
          _Sensor[dictKey],
          _widgetWidth,
          _widgetHeight
        );
      }else{
        drawCurrentCurve(
          _ctx,
          _Sensor[dictKey],
          colors[dictKey],
          _widgetHeight*positionNumbers[dictKey][0], // Radius of arc
          _widgetWidth*positionNumbers[dictKey][1],  // X of vertice
          _widgetHeight*positionNumbers[dictKey][2], // Y of vertice
          hiLow[dictKey]["hi"],
          hiLow[dictKey]["lo"],
          maxMultiplier,
          curveThickDividerLarge,
          trendLimits[dictKey]["downquick"],
          trendLimits[dictKey]["downslow"],
          trendLimits[dictKey]["upslow"],
          trendLimits[dictKey]["upquick"]
        );
        drawSensorTrend(
          _ctx,
          _Sensor[dictKey],
          trendColors[dictKey],
          _widgetHeight*(positionNumbers[dictKey][0]+0.03), // Radius of arc
          _widgetWidth*(positionNumbers[dictKey][1]     ),  // X of vertice
          _widgetHeight*(positionNumbers[dictKey][2]     ), // Y of vertice
          hiLow[dictKey]["hi"],
          hiLow[dictKey]["lo"],
          maxMultiplier,
          curveThickDividerSmall
        );
        drawCurrentData(
          _ctx,
          _Sensor[dictKey],
          _widgetWidth,
          _widgetWidth*(positionNumbers[dictKey][1]-0.06),  // X of vertice
          _widgetHeight*(positionNumbers[dictKey][2]-0.00), // Y of vertice
          currentCharacter[dictKey]
        );
        drawTrendArrow(
          _ctx,
          _Sensor[dictKey],
          _widgetWidth,
          _widgetWidth*(positionNumbers[dictKey][1]-0.08),  // X of vertice
          _widgetHeight*(positionNumbers[dictKey][2]-0.05), // Y of vertice
          trendLimits[dictKey]["downquick"],
          trendLimits[dictKey]["downslow"],
          trendLimits[dictKey]["upslow"],
          trendLimits[dictKey]["upquick"]
        );
      }
    }
  }/*else{
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
          _widgetHeight*positionNumbers[dictKey][0], // Radius of arc
          _widgetWidth*positionNumbers[dictKey][1],  // X of vertice
          _widgetHeight*positionNumbers[dictKey][2], // Y of vertice
          hiLow[dictKey]["hi"],
          hiLow[dictKey]["lo"],
          maxMultiplier,
          curveThickDividerLarge,
          trendLimits[dictKey]["downquick"],
          trendLimits[dictKey]["downslow"],
          trendLimits[dictKey]["upslow"],
          trendLimits[dictKey]["upquick"]
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
          _widgetHeight*(positionNumbers[dictKey][0]+0.02), // Radius of arc
          _widgetWidth*(positionNumbers[dictKey][1]     ),  // X of vertice
          _widgetHeight*(positionNumbers[dictKey][2]     ), // Y of vertice
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
          _widgetWidth*positionNumbers[dictKey][2], // x position
          _widgetHeight*positionNumbers[dictKey][3], // y position
          currentCharacter[dictKey]
        );
      // Draw the trend arrow for the current sensor and historic data stored
      if(enableDraw[dictKey][6] == 1)
        drawTrendArrow(
          _ctx,
          _Sensor[dictKey],
          _widgetWidth,
          _widgetWidth*positionNumbers[dictKey][4], // x position
          _widgetHeight*positionNumbers[dictKey][5], // y position
          trendLimits[dictKey]["downquick"],
          trendLimits[dictKey]["downslow"],
          trendLimits[dictKey]["upslow"],
          trendLimits[dictKey]["upquick"]
        );
    }
  }*/
}

function drawLocationLabel(_ctx,_label,_width,_height){
  offsetX = (_width/75);
  _ctx.translate(offsetX, _height*0.97);
  _ctx.rotate(-Math.PI/2);
  _ctx.fillStyle = '#999999';
  _ctx.fillRect(0,0,_height*0.94,(_height/(_label.length*0.62)));
  _ctx.rotate(Math.PI/2);
  _ctx.translate(-offsetX, -_height*0.97);

  _ctx.font = (_height/(_label.length*0.70))+"px Courier";
  offsetX = (_width/(_label.length*1.25));
  _ctx.translate(offsetX, _height*0.95);
  _ctx.rotate(-Math.PI/2);
  _ctx.fillStyle = '#161412';
  _ctx.fillText(_label, (_label.length*0.20), 0);
  _ctx.rotate(Math.PI/2);
  _ctx.translate(-offsetX, -_height*0.95);
}

function drawSensorLabel(_ctx,_curveRadius,_width,_height,_label,_maxMultiplier,_thickDivider){
  var _thickness = _width/_thickDivider;
  // This is the origin location at the top of the curve
  var _x = (_width/2);
  var _y = ( _height);
  // This is where the end of the curve is, X will only decrease, y will only increase
  var _x = _x - _curveRadius*Math.sin(_maxMultiplier*Math.PI - Math.PI/2);
  var _y = _y - _curveRadius*Math.cos(_maxMultiplier*Math.PI - Math.PI/2);
  // Adjust for the thickness of the curve from where to endpoint would be if it had no thickness
  //
  //     Original
  //     Endpoint
  //      *____>
  //        .   |
  //          . |
  //            v
  var _x = _x + _thickness*Math.sin(_maxMultiplier*Math.PI - Math.PI/2);
  var _y = _y + _thickness*Math.cos(_maxMultiplier*Math.PI - Math.PI/2);
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
  //
  //   X always decreases or is 0
  //   Y always increases or is 0
  var _x = _x - ((_label.length+1)*_width/65) * Math.cos(_maxMultiplier*Math.PI - Math.PI/2);
  var _y = _y + ((_label.length+1)*_width/65) * Math.sin(_maxMultiplier*Math.PI - Math.PI/2);
  // Display the Current Value
  _ctx.font = (_width/40)+"px Courier";
  _ctx.fillStyle = '#999999';
  _ctx.translate(_x, _y);
  _ctx.rotate(-(_maxMultiplier*Math.PI-Math.PI/2));
  _ctx.fillText(_label, 0, 0);
  _ctx.rotate((_maxMultiplier*Math.PI-Math.PI/2));
  _ctx.translate(-_x, -_y);
}

function drawCurrentCurve(_ctx,_Sensor,_color,_box,_x,_y,_hi,_lo,_maxMultiplier,_thickDivider,_downQuick,_downSlow,_upSlow,_upQuick){
  var _currentVal  = _Sensor[_Sensor.length-1];
  var _thickness = _box/_thickDivider;
  var _maxScale = Math.PI*_maxMultiplier-Math.PI/2;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle = _maxScale-((_currentVal-_lo)/(_hi-_lo))*_maxScale-Math.PI/2;

  // Background Arch
  _ctx.fillStyle = '#161412';
  _ctx.beginPath();
  _ctx.arc(_x, _y, _box, Math.PI/2, -_maxScale, true);
  _ctx.arc(_x, _y, _box-2*_thickness, -_maxScale, Math.PI/2, false);
  _ctx.closePath();
  _ctx.fill();

  // Current Value Arch
  _ctx.fillStyle = _color;
  _ctx.beginPath();
  _ctx.arc(_x, _y, _box, -_endPointAsAngle, -_maxScale, true);
  _ctx.arc(_x, _y, _box-2*_thickness, -_maxScale, -_endPointAsAngle, false);
  _ctx.closePath();
  _ctx.fill();

  // Draw a rounded end
  _ctx.beginPath();
  var __x = Math.cos(_endPointAsAngle)*(_box-_thickness) + _x;
  var __y = _y - Math.sin(_endPointAsAngle)*(_box-_thickness);
  _ctx.arc(__x, __y, _thickness, 0, 2*Math.PI);
  _ctx.closePath();
  _ctx.fill();

  // Draw the trend endpoint
  //var __x = __x;
  //var __y = __y;
  //var _arrowSide = 0.75*_thickness;
  //var _valChange = 0;
  //_ctx.fillStyle = '#161412';

  //for(var LavgTrend=(_Sensor.length-4); LavgTrend<_Sensor.length; LavgTrend++){
  //  _valChange = _valChange + _Sensor[LavgTrend];
  //}
  //_valChange = _Sensor[_Sensor.length-1] - (_valChange/4);

  //_ctx.translate(__x, __y);
  //_ctx.rotate((Math.PI/2-_endPointAsAngle));
  //if(_valChange < _downSlow){
  //  //
  //  //  _   _arrowSide     @ is the 0,0 point translation
  //  //  a    |<--->|
  //  //  r ___5      2       
  //  //  r  ^ *  *   *  *    
  //  //  o  | *    * *    *  
  //  //  w  | *      4      1/@
  //  //  S  | *    * *    *  
  //  //  i  v *  *   *  *    
  //  //  d ___6      3       
  //  //  e
  //  //  *
  //  //  2
  //  _ctx.beginPath();
  //  _ctx.moveTo(           0,           0 ); //1
  //  _ctx.lineTo( -_arrowSide, -_arrowSide ); //2
  //  _ctx.lineTo( -_arrowSide,  _arrowSide ); //3
  //  _ctx.closePath();
  //  _ctx.fill();
  //  if(_valChange < _downQuick){
  //    _ctx.beginPath();
  //    _ctx.moveTo( -_arrowSide  ,           0 ); //4
  //    _ctx.lineTo( -_arrowSide*2, -_arrowSide ); //5
  //    _ctx.lineTo( -_arrowSide*2,  _arrowSide ); //6
  //    _ctx.closePath();
  //    _ctx.fill();
  //  }
  //}else if(_valChange < _upSlow){
  //  _ctx.beginPath();
  //  _ctx.arc(0, 0, _arrowSide/2, 0, 2*Math.PI, 0);
  //  _ctx.closePath();
  //  _ctx.fill();
  //}else if(_valChange < _upQuick){
  //  //
  //  //  _   _arrowSide     @ is the 0,0 point translation
  //  //  a    |<--->|
  //  //  r ___       4      1
  //  //  r  ^     *  *    * *
  //  //  o  |   *    *  *   *
  //  //  w  | 6      3      *  
  //  //  S  |   *    *  *   *
  //  //  i  v     *  *    * *
  //  //  d ___       5      2
  //  //  e
  //  //  *
  //  //  2
  //  _ctx.beginPath();
  //  _ctx.moveTo(           0, -_arrowSide ); //1
  //  _ctx.lineTo(           0,  _arrowSide ); //2
  //  _ctx.lineTo( -_arrowSide,           0 ); //3
  //  _ctx.closePath();
  //  _ctx.fill();
  //  if(_valChange > _upQuick){
  //    _ctx.beginPath();
  //    _ctx.moveTo( -_arrowSide  , -_arrowSide ); //4
  //    _ctx.lineTo( -_arrowSide  ,  _arrowSide ); //5
  //    _ctx.lineTo( -_arrowSide*2,           0 ); //6
  //    _ctx.closePath();
  //    _ctx.fill();
  //  }
  //}
  //_ctx.rotate(-(Math.PI/2-_endPointAsAngle));
  //_ctx.translate(-__x, -__y);
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

function drawSensorTrend(_ctx,_Sensor,_color,_box,_x,_y,_hi,_lo,_maxMultiplier,_thickDivider){
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

  var _thickness = _box/_thickDivider;
  var _maxScale = Math.PI*_maxMultiplier-Math.PI/2;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle   = _maxScale-((_max-_lo)/(_hi-_lo))*_maxScale-Math.PI/2;
  var _startPointAsAngle = _maxScale-((_min-_lo)/(_hi-_lo))*_maxScale-Math.PI/2;

  // Current Value Arch
  _ctx.fillStyle = _color;
  _ctx.beginPath();
  _ctx.arc(_x, _y, _box, -_endPointAsAngle, -_startPointAsAngle, true);
  _ctx.arc(_x, _y, _box-2*_thickness, -_startPointAsAngle, -_endPointAsAngle, false);
  _ctx.closePath();
  _ctx.fill();
  // where is the rounded end?
  _ctx.beginPath();
  var __x = Math.cos(_endPointAsAngle)*(_box-_thickness) + _x;
  var __y = _y - Math.sin(_endPointAsAngle)*(_box-_thickness);
  _ctx.arc(__x, __y, _thickness, 0, 2*Math.PI);
  _ctx.closePath();
  _ctx.fill();
  // where is the rounded end?
  _ctx.beginPath();
  var __x = Math.cos(_startPointAsAngle)*(_box-_thickness) + _x;
  var __y = _y - Math.sin(_startPointAsAngle)*(_box-_thickness);
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
  _ctx.font = (_width/10)+"px Courier";
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
