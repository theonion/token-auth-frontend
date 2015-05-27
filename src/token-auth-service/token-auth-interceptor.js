'use strict';

angular.module('tokenAuth.authInterceptor', [
  'tokenAuth.authService',
  'tokenAuth.httpRequestBuffer'
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
            HttpRequestBuffer.append(response.config, deferred);
            var TokenAuthService = $injector.get('TokenAuthService');
            TokenAuthService.refreshToken();
          }
        }
      }
      return $q.reject(response);
    };

    return factory;
  }]);