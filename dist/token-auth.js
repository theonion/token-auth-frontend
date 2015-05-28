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
      if (typeof(value) === 'string') {
        afterLoginPath = value;
      } else {
        throw new TypeError('TokenAuthConfig.afterLoginPath must be a string!');
      }
    };

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

    this.setLoginCallback = function (func) {
      if (typeof(func) === 'function') {
        loginCallback = func;
      } else {
        throw new TypeError('TokenAuthConfig.loginCallback must be a function!');
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

    this.setLogoutCallback = function (func) {
      if (typeof(func) === 'function') {
        logoutCallback = func;
      } else {
        throw new TypeError('TokenAuthConfig.logoutCallback must be a function!');
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
        getAfterLoginPath: function () {
          return afterLoginPath;
        },
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
        },
        loginCallback: loginCallback,
        logoutCallback: logoutCallback
     };
    };
  });

// Source: .tmp/scripts/token-auth-login-form/token-auth-login-form.js
angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.templates'
])
  .directive('tokenAuthLoginForm', [function () {
    return {
      controller:
        ['$scope', 'TokenAuthService', 'TokenAuthConfig', /*'AlertService', BettyService',*/
        function ($scope, TokenAuthService, TokenAuthConfig /*, AlertService, BettyService*/) {

          $scope.init = function () {
            $scope.username = '';
            $scope.password = '';
            $scope.submitted = '';
            $scope.LOGO_URL = TokenAuthConfig.getLogoUrl();
          };

          $scope.submitLogin = function () {
            $scope.submitted = 'submitted';
            // AlertService.clear();
            if(!_.isEmpty($scope.username) && !_.isEmpty($scope.password)) {
              TokenAuthService.login($scope.username, $scope.password)
                .then($scope.userLoggedIn);
            }
          };

          $scope.userLoggedIn = function () {
            // BettyService.updateBettyConfig();
          };

          $scope.init();
        }],
      restrict: 'E',
      scope: {},
      templateUrl: 'token-auth-login-form/token-auth-login-form.html'
    };
  }]);

// Source: .tmp/scripts/token-auth-service/http-request-buffer-factory.js
angular.module('tokenAuth.httpRequestBuffer', [])
  .service('HttpRequestBuffer',
    ['$injector',
    function ($injector) {
      var buffer = [];

      var _retryHttpRequest = function (config, deferred) {
        var successCallback = function (response) {
          deferred.resolve(response);
        };

        var errorCallback = function (response) {
          deferred.reject(response);
        };

        config.headers.ignoreAuthModule = true;
        var $http = $http || $injector.get('$http');
        $http(config).then(successCallback, errorCallback);
      };

      return {
        append: function (config, deferred) {
          buffer.push({
            config: config,
            deferred: deferred
          });
        },
        rejectAll: function (reason) {
          if (reason) {
            _.each(buffer, function (request) {
              request.deferred.reject(reason);
            });
          }
          buffer = [];
        },
        retryAll: function () {
          _.each(buffer, function (request) {
            _retryHttpRequest(request.config, request.deferred);
          });
          buffer = [];
        }
      };
    }]);

// Source: .tmp/scripts/token-auth-service/token-auth-interceptor.js
angular.module('tokenAuth.authInterceptor', [
  'tokenAuth.authService',
  'tokenAuth.config',
  'tokenAuth.httpRequestBuffer',
  'LocalStorageModule'
])
  .factory('TokenAuthInterceptor',
  ['$q', '$location', '$injector', 'localStorageService', 'HttpRequestBuffer',
    'TokenAuthConfig',
  function ($q, $location, $injector, localStorageService, HttpRequestBuffer,
    TokenAuthConfig) {

    var factory = {};

    factory.request = function (config) {
      config.headers = config.headers || {};
      var token = localStorageService.get(TokenAuthConfig.getTokenKey());

      // check if we have a token, if not, prevent request from firing, send user to login
      if (token) {
        var isBettyCropperRequest = _.has(config.headers, 'X-Betty-Api-Key');
        if (!config.ignoreAuthorizationHeader && !isBettyCropperRequest) {
          config.headers.Authorization = 'JWT ' + token;
        }
      } else if (!(config.ignoreAuthModule || config.headers.ignoreAuthModule)) {
        // abort requests where there's no token
        var abort = $q.defer();
        config.timeout = abort.promise;
        abort.resolve();
        $location.path(TokenAuthConfig.getLoginPagePath());
      }

      return config;
    };

    factory.responseError = function (response) {
      if (response.config) {
        var ignoreAuthModule = response.config.ignoreAuthModule || response.config.headers.ignoreAuthModule;
        if (!ignoreAuthModule && (response.status === 403 || response.status === 401)) {
          var deferred = $q.defer();
          HttpRequestBuffer.append(response.config, deferred);

          var TokenAuthService = $injector.get('TokenAuthService');
          TokenAuthService.refreshToken();
        }
      }
      return $q.reject(response);
    };

    return factory;
  }]);

// Source: .tmp/scripts/token-auth-service/token-auth-service.js
angular.module('tokenAuth.authService', [
  'tokenAuth.httpRequestBuffer',
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthService',
  ['$q', '$rootScope', '$location', '$http', 'HttpRequestBuffer', 'localStorageService',
      /*'AlertService',*/ 'TokenAuthConfig',
  function ($q, $rootScope, $location, $http, HttpRequestBuffer, localStorageService,
        /*AlertService,*/ TokenAuthConfig) {
    var service = {};

    service.login = function (username, password) {
      var deferred = $q.defer();

      deferred.promise
        .then(service.loginSuccess)
        .catch(service.loginError);

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

    service.loginSuccess = function (response) {
      localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
      $location.path(TokenAuthConfig.getAfterLoginPath());
      TokenAuthConfig.loginCallback();
    };

    service.loginError = function () {
      // AlertService.error('Username or password provided is incorrect.', false);
    };

    service.logout = function () {
      localStorageService.remove(TokenAuthConfig.getTokenKey());
      $location.path(TokenAuthConfig.getLoginPagePath());
      TokenAuthConfig.logoutCallback();
    };

    service.refreshToken = function () {
      var deferred = $q.defer();
      var token = localStorageService.get(TokenAuthConfig.getTokenKey());

      deferred.promise
        .then(service.tokenRefreshed)
        .catch(service.tokenRefreshError);

      if (token) {
        $http.post(
          TokenAuthConfig.getApiEndpointRefresh(),
          {token: token},
          {ignoreAuthModule: true})
        .success(deferred.resolve)
        .error(deferred.reject);
      } else {
        deferred.reject();
      }

      return deferred.promise;
    };

    service.tokenRefreshed = function (response) {
      localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
      HttpRequestBuffer.retryAll();
    };

    service.tokenRefreshError = function () {
      HttpRequestBuffer.rejectAll();
      // AlertService.error('You failed to authenticate. Redirecting to login.', false);
      $location.path(TokenAuthConfig.getLoginPagePath());
    };

    return service;
  }]);

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
