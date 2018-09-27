module.exports = {
  test: function (name, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, "PushServicePlugin", "test", [name]);
  },

  initiateService: function (jwtToken, successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, "PushServicePlugin", "initiateService", [jwtToken]);
  }
};