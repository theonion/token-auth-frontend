'use strict';

angular.module('tokenAuth.config', [])
  .provider('TokenAuthConfig', function TokenAuthConfigProvider () {
    var apiEndpointAuth = '/api/token/auth';
    var apiEndpointRefresh = '/api/token/refresh';
    var apiHost = '';
    var loginPagePath = '';
    var logoUrl = '';
    var tokenKey = 'authToken';

    this.setApiEndpointAuth = function (value) {
      if (typeof(value) === 'string') {
        apiEndpointAuth = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiEndpointAuth must be a string!');
      }
    };

    this.setApiEndpointRefresh = function (value) {
      if (typeof(value) === 'string') {
        apiEndpointRefresh = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiEndpointRefresh must be a string!');
      }
    };

    this.setApiHost = function (value) {
      if (typeof(value) === 'string') {
        apiHost = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiHost must be a string!');
      }
    };

    this.setLoginPagePath = function (value) {
      if (typeof(value) === 'string') {
        loginPagePath = value;
      } else {
        throw new TypeError('TokenAuthConfig.loginPagePath must be a string!');
      }
    };

    this.setLogoUrl = function (value) {
      if (typeof(value) === 'string') {
        logoUrl = value;
      } else {
        throw new TypeError('TokenAuthConfig.logoUrl must be a string!');
      }
    };

    this.setTokenKey = function (value) {
      if (typeof(value) === 'string') {
        tokenKey = value;
      } else {
        throw new TypeError('TokenAuthConfig.tokenKey must be a string!');
      }
    };

    this.$get = function () {
      return {
        getApiEndpointAuth: function () {
          return apiHost + apiEndpointAuth;
        },
        getApiEndpointRefresh: function () {
          return apiHost + apiEndpointRefresh;
        },
        getLoginPagePath: function () {
          return loginPagePath;
        },
        getLogoUrl: function () {
          return logoUrl;
        },
        getTokenKey: function () {
          return tokenKey;
        }
     };
    };
  });
