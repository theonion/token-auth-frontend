'use strict';
// Source: .tmp/scripts/auth-service/auth-interceptor.js
angular.module('tokenAuth.authInterceptor', [
  'tokenAuth.authService',
  'tokenAuth.httpRequestBuffer'
])
  .factory('authInterceptor',
  ['$q', '$location', '$injector', 'localStorageService', 'httpRequestBuffer',
  function ($q, $location, $injector, localStorageService, httpRequestBuffer) {

    var factory = {};

    factory.request = function (config) {
      config.headers = config.headers || {};
      var token = localStorageService.get('authToken');
      var isBettyCropperRequest = _.has(config.headers, 'X-Betty-Api-Key');
      if (token && !config.ignoreAuthorizationHeader && !isBettyCropperRequest) {
        config.headers.Authorization = 'JWT ' + token;
      }
      return config;
    };

    factory.responseError = function (response) {
      if (response.config) {
        var ignoreAuthModule = response.config.ignoreAuthModule || response.config.headers.ignoreAuthModule;
        if (!ignoreAuthModule) {
          if (response.status === 403 || response.status === 401) {
            var deferred = $q.defer();
            httpRequestBuffer.append(response.config, deferred);
            var authService = $injector.get('authService');
            authService.refreshToken();
          }
        }
      }
      return $q.reject(response);
    };

    return factory;
  }]);

// Source: .tmp/scripts/auth-service/auth-service.js
angular.module('tokenAuth.authService', [
  'tokenAuth.httpRequestBuffer',
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('authService',
  ['$rootScope', '$location', '$http', 'httpRequestBuffer', 'localStorageService', /*'AlertService',*/ 'TokenAuthConfig',
  function ($rootScope, $location, $http, httpRequestBuffer, localStorageService, /*AlertService,*/ TokenAuthConfig) {
    var service = {};

    service.login = function (username, password) {
      return $http.post(TokenAuthConfig.getApiEndpointAuth(), {
        username: username,
        password: password
      })
      .success(service.loginSuccess)
      .error(service.loginError);
    };

    service.loginSuccess = function (response) {
      localStorageService.set('authToken', response.token);
    };

    service.loginError = function () {
      // AlertService.error('Username or password provided is incorrect.', false);
    };

    service.refreshToken = function () {
      var token = localStorageService.get('authToken');
      return $http.post(
          TokenAuthConfig.getApiEndpointRefresh(),
          {token: token},
          {ignoreAuthModule: true})
        .success(service.tokenRefreshed)
        .error(service.tokenRefreshError);
    };

    service.tokenRefreshed = function (response) {
      localStorageService.set('authToken', response.token);
      httpRequestBuffer.retryAll();
    };

    service.tokenRefreshError = function () {
      httpRequestBuffer.rejectAll();
      // AlertService.error('You failed to authenticate. Redirecting to login.', false);
      $location.path('cms/login');
    };

    return service;
  }]);

// Source: .tmp/scripts/auth-service/http-request-buffer-factory.js
angular.module('tokenAuth.httpRequestBuffer', [])
  .service('httpRequestBuffer',
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

// Source: .tmp/scripts/current-user/current-user.js
angular.module('tokenAuth.currentUser', [
  'LocalStorageModule'
])
  .service('TokenAuthCurrentUser',
    ['localStorageService', '$location',
    function (localStorageService, $location) {
      this.currentUser = null;
      this.getCurrentUser = function () {
        return localStorageService.get('currentUser');
      };

      this.setCurrentUser = function (newCurrentUser) {
        localStorageService.set('currentUser', newCurrentUser);
      };

      this.logout = function () {
        this.currentUser = null;
        localStorageService.remove('authToken');
        localStorageService.remove('currentUser');
        $location.path('cms/login/');
      };
    }]);

// Source: .tmp/scripts/login-form/login-form.js
angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.currentUser',
  'tokenAuth.templates'
])
  .directive('loginForm', [function () {
    return {
      controller:
        ['$scope', '$location', 'authService', 'TokenAuthConfig', /*'AlertService',*/ 'TokenAuthCurrentUser', /*'BettyService',*/
        function ($scope, $location, authService, TokenAuthConfig, /*AlertService,*/ TokenAuthCurrentUser /*, BettyService*/) {

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
              authService.login($scope.username, $scope.password)
                .then($scope.userLoggedIn);
            }
          };

          $scope.userLoggedIn = function () {
            TokenAuthCurrentUser.setCurrentUser($scope.username);
            // BettyService.updateBettyConfig();
            $location.path('cms/');
          };

          $scope.init();
        }],
      restrict: 'E',
      scope: {},
      templateUrl: 'login-form/login-form.html'
    };
  }]);

// Source: .tmp/scripts/token-auth-config.js
angular.module('tokenAuth.config', [])
  .provider('TokenAuthConfig', function TokenAuthConfigProvider () {
    var logoUrl = '';
    var apiHost = '';
    var apiEndpointAuth = '/api/token/auth';
    var apiEndpointRefresh = '/api/token/refresh';

    this.setLogoUrl = function (value) {
      if (typeof(value) === 'string') {
        logoUrl = value;
      } else {
        throw new TypeError('TokenAuthConfig.logoUrl must be a string!');
      }
    };

    this.setApiHost = function (value) {
      if (typeof(value) === 'string') {
        apiHost = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiHost must be a string!');
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

    this.$get = function () {
      return {
        getLogoUrl: function () {
          return logoUrl;
        },
        getApiEndpointAuth: function () {
          return apiHost + apiEndpointAuth;
        },
        getApiEndpointRefresh: function () {
          return apiHost + apiEndpointRefresh;
        }
     };
    };
  });

// Source: .tmp/scripts/token-auth.js
angular.module('tokenAuth', [
  'tokenAuth.loginForm',
  'tokenAuth.authInterceptor'
]);

// Source: .tmp/templates.js
angular.module('tokenAuth.templates', []).run(['$templateCache', function($templateCache) {
$templateCache.put('login-form/login-form.html',
    "<div class=login-container><div class=login-header><img ng-src={{LOGO_URL}}></div><div class=login-form><p class=\"text-center welcome-text\">Welcome</p><form><div class=\"login-input username\"><label>Username</label><input class=form-control ng-model=username required><div class=\"alert alert-danger required-label\" ng-class=submitted>Required</div></div><div class=\"login-input password\"><label>Password</label><input type=password class=form-control ng-model=password required><div class=\"alert alert-danger required-label\" ng-class=submitted>Required</div></div><alertbar></alertbar><button class=\"btn add-btn btn-success\" type=submit ng-click=submitLogin()><span>Sign in</span></button></form><a class=contact href=mailto:webtech@theonion.com><div class=question-mark>?</div><div class=contact-tech>Contact Tech</div></a></div></div>"
  );

}]);
