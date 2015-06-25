'use strict';
// Source: .tmp/scripts/token-auth-config.js
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
    // HTTP codes this module should handle
    var handleHttpCodes = [401, 403];
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

    this.setHandleHttpCodes = function (httpCodesList) {
      if (_.isArray(httpCodesList)) {
        // check that all the items are numbers
        _.each(httpCodesList, function (httpCode) {
          if (!_.isNumber(httpCode)) {
            throw new TypeError('TokenAuthConfig.handleHttpCodes must include only Numbers! ' + httpCode + ' is not a Number.');
          }
        });

        handleHttpCodes = httpCodesList;
      } else {
        throw new TypeError('TokenAuthConfig.handleHttpCodes must be an array!');
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
            throw new TypeError('TokenAuthConfig.matchers must include only RegExp objects! ' + matcher + ' is not a RegExp.');
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
         * Check if this an HTTP status code this library should handle.
         *
         * @param {number} httpCode - HTTP code to test.
         * @returns {boolean} true if HTTP code indicates something to handle,
         *    false otherwise.
         */
        isStatusCodeToHandle: function (httpCode) {
          return _.includes(handleHttpCodes, httpCode);
        },
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

// Source: .tmp/scripts/token-auth-interceptor/token-auth-interceptor.js
angular.module('tokenAuth.authInterceptor', [
  'tokenAuth.authService',
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthInterceptor', [
    '$injector', '$q', '$location', 'localStorageService', 'TokenAuthConfig',
    function ($injector, $q, $location, localStorageService, TokenAuthConfig) {

      var doIgnoreAuth = function (config) {
        return Boolean(!config || config.ignoreTokenAuth);
      };

      var abortRequest = function (config) {
        var abort = $q.defer();
        config.timeout = abort.promise;
        abort.resolve();
      };

      this.request = function (config) {
        if (!doIgnoreAuth(config) && TokenAuthConfig.shouldBeIntercepted(config.url)) {

          // need to inject service here, otherwise we get a circular $http dep
          var TokenAuthService = $injector.get('TokenAuthService');

          if (TokenAuthService.isAuthenticated()) {
            // we've already been authenticated
            var token = localStorageService.get(TokenAuthConfig.getTokenKey());

            // check if we have a token, if not, prevent request from firing, send user to login
            if (token) {
              // add Authorization header
              config.headers = config.headers || {};
              config.headers.Authorization = 'JWT ' + token;
            } else {
              // abort requests where there's no token
              abortRequest(config);

              // navigate to login page
              TokenAuthService.navToLogin();
            }
          } else {
            // abort request
            abortRequest(config);

            // not authenticated yet, buffer this request
            TokenAuthService.requestBufferPush(config);
          }
        }

        return config;
      };

      this.responseError = function (response) {
        // only deal with an error if auth module is not ignored, this is a url
        //  to deal with and the response code is unauthorized
        if (!doIgnoreAuth(response.config) &&
            TokenAuthConfig.shouldBeIntercepted(response.config.url) &&
            TokenAuthConfig.isStatusCodeToHandle(response.status)) {

          // need to inject service here, otherwise we get a circular $http dep
          var TokenAuthService = $injector.get('TokenAuthService');

          // append request to buffer to retry later
          TokenAuthService.requestBufferPush(response.config);

          // attempt to refresh token
          TokenAuthService.tokenRefresh();
        }

        return $q.reject(response);
      };

      return this;
    }
  ]);

// Source: .tmp/scripts/token-auth-login-form/token-auth-login-form.js
angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.templates'
])
  .directive('tokenAuthLoginForm', [
    function () {
      return {
        controller: [
          '$scope', 'TokenAuthService', 'TokenAuthConfig',
          function ($scope, TokenAuthService, TokenAuthConfig) {

            $scope.username = '';
            $scope.password = '';
            $scope.submitted = '';
            $scope.LOGO_URL = TokenAuthConfig.getLogoUrl();

            $scope.submitLogin = function () {
              $scope.submitted = 'submitted';

              if(!_.isEmpty($scope.username) && !_.isEmpty($scope.password)) {
                TokenAuthService.login($scope.username, $scope.password);
              }
            };
          }
        ],
        restrict: 'E',
        scope: {},
        templateUrl: 'token-auth-login-form/token-auth-login-form.html'
      };
    }
  ]);

