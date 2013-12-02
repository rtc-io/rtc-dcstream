/* jshint node: true */
'use strict';

var stream = require('stream');
var util = require('util');

/**
  # rtc-datastream

  Node streams2 interface for working with WebRTC data channels. This stream
  implementation will cater for current data size limits in the WebRTC
  data channels.

  It is, however, a work in progress.  While this library is under development
  perhaps check out one of these alternative implementations:

  - [rtc-data-stream](https://github.com/kumavis/rtc-data-stream)

**/

function RTCDataStream(channel) {
  if (! (this instanceof RTCDataStream)) {
    return new RTCDataStream(channel);
  }

  stream.Duplex.call(this);
  channel.addEventListener('message', this._handleMessage.bind(this));
  channel.addEventListener('close', this._handleClose.bind(this));
}

module.exports = RTCDataStream;
util.inherits(RTCDataStream, stream.Duplex);

RTCDataStream.prototype._handleClose = function(evt) {
  console.log('stream closed');
};

RTCDataStream.prototype._handleMessage = function(evt) {
  this.push(evt.data);
};

RTCDataStream.prototype._read = function(n) {
};