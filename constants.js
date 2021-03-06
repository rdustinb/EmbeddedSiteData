CsampleSize         = 120; // 10 hours of samples
CxOffset            = 5;
CyOffset            = 40;
CwidgetXGapMult     = 0.1;
CwidgetPlotYMaxMult = 0.70;

CplotVertValsMinPerPixel = {"temperature":0.5, "humidity":0.7, "barometric":10, "uv":0.25, "airquality":2};

// Raises or Drops in temperature, humidity or, especially pressure indicate certain weather conditions. According to
// the Weather Handbook by Alan Watts, these are the limits for pressure changes:
// slow - 0.1 to 1.5 millibars in 3 hours
// quick - 3.6 to 6.0 millibars in 3 hours
CdownQuickLimit = {"temperature":-3, "humidity":-3, "barometric":-3.6, "uv":-2, "airquality":-5};
CdownSlowLimit  = {"temperature":-1, "humidity":-1, "barometric":-1.5, "uv":-1, "airquality":-2};
CupSlowLimit    = {"temperature": 1, "humidity": 1, "barometric": 1.5, "uv": 1, "airquality": 2};
CupQuickLimit   = {"temperature": 3, "humidity": 3, "barometric": 3.6, "uv": 2, "airquality": 5};

