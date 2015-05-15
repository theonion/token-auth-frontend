'use strict';

angular.module('tokenAuth.settings', [])
  .config(function ($injector) {
    var logoUrlKey = 'TOKEN_AUTH_LOGO_URL';
    var apiHostKey = 'TOKEN_AUTH_API_HOST';

    try {
      $injector.get(logoUrlKey);
    } catch (e) {
      console.log('You must provide ' + logoUrlKey + ' for tokenAuth module!');
    }

    try {
      $injector.get(apiHostKey);
    } catch (e) {
      console.log('You must provide ' + apiHostKey + ' for tokenAuth module!');
    }
  });
