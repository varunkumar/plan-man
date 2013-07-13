cordova.define("cordova/plugin/missedcallplugin", function(require, exports, module) {
  var exec = require('cordova/exec');
  
  var MissedCallPlugin = function() {};

  MissedCallPlugin.prototype.startReception = function(successCallback,failureCallback) {
    return exec(successCallback, failureCallback, 'MissedCallPlugin', 'StartReception', []);
  }

  MissedCallPlugin.prototype.stopReception = function(successCallback,failureCallback) {
    return exec(successCallback, failureCallback, 'MissedCallPlugin', 'StopReception', []);
  }

  var missedcallplugin = new MissedCallPlugin();
  module.exports = missedcallplugin;
});