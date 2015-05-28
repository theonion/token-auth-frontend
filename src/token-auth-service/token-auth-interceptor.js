'use strict';

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
