'use strict';

angular.module('tokenAuth.authService', [
  'tokenAuth.httpRequestBuffer',
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('AuthService',
  ['$q', '$rootScope', '$location', '$http', 'HttpRequestBuffer', 'localStorageService',
      /*'AlertService',*/ 'TokenAuthConfig',
  function ($q, $rootScope, $location, $http, HttpRequestBuffer, localStorageService,
        /*AlertService,*/ TokenAuthConfig) {
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
      localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
    };

    service.loginError = function () {
      // AlertService.error('Username or password provided is incorrect.', false);
    };

    service.logout = function () {
      localStorageService.remove(TokenAuthConfig.getTokenKey());
      $location.path(TokenAuthConfig.getLoginPagePath());
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
