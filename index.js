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

  // save a reference to the channel
  this.channel = channel;

  // attach channel listeners
  channel.addEventListener('message', this._handleMessage.bind(this));
  channel.addEventListener('close', this._handleClose.bind(this));
}

module.exports = RTCChannelStream;
util.inherits(RTCChannelStream, stream.Duplex);

RTCChannelStream.prototype._handleClose = function(evt) {
  console.log('stream closed');
};

RTCChannelStream.prototype._handleMessage = function(evt) {
  this.push(evt.data);
};

RTCChannelStream.prototype._read = function(n) {
};

RTCChannelStream.prototype._write = function(data) {
  this.channel.send(data);
};