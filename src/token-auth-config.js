'use strict';

angular.module('tokenAuth.config', [])
  .provider('TokenAuthConfig', function TokenAuthConfigProvider () {
    // page to route to after a successful login
    var afterLoginPath = '/';
    // endpoint for token auth
    var apiEndpointAuth = '/api/token/auth';
    // endpoint for token refresh
    var apiEndpointRefresh = '/api/token/refresh';
    // endpoint for token verification
    var apiEndpointVerify = '/api/token/verify';
    // host where auth endpoints are located
    var apiHost = '';
    // callback called on successful login
    var loginCallback = function () {};
    // path to login page
    var loginPagePath = '';
    // url for logo to display on login page
    var logoUrl = '';
    // callback called on successful logout
    var logoutCallback = function () {};
    // local storage key for token
    var tokenKey = 'authToken';

    this.setAfterLoginPath = function (value) {
      if (_.isString(value)) {
        afterLoginPath = value;
      } else {
        throw new TypeError('TokenAuthConfig.afterLoginPath must be a string!');
      }
    };

    this.setApiEndpointAuth = function (value) {
      if (_.isString(value)) {
        apiEndpointAuth = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiEndpointAuth must be a string!');
      }
    };

    this.setApiEndpointRefresh = function (value) {
      if (_.isString(value)) {
        apiEndpointRefresh = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiEndpointRefresh must be a string!');
      }
    };

    this.setApiEndpointVerify = function (value) {
      if (_.isString(value)) {
        apiEndpointVerify = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiEndpointVerify must be a string!');
      }
    };

    this.setApiHost = function (value) {
      if (_.isString(value)) {
        apiHost = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiHost must be a string!');
      }
    };

    this.setLoginCallback = function (func) {
      if (_.isFunction(func)) {
        loginCallback = func;
      } else {
        throw new TypeError('TokenAuthConfig.loginCallback must be a function!');
      }
    };

    this.setLoginPagePath = function (value) {
      if (_.isString(value)) {
        loginPagePath = value;
      } else {
        throw new TypeError('TokenAuthConfig.loginPagePath must be a string!');
      }
    };

    this.setLogoUrl = function (value) {
      if (_.isString(value)) {
        logoUrl = value;
      } else {
        throw new TypeError('TokenAuthConfig.logoUrl must be a string!');
      }
    };

    this.setLogoutCallback = function (func) {
      if (_.isFunction(func)) {
        logoutCallback = func;
      } else {
        throw new TypeError('TokenAuthConfig.logoutCallback must be a function!');
      }
    };

    this.setTokenKey = function (value) {
      if (_.isString(value)) {
        tokenKey = value;
      } else {
        throw new TypeError('TokenAuthConfig.tokenKey must be a string!');
      }
    };

    this.$get = function () {
      return {
        getAfterLoginPath: _.constant(afterLoginPath),
        getApiEndpointAuth: _.constant(apiHost + apiEndpointAuth),
        getApiEndpointRefresh: _.constant(apiHost + apiEndpointRefresh),
        getApiEndpointVerify: _.constant(apiHost + apiEndpointVerify),
        getLoginPagePath: _.constant(loginPagePath),
        getLogoUrl: _.constant(logoUrl),
        getTokenKey: _.constant(tokenKey),
        loginCallback: loginCallback,
        logoutCallback: logoutCallback
     };
    };
  });
