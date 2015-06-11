'use strict';

angular.module('tokenAuth.authService', [
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthService', [
    '$q', '$rootScope', '$location', '$http', 'localStorageService', /*'AlertService',*/
      'TokenAuthConfig',
    function ($q, $rootScope, $location, $http, localStorageService, /*AlertService,*/
      TokenAuthConfig) {

      var requestBuffer = [];

      this.verifyToken = function () {
        var deferred = $q.defer();
        var token = localStorageService.get(TokenAuthConfig.getTokenKey());

        deferred.promise
          .then(this.verifySuccess.bind(this));

        if (token) {
          $http.post(
            TokenAuthConfig.getApiEndpointVerify(),
            {token: token},
            {ignoreAuthModule: true})
          .success(deferred.resolve)
          .error(deferred.reject);
        } else {
          deferred.reject();
        }

        return deferred.promise;
      };

      this.verifySuccess = function () {
        $location.path(TokenAuthConfig.getAfterLoginPath());
      };

      this.login = function (username, password) {
        var deferred = $q.defer();

        deferred.promise
          .then(this.loginSuccess.bind(this))
          .catch(this.loginError.bind(this));

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

      this.loginSuccess = function (response) {
        localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
        $location.path(TokenAuthConfig.getAfterLoginPath());
        TokenAuthConfig.loginCallback();
      };

      this.loginError = function () {
        // AlertService.error('Username or password provided is incorrect.', false);
      };

      this.logout = function () {
        localStorageService.remove(TokenAuthConfig.getTokenKey());
        $location.path(TokenAuthConfig.getLoginPagePath());
        TokenAuthConfig.logoutCallback();
      };

      this.refreshToken = function () {
        var deferred = $q.defer();
        var token = localStorageService.get(TokenAuthConfig.getTokenKey());

        deferred.promise
          .then(this.tokenRefreshed.bind(this))
          .catch(this.tokenRefreshError.bind(this));

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

      this.tokenRefreshed = function (response) {
        localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
        this.retryRequestBuffer();
      };

      this.tokenRefreshError = function () {
        this.clearRequestBuffer();
        // AlertService.error('You failed to authenticate. Redirecting to login.', false);
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      this.bufferRequest = function (config) {
        requestBuffer.push(config);
      };

      this.retryRequestBuffer = function () {
        _.each(requestBuffer, function (config) {
          $http(config);
        });
        this.clearRequestBuffer();
      };

      this.clearRequestBuffer = function () {
        requestBuffer = [];
      };

      return this;
    }
  ]);
