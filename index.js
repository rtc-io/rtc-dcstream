/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-dcstream');
var stream = require('stream');
var toBuffer = require('typedarray-to-buffer');
var util = require('util');
var closingStates = ['closing', 'closed'];
var ENDOFSTREAM = '::endofstream';

/**
  # rtc-dcstream

  Node streams2 interface for working with WebRTC data channels. This stream
  implementation will cater for current data size limits in the WebRTC
  data channels.

  ## Example Usage

  The example below shows how to use the `rtc-dcstream` module to stream data
  via a datachannel to *n* remote participants.  In this case we are using
  the W3C FileReader API and streaming dropped data files over the data
  channel:

  <<< examples/file-transfer.js

  ## Alternative Implementations

  In addition to this module, the following are other modules that wrap
  WebRTC data channel communication via a node streaming interface:

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
  
  // initialise the closed state
  this._closed = channel.readyState === 'closed';

  // save a reference to the channel
  this.channel = channel;

  // set the channel binaryType to arraybuffer
  channel.binaryType = 'arraybuffer';
  
  // initialise the message handlers
  this._handlers = {
    message: this._handleMessage.bind(this),
    close: this._handleClose.bind(this),
    open: this._handleOpen.bind(this)
  };

  // attach channel listeners
  channel.addEventListener('message', this._handlers.message);
  channel.addEventListener('close', this._handlers.close);
  channel.addEventListener('open', this._handlers.open);

  // send an ENDOFSTREAM marker on finish
  this.once('finish', this._dcsend.bind(this, ENDOFSTREAM));
}

module.exports = RTCChannelStream;
util.inherits(RTCChannelStream, stream.Duplex);

var prot = RTCChannelStream.prototype;

prot._checkClear = function() {
  if (this.channel.bufferedAmount === 0) {
    clearInterval(this._clearTimer);
    this._handleOpen();
  }
};

prot._debindChannel = function() {
  var channel = this.channel;

  // remove the message listener
  channel.removeEventListener('message', this._handlers.message);
  channel.removeEventListener('close', this._handlers.close);
  channel.removeEventListener('open', this._handlers.message);
};

prot._read = function(n) {
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
      this.push(toBuffer(new Uint8Array(next)));
    }
    else {
      this.push(next);
    }
  }

  return ready;
};

prot._write = function(chunk, encoding, callback) {
  var closed = (! this.channel) ||
    closingStates.indexOf(this.channel.readyState) >= 0;

  // if closed then abort
  if (closed) {
    return callback(new Error('data channel is closed'));
  }

  // if we are connecting, then wait
  if (this._wq.length || this.channel.readyState === 'connecting') {
    return this._wq.push([ chunk, encoding, callback ]);
  }

  // if the channel is buffering, let's give it a rest
  if (this.channel.bufferedAmount > 0) {
    debug('data channel buffering ' + this.channel.bufferedAmount + ', backing off');
    this._clearTimer = setInterval(this._checkClear.bind(this), 100);
    return this._wq.push([ chunk, encoding, callback ]);
  }
  
  return this._dcsend(chunk, encoding, callback);
};

/**
  ### `_dcsend(chunk, encoding, callback)`

  The internal function that is responsible for sending the data over the
  underlying datachannel.

**/
prot._dcsend = function(chunk, encoding, callback) {
  // ensure we have a callback to use if not supplied
  callback = callback || function() {};
  
  // if the channel is closed, then return false
  if (this._closed || this.channel.readyState !== 'open') {
    return false;
  }
  
  try {
    this.channel.send(chunk);
  }
  catch (e) {
    // handle closed streams where we didn't get the memo
    if (e.name == 'NetworkError') {
      return this._handleClose();
    }
    
    return callback(e);
  }

  return callback();
};

/* event handlers */

prot._handleClose = function(evt) {
  // flag the channel as closed
  this._closed = true;
  
  // emit the close and end events
  this.emit('close');
  this.emit('end');
};

prot._handleMessage = function(evt) {
  /* jshint validthis: true */
  var data = evt && evt.data;

  // if we have an end of stream marker, end
  if (typeof data == 'string' && data === ENDOFSTREAM) {
    // remove the channel event bindings
    this._debindChannel();

    // emit the end
    return this.emit('end');
  }

  this._rq.push(data);
  this.emit('readable');
};

prot._handleOpen = function(evt) {
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
};
