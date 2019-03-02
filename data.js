// Order of data will always be:
//    Temp, Humidity, Pressure, Air Quality, UV, Flux, Color
// These could be expanded in the future but for now that will covere the things desired
__currentMins = {"temperature":1000, "humidity":1000, "barometric":1000, "uv":1000, "airquality":1000};
__currentMaxs = {"temperature":0000, "humidity":0000, "barometric":0000, "uv":0000, "airquality":0000};

__systemData = [
  {
    "label" : "Master Bedroom",
    "temperature" : [],
    "humidity"    : [],
  },
  {
    "label" : "Julian's Bedroom",
    "temperature" : [],
    "humidity"    : [],
  },
  {
    "label" : "Alice's Bedroom",
    "temperature" : [],
    "humidity"    : [],
  },
  {
    "label" : "Living Room",
    "temperature" : [],
    "humidity"    : [],
  },
];

