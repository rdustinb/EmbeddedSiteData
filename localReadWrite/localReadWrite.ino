// Communication to the nRF24L01 is over SPI
#include <SPI.h>
// Configuration changes to the nRF24L01 is also stored in EEPROM for when power is cycled
#include <EEPROM.h>
// Interrupt library for the Teensy devices
#include <avr/io.h>
#include <avr/interrupt.h>

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
#define NRFCSn        10
#define NRFIRQn       6
#define NRFCE         4
#define SERIALRATE    115200
#define DELAY2X       (1024000/(float)(SERIALRATE))
#define IDLE          0
#define RECEIVING     1
#define AVAILABLE     2
uint32_t lastTime;
int lastCount;
uint32_t *p_lastTime = &lastTime;
int *p_lastCount = &lastCount;
uint8_t len;
uint8_t cmd;
uint8_t addr;
uint8_t status;
uint8_t data[7];
uint8_t reg[5];
uint8_t *p_len = &len;
uint8_t *p_cmd = &cmd;
uint8_t *p_addr = &addr;
uint8_t *p_status = &status;
uint8_t *p_data = data;
uint8_t *p_reg = reg;
enum States {WAITFORCOMMAND,PROCESSCOMMAND,WAITFORTX,WAITFORTXTORX,WAITFORRESP} state;

void setup() {
  Serial.begin(SERIALRATE);
  // Setup the nRF Pins
  pinMode(NRFCSn, OUTPUT);
  pinMode(NRFIRQn, INPUT_PULLUP);
  pinMode(NRFCE, OUTPUT);
  digitalWrite(NRFCSn, HIGH);
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
  // Define Initial State
  state = WAITFORCOMMAND;
  // Setup the Interrupt Pin, parameterized
  attachInterrupt(NRFIRQn, nrfISR, FALLING);
}

void loop() {
  switch(state){
    case WAITFORCOMMAND:
      if(receiveCommand(p_lastTime, p_lastCount, p_data) == AVAILABLE){
        state = PROCESSCOMMAND;
      }
      break;
    case PROCESSCOMMAND:
      // Decoding the command, the access type falls right out of it
      switch(p_data[0]){
        // Remote Read
        case 0x00:
          *p_len = 2;
          writeTxPacket(p_data, p_len);  // Contains CMD Byte and ADDR Byte
          state = WAITFORTXTORX;
          break;
        // Remote Write
        case 0x01:
          unpackCommand(p_data, p_addr, p_reg, p_len);
          *p_len = *p_len + 2;          // Length returns as the length of the regData only
          writeTxPacket(p_data, p_len);  // Contains CMD Byte, ADDR Byte, and 1-5 DATA Bytes
          state = WAITFORTX;
          break;
        // Local Read
        case 0x02:
          unpackCommand(p_data, p_addr, p_reg, p_len);
          readRegSpace(p_addr);
          state = WAITFORCOMMAND;
          break;
        // Local Write
        case 0x03:
          unpackCommand(p_data, p_addr, p_reg, p_len);
          writeRegSpace(p_addr, p_reg);
          state = WAITFORCOMMAND;
          break;
        // Default
        default:
          Serial.print("Invalid Command -- ");
          Serial.println(p_data[0], HEX);
          break;
      }
      break;
    case WAITFORTX:
      if(nrfResults == 1){
        nrfResults = 0;
        *p_status = 0;
        clearFifosAndStatus(p_status);
        // Decode the status
        if((*p_status & 0x70) == 0x10){
          Serial.print("Tx retry limit\n");
          state = WAITFORCOMMAND;
        }else if((*p_status & 0x70) == 0x20){
          Serial.print("Tx complete\n");
          state = WAITFORCOMMAND;
        }
      }
      break;
    case WAITFORTXTORX:
      if(nrfResults == 1){
        nrfResults = 0;
        *p_status = 0;
        clearFifosAndStatus(p_status);
        // Decode the status
        if((*p_status & 0x70) == 0x10){
          Serial.print("Tx retry limit\n");
          state = WAITFORCOMMAND;
        }else if((*p_status & 0x70) == 0x20){
          powerUpRx();
          state = WAITFORRESP;
        }else{
          Serial.print(*p_status, HEX);
          Serial.print(" -- WTF?!?\n");
        }
      }
      break;
    case WAITFORRESP:
      if(nrfResults == 1){
        nrfResults = 0;
        readRxPacket();
        *p_status = 0;
        clearFifosAndStatus(p_status);
        state = WAITFORCOMMAND;
      }
      break;
  }
}

