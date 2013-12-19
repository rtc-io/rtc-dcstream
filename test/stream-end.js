var Model = require('scuttlebutt/model');
var Duplex = require('stream').Duplex;
var initChannels = require('./helpers/init-channels');
var test = require('tape');
var channelstream = require('..');
var dcs;
var streams;
var models = [];

test('initialize channels', function(t) {
  t.plan(2);
  initChannels(function(err, channels) {
    t.ifError(err);
    dcs = channels;
    t.equal(dcs.length, 2);
  });
});

test('create streams', function(t) {
  t.plan(2);

  // create the streams
  streams = dcs.map(channelstream);

  // check we have valid streams
  t.ok(streams[0] instanceof Duplex, 'stream:0 valid');
  t.ok(streams[1] instanceof Duplex, 'stream:1 valid');
});

test('streams transmit end events across the wire', function(t) {
  t.plan(2);

  streams[0].pipe(streams[1]);
  streams[1].once('data', function(buffer) {
    t.equal(buffer.toString(), 'hello');
  });

  streams[1].once('end', t.pass.bind(t, 'stream ended'));
  streams[0].end('hello');
});