if [ $# -ne 1 ]; then
  echo -e "\nUsage:"
  echo -e "\n\n\t./build.sh [BUILD|CLEAN] <folder>"
  echo -e "\n\n\tBUILD|CLEAN - BUILD will create the hex file from the specified folder."
  echo -e "\n\t              CLEAN will remove the build and cache folders from the specified folder."
  exit 1
fi

ARDUINOBUILDER_DIR=/Applications/Arduino.app/Contents/Java
ARDUINOLIBS_DIR=/Users/sudood/Library/Arduino15
ARDUINOGCC_DIR=$ARDUINOLIBS_DIR/packages/arduino/tools/avr-gcc/
ARDUINOOTA_DIR=$ARDUINOLIBS_DIR/packages/arduino/tools/arduinoOTA/
AVRDUDE_DIR=$ARDUINOLIBS_DIR/packages/arduino/tools/avrdude/
ARDUINOLOCALLIBS_DIR=/Users/sudood/Documents/Arduino/libraries
AVRGCCVER=5.4.0-atmel3.6.1-arduino2
CURRENT_DIR=`pwd`
BUILD_DIR=$CURRENT_DIR/build
CACHE_DIR=$CURRENT_DIR/cache

if [ $1 = "CLEAN" ]; then
  rm -fr $CURRENT_DIR/build
  rm -fr $CURRENT_DIR/cache
else
  if [ $1 = "BUILD" ]; then
    mkdir -p $CURRENT_DIR/build
    mkdir -p $CURRENT_DIR/cache

    $ARDUINOBUILDER_DIR/arduino-builder \
      -compile \
      -logger=machine \
      -hardware $ARDUINOBUILDER_DIR/hardware \
      -hardware $ARDUINOLIBS_DIR/packages \
      -tools $ARDUINOBUILDER_DIR/tools-builder \
      -tools $ARDUINOBUILDER_DIR/hardware/tools/avr \
      -tools $ARDUINOLIBS_DIR/packages \
      -built-in-libraries $ARDUINOBUILDER_DIR/libraries \
      -libraries $ARDUINOLOCALLIBS_DIR \
      -fqbn=arduino:avr:pro:cpu=8MHzatmega328 \
      -ide-version=10807 \
      -build-path $BUILD_DIR \
      -warnings=none \
      -build-cache $CACHE_DIR \
      -prefs=build.warn_data_percentage=75 \
      -prefs=runtime.tools.avr-gcc.path=$ARDUINOGCC_DIR/$AVRGCCVER \
      -prefs=runtime.tools.avr-gcc-$AVRGCCVER.path=$ARDUINOGCC_DIR/$AVRGCCVER \
      -prefs=runtime.tools.arduinoOTA.path=$ARDUINOOTA_DIR/1.2.1 \
      -prefs=runtime.tools.arduinoOTA-1.2.1.path=$ARDUINOOTA_DIR/1.2.1 \
      -prefs=runtime.tools.avrdude.path=$AVRDUDE_DIR/6.3.0-arduino14 \
      -prefs=runtime.tools.avrdude-6.3.0-arduino14.path=$AVRDUDE_DIR/6.3.0-arduino14 \
      -verbose \
      $CURRENT_DIR/remoteReadWrite.ino
  fi
fi
