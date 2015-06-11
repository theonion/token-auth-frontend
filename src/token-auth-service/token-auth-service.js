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
        if (!this.refreshTokenDeferred) {
          this.refreshTokenDeferred = $q.defer();

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());

          this.refreshTokenDeferred.promise
            .then(this.tokenRefreshed.bind(this))
            .catch(this.navToLogin.bind(this))
            .finally(function () {
              this.refreshTokenDeferred = null;
            });

          if (token) {
            $http.post(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: token},
              {ignoreAuthModule: true})
            .success(this.refreshTokenDeferred.resolve)
            .error(this.refreshTokenDeferred.reject);
          } else {
            this.refreshTokenDeferred.reject();
          }
        }

        return this.refreshTokenDeferred.promise;
      };

      this.tokenRefreshed = function (response) {
        localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
        this.retryRequestBuffer();
      };

      this.navToLogin = function () {
        this.clearRequestBuffer();
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      this.bufferRequest = function (config) {
        requestBuffer.push(config);
      };

      this.retryRequestBuffer = function () {
        _.each(requestBuffer, function (config) {
          config.headers.ignoreAuthModule = true;
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
