/* jshint node: true */
'use strict';

var stream = require('stream');
var util = require('util');

function RTCDataStream(channel) {
  if (! (this instanceof RTCDataStream)) {
    return new RTCDataStream(channel);
  }
}

module.exports = RTCDataStream;
util.inherits(RTCDataStream, stream.Duplex);