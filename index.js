/* jshint node: true */
'use strict';

var stream = require('stream');
var util = require('util');

function RTCDataStream(channel) {
  if (! (this instanceof RTCDataStream)) {
    return new RTCDataStream(channel);
  }

  stream.Duplex.call(this);
  channel.addEventListener('message', this._handleMessage.bind(this));
}

module.exports = RTCDataStream;
util.inherits(RTCDataStream, stream.Duplex);

RTCDataStream.prototype._handleMessage = function(evt) {
  this.push(evt.data);
};

RTCDataStream.prototype._read = function(n) {
};