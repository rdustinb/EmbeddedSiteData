if [ $# -ne 1 ]; then
  echo -e "\nUsage:"
  echo -e "\n\n\t./build.sh [BUILD|CLEAN] <folder>"
  echo -e "\n\n\tBUILD|CLEAN - BUILD will create the hex file from the specified folder."
  echo -e "\n\t              CLEAN will remove the build and cache folders from the specified folder."
  exit 1
fi

ARDUINOBUILDER_DIR=/Applications/Arduino.app/Contents/Java
ARDUINOLIBS_DIR=/Users/sudood/Library/Arduino15
ARDUINOLOCALLIBS_DIR=/Users/sudood/Documents/Arduino/libraries
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
      -fqbn=teensy:avr:teensy31:usb=serial,speed=48,opt=o2std,keys=en-us \
      -ide-version=10807 \
      -build-path $BUILD_DIR \
      -warnings=none \
      -build-cache $CACHE_DIR \
      -verbose \
      $CURRENT_DIR/localReadWrite.ino
  fi
fi
