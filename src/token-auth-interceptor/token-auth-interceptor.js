'use strict';

angular.module('tokenAuth.authInterceptor', [
  'tokenAuth.authService',
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthInterceptor', [
    '$injector', '$q', '$location', 'localStorageService', 'TokenAuthConfig',
    function ($injector, $q, $location, localStorageService, TokenAuthConfig) {

      var doIgnoreAuth = function (config) {
        return Boolean(!config || (config.headers && config.headers.ignoreTokenAuth));
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
              var abort = $q.defer();
              config.timeout = abort.promise;
              abort.resolve();

              // navigate to login page
              TokenAuthService.navToLogin();
            }
          } else {
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
