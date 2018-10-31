// The following formating is used:
//   __* indicates a global data variable
//    _* indicates a local data variable
//    L* indicates a loop variable, only used in that loop
//    C* indicates a constant used for debug or for configuring the GUI

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
function setBackground(){
  ctx.fillStyle = CbgColor;
  ctx.fillRect(0, 0, width, height);
}

function drawLocationBox(_xOffset,_yOffset,_width,_height){
  ctx.fillStyle = ClocationBgColor;
  ctx.fillRect(_xOffset,_yOffset,_width,_height);
}

function drawSensorWidget(_ctx,_Sensor,_widgetWidth,_widgetHeight,_type){
  // Draw the Samples Graph
  drawSamplesGraphBox(_ctx,_widgetWidth,_widgetHeight);
  drawSmoothSamplesGraphRange(_ctx,_Sensor,_type,_widgetWidth,_widgetHeight);
  drawSmoothSamplesGraph(_ctx,_Sensor,_type,_widgetWidth,_widgetHeight);

  // Draw the Current Data Section
  drawCurrentData(_ctx,_Sensor,_widgetWidth,_type);
}

function drawCurrentData(_ctx,_Sensor,_widgetWidth,_type){
  var _baseWidgetHeight = 52;
  var _baseWidgetWidth;
  var _currentVal  = _Sensor[_Sensor.length-1];

  // Determine widget width as it depends on the value of the current measurement
  if(_currentVal > 999){
    _baseWidgetWidth = 180; // four characters
  }else if(_currentVal > 99){
    _baseWidgetWidth = 145; // three characters
  }else if(_currentVal > 9){
    _baseWidgetWidth = 110; // two characters
  }else if(_currentVal > -1){
    _baseWidgetWidth = 75; // one character
  }else if(_currentVal > -9){
    _baseWidgetWidth = 110; // one character plus the negative sign (two characters)
  }else if(_currentVal > -99){
    _baseWidgetWidth = 145; // two characters plus the negative sign (three characters)
  }else{
    _baseWidgetWidth = 180;
  }

  // Draw a background
  var _point1x = (CxOffset+_widgetWidth/2)-_baseWidgetWidth/2;
  var _point1y = CyOffset-_baseWidgetHeight*2/3;
  var _point2x = (CxOffset+_widgetWidth/2)-_baseWidgetWidth/2;
  var _point2y = CyOffset+_baseWidgetHeight*1/3;
  var _point3x = (CxOffset+_widgetWidth/2)+_baseWidgetWidth/2;
  var _point3y = CyOffset+_baseWidgetHeight*1/3;
  var _point4x = (CxOffset+_widgetWidth/2)+_baseWidgetWidth/2;
  var _point4y = CyOffset-_baseWidgetHeight*2/3;
  _ctx.fillStyle = CwidgetCurrentBgColor;
  _ctx.beginPath();
  _ctx.lineTo( _point1x, _point1y);
  _ctx.lineTo( _point2x, _point2y);
  _ctx.lineTo( _point3x, _point3y);
  _ctx.lineTo( _point4x, _point4y);
  _ctx.closePath();
  _ctx.fill();
  _ctx.strokeStyle = CwidgetBorderColor;
  _ctx.lineWidth = 2;
  _ctx.beginPath();
  _ctx.lineTo( _point1x, _point1y);
  _ctx.lineTo( _point2x, _point2y);
  _ctx.lineTo( _point3x, _point3y);
  _ctx.lineTo( _point4x, _point4y);
  _ctx.closePath();
  _ctx.stroke();

  // Display the Current Value
  var _currentValx = (CxOffset+_widgetWidth/2)-_baseWidgetWidth/2+3;
  var _currentValy = CyOffset+_baseWidgetHeight*1/3-7;
  _ctx.font = CcurrentFont;
  _ctx.fillStyle = CwidgetCurrentColor;
  _ctx.fillText(_currentVal, _currentValx, _currentValy);

  // Draw Trend Arrow
  var _arrowXOffset = (CxOffset+_widgetWidth/2)+_baseWidgetWidth/2-18;
  var _arrowYOffset = CyOffset+_baseWidgetHeight*1/3-15;
  drawTrendArrow(_ctx,_Sensor,_arrowXOffset,_arrowYOffset,_type);

  // Draw Sensor Unit
  var _currentUnitx;
  var _currentUnity = CyOffset-_baseWidgetHeight*2/3+20;
  if(Cunits[_type].length == 2){
    _currentUnitx = (CxOffset+_widgetWidth/2)+_baseWidgetWidth/2-27;
  }else if(Cunits[_type].length == 3){
    _currentUnitx = (CxOffset+_widgetWidth/2)+_baseWidgetWidth/2-35;
  }else{
    _currentUnitx = (CxOffset+_widgetWidth/2)+_baseWidgetWidth/2-15;
  }
  _ctx.font = CcurrentUnitFont;
  _ctx.fillStyle = CwidgetCurrentUnitColor;
  _ctx.fillText(Cunits[_type], _currentUnitx, _currentUnity);
}

