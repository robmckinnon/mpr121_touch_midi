const noble = require('@abandonware/noble');

const midiServiceUUID = '03b80e5aede84b33a7516ce34ec4c700';
const midiCharacteristicUUID = '7772e5db38684112a1a9f2669d106bf3';
const serviceIds = [midiServiceUUID];
const characteristicIds = [midiCharacteristicUUID];

const activeSensing = 254;
const noteoff = 8;
const noteon = 9;
const polyat = 10;
const controlchange = 11;
const programchange = 12;
const channelat = 13;
const pitchbend = 14;
const midiTypes = {
  [noteoff]: 'noteoff',
  [noteon]: 'noteon',
  [polyat]: 'polyat',
  [controlchange]: 'controlchange',
  [programchange]: 'programchange',
  [channelat]: 'channelat',
  [pitchbend]: 'pitchbend',
};

const displayError = (e) => {
  console.log(e);// eslint-disable-line
  console.log(e.message);// eslint-disable-line
};

const parseData = (data) => {
  // How to parse here:
  // const header = data[0];
  // const timestamp = data[1];
  const status = data[2];
  if (status === activeSensing) {
    return false;
  }
  const data1 = data[3];
  const data2 = data[4];

  const channel = (status & 0xF) + 1; // eslint-disable-line
  const type = status >> 4; // eslint-disable-line

  return [type, channel, data1, data2];
};

const onDataImpl = (uuid, callback) => (data) => {
  const array = new Buffer(data).toJSON().data; // eslint-disable-line
  const result = parseData(array);
  if (!result) {
    return;
  }
  const [type, channel, data1, data2] = result; // eslint-disable-line
  console.log(`type: ${midiTypes[type]} channel: ${channel} data1: ${data1} data2: ${data2}`); // eslint-disable-line

  if (channel !== null) {
    callback.setCharacteristicChannel(uuid, channel);
  }
  if (type === noteon) {
    if (data2 === 0) {
      callback.noteOff({ note: data1, channel });
    } else {
      callback.noteOn({ note: data1, velocity: data2, channel });
    }
  } else if (type === noteoff) {
    callback.noteOff({ note: data1, channel });
  } else if (type === controlchange) {
    callback.controlChange({ controlNumber: data1, value: data2, channel });
  } else if (type === polyat) { // eslint-disable-line
  } else if (type === programchange) { // eslint-disable-line
  } else if (type === channelat) { // eslint-disable-line
  } else if (type === pitchbend) { // eslint-disable-line
  }
};

const sendNoteOn = async (characteristic, channel, note, velocity) => {
  if (channel === null) { return null; }
  const { header, messageTimestamp } = getTimestampBytes();
  const midiStatus = (channel - 1) & 0x0f | noteon; // eslint-disable-line
  const midiOne = note;
  const midiTwo = velocity;
  // const midiOne = note & 0x7f;
  // const midiTwo = velocity & 0x7f;
  const packet = new Uint8Array([
    header,
    messageTimestamp,
    midiStatus,
    midiOne,
    midiTwo,
  ]);

  // const temperature = Buffer.alloc(2);
  // temperature.writeUInt16BE(450, 0);

  console.log(packet);
  // const buffer = Buffer.alloc(5);
  // buffer.writeUInt8BE(header, 0);
  // buffer.writeUInt8BE(messageTimestamp, 1);
  // buffer.writeUInt8BE(midiStatus, 2);
  // buffer.writeUInt8BE(midiOne, 3);
  // buffer.writeUInt8BE(midiTwo, 4);
  //
  // console.log(buffer);
  try {
    console.log('writeAsync');
    const buffer = Buffer.from(packet);
    const result = await characteristic.writeAsync(buffer, false);
    console.log('result');
    console.log(result);
    return result;
  } catch (e) {
    displayError(e);
  }
};

const sendNoteOff = async (characteristic, channel, note) => {
  if (channel === null) { return null; }
  const { header, messageTimestamp } = getTimestampBytes();
  const midiStatus = (channel - 1) & 0x0f | noteoff; // eslint-disable-line
  const midiOne = note;
  // const midiTwo = velocity;
  // const midiOne = note & 0x7f;
  // const midiTwo = velocity & 0x7f;
  const packet = new Uint8Array([
    header,
    messageTimestamp,
    midiStatus,
    midiOne
    // midiTwo,
  ]);
  // const buffer = Buffer.alloc(4);
  // buffer.writeUInt8BE(header, 0);
  // buffer.writeUInt8BE(messageTimestamp, 1);
  // buffer.writeUInt8BE(midiStatus, 2);
  // buffer.writeUInt8BE(midiOne, 3);
  // buffer.writeUInt8BE(midiTwo, 4);
  try {
    console.log('writeAsync');
    const buffer = Buffer.from(packet);
    const result = await characteristic.writeAsync(buffer, false);
    console.log('result');
    console.log(result);
    return result;
  } catch (e) {
    displayError(e);
  }
};

