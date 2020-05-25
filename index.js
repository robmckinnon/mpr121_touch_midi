const midiBle = require("./midi-ble");

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
    console.log(characteristic);
  },
  setCharacteristicChannel: (uuid, channel) => {
    console.log(uuid, channel);
  }
};


midiBle.initNoble(callback);
