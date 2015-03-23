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

test('write a buffer from 0 -> 1', function(t) {
  function handleData(buffer) {
    streams[1].removeListener('data', handleData);
    t.equal(buffer.toString(), 'hello', 'matched expected');
  }
  
  
  t.plan(1);
  streams[1].on('data', handleData);
  streams[0].write(new Buffer('hello'));
});

test('close the underlying data channel and attempt to write', function(t) {
  t.plan(3);
  
  dcs[0].close();
  streams[1].once('end', t.pass.bind(t, 'stream ended'));
  streams[0].once('error', function(err) {
    t.ok(err instanceof Error, 'got valid error');
  });
  
  t.doesNotThrow(function() {
    streams[0].write(new Buffer('hello'));
  });
});