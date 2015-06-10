'use strict';

angular.module('tokenAuth.authInterceptor', [
  'tokenAuth.authService',
  'tokenAuth.config',
  'tokenAuth.httpRequestBuffer',
  'LocalStorageModule'
])
  .service('TokenAuthInterceptor', [
    '$q', '$location', '$injector', 'localStorageService', 'TokenAuthHttpRequestBuffer',
      'TokenAuthConfig',
    function ($q, $location, $injector, localStorageService, TokenAuthHttpRequestBuffer,
      TokenAuthConfig) {

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

          // append request to buffer to retry later
          var deferred = $q.defer();
          TokenAuthHttpRequestBuffer.append(response.config, deferred);

          // attempt to refresh token
          var TokenAuthService = $injector.get('TokenAuthService');
          TokenAuthService.refreshToken();
        }

        return $q.reject(response);
      };

      return this;
    }
  ]);