uint8_t receiveCommand (uint32_t *lastTime, int *lastCount, uint8_t *data) {
  /*
   *  If the receive buffer has received data but it has not stabilized (a form of debouncing, so that the entire data
   *  command is received before this file idicates there is a command ready), the calling function should delay a
   *  reasonable amount of time (1-2ms) but not too long before resampling the returned value of this fuction.
   */
  if(Serial.available() > 0) {
    // We are still getting data
    if(*lastCount != Serial.available()) {
      // Update the last count value so the next read is decoded properly
      *lastCount = Serial.available();
      *lastTime = millis();
      return RECEIVING;
    // Data reception has stabilized
    } else {
      // Have we delayed long enough to confirm all data has been captured -- this delay value is one entire
      // full transfer packet time, doubled, in ms...which is 8 * 64 * 2 * 1000 / rate
      if((millis() > (*lastTime + DELAY2X)) && (*lastTime != 0)) {
        for(int i=0; i<*lastCount; i++){
          // Verify received data is not bigger than buffer size
          // CMD + ADDR + DATA[0:4] == 7
          if(i <= 7){
            data[i] = Serial.read();
          }else{
            // Flush the rest of the buffer
            Serial.read();
          }
        }
        return AVAILABLE;
      } else {
        return RECEIVING;
      }
    }
  // Just return if there is no data
  } else {
    *lastTime = 0;
    // Reset Buffer Pointers otherwise the next command is essentially masked in the receive logic above
    *lastCount = 0;
    return IDLE;
  }
}

void unpackCommand(uint8_t *data, uint8_t *regAddress, uint8_t *regData, uint8_t *regLength){
  /*
   *  This function is only used for local register reads and writes as the commands received that are for a remote
   *  device will be passed without any unpacking or alterations. However for usefullness it can also be used to simply
   *  get the length of the data buffer for writing out an outgoing nRF packet.
   */
  *regAddress = data[1];
  if(*regAddress == 0x0a || *regAddress == 0x0b || *regAddress == 0x10){
    *regLength = 5;
    // The incoming data buffer is always bounded with at least 7 bytes so to simplify the code, just always pack the
    // outgoing regData buffer with the bytes in these locations but then don't use them if this is for a read
    for(int i=0; i<5; i++){
      regData[i] = data[i+2];
    }
  }else{
    *regLength = 1;
    regData[0] = data[2];
  }
}

void writeTxPacket(uint8_t *data, uint8_t *length){
  /*  The writeTxPacket function will handle all of the SPI commanding and handshaking necessary to send a buffer worth
   *  of bytes to the nRF24L01 and command it to send the data. This function assumes the nRF24L01 is already powered up
   *  and can accept a packet for transmission.
   */
  // Power up in Tx Mode:
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x20); // Write (0x20) the CONFIG (0x00) register
  SPI.transfer(0x0A);
  digitalWrite(NRFCSn, HIGH);
  // Wait for 1.5ms after Power Up Command
  delay(2);

  clearFifosAndStatus(p_status);

  // Load Tx Buffer:
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0xA0); // W_TX_PAYLOAD command
  for(uint8_t i=0; i<*length; i++){
    SPI.transfer(data[i]);
  }
  digitalWrite(NRFCSn, HIGH);

  // Enable Tx:
  for(uint8_t i=0; i<23; i++){
    // Make this only high as close to 10us as possible (this on the teensy is 10.5us
    digitalWrite(NRFCE, HIGH);
  }
  digitalWrite(NRFCE, LOW); // Go back to Standby 1 mode
}

void readRxPacket(){
  /*  This function is similar to the same named function in the remote readwrite device except that the data output in
   *  this function is simply printed to the Serial interface which is the main command and control pipe.
   */
  uint8_t tempData;
  // Get number of bytes received
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x60); // R_RX_PL_WID command
  uint8_t byteRxCount = SPI.transfer(0xFF); // NOP command
  digitalWrite(NRFCSn, HIGH);

  // Read out Received Bytes
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x61); // R_RX_PAYLOAD command
  for(uint8_t i=0; i<byteRxCount; i++){
    // Cap the end of the buffer, prevents a stack overflow
    if(i<8){
      tempData = (uint8_t)(SPI.transfer(0xFF)); // NOP command
      if(tempData < 0x10){
        Serial.print('0');
      }
      Serial.print(tempData, HEX);
    }else{
      SPI.transfer(0xFF); // NOP command
    }
  }
  Serial.print("\n");
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
    // Multi Byte Locations (Rx Pipe 0, Tx Pipe 0)
    case 0x0a: case 0x10:
      for(uint8_t i=0; i<5; i++){
        EEPROM.update(i, data[i]);        // Store pipe address so this address is used after power is cycled
      }
      configCommsPipe(data);
      break;
    // Multi Byte Locations (Rx Pipe 1)
    case 0x0b:
      // Write the current Configuration to the nRF24L01
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x20+*address);           // A Write to a register is signified by a bit set in location 5, then the
                                            // lower bits are used as an address
      for(uint8_t i=0; i<5; i++){
        SPI.transfer(data[i]);
      }
      digitalWrite(NRFCSn, HIGH);
      break;

    // Sensor Registers (0x40 + ) (currently read only)
  }

  // Null return to not lockup script
  Serial.print("writeRegSpace\n");
}

