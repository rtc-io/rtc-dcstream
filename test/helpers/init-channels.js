var couple = require('rtc/couple');
var messenger = require('messenger-memory');
var signaller = require('rtc-signaller');
var test = require('tape');
var rtc = require('rtc');
var conns = [];
var signallers = [];
var monitors = [];

var defaultConstraints = {
  mandatory: {
    DtlsSrtpKeyAgreement: false,
    internalSctpDataChannels: false
  },
  optional: [
    { RtpDataChannels: true }
  ]
};

module.exports = function(opts, callback) {
  var constraints;
  var conns = [];
  var signallers = [];
  var monitors = [];
  var dcs = [];

  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  constraints = (opts || {}).constraints || defaultConstraints;

  // create the connections
  conns.push(rtc.createConnection({}, constraints));
  conns.push(rtc.createConnection({}, constraints));

  // create the signallers
  signallers.push(signaller(messenger()));
  signallers.push(signaller(messenger()));

  // couple the connections and capture the monitors
  monitors.push(couple(conns[0], { id: signallers[1].id }, signallers[0]));
  monitors.push(couple(conns[1], { id: signallers[0].id }, signallers[1]));

  // create the offer
  monitors[0].createOffer();
  monitors[0].once('active', function() {
    dcs[0] = conns[0].createDataChannel('test');
    conns[1].ondatachannel = function(evt) {
      dcs[1] = evt.channel;

      console.log(dcs);
    };
  });
};