#! /usr/local/bin/python3

import serial
import random
import datetime
import math

# Commands
_REMOTEREAD      = 0x00
_REMOTEWRITE     = 0x01
_LOCALREAD       = 0x02
_LOCALWRITE      = 0x03

# nRF Addresses
_NRFREG_RFCH     = 0x05
_NRFREG_RFSETUP  = 0x06
_NRFREG_STATUS   = 0x07
_NRFREG_TXRXADDR = 0x10
_HTU21DREG       = 0x40

# Device Sensor Registers
REG_SENSOR = 0x40

def readHtu21dData():
  """
    This function simply programs the remote device address into the master device, then requests the remote sensor
    data.
    All addresses are currently hard-coded for ease of debugging.
  """
  __output_file = open(_THISDEVICE+".json", "a")
  __ser = serial.Serial(port="/dev/cu.usbmodem226541", baudrate=115200)
  # Program which device to access
  # For the address, the LSByte as expected in the nRf devices is sent FIRST, so in the following example:
  #   __byteArray = [_LOCALWRITE,_NRFREG_TXRXADDR,0x01,0x02,0x03,0x04,0x05]
  # 0x01 is the LSByte and 0x05 is the MSByte of the nRf device.
  __byteArray = [_LOCALWRITE,_NRFREG_TXRXADDR,0x01,0x02,0x03,0x04,0x05]
  # Send the device address programming to the master device
  __ser.write(__byteArray)
  # Program a remote read request of the sensor address on the remote device
  __byteArray = [_REMOTEREAD,_HTU21DREG]
  # Send the remote read request to the master device
  __ser.write(__byteArray)
  __data = ''
  # Wait for the remote read response to come back from the master device
  while True:
    __char = __ser.read().decode('utf-8')
    if __char == "\n":
      break
    else:
      __data += __char
  __humidityActual = -6 + 125*(int("%s%s%s%s"%(__data[6],__data[7],__data[4],__data[5]), 16)/65536)
  __temperature = -46.85 + 175.72*(int("%s%s%s%s"%(__data[2],__data[3],__data[0],__data[1]), 16)/65536)
  __humidityCompensated = __humidityActual + (25 - __temperature)*(-0.15)
  __partialPressure = 10**(8.1332-(1762.39/(__temperature+235.66)))
  __dewPoint = -((1762.39/(math.log10(__humidityActual*(__partialPressure/100))-8.1332))+235.66)
  __sampleDate = datetime.datetime.now().isoformat()
  return (__sampleDate, __temperature, __humidityCompensated, __dewPoint)

