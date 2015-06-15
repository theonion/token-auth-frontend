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

      this._authenticated = false;
      this._requestBuffer = [];

      this.tokenVerify = function () {
        var verification = $q.defer();
        var token = localStorageService.get(TokenAuthConfig.getTokenKey());

        if (token) {
          // has a token, fire off request
          $http.post(
            TokenAuthConfig.getApiEndpointVerify(),
            {token: token},
            {ignoreTokenAuth: true}
          )
          .success((function () {
            // user is authed, retry all buffer, resolve promise
            this._authenticated = true;
            this.requestBufferRetry();
            verification.resolve();
          }).bind(this))
          .error((function (err, status) {
            // some error at the verify endpoint
            this._authenticated = false;

            if (status === 401 || status === 403) {
              // not authed, attempt refresh, resolve as refresh does
              this.tokenRefresh()
                .then(verification.resolve)
                .catch(verification.reject);
            } else {
              // this is not an auth error, reject verification
              verification.reject();
            }
          }).bind(this));
        } else {
          // no token at all, send user to login reject verification
          this.navToLogin();
          verification.reject();
        }

        return verification.promise;
      };

      this.tokenRefresh = function () {
        var refresh = $q.defer();

        return refresh.promise;
      };

      this.requestBufferPush = function (config) {
        this._requestBuffer.push(config);
      };

      this.requestBufferRetry = function () {
        _.each(this._requestBuffer, function (config) {
          config.headers = config.headers || {};
          config.headers.ignoreTokenAuth = true;
          $http(config);
         });
         this.clearRequestBuffer();
      };

      this.requestBufferClear = function () {
        this._requestBuffer = [];
      };

      this.navToLogin = function () {
        this.requestBufferClear();
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      this.isAuthenticated = function () {
        return this._authenticated;
      };




      // this.verifyToken = function () {
      //   var deferred = $q.defer();
      //   var token = localStorageService.get(TokenAuthConfig.getTokenKey());
      //
      //   deferred.promise
      //     .then(this.verifySuccess.bind(this));
      //
      //   if (token) {
      //     $http.post(
      //       TokenAuthConfig.getApiEndpointVerify(),
      //       {token: token},
      //       {ignoreAuthModule: true})
      //     .success(deferred.resolve)
      //     .error(deferred.reject);
      //   } else {
      //     deferred.reject();
      //   }
      //
      //   return deferred.promise;
      // };
      //
      // this.verifySuccess = function () {
      //   $location.path(TokenAuthConfig.getAfterLoginPath());
      // };
      //
      // this.login = function (username, password) {
      //   var deferred = $q.defer();
      //
      //   deferred.promise
      //     .then(this.loginSuccess.bind(this))
      //     .catch(this.loginError.bind(this));
      //
      //   $http.post(
      //     TokenAuthConfig.getApiEndpointAuth(), {
      //       username: username,
      //       password: password
      //     }, {
      //       ignoreAuthModule: true
      //     })
      //   .success(deferred.resolve)
      //   .error(deferred.reject);
      //
      //   return deferred.promise;
      // };
      //
      // this.loginSuccess = function (response) {
      //   localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
      //   $location.path(TokenAuthConfig.getAfterLoginPath());
      //   TokenAuthConfig.loginCallback();
      // };
      //
      // this.loginError = function () {
      //   // AlertService.error('Username or password provided is incorrect.', false);
      // };
      //
      // this.logout = function () {
      //   localStorageService.remove(TokenAuthConfig.getTokenKey());
      //   $location.path(TokenAuthConfig.getLoginPagePath());
      //   TokenAuthConfig.logoutCallback();
      // };
      //
      // this.refreshToken = function () {
      //   if (!this.refreshTokenDeferred) {
      //     this.refreshTokenDeferred = $q.defer();
      //
      //     var token = localStorageService.get(TokenAuthConfig.getTokenKey());
      //
      //     this.refreshTokenDeferred.promise
      //       .then(this.tokenRefreshed.bind(this))
      //       .catch(this.navToLogin.bind(this))
      //       .finally(function () {
      //         this.refreshTokenDeferred = null;
      //       });
      //
      //     if (token) {
      //       $http.post(
      //         TokenAuthConfig.getApiEndpointRefresh(),
      //         {token: token},
      //         {ignoreAuthModule: true})
      //       .success(this.refreshTokenDeferred.resolve)
      //       .error(this.refreshTokenDeferred.reject);
      //     } else {
      //       this.refreshTokenDeferred.reject();
      //     }
      //   }
      //
      //   return this.refreshTokenDeferred.promise;
      // };
      //
      // this.tokenRefreshed = function (response) {
      //   localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
      //   this.retryRequestBuffer();
      // };
      //
      // this.navToLogin = function () {
      //   this.clearRequestBuffer();
      //   $location.path(TokenAuthConfig.getLoginPagePath());
      // };


      return this;
    }
  ]);
