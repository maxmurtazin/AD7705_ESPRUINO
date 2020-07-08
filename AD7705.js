/////////////pins////////////////////////////////////////
let pinMOSI = P2; //MOSI
let pinMISO = P3; //MISO
let pinSPIClock = A5; //SCK
let pinCS = P5; //CS 1
//let pinCS2 = P6;// CS 2
//let pinCS3 = P7;//CS 3
////////////////////////////////////////////////////s//
let REG_CMM = 0x0; //communication register 8 bit
let REG_SETUP = 0x1; //setup register
let REG_CLOCK = 0x2; //clock register 8 bit
let REG_DATA = 0x3; //data register 16 bit, contains conversion result
//////////////////////////////////////////////////////////////////////////
let REG_TEST = 0x4; //test register 8 bit, POR 0x0
let REG_NOP = 0x5; //no operation
let REG_OFFSET = 0x6; //offset register 24 bit
let REG_GAIN = 0x7; // gain register
    //channel selection for AD7706 (for AD7705 use the first two channel definitions)
    //CH1 CH0
let CHN_AIN1 = 0x0; //AIN1; calibration register pair 0
let CHN_AIN2 = 0x1; //AIN2; calibration register pair 1
    //output update rate
    //CLK FS1 FS0
let  UPDATE_RATE_20 = 0x0; // 20 Hz
let  UPDATE_RATE_25 = 0x1; // 25 Hz
let  UPDATE_RATE_100 = 0x2; // 100 Hz
let  UPDATE_RATE_200 = 0x3; // 200 Hz
let  UPDATE_RATE_50 = 0x4; // 50 Hz
let  UPDATE_RATE_60 = 0x5; // 60 Hz
let  UPDATE_RATE_250 = 0x6; // 250 Hz
let  UPDATE_RATE_500 = 0x7; // 500 Hz
    //operating mode options
    //MD1 MD0
let  MODE_NORMAL = 0x0; //normal mode
let  MODE_SELF_CAL = 0x1; //self-calibration
let  MODE_ZERO_SCALE_CAL = 0x2; //zero-scale system calibration, POR 0x1F4000, set FSYNC high before calibration, FSYNC low after calibration
let  MODE_FULL_SCALE_CAL = 0x3; //full-scale system calibration, POR 0x5761AB, set FSYNC high before calibration, FSYNC low after calib
    //set
let  GAIN_1 = 0x0;
let  GAIN_2 = 0x1;
let  GAIN_4 = 0x2;
let  GAIN_8 = 0x3;
let  GAIN_16 = 0x4;
let  GAIN_32 = 0x5;
let  GAIN_64 = 0x6;
let  GAIN_128 = 0x7;
let  UNIPOLAR = 0x0;
let  BIPOLAR = 0x1;
///////////////////////////
let  CLK_DIV_1 = 0x1;
let  CLK_DIV_2 = 0x2;
let VRef;
let vref;

////////////////////////////////////////
function spiTransfer(data) {
    var SPDR = data;
    while (!(SPSR & (1<<SPIF))) {
    return SPDR}
}
/////////////////////////////////////////////////////////////
function setNextOperation(reg, channel,  readWrite) {
    let r = 0;
    r = reg << 4 | readWrite << 3 | channel;
    digitalWrite(pinCS, 0);
    spiTransfer(r);
    digitalWrite(pinCS, 1);
}
//////////////////////////////////////////////////////////////////
function writeClockRegister(CLKDIS,  CLKDIV,  outputUpdateRate) {
    let r = CLKDIS << 4 | CLKDIV << 3 | outputUpdateRate;
    r &= ~(1 << 2); // clear CLK
    digitalWrite(pinCS, 0);
    spiTransfer(r);
    digitalWrite(pinCS, 1);
}
//////////////////////////////////////////////////////////////////////////////////
function writeSetupRegister( operationMode, gain, unipolar, buffered, fsync) {
    let r = operationMode << 6 | gain << 3 | unipolar << 2 | buffered << 1 | fsync;
    digitalWrite(pinCS, LOW);
    spiTransfer(r);
    digitalWrite(pinCS, HIGH);
}
////////////////////////////////////////////////////////////////
function readADResult(){
    digitalWrite(pinCS, 0);
     let b1 = spiTransfer(0x0);
     let b2 = spiTransfer(0x0);
    digitalWrite(pinCS, 1);
    let r = b1 << 8 | b2;
    return r;
}
//////////////////////////////////////////////////////////////////////
function readADResultRaw(channel) {
    while (!dataReady(channel)) {
    }
    setNextOperation(REG_DATA, channel, 1);
    return readADResult();
}
///////////////////////////////////////////////////////////////
function readADResult( channel,  refOffset) {
    return readADResultRaw(channel) * 1.0 / 65536.0 * VRef - refOffset;
}
//////////////////////////////////////////////////////////////////
function dataReady(channel) {
    setNextOperation(REG_CMM, channel, 1);
    digitalWrite(pinCS, 0);
    let b1 = spiTransfer(0x0);
    digitalWrite(pinCS, 1);
    return (b1 & 0x80) == 0x0;
}
///////////////////////////////////////////////////////////////
function reset() {
    digitalWrite(pinCS, 0);
    for ( i = 0; i < 100; i++)
    spiTransfer(0xff);
    digitalWrite(pinCS, 1);
}
/////////////////////////////////////////////////////////////////////
function AD770X(vref) {
    VRef = vref;
    pinMode(pinMOSI, OUTPUT);
    pinMode(pinMISO, INPUT);
    pinMode(pinSPIClock, OUTPUT);
    pinMode(pinCS, OUTPUT);
    digitalWrite(pinCS, 1);
    let SPCR = _BV(SPE) | _BV(MSTR) | _BV(CPOL) | _BV(CPHA) | _BV(SPI2X) | _BV(SPR1) | _BV(SPR0);
}
/////////////////////////////////////////////////////////////////////////////////////////////
function init( channel,  clkDivider,  polarity,  gain, updRate) {
    setNextOperation(REG_CLOCK, channel, 0);
    writeClockRegister(0, clkDivider, updRate);
    setNextOperation(REG_SETUP, channel, 0);
    writeSetupRegister(MODE_SELF_CAL, gain, polarity, 0, 0);
    while (!dataReady(channel)) {
    }
}
////////////////////////////////////////////////////////////////////////////////////////
function init(channel) {
    init(channel, CLK_DIV_1, BIPOLAR, GAIN_1, UPDATE_RATE_25);
}

//////////////////////////////////////////////////////////////////////////////////////
////////////////////////////test////////////////////////////////////////////////

//AD770X (5);//vRef
reset();
init(CHN_AIN1);
init(CHN_AIN2);
/////////////////////////////////////////
let ch1 = readADResult(CHN_AIN1);
let ch2 = readADResult(CHN_AIN2);


function  sayHi() {
    console.log('D1______'+ ch1);// first chADC
    console.log('D2______'+ ch2);// second chADC

}
setInterval(sayHi, 2000);