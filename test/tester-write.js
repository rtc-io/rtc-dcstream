var initChannels = require('./helpers/init-channels');
var test = require('tape');
var Duplex = require('stream').Duplex;
var tester = require('stream-tester');
var channelstream = require('..');
var dcs;
var stream;
var LIPSUM = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'

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

test('push through 5000 text updates', function(t) {
  var max = 5000;
  var progressInterval = max / 10;
  var received = 0;
  var parts = [];

  function checkParts() {
    var match = true;
    for (var ii = parts.length; match && ii--; ) {
      match = parts[ii] === LIPSUM;
      if (! match) {
        console.log(parts[ii], ii);
      }
    }

    t.ok(match, 'all strings matched expected output');
  }

  function handleMessage(evt) {
    parts[received++] = evt.data;
    if (received >= max) {
      t.pass('received ' + max + ' messages');

      // check the messages match
      checkParts();
      dcs[1].removeEventListener('message', handleMessage);
      dcs[1].removeEventListener('close', handleClose);
    }

    if (received % progressInterval === 0) {
      t.pass('received ' + received + ' messages');
    }
  }

  function handleClose(evt) {
    t.fail('broke the datachannel - it closed');
  }

  t.plan(12);
  dcs[1].addEventListener('message', handleMessage);
  dcs[1].addEventListener('close', handleClose);

  tester.createRandomStream(function() {
    return LIPSUM;
  }, max).pipe(stream);
});

test('create a new stream on dc:0', function(t) {
  t.plan(1);
  stream = channelstream(dcs[0]);
  t.ok(stream instanceof Duplex, 'created stream object');
});

test('push through 5000 buffer updates', function(t) {
  var max = 5000;
  var progressInterval = max / 10;
  var received = 0;
  var parts = [];

  function checkParts() {
    var match = true;
    var view;
    for (var ii = parts.length; match && ii--; ) {
      match = parts[ii] instanceof ArrayBuffer;
      if (match) {
        view = new Uint8Array(parts[ii]);
        match = view[0] === 0xFF && view[1] === 0xAA;
      }
    }

    t.ok(match, 'all buffers matched expected');
  }

  function handleMessage(evt) {
    parts[received++] = evt.data;
    if (received >= max) {
      t.pass('received ' + max + ' messages');

      // check the messages match
      checkParts();
      dcs[1].removeEventListener('message', handleMessage);
      dcs[1].removeEventListener('close', handleClose);
    }

    if (received % progressInterval === 0) {
      t.pass('received ' + received + ' messages');
    }
  }

  function handleClose(evt) {
    t.fail('broke the datachannel - it closed');
  }

  t.plan(12);
  dcs[1].addEventListener('message', handleMessage);
  dcs[1].addEventListener('close', handleClose);

  tester.createRandomStream(function() {
    return new Buffer([0xFF, 0xAA]);
  }, max).pipe(stream);
});