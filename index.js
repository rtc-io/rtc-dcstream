/* jshint node: true */
'use strict';

var stream = require('stream');
var util = require('util');

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

  // bind some local event handlers
  this._handleClose = handleChannelClose.bind(this);
  this._handleMessage = handleChannelMessage.bind(this);
  this._handleOpen = handleChannelOpen.bind(this);

  // attach channel listeners
  channel.addEventListener('message', this._handleMessage);
  channel.addEventListener('close', this._handleClose);
  channel.addEventListener('open', this._handleOpen);
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
  // if we don't have a channel, abort
  if (! this.channel) {
    return;
  }

  // if the channel is not open, then queue the write
  if (this.channel.readyState !== 'open') {
    console.log('closed, need to buffer');

    // TODO: how to handle this situation?
    return this._wq.push(chunk);
  }

  if (this.channel.bufferedAmount > 0) {
    console.log('channel buffering: ', this.channel.bufferedAmount);
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
      console.log('error sending text: ', e);
    }
  }

  setTimeout(callback, 0);
};

/* event handlers */

function handleChannelClose(evt) {
  console.log('dc closed');
  this.emit('close');
}

function handleChannelMessage(evt) {
  this._rq.push(evt.data);
  this.emit('readable');
}

function handleChannelOpen(evt) {

}