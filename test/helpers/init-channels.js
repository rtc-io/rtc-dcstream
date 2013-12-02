var peerpair = require('peerpair');

module.exports = function(callback) {
  var peers = peerpair();
  return peers.createChannelsAndConnect(['dc:test'], callback);
};