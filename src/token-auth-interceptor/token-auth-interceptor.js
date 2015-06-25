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
        return Boolean(!config || config.ignoreTokenAuth);
      };

      var abortRequest = function (config) {
        var abort = $q.defer();
        config.timeout = abort.promise;
        abort.resolve();
      };

      this.request = function (config) {
        var newConfig;

        if (!doIgnoreAuth(config) && TokenAuthConfig.shouldBeIntercepted(config.url)) {

          // get token from storage
          var token = localStorageService.get(TokenAuthConfig.getTokenKey());
          // need to inject service here, otherwise we get a circular $http dep
          var TokenAuthService = $injector.get('TokenAuthService');

          // check if we have a token, if not, prevent request from firing, send user to login
          if (token) {
            newConfig = TokenAuthService.tokenVerify()
              .then(function () {
                // add Authorization header
                config.headers = config.headers || {};
                config.headers.Authorization = 'JWT ' + token;

                return config;
              })
              .catch(function () {
                // verification failed abort request
                abortRequest(config);
              });
          } else {
            // abort requests where there's no token
            abortRequest(config);

            // navigate to login page
            TokenAuthService.navToLogin();

            // return aborted request
            newConfig = config;
          }
        } else {
          // this is a request not being intercepted, just return it
          newConfig = config;
        }

        return newConfig;
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
