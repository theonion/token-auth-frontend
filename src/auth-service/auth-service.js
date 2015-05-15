'use strict';

angular.module('tokenAuth.authService', [
  'tokenAuth.httpRequestBuffer',
  'tokenAuth.settings',
  'LocalStorageModule'
])
  .service('authService',
  ['$rootScope', '$location', '$http', 'httpRequestBuffer', 'localStorageService', /*'AlertService',*/ 'TOKEN_AUTH_API_HOST',
  function ($rootScope, $location, $http, httpRequestBuffer, localStorageService, /*AlertService,*/ TOKEN_AUTH_API_HOST) {
    var service = {};

    service.login = function (username, password) {
      return $http.post(TOKEN_AUTH_API_HOST + '/api/token/auth', {
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
          TOKEN_AUTH_API_HOST + '/api/token/refresh',
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