void readRegSpace(uint8_t *address){
  /*  This function is similar in structure as that in the remote readwrite device except that the read results are
   *  simply printed to the Serial interface, which is the main communications pipe back to the master Python script.
   */
  uint8_t tempData;
  switch(*address){
    // Single Byte STATUS
    case 0x07:
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x00+*address);
      tempData = SPI.transfer(0xff);
      if(tempData < 0x10){
        Serial.print('0');
      }
      Serial.print(tempData, HEX);
      Serial.print("\n");
      digitalWrite(NRFCSn, HIGH);
      break;
    // Single Byte Locations except STATUS
    case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x08: case 0x09:
    case 0x0c: case 0x0d: case 0x0e: case 0x0f: case 0x11: case 0x12: case 0x13: case 0x14:
    case 0x15: case 0x16: case 0x17: case 0x1c: case 0x1d:
      // Read from any register except the STATUS register requires NOP to be sent after the command+address byte
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x00+*address);
      tempData = SPI.transfer(0xff);         // Send a NOP over SPI to read back on the MISO line
      if(tempData < 0x10){
        Serial.print('0');
      }
      Serial.print(tempData, HEX);
      Serial.print("\n");
      digitalWrite(NRFCSn, HIGH);
      break;
    // Multi Byte Locations (Rx Pipe 0, Rx Pipe 1, Tx Pipe 0)
    case 0x0a: case 0x0b: case 0x10:
      digitalWrite(NRFCSn, LOW);
      SPI.transfer(0x00+*address);
      for(uint8_t i=0; i<5; i++){
        tempData = SPI.transfer(0xff);
        if(tempData < 0x10){
          Serial.print('0');
        }
        Serial.print(tempData, HEX);
      }
      Serial.print("\n");
      digitalWrite(NRFCSn, HIGH);
      break;
  }
}

void configCommsPipe(uint8_t *data){
  // Write the current Configuration to the nRF24L01
  // LSByte of the address is expected to be in data[0], the MSByte is expected to be in data[4]
  // Rx Address of the Pipe
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x20+0x0a);
  for(uint8_t i=0; i<5; i++){
    SPI.transfer(data[i]);
  }
  digitalWrite(NRFCSn, HIGH);
  delay(1);
  // Tx Address of the Pipe
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x20+0x10);
  for(uint8_t i=0; i<5; i++){
    SPI.transfer(data[i]);
  }
  digitalWrite(NRFCSn, HIGH);
  delay(1);
}

void clearFifosAndStatus(uint8_t *p_stat){
  // Clear STATUS Register Flags
  digitalWrite(NRFCSn, LOW);
  *p_stat = SPI.transfer(0x07+0x20);
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

void powerDown(){
  digitalWrite(NRFCE, LOW);
  delay(1);
  digitalWrite(NRFCSn, LOW);
  SPI.transfer(0x00+0x20);  // Write Reg (001x_xxxx)
  SPI.transfer(0x00);               // Power Down
  digitalWrite(NRFCSn, HIGH);
  // Wait 1.5ms to allow power down to occur
  delay(2);
}

void powerUpRx(){
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
  SPI.transfer(0x0B);
  digitalWrite(NRFCSn, HIGH);
  delay(2);
  digitalWrite(NRFCE, HIGH);
  delay(1);
}

void test_writeTxPacket(uint8_t *data, uint8_t *length){
  Serial.print("*data: 0x");
  for(int i=0; i<*length; i++){
    if(data[i] < 0x10){
      Serial.print('0');
    }
    Serial.print(data[i], HEX);
  }
  Serial.print(" *length: 0x");
  if(*length < 0x10){
    Serial.print('0');
  }
  Serial.println(*length, HEX);
}
void test_readRxPacket(uint8_t *command, uint8_t *address, uint8_t *data){
  Serial.print("*command: 0x");
  if(*command < 0x10){
    Serial.print('0');
  }
  Serial.print(*command, HEX);
  Serial.print(" *address: 0x");
  if(*address < 0x10){
    Serial.print('0');
  }
  Serial.println(*address, HEX);
}
void test_writeRegSpace(uint8_t *address, uint8_t *data, uint8_t *length){
  Serial.print("*address: 0x");
  if(*address < 0x10){
    Serial.print('0');
  }
  Serial.print(*address, HEX);
  if(*address == 0x0a || *address == 0x0b || *address == 0x10){
    Serial.print(" *data: 0x");
    for(int i=0; i<5; i++){
      if(data[i] < 0x10){
        Serial.print('0');
      }
      Serial.print(data[i], HEX);
    }
  }else{
    Serial.print(" *data: 0x");
    if(data[0] < 0x10){
      Serial.print('0');
    }
    Serial.print(data[0], HEX);
  }
  Serial.print(" *length: 0x");
  if(*length < 0x10){
    Serial.print('0');
  }
  Serial.println(*length, HEX);
}
void test_readRegSpace(uint8_t *address){
  Serial.print("*address: 0x");
  if(*address < 0x10){
    Serial.print('0');
  }
  Serial.println(*address, HEX);
}
