var initChannels = require('./helpers/init-channels');
var test = require('tape');
var Duplex = require('stream').Duplex;
var through = require('through');
var channelstream = require('..');
var dcs;
var stream;

test('initialize channels', function(t) {
  t.plan(2);
  initChannels(function(err, channels) {
    t.ifError(err);
    dcs = channels;
    t.equal(dcs.length, 2);
  });
});

test('set the data channels to arraybuffer binary mode', function(t) {
  t.plan(2);
  dcs[0].binaryType = 'arraybuffer';
  dcs[1].binaryType = 'arraybuffer';

  t.equal(dcs[0].binaryType, 'arraybuffer');
  t.equal(dcs[1].binaryType, 'arraybuffer');
});

test('create a data stream on dc:1', function(t) {
  t.plan(1);
  stream = channelstream(dcs[1]);
  t.ok(stream instanceof Duplex, 'created stream object');
});

test('can read (non flowing mode)', function(t) {
  t.plan(1);

  function readData() {
    var data = stream.read();

    if (data) {
      stream.removeListener('readable', readData);
      t.equal(data.toString(), 'hello1');
    }
  }

  stream.on('readable', readData);
  dcs[0].send('hello1');
});

test('can read from the stream', function(t) {
  t.plan(1);

  stream.once('data', function handleData(buffer) {
    t.equal(buffer.toString(), 'hello2');
  });

  dcs[0].send('hello2');
});

test('can read through', function(t) {
  t.plan(1);

  stream.pipe(through()).once('data', function(buffer) {
    t.equal(buffer.toString(), 'hello3');
  });

  dcs[0].send('hello3');
});

test('can read binary data', function(t) {
  t.plan(4);

  stream.once('data', function handleData(buffer) {
    // validate that the buffer is a buffer instance
    t.ok(buffer instanceof Buffer, 'got a Buffer instance');
    t.equal(buffer.length, 2, 'buffer is expected length')
    t.equal(buffer[0], 0xFF);
    t.equal(buffer[1], 0xAA);
  });

  dcs[0].send(new Uint8Array([0xFF, 0xAA]));
});