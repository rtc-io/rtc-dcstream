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

test('can write to the stream', function(t) {
  t.plan(2);

  dcs[1].addEventListener('message', function(evt) {
    t.ok(evt && evt.data);
    t.equal(evt.data, 'hello', 'got expected message');
  });

  stream.write('hello');
});