// Source: .tmp/scripts/token-auth-service/token-auth-service.js
angular.module('tokenAuth.authService', [
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthService', [
    '$q', '$rootScope', '$location', '$http', 'localStorageService', 'TokenAuthConfig',
    function ($q, $rootScope, $location, $http, localStorageService, TokenAuthConfig) {

      var TokenAuthService = this;
      var requestInProgress = false;

      TokenAuthService._authenticated = false;
      TokenAuthService._requestBuffer = [];

      var authSuccess = function (deferred) {
        return function () {
          TokenAuthService._authenticated = true;
          TokenAuthService.requestBufferRetry();

          // if we're currently on the login page, navigate away from it
          if ($location.path() === TokenAuthConfig.getLoginPagePath()) {
            $location.path(TokenAuthConfig.getAfterLoginPath());
          }

          deferred.resolve();
        };
      };

      var noTokenFailure = function (deferred) {
        return function () {
          TokenAuthService._authenticated = false;
          TokenAuthService.navToLogin();
          deferred.reject();
        };
      };

      /**
       * Token verification endpoint. Should be used as the initial request when
       *  a page loads to check if user is authenticated. All requests should be
       *  buffered until verify endpoint returns successfully.
       *
       * @returns {promise} resolves when authenticated, rejects otherwise.
       */
      TokenAuthService.tokenVerify = function () {
        var verification = $q.defer();

        if (!requestInProgress) {
          // no currently running request, start a new one
          requestInProgress = true;
          TokenAuthService._pendingVerification = verification;

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());
          if (token) {

            // has a token, fire off request
            $http.post(
              TokenAuthConfig.getApiEndpointVerify(),
              {token: token},
              {ignoreTokenAuth: true}
            )
            .then(authSuccess(verification))
            .catch(function (response) {
              // some error at the verify endpoint
              TokenAuthService._authenticated = false;
              if (response.status === 400) {
                // this is an expired token, attempt refresh
                requestInProgress = false;
                TokenAuthService.tokenRefresh()
                  .then(verification.resolve)
                  .catch(verification.reject);
              } else if (TokenAuthConfig.isStatusCodeToHandle(response.status)) {
                // user is not authorized, send them to login page
                noTokenFailure(verification)();
              } else {
                // this is not an auth error, reject verification
                verification.reject();
              }
            })
            .finally(function () {
              // reset request flag so other requests can go through
              requestInProgress = false;
            });
          } else {
            noTokenFailure(verification)();

            // reset request flag so other requests can go through
            requestInProgress = false;
          }
        } else if (!TokenAuthService._pendingVerification) {
          // there is a request happening, and it's not a verify request, reject promise
          verification.reject();
        } else {
          // request in progress and it's a verify request, return existing promise
          verification = TokenAuthService._pendingVerification;
        }

        return verification.promise;
      };

      /**
       * Token refresh endpoint. Should be used for reauthenticating ajax requests
       *  that have responded with an unauthorized status code. In the event of
       *  an error status code returning from a refresh request, the user will
       *  be routed to the login page.
       *
       * @returns {promise} resolves when authenticated, rejects otherwise.
       */
      TokenAuthService.tokenRefresh = function () {
        var refresh = $q.defer();

        if (!requestInProgress) {
          // no currently running request, start a new one
          requestInProgress = true;
          TokenAuthService._pendingRefresh = refresh;

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());
          if (token) {
            // has token, fire off request
            $http.post(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: token},
              {ignoreTokenAuth: true}
            )
            .success(authSuccess(refresh))
            .catch(noTokenFailure(refresh))
            .finally(function () {
              // reset request flag so other requests can go through
              requestInProgress = false;
            });
          } else {
            noTokenFailure(refresh)();

            // reset request flag so other requests can go through
            requestInProgress = false;
          }

        } else if (!TokenAuthService._pendingRefresh) {
          // there is a request happening, and it's not a refresh request, reject promise
          refresh.reject();
        } else {
          // request in progress and it's a refresh request, return existing promise
          refresh = TokenAuthService._pendingRefresh;
        }

        return refresh.promise;
      };

      /**
       * Login endpoint. Should only be used where a user is providing a username
       *  and password to login. After a successful login, the user will be directed
       *  to the configured afterLoginPath location.
       *
       * @param {string} username - username to use to login.
       * @param {string} password - password to use to login.
       * @returns {promise} resolves when authenticated, rejects otherwise.
       */
      TokenAuthService.login = function (username, password) {
        var login = $q.defer();

        if (!requestInProgress) {
          // no currently running request, start a new one
          requestInProgress = true;
          TokenAuthService._pendingLogin = login;

          $http.post(
            TokenAuthConfig.getApiEndpointAuth(),
            {
              username: username,
              password: password
            },
            {ignoreTokenAuth: true}
          )
          .success(function (response) {
            localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
            $location.path(TokenAuthConfig.getAfterLoginPath());
            TokenAuthService._authenticated = true;
            TokenAuthConfig.loginCallback();
            login.resolve();
          })
          .catch(function () {
            TokenAuthService._authenticated = false;
            login.reject();
          })
          .finally(function () {
            // reset request flag so other requests can go through
            requestInProgress = false;
          });
        } else if (!TokenAuthService._pendingLogin) {
          // there is a request happening, and it's not a login request, reject promise
          login.reject();
        } else {
          // request in progress and it's a login request, return existing promise
          login = TokenAuthService._pendingLogin;
        }

        return login.promise;
      };

      /**
       * Log user out by removing token from local storage, sends them back to
       *  login page.
       */
      TokenAuthService.logout = function () {
        TokenAuthService._authenticated = false;
        localStorageService.remove(TokenAuthConfig.getTokenKey());
        $location.path(TokenAuthConfig.getLoginPagePath());
        TokenAuthConfig.logoutCallback();
      };

      /**
       * Push a request configuration into buffer to be rerun later.
       *
       * @param {object} config - request configuration to be buffered.
       * @returns {object} cloned config object added to the buffer.
       */
      TokenAuthService.requestBufferPush = function (config) {
        var configCopy = _.omit(config, 'timeout');
        TokenAuthService._requestBuffer.push(configCopy);
        return configCopy;
      };

      /**
       * Retry all buffered requests. If any response returns with an
       *  unauthorized status code, all further buffered requests will be aborted.
       *  Clears buffer in every case.
       */
      TokenAuthService.requestBufferRetry = function () {
        var abort = $q.defer();

        _.each(TokenAuthService._requestBuffer, function (config) {
          // hook for canceling requests after a failure
          config.timeout = abort.promise;

          $http(config)
            .catch(function (response) {
              if (TokenAuthConfig.isStatusCodeToHandle(response.status)) {
                // have one failure, abort all other requests
                abort.resolve();
              }
            });
         });

         TokenAuthService.requestBufferClear();
      };

      /**
       * Remove all request configurations from request buffer.
       */
      TokenAuthService.requestBufferClear = function () {
        TokenAuthService._requestBuffer = [];
      };

      /**
       * Clear request buffer and send user to login page.
       */
      TokenAuthService.navToLogin = function () {
        TokenAuthService.requestBufferClear();
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      /**
       * @returns {boolean} true when some authorization endpoint has successfully returned.
       */
      TokenAuthService.isAuthenticated = function () {
        return TokenAuthService._authenticated;
      };

      return TokenAuthService;
    }
  ]);

// Source: .tmp/scripts/token-auth.js
angular.module('tokenAuth', [
  'tokenAuth.authInterceptor',
  'tokenAuth.config',
  'tokenAuth.loginForm'
]);

// Source: .tmp/templates.js
angular.module('tokenAuth.templates', []).run(['$templateCache', function($templateCache) {
$templateCache.put('token-auth-login-form/token-auth-login-form.html',
    "<div><div class=login-header><img ng-src={{LOGO_URL}}></div><div class=login-form><p class=\"text-center welcome-text\">Welcome</p><form><div class=\"login-input username\"><label>Username</label><input class=form-control ng-model=username required><div class=\"alert alert-danger required-label\" ng-class=submitted>Required</div></div><div class=\"login-input password\"><label>Password</label><input type=password class=form-control ng-model=password required><div class=\"alert alert-danger required-label\" ng-class=submitted>Required</div></div><alertbar></alertbar><button class=\"btn add-btn btn-success\" type=submit ng-click=submitLogin()><span>Sign in</span></button></form><a class=contact href=mailto:webtech@theonion.com><div class=question-mark>?</div><div class=contact-tech>Contact Tech</div></a></div></div>"
  );

}]);