function drawTrendArrow(_ctx,_Sensor,_xOffset,_yOffset,_type){
  var _valChange = 0;
  var _trendSamples = 12; // one hour of samples
  var _square = 10;
  for(var LavgTrend=(_Sensor.length-_trendSamples); LavgTrend<_Sensor.length; LavgTrend++){
    _valChange = _valChange + _Sensor[LavgTrend];
  }
  _valChange = _Sensor[_Sensor.length-1] - (_valChange / _trendSamples);

  if(_valChange < CdownQuickLimit[_type]){
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
    var _trendX1 = _xOffset-_square/2;
    var _trendY1 = _yOffset-_square;
    var _trendX2 = _xOffset+_square/2;
    var _trendY2 = _yOffset-_square;
    var _trendX3 = _xOffset;
    var _trendY3 = _yOffset;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
    _ctx.closePath();
    _ctx.fill();
    var _trendX4 = _xOffset-_square/2;
    var _trendY4 = _yOffset;
    var _trendX5 = _xOffset+_square/2;
    var _trendY5 = _yOffset;
    var _trendX6 = _xOffset;
    var _trendY6 = _yOffset+_square;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.moveTo( _trendX4, _trendY4 );
    _ctx.lineTo( _trendX5, _trendY5 );
    _ctx.lineTo( _trendX6, _trendY6 );
    _ctx.closePath();
    _ctx.fill();
  }else if(_valChange < CdownSlowLimit[_type]){
    // Down slowly
    //    1_______2
    //     \     /
    //      \   /
    //       \ /
    //        3
    var _trendX1 = _xOffset-_square/2;
    var _trendY1 = _yOffset-_square/2;
    var _trendX2 = _xOffset+_square/2;
    var _trendY2 = _yOffset-_square/2;
    var _trendX3 = _xOffset;
    var _trendY3 = _yOffset+_square/2;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
    _ctx.closePath();
    _ctx.fill();
  }else if(_valChange < CupSlowLimit[_type]){
    // Steady
    //        ___
    //      /     \
    //     |   1   |
    //      \ ___ /
    //
    var _trendX = _xOffset;
    var _trendY = _yOffset;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.arc(_trendX, _trendY, _square/2, 0, 2*Math.PI, 0);
    _ctx.fill()
  }else if(_valChange < CupQuickLimit[_type]){
    // Up slowly
    //        3
    //       / \
    //      /   \
    //     /     \
    //    1_______2
    var _trendX1 = _xOffset-_square/2;
    var _trendY1 = _yOffset+_square/2;
    var _trendX2 = _xOffset+_square/2;
    var _trendY2 = _yOffset+_square/2;
    var _trendX3 = _xOffset;
    var _trendY3 = _yOffset-_square/2;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
    _ctx.closePath();
    _ctx.fill();
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
    var _trendX1 = _xOffset-_square/2;
    var _trendY1 = _yOffset+_square;
    var _trendX2 = _xOffset+_square/2;
    var _trendY2 = _yOffset+_square;
    var _trendX3 = _xOffset;
    var _trendY3 = _yOffset;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.moveTo( _trendX1, _trendY1 );
    _ctx.lineTo( _trendX2, _trendY2 );
    _ctx.lineTo( _trendX3, _trendY3 );
    _ctx.closePath();
    _ctx.fill();
    var _trendX4 = _xOffset-_square/2;
    var _trendY4 = _yOffset;
    var _trendX5 = _xOffset+_square/2;
    var _trendY5 = _yOffset;
    var _trendX6 = _xOffset;
    var _trendY6 = _yOffset-_square;
    _ctx.fillStyle = CwidgetTrendColor;
    _ctx.beginPath();
    _ctx.moveTo( _trendX4, _trendY4 );
    _ctx.lineTo( _trendX5, _trendY5 );
    _ctx.lineTo( _trendX6, _trendY6 );
    _ctx.closePath();
    _ctx.fill();
  }

}

