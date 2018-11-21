//  TODO Items
//  1. Since I have segregated out register reads and writes of the nRF device itself from actual Tx and Rx operations,
//    does the CE need to be active to simply read and write register in the nRF device?

// Communication to the nRF24L01 is over SPI
#include <SPI.h>
// Communication with the sensor is over I2C
#include <Wire.h>
// Configuration changes to the nRF24L01 is also stored in EEPROM for when power is cycled
#include <EEPROM.h>

/*********************************/
/******** nRF Result ISR *********/
/*********************************/
volatile uint8_t nrfResults = 0;
void nrfISR(){
  cli();
  nrfResults = 1;
  sei();
}

/*********************************/
/********** Main Setup ***********/
/*********************************/
#define NRFCSn      10
#define NRFIRQn     3
#define NRFCE       4
#define BUFFDEPTH   16
uint8_t len;
uint8_t cmd;
uint8_t addr;
uint8_t data[BUFFDEPTH];
uint8_t *p_len = &len;
uint8_t *p_cmd = &cmd;
uint8_t *p_addr = &addr;
uint8_t *p_data = data;
enum States {STARTUPINRX,WAITFORRX,PROCESSRX,TXPACKET,WAITFORTX} state;

void setup(){
  Serial.begin(115200);
  Wire.begin();
  // Setup the nRF Pins
  pinMode(NRFCSn, OUTPUT);
  pinMode(NRFIRQn, INPUT_PULLUP);
  pinMode(NRFCE, OUTPUT);
  digitalWrite(NRFCSn, HIGH);
  digitalWrite(NRFCE, LOW);
  // Begin SPI for the nRF Device
  SPI.begin();
  // Enable Extended Features
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x50);
  SPI.transfer(0x73); // Magic Value for Activate
  digitalWrite(NRFCSn, HIGH);
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x1c+0x20);
  SPI.transfer(0x1); // Dynamic Payload per Pipe, Pipe 0 Only
  digitalWrite(NRFCSn, HIGH);
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x1d+0x20);
  SPI.transfer(0x4); // Dynamic Payload Enable
  digitalWrite(NRFCSn, HIGH);

  // Configure the nRf from EEPROM if magic value is set
  if(EEPROM.read(0x0) == 0xa5){
    // Read the stored address for this device, address is EEPROM Address 0x1-0x6
    for(int i=1; i<6; i++){
      data[i] = EEPROM.read(i);
    }
    // Load the stored addres
    configCommsPipe(p_data);
  }

  // Define Initial State
  state = STARTUPINRX;
  // nRF24L01 fires an interrupt when Tx Fails, Tx has finished sending or Rx data is available
  attachInterrupt(digitalPinToInterrupt(NRFIRQn), nrfISR, FALLING);
  // Setup the nRF24L01
  power_up_rx();
}

/*********************************/
/*********** Main Loop ***********/
/*********************************/
void loop(){
  // FSM for what to do next and what we are currently working on
  switch(state){
    case STARTUPINRX:
      state = WAITFORRX;
      break;
    case WAITFORRX:
      if(nrfResults == 1){
        nrfResults = 0;
        readRxPacket(p_cmd, p_addr, p_data); // This returns in Standby 1 Mode
        state = PROCESSRX;
      }
      break;
    case PROCESSRX:
      if(*p_cmd == 0x00) {
        readRegSpace(p_addr, p_data, p_len);
        clearFifosAndStatus();
        state = TXPACKET;
      } else if(*p_cmd == 0x01) {
        writeRegSpace(p_addr, p_data);
        clearFifosAndStatus();
        // Setup the nRF24L01
        power_up_rx();
        state = STARTUPINRX;
      }
      break;
    case TXPACKET:
      writeTxPacket(p_data, p_len); // After transmission, this returns to Standby 1 Mode
      state = WAITFORTX;
      break;
    case WAITFORTX:
      if(nrfResults == 1){
        nrfResults = 0;
        clearFifosAndStatus();
        // Setup the nRF24L01
        power_up_rx();
        state = STARTUPINRX;
      }
      break;
  }
}

