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
    // list of regular expressions to match request urls, only matched urls will
    //  be intercepted successfully
    var matchers = [/.*/];
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

    this.setMatchers = function (matcherList) {
      if (_.isArray(matcherList)) {
        // check that all the items are regex
        _.each(matcherList, function (matcher) {
          if (!_.isRegExp(matcher)) {
            throw new TypeError('TokenAuthConfig.matchers must include only RegExp objects! "' + matcher + '" is not a RegExp.');
          }
        });

        matchers = matcherList;
      } else {
        throw new TypeError('TokenAuthConfig.matchers must be an array!');
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
        logoutCallback: logoutCallback,
        /**
         * Check if a url is a token auth url.
         *
         * @param {string} url - Url to test against token auth urls.
         * @returns {boolean} true if url should be intercepted, false otherwise.
         */
        isTokenAuthUrl: function (url) {
          return url.search(this.getApiEndpointAuth()) ||
            url.search(this.getApiEndpointVerify()) ||
            url.search(this.getApiEndpointRefresh());
        },
        /**
         * Check if a given url should be intercepted by this library's interceptor.
         *
         * @param {string} url - Url to test against matchers.
         * @returns {boolean} true if url should be intercepted, false otherwise.
         */
        shouldBeIntercepted: function (url) {
          return _.chain(matchers)
            .find(function (regex) {
              return regex.test(url);
            })
            .isRegExp()
            .value();
        }
     };
    };
  });