function drawSamplesGraphBox(_ctx,_widgetWidth,_widgetHeight){
  // Draw the Outline
  var _point1x = CxOffset;
  var _point1y = CyOffset;
  var _point2x = CxOffset;
  var _point2y = CyOffset+_widgetHeight;
  var _point3x = CxOffset+_widgetWidth;
  var _point3y = CyOffset+_widgetHeight;
  var _point4x = CxOffset+_widgetWidth;
  var _point4y = CyOffset;
  _ctx.fillStyle = CwidgetBgColor;
  _ctx.beginPath();
  _ctx.lineTo( _point1x, _point1y);
  _ctx.lineTo( _point2x, _point2y);
  _ctx.lineTo( _point3x, _point3y);
  _ctx.lineTo( _point4x, _point4y);
  _ctx.closePath();
  _ctx.fill();
  _ctx.strokeStyle = CwidgetBorderColor;
  _ctx.lineWidth = 2;
  _ctx.beginPath();
  _ctx.lineTo( _point1x, _point1y);
  _ctx.lineTo( _point2x, _point2y);
  _ctx.lineTo( _point3x, _point3y);
  _ctx.lineTo( _point4x, _point4y);
  _ctx.closePath();
  _ctx.stroke();
}

function drawSamplesGraph(_ctx,_Sensor,_type,_xOffset,_yOffset,_widgetWidth,_widgetHeight){
  // This function draws the widget with the following structure:
  //           |
  //           |
  //           | _yOffset
  //           V
  //          1---------------------------------------------------4
  // -------> |                                                   |
  // _xOffset |   |  |   | |    | ||||||    ||    |||        ||   |
  //          |  || ||  ||||  ||||||||||  |||||  ||||| |   |||||  |
  //          |  |||||| ||||| |||||||||| |||||| ||||||||  ||||||| |
  //          | ||||||||||||Long Term Graphing Data|||||| ||||||| |
  //          | ||||||||||||||||||||||||||||||||||||||||||||||||| |
  //          2___________________________________________________3

  // Draw Data Samples
  var _sampleWidth = _widgetWidth / (_Sensor.length+1);
  var _sampleMin =  10000;
  var _sampleMax = -10000;
  [_sampleMax, _sampleMin] = calculateMinMax(_Sensor, _sampleMax, _sampleMin);
  // Scale for data that has very little variance
  if((_sampleMax-_sampleMin) < CplotVertValsMinPerPixel[_type]*CwidgetHeight){
    var _verticalMinSplit = (CplotVertValsMinPerPixel[_type]*CwidgetHeight - (_sampleMax - _sampleMin))/2;
    _sampleMax = _sampleMax + _verticalMinSplit;
    _sampleMin = _sampleMin - _verticalMinSplit;
  }
  _ctx.strokeStyle = CwidgetDataColor;
  _ctx.lineWidth = 1;
  for(var LdataSample=0; LdataSample<_Sensor.length; LdataSample++){
    var _oldLineWidth = _ctx.lineWidth;
    var _line1x = _xOffset+(LdataSample+1)*_sampleWidth;
    var _line1y = _yOffset+_widgetHeight-1;
    var _line2x = _xOffset+(LdataSample+1)*_sampleWidth;
    var _line2y = _line1y-5-(_Sensor[LdataSample]-_sampleMin)*
      ((_widgetHeight*CwidgetPlotYMaxMult)/(_sampleMax-_sampleMin));
    _ctx.lineWidth = _sampleWidth/4*3;
    _ctx.beginPath();
    _ctx.moveTo( _line1x, _line1y);
    _ctx.lineTo( _line2x, _line2y);
    _ctx.stroke();
    _ctx.lineWidth = _oldLineWidth;
  }
}

