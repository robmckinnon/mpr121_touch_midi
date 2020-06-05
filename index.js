const midi = require('midi');
const MPR121 = require('adafruit-mpr121'),
      mpr121  = new MPR121(0x5A, 1);

const activeSensing = 254;
const noteoff = 8;
const noteon = 9;
const polyat = 10;
const controlchange = 11;
const programchange = 12;
const channelat = 13;
const pitchbend = 14;

// reface cp
const delayDepthCC = 89;
const delayTimeCC = 90;

const output = new midi.Output();

const count = output.getPortCount();

// Get the name of a specified output port.
console.log(output.getPortName(1));// eslint-disable-line

// Open the first available output port.
output.openPort(1);

output.sendMessage([176,22,1]);

// Send a MIDI message.
// output.sendMessage([176,22,1]);

const decToBinary = (d) => { return (d >>> 0).toString(2) };

const noteOn = (channel, note, vel) => {
  const msg = [
    (noteon << 4) + channel,// eslint-disable-line
    note,
    vel];
  // console.log(decToBinary(msg[0]));// eslint-disable-line
  // console.log(msg);// eslint-disable-line
  output.sendMessage(msg);
}

const noteOff = (channel, note) => {
  const msg = [
    (noteoff << 4) + channel,// eslint-disable-line
    note];
  // console.log(decToBinary(msg[0]));// eslint-disable-line
  // console.log(msg);// eslint-disable-line
  output.sendMessage(msg);
}

const controlChange = (channel, control, level) => {
  const value = Math.floor((127 / 11) * level);
  const msg = [
    (controlchange << 4) + channel,
    control,
    value
  ];
  output.sendMessage(msg);
}

// // Close the port when done.
// output.closePort();

const scale = [44, 46, 49, 51, 54, 56, 58, 61, 63, 66, 68, 70]

mpr121.on('touch', (pin) => {
  const note = scale[pin % 12];
  if (note > 61) {
    controlChange(1, delayTimeCC, pin % 12);
  } else {
    noteOn(1, note, 97);
  }
});

mpr121.on('release', (pin) => {
  const note = scale[pin % 12];
  if (note > 61) {
    controlChange(1, delayDepthCC, pin % 12);
  } else {
    noteOff(1, note);
  }
});
