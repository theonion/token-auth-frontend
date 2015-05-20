'use strict';

angular.module('tokenAuth.authService', [
  'tokenAuth.httpRequestBuffer',
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('AuthService',
  ['$rootScope', '$location', '$http', 'HttpRequestBuffer', 'localStorageService', /*'AlertService',*/ 'TokenAuthConfig',
  function ($rootScope, $location, $http, HttpRequestBuffer, localStorageService, /*AlertService,*/ TokenAuthConfig) {
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
      var token = localStorageService.get(TokenAuthConfig.getTokenKey());
      return $http.post(
          TokenAuthConfig.getApiEndpointRefresh(),
          {token: token},
          {ignoreAuthModule: true})
        .success(service.tokenRefreshed)
        .error(service.tokenRefreshError);
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
