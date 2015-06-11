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
        return Boolean(
          !config ||
          config.ignoreAuthModule ||
          (config.headers && config.headers.ignoreAuthModule));
      };

      this.request = function (config) {
        // only deal with reqeusts if auth module is not ignored, and this is a url
        //  to deal with
        if (!doIgnoreAuth(config) && TokenAuthConfig.shouldBeIntercepted(config.url)) {

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());

          // check if we have a token, if not, prevent request from firing, send user to login
          if (token) {
            // add Authorization header
            config.headers = config.headers || {};
            config.headers.Authorization = 'JWT ' + token;
          } else {
            // abort requests where there's no token
            var abort = $q.defer();
            config.timeout = abort.promise;
            abort.resolve();
            $location.path(TokenAuthConfig.getLoginPagePath());
          }
        }

        return config;
      };

      this.responseError = function (response) {
        // only deal with an error if auth module is not ignored, this is a url
        //  to deal with and the response code is unauthorized
        if (!doIgnoreAuth(response.config) &&
            TokenAuthConfig.shouldBeIntercepted(response.config.url) &&
            (response.status === 403 || response.status === 401)) {

          // need to inject service here, otherwise we get a circular $http dep
          var TokenAuthService = $injector.get('TokenAuthService');

          // append request to buffer to retry later
          TokenAuthService.bufferRequest(response.config);

          // attempt to refresh token
          TokenAuthService.refreshToken();
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
          '$location', '$scope', 'TokenAuthService', 'TokenAuthConfig', /*'AlertService',*/
          function ($location, $scope, TokenAuthService, TokenAuthConfig /*, AlertService*/) {

            $scope.init = function () {
              // check if user is already authenticated
              TokenAuthService.verifyToken();

              $scope.username = '';
              $scope.password = '';
              $scope.submitted = '';
              $scope.LOGO_URL = TokenAuthConfig.getLogoUrl();
            };

            $scope.submitLogin = function () {
              $scope.submitted = 'submitted';
              // AlertService.clear();
              if(!_.isEmpty($scope.username) && !_.isEmpty($scope.password)) {
                TokenAuthService.login($scope.username, $scope.password);
              }
            };

            $scope.init();
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
    '$q', '$rootScope', '$location', '$http', 'localStorageService', /*'AlertService',*/
      'TokenAuthConfig',
    function ($q, $rootScope, $location, $http, localStorageService, /*AlertService,*/
      TokenAuthConfig) {

      var requestBuffer = [];

      this.verifyToken = function () {
        var deferred = $q.defer();
        var token = localStorageService.get(TokenAuthConfig.getTokenKey());

        deferred.promise
          .then(this.verifySuccess.bind(this));

        if (token) {
          $http.post(
            TokenAuthConfig.getApiEndpointVerify(),
            {token: token},
            {ignoreAuthModule: true})
          .success(deferred.resolve)
          .error(deferred.reject);
        } else {
          deferred.reject();
        }

        return deferred.promise;
      };

      this.verifySuccess = function () {
        $location.path(TokenAuthConfig.getAfterLoginPath());
      };

      this.login = function (username, password) {
        var deferred = $q.defer();

        deferred.promise
          .then(this.loginSuccess.bind(this))
          .catch(this.loginError.bind(this));

        $http.post(
          TokenAuthConfig.getApiEndpointAuth(), {
            username: username,
            password: password
          }, {
            ignoreAuthModule: true
          })
        .success(deferred.resolve)
        .error(deferred.reject);

        return deferred.promise;
      };

      this.loginSuccess = function (response) {
        localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
        $location.path(TokenAuthConfig.getAfterLoginPath());
        TokenAuthConfig.loginCallback();
      };

      this.loginError = function () {
        // AlertService.error('Username or password provided is incorrect.', false);
      };

      this.logout = function () {
        localStorageService.remove(TokenAuthConfig.getTokenKey());
        $location.path(TokenAuthConfig.getLoginPagePath());
        TokenAuthConfig.logoutCallback();
      };

      this.refreshToken = function () {
        if (!this.refreshTokenDeferred) {
          this.refreshTokenDeferred = $q.defer();

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());

          this.refreshTokenDeferred.promise
            .then(this.tokenRefreshed.bind(this))
            .catch(this.tokenRefreshError.bind(this))
            .finally(function () {
              this.refreshTokenDeferred = null;
            });

          if (token) {
            $http.post(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: token},
              {ignoreAuthModule: true})
            .success(this.refreshTokenDeferred.resolve)
            .error(this.refreshTokenDeferred.reject);
          } else {
            this.refreshTokenDeferred.reject();
          }
        }

        return this.refreshTokenDeferred.promise;
      };

      this.tokenRefreshed = function (response) {
        localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
        this.retryRequestBuffer();
      };

      this.tokenRefreshError = function () {
        this.clearRequestBuffer();
        // AlertService.error('You failed to authenticate. Redirecting to login.', false);
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      this.bufferRequest = function (config) {
        requestBuffer.push(config);
      };

      this.retryRequestBuffer = function () {
        _.each(requestBuffer, function (config) {
          config.headers.ignoreAuthModule = true;
          $http(config);
        });
        this.clearRequestBuffer();
      };

      this.clearRequestBuffer = function () {
        requestBuffer = [];
      };

      return this;
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
