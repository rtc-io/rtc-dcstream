# rtc-dcstream

Node streams2 interface for working with WebRTC data channels. This stream
implementation will cater for current data size limits in the WebRTC
data channels.


[![NPM](https://nodei.co/npm/rtc-dcstream.png)](https://nodei.co/npm/rtc-dcstream/)

[![unstable](https://img.shields.io/badge/stability-unstable-yellowgreen.svg)](https://github.com/dominictarr/stability#unstable) [![Build Status](https://img.shields.io/travis/rtc-io/rtc-dcstream.svg?branch=master)](https://travis-ci.org/rtc-io/rtc-dcstream) [![bitHound Score](https://www.bithound.io/github/rtc-io/rtc-dcstream/badges/score.svg)](https://www.bithound.io/github/rtc-io/rtc-dcstream) 

## Example Usage

The example below shows how to use the `rtc-dcstream` module to stream data
via a datachannel to *n* remote participants.  In this case we are using
the W3C FileReader API and streaming dropped data files over the data
channel:

```js
var crel = require('crel');
var dropkick = require('dropkick');
var quickconnect = require('rtc-quickconnect');
var fileReader = require('filestream/read');
var fileReceiver = require('filestream/write');
var multiplex = require('multiplex');
var createDataStream = require('rtc-dcstream');
var channels = [];
var peers = [];
var inbound = {};

function prepStream(dc, id) {
  var plex = multiplex();

  plex.pipe(createDataStream(dc)).pipe(multiplex(function(stream, type) {
    stream.pipe(fileReceiver(function(file) {
      document.body.appendChild(crel('img', { src: URL.createObjectURL(file) }));
    }, { type: type }));
  }));

  return plex;
}

quickconnect('http://rtc.io/switchboard', { room: 'filetx-test' })
  .createDataChannel('files')
  .on('channel:opened:files', function(id, dc) {
    peers.push(id);
    channels.push(prepStream(dc, id));
  })
  .on('peer:leave', function(id) {
    var peerIdx = peers.indexOf(id);
    if (peerIdx >= 0) {
      peers.splice(peerIdx, 1);
      channels.splice(peerIdx, 1);
    }
  })

dropkick(document.body).on('file', function(file) {
  channels.forEach(function(plex) {
    fileReader(file).pipe(plex.createStream(file.type));
  });
});

// give the document some size so we can drag and drop stuff
document.body.style.width = '100vw';
document.body.style.height = '100vw';

```

## Alternative Implementations

In addition to this module, the following are other modules that wrap
WebRTC data channel communication via a node streaming interface:

- [rtc-data-stream](https://github.com/kumavis/rtc-data-stream)

## Reference

To be completed.

## License(s)

### Apache 2.0

Copyright 2015 National ICT Australia Limited (NICTA)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
