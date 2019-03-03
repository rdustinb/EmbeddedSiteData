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
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(76,68);
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
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(256,236);
        }
      }
    }
  }
}

// Drawing Functions
function drawSensorWidget(_ctx,_Sensor,_widgetWidth,_widgetHeight){
  var hiLow = {
    "temperature": {"hi": 80,   "lo": 66},
    "humidity":    {"hi": 48,   "lo": 31},
    "barometric":  {"hi": 1100, "lo": 950},
    "uv":          {"hi": 13,   "lo": 0},
    "airquality":  {"hi": 500,  "lo": 0}
  };
  var trendLimits = {
    "temperature": {"downquick": -3,   "downslow": -1,   "upslow": 1,   "upquick": 3},
    "humidity":    {"downquick": -3,   "downslow": -1,   "upslow": 1,   "upquick": 3},
    "barometric":  {"downquick": -3.6, "downslow": -1.5, "upslow": 1.5, "upquick": 3.6},
    "uv":          {"downquick": -2,   "downslow": -1,   "upslow": 1,   "upquick": 2},
    "airquality":  {"downquick": -5,   "downslow": -2,   "upslow": 2,   "upquick": 5}
  };
  var positionNumbers = {
    "temperature": [0.90, 0.92, 0.30, 0.99, 0.28, 0.95],
    "humidity":    [0.82, 0.84, 0.58, 0.99, 0.56, 0.95],
    "barometric":  [0.74, 0.76, 0.20, 0.79, 0.18, 0.75],
    "uv":          [0.66, 0.68, 0.68, 0.79, 0.66, 0.75],
    "airquality":  [0.58, 0.60, 0.45, 0.59, 0.43, 0.55]
  };
  var currentCharacter = {
    "temperature": "°",
    "humidity":    "%",
    "barometric":  "mbar",
    "uv":          "idx",
    "airquality":  "ppm"
  };
  var enableDraw = {
    "temperature": [1, 1, 1, 1],
    "humidity":    [1, 1, 1, 1],
    "barometric":  [1, 1, 0, 0],
    "uv":          [1, 1, 0, 0],
    "airquality":  [1, 1, 0, 0]
  };

  for(var dictKey in _Sensor){
    if(dictKey == "label") continue;
    // Draw the curve for the current value, scaled from left to right according to the limits in hiLow
    if(enableDraw[dictKey][0] == 1)
      drawCurrentCurve(
        _ctx,
        _Sensor[dictKey],
        _widgetHeight*positionNumbers[dictKey][0],
        _widgetWidth,
        _widgetHeight,
        hiLow[dictKey]["hi"],
        hiLow[dictKey]["lo"]
      );
    // Draw the trend of this sensor over the last 50 stored values
    if(enableDraw[dictKey][1] == 1)
      drawSensorTrend(
        _ctx,
        _Sensor[dictKey],
        _widgetHeight*positionNumbers[dictKey][1],
        _widgetWidth,
        _widgetHeight,
        hiLow[dictKey]["hi"],
        hiLow[dictKey]["lo"]
      );
    // Print the current value as a number with a special character
    if(enableDraw[dictKey][2] == 1)
      drawCurrentData(
        _ctx,
        _Sensor[dictKey],
        _widgetWidth,
        _widgetWidth*positionNumbers[dictKey][2],
        _widgetHeight*positionNumbers[dictKey][3],
        currentCharacter[dictKey]
      );
    // Draw the trend arrow for the current sensor and historic data stored
    if(enableDraw[dictKey][3] == 1)
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

function drawCurrentCurve(_ctx,_Sensor,_box,_width,_height,_hi,_lo){
  var _currentVal  = _Sensor[_Sensor.length-1];
  var _thickness = _width/125;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle = Math.PI-((_currentVal-_lo)/(_hi-_lo))*Math.PI;

  // Background Arch
  _ctx.fillStyle = '#161412';
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, 0, Math.PI, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, Math.PI, 0, false);
  _ctx.closePath();
  _ctx.fill();

  // Current Value Arch
  _ctx.fillStyle = '#bb4422';
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, -_endPointAsAngle, Math.PI, true);
  _ctx.arc(_width/2, _height, _box-2*_thickness, Math.PI, -_endPointAsAngle, false);
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

function drawSensorTrend(_ctx,_Sensor,_box,_width,_height,_hi,_lo){
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

  var _thickness = _width/250;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle   = Math.PI-((_max-_lo)/(_hi-_lo))*Math.PI;
  var _startPointAsAngle = Math.PI-((_min-_lo)/(_hi-_lo))*Math.PI;

  // Current Value Arch
  _ctx.fillStyle = '#666666';
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
