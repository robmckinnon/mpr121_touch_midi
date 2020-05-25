const midiBle = require("./midi-ble");

let _characteristic = null;
let _channel = null;
const callback = {
  controlChange: ({ controlNumber, value, channel }) => {
    console.log({ controlNumber, value, channel });
  },
  noteOn: ({ note, velocity, channel }) => {
    console.log({ note, velocity, channel });
  },
  noteOff: ({ note, channel }) => {
    console.log({ note, channel });
  },
  setCharacteristic: (characteristic) => {
    console.log('--- characteristic ---');
    console.log(characteristic);
    console.log('---');
    _characteristic = characteristic;
  },
  setCharacteristicChannel: (uuid, channel) => {
    console.log('--- channel ---');
    console.log(uuid, channel);
    console.log('---');
    _channel = channel;
  }
};

midiBle.initNoble(callback);

const MPR121 = require('adafruit-mpr121'),
      mpr121  = new MPR121(0x5A, 1);

mpr121.on('touch', (pin) => {
  console.log(`pin ${pin} touched`);
  if (_characteristic && _channel) {
    const note = pin + 50;
    console.log(`value ${note}`);
    midiBle.sendNoteOn(_characteristic, _channel, note, 97);
  }
});

mpr121.on('release', (pin) => {
  console.log(`pin ${pin} released`);
  if (_characteristic && _channel) {
    const note = pin + 50;
    midiBle.sendNoteOff(_characteristic, _channel, note);
  }
});
