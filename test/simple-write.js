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

test('create a data stream on dc:0', function(t) {
  t.plan(1);
  stream = channelstream(dcs[0]);
  t.ok(stream instanceof Duplex, 'created stream object');
});

test('can write a string to the stream', function(t) {
  t.plan(2);

  function handleMessage(evt) {
    t.ok(evt && evt.data);
    t.equal(evt.data, 'hello', 'got expected message');
    dcs[1].removeEventListener('message', handleMessage);
  }

  dcs[1].addEventListener('message', handleMessage);
  stream.write('hello');
});

test('can write a buffer to the stream', function(t) {
  var chunk = new Buffer([0xFF, 0xAA]);

  t.plan(4);

  function handleMessage(evt) {
    var view;

    t.ok(evt && evt.data, 'got data');
    t.ok(evt.data instanceof ArrayBuffer, 'got an array buffer of data');
    view = new Uint8Array(evt.data);

    t.equal(view[0], 0xFF);
    t.equal(view[1], 0xAA);

    dcs[1].removeEventListener('message', handleMessage);
  }

  dcs[1].addEventListener('message', handleMessage);
  // console.log('writing new chunk, is buffer = ', chunk instanceof Buffer);
  stream.write(chunk);
});