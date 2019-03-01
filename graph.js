// The following formating is used:
//   __* indicates a global data variable
//    _* indicates a local data variable
//    L* indicates a loop variable, only used in that loop
//    C* indicates a constant used for debug or for configuring the GUI
function selectColors(_type){
  // Type of sensor changes the color scheme of the widget
  if(_type == "temperature"){
    CwidgetTrendColor       = '#704040';
    CwidgetBorderColor      = '#504040';
    CwidgetCurrentBgColor   = '#ffffff';
    CwidgetCurrentColor     = '#704040';
    CwidgetCurrentUnitColor = '#706060';
    CwidgetBgColor          = '#ffffff';
    CwidgetBorderColor      = '#504040';
    CwidgetDataHighLowColor = '#907070';
    CwidgetDataColor        = '#503030';
  }else if(_type == "humidity"){
    CwidgetTrendColor       = '#404070';
    CwidgetBorderColor      = '#404050';
    CwidgetCurrentBgColor   = '#ffffff';
    CwidgetCurrentColor     = '#404070';
    CwidgetCurrentUnitColor = '#606070';
    CwidgetBgColor          = '#ffffff';
    CwidgetBorderColor      = '#404050';
    CwidgetDataHighLowColor = '#707090';
    CwidgetDataColor        = '#303050';
  }else if(_type == "uv"){
  }else if(_type == "barometric"){
  }else if(_type == "airquality"){
  }
}

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
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(78,68);
        }
      }else if(Lsensor == "humidity"){
        for(var CsampleDepth=0; CsampleDepth<CsampleSize; CsampleDepth++){
          __systemData[Lroom][Lsensor][CsampleDepth] = genRandomSensor(46,33);
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
  drawCurrentCurve(_ctx,_Sensor["temperature"],_widgetHeight,_widgetWidth,_widgetHeight,80,66);
  drawCurrentData( _ctx,_Sensor["temperature"],_widgetHeight,_widgetWidth,_widgetHeight,"°");
  drawCurrentCurve(_ctx,_Sensor[   "humidity"],_widgetHeight,_widgetWidth,_widgetHeight,48,31);
  drawCurrentData( _ctx,_Sensor[   "humidity"],_widgetHeight,_widgetWidth,_widgetHeight,"%");
}

function drawCurrentCurve(_ctx,_Sensor,_box,_width,_height,_hi,_lo){
  var _currentVal  = _Sensor[_Sensor.length-1];
  var _thickness = 3;

  // Scaled to a range between 0 (highest) and PI (lowest), inverse proportion
  var _endPointAsAngle = Math.PI-((_currentVal-_lo)/(_hi-_lo))*Math.PI;

  // Background Arch
  _ctx.fillStyle = '#000000';
  _ctx.beginPath();
  _ctx.arc(_width/2, _height, _box, 0, Math.PI, true);
  _ctx.arc(_width/2, _height, _box-2*3, Math.PI, 0, false);
  _ctx.closePath();
  _ctx.fill();

  // Current Value Arch
  _ctx.fillStyle = '#999999';
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

function drawCurrentData(_ctx,_Sensor,_widgetWidth,_widgetHeight,_unit){
  // Display the Current Value
  _ctx.font = "24px Courier";
  //_ctx.fillStyle = CwidgetCurrentColor;
  _ctx.fillText(_Sensor[_Sensor.length-1]+_unit, _widgetWidth*0.1, 25);
}

