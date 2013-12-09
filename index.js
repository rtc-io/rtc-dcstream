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
  console.log('read requested for n bytes:', n);

  // TODO: honour the request for a particular number of bytes
  // this.push(evt.data);
  if (this._rq.length > 0) {
    this.push(this._rq.shift());
  }
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
  console.log('got data, emitting readable');
  this._rq.push(evt.data);
  this.emit('readable');
}

function handleChannelOpen(evt) {

}