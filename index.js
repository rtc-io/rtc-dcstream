/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-dcstream');
var stream = require('stream');
var util = require('util');
var closingStates = ['closing', 'closed'];
var ENDOFSTREAM = '::endofstream';

/**
  # rtc-dcstream

  Node streams2 interface for working with WebRTC data channels. This stream
  implementation will cater for current data size limits in the WebRTC
  data channels.

  ## NOTE: Work in Progress

  This module is currently an experimental work in progress, so I'd recommend
  checking out one of the alternative implementation of data channel -> node
  stream implementations:

  - [rtc-data-stream](https://github.com/kumavis/rtc-data-stream)

  ## Reference

  To be completed.

**/

function RTCChannelStream(channel) {
  if (! (this instanceof RTCChannelStream)) {
    return new RTCChannelStream(channel);
  }

  // super
  stream.Duplex.call(this, {
    decodeStrings: false,
    objectMode: true
  });

  // create the internal read and write queues
  this._rq = [];
  this._wq = [];

  // save a reference to the channel
  this.channel = channel;

  // set the channel binaryType to arraybuffer
  channel.binaryType = 'arraybuffer';

  // bind some local event handlers
  this._handleClose = handleChannelClose.bind(this);
  this._handleMessage = handleChannelMessage.bind(this);
  this._handleOpen = handleChannelOpen.bind(this);

  // attach channel listeners
  channel.addEventListener('message', this._handleMessage);
  channel.addEventListener('close', this._handleClose);
  channel.addEventListener('open', this._handleOpen);

  // listen for finish events on the stream
  this.once('finish', function() {
    // if the channel is still open send an EOF message
    if (channel.readyState === 'open') {
      channel.send(ENDOFSTREAM);
    }
  });
}

module.exports = RTCChannelStream;
util.inherits(RTCChannelStream, stream.Duplex);

RTCChannelStream.prototype._read = function(n) {
  var ready = true;
  var next;

  // if we have no data queued, then wait until we have been told we
  // do as _read will not be called again until we have pushed something
  if (this._rq.length === 0) {
    return this.once('readable', this._read.bind(this, n));
  }

  // TODO: honour the request for a particular number of bytes
  // this.push(evt.data);
  while (ready && this._rq.length > 0) {
    // get the next chunk
    next = this._rq.shift();

    // if the next chunk is an array buffer, convert to a node buffer
    if (next instanceof ArrayBuffer) {
      this.push(new Buffer(new Uint8Array(next)));
    }
    else {
      this.push(next);
    }
  }

  return ready;
};

RTCChannelStream.prototype._write = function(chunk, encoding, callback) {
  var closed = (! this.channel) ||
    closingStates.indexOf(this.channel.readyState) >= 0;

  // if closed then abort
  if (closed) {
    return;
  }

  // if we are connecting, then wait
  if (this._wq.length || this.channel.readyState === 'connecting') {
    return this._wq.push([ chunk, encoding, callback ]);
  }

  if (this.channel.bufferedAmount > 0) {
    debug('channel buffering: ', this.channel.bufferedAmount);
  }

  // if we have a buffer convert into a Uint8Array
  if (chunk instanceof Buffer) {
    this.channel.send(new Uint8Array(chunk));
  }
  // otherwise, send as is
  else {
    try {
      this.channel.send(chunk);
    }
    catch (e) {
      debug('error sending text: ', e);
    }
  }

  setTimeout(callback, 0);
};

/* event handlers */

function handleChannelClose(evt) {
  debug('dc closed');
  this.emit('close');
}

function handleChannelMessage(evt) {
  var data = evt && evt.data;

  // if we have an end of stream marker, end
  if (typeof data == 'string' && data === ENDOFSTREAM) {
    return this.emit('end');
  }

  this._rq.push(data);
  this.emit('readable');
}

function handleChannelOpen(evt) {

  var peer = this;
  var queue = this._wq;

  function sendNext(args) {
    var callback;

    // if we have no args, then abort
    if (! args) {
      return queue.length ? sendNext(queue.shift()) : null;
    }

    // save the callback
    callback = args[2];

    // replace with a new callback
    args[2] = function() {
      sendNext(queue.shift());

      // trigger the callback
      if (typeof callback == 'function') {
        callback();
      }
    };

    peer._write.apply(peer, args);
  }

  // send the queued messages
  debug('channel open, sending queued ' + queue.length + ' messages');
  sendNext(queue.shift());
}