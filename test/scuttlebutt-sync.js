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

test('create model:0', function(t) {
  t.plan(1);

  models[0] = new Model();
  streams[0].pipe(models[0].createStream()).pipe(streams[0]);
  t.ok(models[0] instanceof Model);
});

test('create model:1', function(t) {
  t.plan(1);

  models[1] = new Model();
  streams[1].pipe(models[1].createStream()).pipe(streams[1]);
  t.ok(models[1] instanceof Model);
});

test('update model:0, observe model:1 change', function(t) {
  t.plan(1);

  models[1].on('update', function() {
    console.log(arguments);
  });

  models[0].set('name', 'Bob');
});