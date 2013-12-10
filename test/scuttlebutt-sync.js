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

test('set the data channels to arraybuffer binary mode', function(t) {
  t.plan(2);
  dcs[0].binaryType = 'arraybuffer';
  dcs[1].binaryType = 'arraybuffer';

  t.equal(dcs[0].binaryType, 'arraybuffer');
  t.equal(dcs[1].binaryType, 'arraybuffer');
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
  t.plan(2);

  models[1].on('update', function() {
    t.equal(models[1].get('name'), 'Bob', 'model 1 has synced (name == Bob)');
  });

  t.equal(models[1].get('name'), undefined, 'model 1 has no name');
  models[0].set('name', 'Bob');
});