var initChannels = require('./helpers/init-channels');
var test = require('tape');
var Duplex = require('stream').Duplex;
var datastream = require('..');
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

test('create a data stream on dc:1', function(t) {
  t.plan(1);
  stream = datastream(dcs[1]);
  t.ok(stream instanceof Duplex, 'created stream object');
});

test('can read from the stream', function(t) {
  t.plan(1);
  stream.on('data', function handleData(buffer) {
    t.equal(buffer.toString(), 'hello');
  });

  dcs[0].send('hello');
});