void writeTxPacket(uint8_t *data, uint8_t *length){
  /*  The writeTxPacket function will handle all of the SPI commanding and handshaking necessary to send a buffer worth
   *  of bytes to the nRF24L01 and command it to send the data. This function assumes the nRF24L01 is already powered up
   *  and can accept a packet for transmission.
   */
  // Power up in Tx Mode:
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x00+0x20); // Write (0x20) the CONFIG (0x00) register
  SPI.transfer(0x0A);
  digitalWrite(NRFCSn, HIGH);
  delay(2);

  clearFifosAndStatus();

  // Load Tx Buffer:
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0xA0); // W_TX_PAYLOAD command
  for(uint8_t i=0; i<*length; i++){
    SPI.transfer(data[i]);
  }
  digitalWrite(NRFCSn, HIGH);

  // Enable Tx:
  for(uint8_t i=0; i<2; i++){
    // Make this only high as close to 10us as possible, this on the Arduino Pro Mini is about 14us
    digitalWrite(NRFCE, HIGH);
  }
  digitalWrite(NRFCE, LOW); // Go back to Standby 1 mode
}

void readRxPacket(uint8_t *command, uint8_t *address, uint8_t *data){
  /*  This function will first capture the number of bytes available in the Rx buffer and then immediately read out the
   *  buffer and properly parse the command, address and data into the respective pointer buffers passed to this
   *  function. The Rx buffer must already hace data in it before this function is called.
   */
  // Get number of bytes received
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x60); // R_RX_PL_WID command
  uint8_t byteRxCount = SPI.transfer(0xFF); // NOP command
  digitalWrite(NRFCSn, HIGH);

  // Read out Received Bytes
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x61); // R_RX_PAYLOAD command
  for(uint8_t i=0; i<byteRxCount; i++){
    if(i==0){
      *command = (uint8_t)(SPI.transfer(0xFF)); // NOP command
    }else if(i==1){
      *address = (uint8_t)(SPI.transfer(0xFF)); // NOP command
    }else{
      // Cap the end of the buffer, prevents a stack overflow
      if(i<(BUFFDEPTH+2)){
        data[(i-2)] = (uint8_t)(SPI.transfer(0xFF)); // NOP command
      }else{
        SPI.transfer(0xFF); // NOP command, drop the incoming byte on the floor, no more room for it
      }
    }
  }
  digitalWrite(NRFCSn, HIGH);
  delay(1);
  digitalWrite(NRFCE, LOW); // Go back to Standby 1 mode
}

void writeRegSpace(uint8_t *address, uint8_t *data){
  /*  Sending a write request, with an address and a data payload to this device will allow the remote device to write
   *  the nRF24L01 configuration space (0x00 - 0x1D, one to one mapping of address) and any control mechanisms attached
   *  to this controller.
   */
  switch(*address){
    // Single Byte Locations
    case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x07:
    case 0x0c: case 0x0d: case 0x0e: case 0x0f: case 0x11: case 0x12: case 0x13: case 0x14:
    case 0x15: case 0x16: case 0x17: case 0x1c: case 0x1d:
      // Write the current Configuration to the nRF24L01
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x20+*address);           // A Write to a register is signified by a bit set in location 5, then the
                                            // lower bits are used as an address
      SPI.transfer(data[0]);
      digitalWrite(NRFCSn, HIGH);
      break;
    // Multi Byte Locations (Rx Pipe 0, Tx Pipe 0), a write to either Rx or Tx address will update both, prevents
    // mismatched data pipe addresses
    case 0x0a: case 0x10:
      // If the Pipe address is changed, also store address for this device in EEPROM
      // address is EEPROM Address 0x1-0x6
      for(uint8_t i=1; i<6; i++){
        EEPROM.update(i, data[i-1]);      // Store pipe address so this address is used after power is cycled
      }
      EEPROM.update(0, 0xA5);             // Also update the magic word register so the device boots with this new
                                          // address
      configCommsPipe(data);
      break;

    // EEPROM Locations (0x20 + )
    case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27:
    case 0x28: case 0x29: case 0x2a: case 0x2b: case 0x2c: case 0x2d: case 0x2e: case 0x2f:
      EEPROM.update(*address-0x20, data[0]);
      break;

    // Sensor Registers (0x40 + ) (currently read only)
  }
}

