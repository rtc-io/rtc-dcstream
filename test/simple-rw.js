var initChannels = require('./helpers/init-channels');
var test = require('tape');
var Duplex = require('stream').Duplex;
var through = require('through');
var channelstream = require('..');
var dcs;
var streams;

test('initialize channels', function(t) {
  t.plan(2);
  initChannels(function(err, channels) {
    t.ifError(err);
    dcs = channels;
    t.equal(dcs.length, 2);
  });
});

test('create a data stream on dc:0', function(t) {
  t.plan(2);

  // create the streams
  streams = dcs.map(channelstream);

  // check we have valid streams
  t.ok(streams[0] instanceof Duplex, 'stream:0 valid');
  t.ok(streams[1] instanceof Duplex, 'stream:1 valid');
});

test('can write to stream:0 and read through stream:1', function(t) {
  t.plan(1);

  streams[1].once('data', function(buffer) {
    t.equal(buffer.toString(), 'helo', 'stream:1 received helo');
  });

  streams[0].write('helo');
});

test('can write to stream:1 and read through stream:0', function(t) {
  t.plan(1);

  streams[0].once('data', function(buffer) {
    t.equal(buffer.toString(), 'ehlo', 'stream:0 received ehlo');
  });

  streams[1].write('ehlo');
});

test('can write buffer to stream:1 and read through stream:0', function(t) {
  t.plan(4);

  streams[0].once('data', function(buffer) {
    t.ok(buffer instanceof Buffer || buffer instanceof Uint8Array, 'got a Buffer instance');
    t.equal(buffer.length, 2, 'got 2 length buffer');
    t.equal(buffer[0], 0xFF);
    t.equal(buffer[1], 0xAA);
  });

  streams[1].write(new Buffer([0xFF, 0xAA]));
});