const servicesAndCharacteristics = (_uuid, services, characteristics, callback) => {
  const characteristic = characteristics[0]; // eslint-disable-line
  if (characteristic) {
    console.log('---services:');
    console.log(services);
    const onData = onDataImpl(characteristic.uuid, callback);
    characteristic.on('data', (data, _isNotification) => { // eslint-disable-line
      onData(data);
    });
    characteristic.subscribe(); // todo: allow unsubscribe
    callback.setCharacteristic(characteristic);
  }
};

const connectedPeripheral = (peripheral, callback) => {
  peripheral.discoverSomeServicesAndCharacteristics(serviceIds, characteristicIds,
    (e, services, characteristics) => {
      if (e) {
        displayError(e);
        return console.error('error discovering', e); // eslint-disable-line
      }
      console.log('discovered services', services); // eslint-disable-line
      console.log('discovered characteristics', characteristics); // eslint-disable-line
      return servicesAndCharacteristics(peripheral.uuid, services, characteristics, callback);
    });
};

const discoveredPeripheral = (peripheral, callback) => {
  console.log('peripheral found!', peripheral); // eslint-disable-line
  noble.stopScanning();
  if (!peripheral) {
    console.log('No BLE peripheral found.'); // eslint-disable-line
    return;
  }
  console.log('connect to BLE peripheral ...'); // eslint-disable-line
  peripheral.connect((error) => {
    if (error) {
      displayError(error);
      return console.error('error connecting to peripheral', error); // eslint-disable-line
    }
    console.log('connected to peripheral', peripheral); // eslint-disable-line
    return connectedPeripheral(peripheral, callback);
  });
};

const getTimestampBytes = () => {
  const d = Date.now().toString(2).split('').reverse();
  const byte0 = ['1', '0', d[12], d[11], d[10], d[9], d[8], d[7]];
  const byte1 = ['1', d[6], d[5], d[4], d[3], d[2], d[1], d[0]];
  return {
    header: parseInt(byte0.join(''), 2),
    messageTimestamp: parseInt(byte1.join(''), 2),
  };
};

const initNoble = (callback) => {
  noble.on('error', displayError);
  noble._bindings.on('error', displayError);// eslint-disable-line

  noble.on('stateChange', (state) => {
    if (state === 'poweredOn') {
      console.log('poweredOn...'); // eslint-disable-line
      handleScan(callback);
    } else {
      noble.stopScanning();
    }
  });
};

const handleScan = (callback) => {
  console.log(`startScanning`); // eslint-disable-line
  noble.on('discover', (peripheral) => {
    discoveredPeripheral(peripheral, callback);
  });
  const allowDuplicates = false;
  noble.startScanning(serviceIds, allowDuplicates);
};

const sendProgramChange = async (characteristic, channel, value) => {
  if (channel === null) { return null; }
  const { header, messageTimestamp } = getTimestampBytes();
  const midiStatus = channel & 0x0f | programchange; // eslint-disable-line
  const midiOne = value;
  const midiTwo = null;
  // const midiOne = note & 0x7f
  // const midiTwo = velocity & 0x7f;
  const packet = new Uint8Array([
    header,
    messageTimestamp,
    midiStatus,
    midiOne,
    midiTwo,
  ]);
  const result = await characteristic.writeValue(packet);
  return result;
};

const sendControlChange = async (characteristic, channel, controlNumber, value) => {
  if (channel === null) { return null; }
  const { header, messageTimestamp } = getTimestampBytes();
  const midiStatus = channel & 0x0f | controlchange; // eslint-disable-line
  const midiOne = controlNumber;
  const midiTwo = value;
  // const midiOne = note & 0x7f;
  // const midiTwo = velocity & 0x7f;
  const packet = new Uint8Array([
    header,
    messageTimestamp,
    midiStatus,
    midiOne,
    midiTwo,
  ]);
  const result = await characteristic.writeAsync(
    Buffer.from(packet)
  );
  return result;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.initNoble = initNoble;
exports.handleScan = handleScan;
exports.sendControlChange = sendControlChange;
exports.sendNoteOff = sendNoteOff;
exports.sendNoteOn = sendNoteOn;
exports.sendProgramChange = sendProgramChange;