void readRegSpace(uint8_t *address, uint8_t *data, uint8_t *length){
  /*  Sending a read command with an address to this device will allow the remote device to read the nRF24L01
   *  configuration space (0x00 - 0x1D, one to one mapping of address) and also read any attached sensors.
   */
  switch(*address){
    // Single Byte STATUS
    case 0x07:
      digitalWrite(NRFCSn, LOW);
      data[0] = SPI.transfer(0x00+*address);
      digitalWrite(NRFCSn, HIGH);
      *length = 1;
      break;
    // Single Byte Locations except STATUS
    case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x08: case 0x09:
    case 0x0c: case 0x0d: case 0x0e: case 0x0f: case 0x11: case 0x12: case 0x13: case 0x14:
    case 0x15: case 0x16: case 0x17: case 0x1c: case 0x1d:
      // Read from any register except the STATUS register requires NOP to be sent after the command+address byte
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x00+*address);
      data[0] = SPI.transfer(0xff);         // Send a NOP over SPI to read back on the MISO line
      digitalWrite(NRFCSn, HIGH);
      *length = 1;
      break;
    // Multi Byte Locations (Rx Pipe 0, Rx Pipe 1, Tx Pipe 0)
    case 0x0a: case 0x0b: case 0x10:
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x00+*address);
      for(uint8_t i=0; i<5; i++){
        data[i] = SPI.transfer(0xff);
      }
      digitalWrite(NRFCSn, HIGH);
      *length = 5;
      break;

    // EEPROM Locations (0x20 + )
    case 0x20: case 0x21: case 0x22: case 0x23: case 0x24: case 0x25: case 0x26: case 0x27:
    case 0x28: case 0x29: case 0x2a: case 0x2b: case 0x2c: case 0x2d: case 0x2e: case 0x2f:
      digitalWrite(NRFCSn, LOW);
      data[0] = EEPROM.read(*address-0x20);
      digitalWrite(NRFCSn, HIGH);
      *length = 1;
      break;

    // Sensor Registers (0x40 + )
    case 0x40:
      sampleHtu21d(data);         // Sensor function will fill the data buffer directly
      *length = 4;
      break;
  }
}

void configCommsPipe(uint8_t *data){
  // Write the current Configuration to the nRF24L01
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x20+0x0a);
  for(uint8_t i=0; i<5; i++){
    SPI.transfer(data[i]);
  }
  digitalWrite(NRFCSn, HIGH);
  delay(1);
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x20+0x10);
  for(uint8_t i=0; i<5; i++){
    SPI.transfer(data[i]);
  }
  digitalWrite(NRFCSn, HIGH);
  delay(1);
}

void clearFifosAndStatus(){
  // Clear STATUS Register Flags
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x07+0x20);
  SPI.transfer(0x70);
  digitalWrite(NRFCSn, HIGH);
  delay(1);
  // Clear Rx FIFOs
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0xE2);
  digitalWrite(NRFCSn, HIGH);
  delay(1);
  // Clear Tx FIFOs
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0xE1);
  digitalWrite(NRFCSn, HIGH);
  delay(1);
}

void power_up_rx(){
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x01+0x20); // Write (0x20) the EN Auto ACK (0x01) register
  SPI.transfer(0x01); // Only one Rx pipe enabled
  digitalWrite(NRFCSn, HIGH);

  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x02+0x20); // Write (0x20) the EN Rx Addr (0x02) register
  SPI.transfer(0x01); // Only one Rx pipe enabled
  digitalWrite(NRFCSn, HIGH);

  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x00+0x20); // Write (0x20) the CONFIG (0x00) register
  SPI.transfer(0x0B); // Power Up and RX Mode
  digitalWrite(NRFCSn, HIGH);
  delay(2);
  digitalWrite(NRFCE, HIGH);
  delay(1);
}

void sampleHtu21d(uint8_t *data){
  /*  This is the sensor sample routine for the HTU21D temperature and humidity sensor.
   */
  // Temperature
  Wire.beginTransmission(0x40);
  Wire.write(0xE3);               // Temperature Register over I2C
  Wire.endTransmission(0);
  Wire.requestFrom(0x40, 3);
  while(3 > Wire.available());
  data[1] = Wire.read() & 0xff;   // Temperature High Byte
  data[0] = Wire.read() & 0xfc;   // Temperature Low Byte
  Wire.read(); // Checksum, don't do anything with this yet

  // Humidity
  Wire.beginTransmission(0x40);
  Wire.write(0xE5);               // Humidity Register over I2C
  Wire.endTransmission(0);
  Wire.requestFrom(0x40, 3);
  while(3 > Wire.available());
  data[3] = Wire.read() & 0xff;   // Humidity High Byte
  data[2] = Wire.read() & 0xf0;   // Humidity Low Byte
  Wire.read(); // Checksum, don't do anything with this yet
}
