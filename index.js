/* jshint node: true */
'use strict';

var stream = require('stream');
var util = require('util');

/**
  # rtc-channelstream

  Node streams2 interface for working with WebRTC data channels. This stream
  implementation will cater for current data size limits in the WebRTC
  data channels.

  ## NOTE: Work in Progress

  This module is currently an experimental work in progress, so I'd recommend
  checking out one of the alternative implementation of data channel -> node
  stream implementations:

  - [rtc-data-stream](https://github.com/kumavis/rtc-data-stream)

**/

function RTCChannelStream(channel) {
  if (! (this instanceof RTCChannelStream)) {
    return new RTCChannelStream(channel);
  }

  // super
  stream.Duplex.call(this);

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

  // if we have no data queued, then wait until we have been told we
  // do as _read will not be called again until we have pushed something
  if (this._rq.length === 0) {
    return this.once('readable', this._read.bind(this, n));
  }

  // TODO: honour the request for a particular number of bytes
  // this.push(evt.data);
  while (ready && this._rq.length > 0) {
    ready = this.push(this._rq.shift());
  }

  return ready;
};

RTCChannelStream.prototype._write = function(data) {
  // if we don't have a channel, abort
  if (! this.channel) {
    return;
  }

  // if the channel is not open, then queue the write
  if (this.channel.readyState !== 'open') {
    return this._wq.push(data);
  }

  // if we are good to go, then send the data
  this.channel.send(data);
};

/* event handlers */

function handleChannelClose(evt) {
  this.emit('close');
}

function handleChannelMessage(evt) {
  this._rq.push(evt.data);
  this.emit('readable');
}

function handleChannelOpen(evt) {

}