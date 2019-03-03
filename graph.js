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
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(1100,950);
        }
      }else if(Lsensor == "uv"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(13,1);
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
  drawCurrentCurve(_ctx,_Sensor["temperature"],_widgetHeight*0.90,      _widgetWidth,     _widgetHeight,80,66);
  drawCurrentCurve(_ctx,_Sensor[   "humidity"],_widgetHeight*0.80,      _widgetWidth,     _widgetHeight,48,31);
  drawSensorTrend( _ctx,_Sensor["temperature"],_widgetHeight*0.93,      _widgetWidth,     _widgetHeight,80,66);
  drawSensorTrend( _ctx,_Sensor[   "humidity"],_widgetHeight*0.83,      _widgetWidth,     _widgetHeight,48,31);
  drawCurrentData( _ctx,_Sensor["temperature"],      _widgetWidth, _widgetWidth*0.20,_widgetHeight*0.99,"°");
  drawCurrentData( _ctx,_Sensor[   "humidity"],      _widgetWidth, _widgetWidth*0.68,_widgetHeight*0.99,"%");
  drawTrendArrow(  _ctx,_Sensor["temperature"],      _widgetWidth, _widgetWidth*0.18,_widgetHeight*0.95,-3,-1,1,3);
  drawTrendArrow(  _ctx,_Sensor[   "humidity"],      _widgetWidth, _widgetWidth*0.66,_widgetHeight*0.95,-3,-1,1,3);
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

  var _thickness = _width/125;

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