function drawSmoothSamplesGraphRange(_ctx,_Sensor,_type,_widgetWidth,_widgetHeight){
  // Draw Data Samples
  var _sampleWidth = _widgetWidth / (_Sensor.length+1);
  var _sampleMin =  10000;
  var _sampleMax = -10000;
  [_sampleMax, _sampleMin] = calculateMinMax(_Sensor, _sampleMax, _sampleMin);
  // Scale for data that has very little variance
  if((_sampleMax-_sampleMin) < CplotVertValsMinPerPixel[_type]*CwidgetHeight){
    var _verticalMinSplit = (CplotVertValsMinPerPixel[_type]*CwidgetHeight - (_sampleMax - _sampleMin))/2;
    _sampleMax = _sampleMax + _verticalMinSplit;
    _sampleMin = _sampleMin - _verticalMinSplit;
  }
  // Graph the range filled plot
  // High water side
  var _lineXhigh = [];
  var _lineYhigh = [];
  for(var LdataSample=0; LdataSample<_Sensor.length; LdataSample++){
    _lineXhigh.push(CxOffset+(LdataSample+1)*_sampleWidth);
    _lineYhigh.push(CyOffset+_widgetHeight-5-(_Sensor[LdataSample]-_sampleMin)*
      ((_widgetHeight*CwidgetPlotYMaxMult)/(_sampleMax-_sampleMin))-10);
  }
  // Low water side
  var _lineXlow = [];
  var _lineYlow = [];
  for(var LdataSample=_Sensor.length-1; LdataSample>=0; LdataSample--){
    _lineXlow.push(CxOffset+(LdataSample+1)*_sampleWidth);
    _lineYlow.push(CyOffset+_widgetHeight-5-(_Sensor[LdataSample]-_sampleMin)*
      ((_widgetHeight*CwidgetPlotYMaxMult)/(_sampleMax-_sampleMin))+10);
  }
  _ctx.fillStyle = CwidgetDataHighLowColor;
  _ctx.beginPath();
  _ctx.moveTo(_lineXhigh[0], _lineYhigh[0]);
  for (i=1; i<_Sensor.length; i++){
    var xc;
    var yc;
    if(i == _Sensor.length-1){
      xc = _lineXhigh[i];
      yc = _lineYhigh[i];
    }else{
      xc = (_lineXhigh[i] + _lineXhigh[i+1])/2;
      yc = (_lineYhigh[i] + _lineYhigh[i+1])/2;
    }
    _ctx.quadraticCurveTo(_lineXhigh[i], _lineYhigh[i], xc, yc);
  }
  _ctx.lineTo(_lineXlow[0], _lineYlow[0]);
  for (i=1; i<_Sensor.length; i++){
    var xc;
    var yc;
    if(i == _Sensor.length-1){
      xc = _lineXlow[i];
      yc = _lineYlow[i];
    }else{
      xc = (_lineXlow[i] + _lineXlow[i+1])/2;
      yc = (_lineYlow[i] + _lineYlow[i+1])/2;
    }
    _ctx.quadraticCurveTo(_lineXlow[i], _lineYlow[i], xc, yc);
  }
  _ctx.closePath();
  _ctx.fill();
}

function drawSmoothSamplesGraph(_ctx,_Sensor,_type,_widgetWidth,_widgetHeight){
  // Draw Data Samples
  var _sampleWidth = _widgetWidth / (_Sensor.length+1);
  var _sampleMin =  10000;
  var _sampleMax = -10000;
  [_sampleMax, _sampleMin] = calculateMinMax(_Sensor, _sampleMax, _sampleMin);
  // Scale for data that has very little variance
  if((_sampleMax-_sampleMin) < CplotVertValsMinPerPixel[_type]*CwidgetHeight){
    var _verticalMinSplit = (CplotVertValsMinPerPixel[_type]*CwidgetHeight - (_sampleMax - _sampleMin))/2;
    _sampleMax = _sampleMax + _verticalMinSplit;
    _sampleMin = _sampleMin - _verticalMinSplit;
  }
  var _lineX = [];
  var _lineY = [];

  // Graph the data plot
  for(var LdataSample=0; LdataSample<_Sensor.length; LdataSample++){
    _lineX.push(CxOffset+(LdataSample+1)*_sampleWidth);
    _lineY.push(CyOffset+_widgetHeight-5-(_Sensor[LdataSample]-_sampleMin)*
      ((_widgetHeight*CwidgetPlotYMaxMult)/(_sampleMax-_sampleMin)));
  }
  _ctx.strokeStyle = CwidgetDataColor;
  _ctx.beginPath();
  _ctx.moveTo(_lineX[0], _lineY[0]);
  for (i=1; i<_Sensor.length; i++){
    var xc;
    var yc;
    if(i == _Sensor.length-1){
      xc = _lineX[i];
      yc = _lineY[i];
    }else{
      xc = (_lineX[i] + _lineX[i+1])/2;
      yc = (_lineY[i] + _lineY[i+1])/2;
    }
    _ctx.quadraticCurveTo(_lineX[i], _lineY[i], xc, yc);
  }
  _ctx.stroke();
}
