'use strict';

angular.module('tokenAuth.authService', [
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthService', [
    '$q', '$rootScope', '$location', '$http', 'localStorageService', 'TokenAuthConfig',
    function ($q, $rootScope, $location, $http, localStorageService, TokenAuthConfig) {

      var TokenAuthService = this;

      TokenAuthService._authenticated = false;
      TokenAuthService._requestBuffer = [];

      var authSuccess = function (deferred) {
        return function () {
          TokenAuthService._authenticated = true;
          TokenAuthService.requestBufferRetry();
          deferred.resolve();
        };
      };

      var noTokenFailure = function (deferred) {
        return function () {
          TokenAuthService.navToLogin();
          deferred.reject();
        };
      };

      TokenAuthService.tokenVerify = function () {
        var verification = $q.defer();
        var token = localStorageService.get(TokenAuthConfig.getTokenKey());

        if (token) {
          // has a token, fire off request
          $http.post(
            TokenAuthConfig.getApiEndpointVerify(),
            {token: token},
            {headers: {ignoreTokenAuth: true}}
          )
          .then(authSuccess(verification))
          .catch(function (response) {
            // some error at the verify endpoint
            TokenAuthService._authenticated = false;
            if (response.status === 401 || response.status === 403) {
              // not authed, attempt refresh, resolve as refresh does
              TokenAuthService.tokenRefresh()
                .then(verification.resolve)
                .catch(verification.reject);
            } else {
              // this is not an auth error, reject verification
              verification.reject();
            }
          });
        } else {
          noTokenFailure(verification)();
        }

        return verification.promise;
      };

      TokenAuthService.tokenRefresh = function () {
        var refresh = $q.defer();
        var token = localStorageService.get(TokenAuthConfig.getTokenKey());

        if (token) {
          // has token, fire off request
          $http.post(
            TokenAuthConfig.getApiEndpointRefresh(),
            {token: token},
            {headers: {ignoreTokenAuth: true}}
          )
          .success(authSuccess(refresh))
          .catch(noTokenFailure(refresh));
        } else {
          noTokenFailure(refresh)();
        }

        return refresh.promise;
      };

      TokenAuthService.login = function (username, password) {
        var login = $q.defer();

        $http.post(
          TokenAuthConfig.getApiEndpointAuth(),
          {
            username: username,
            password: password
          },
          {headers: {ignoreTokenAuth: true}}
        )
        .success(function (response) {
          localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
          $location.path(TokenAuthConfig.getAfterLoginPath());
          TokenAuthConfig.loginCallback();
          login.resolve();
        })
        .catch(login.reject);

        return login.promise;
      };

      TokenAuthService.logout = function () {
        localStorageService.remove(TokenAuthConfig.getTokenKey());
        $location.path(TokenAuthConfig.getLoginPagePath());
        TokenAuthConfig.logoutCallback();
      };

      TokenAuthService.requestBufferPush = function (config) {
        TokenAuthService._requestBuffer.push(config);
      };

      TokenAuthService.requestBufferRetry = function () {
        var abort = $q.defer();

        _.each(TokenAuthService._requestBuffer, function (config) {
          config.headers = config.headers || {};
          config.headers.ignoreTokenAuth = true;

          // hook for canceling requests after a failure
          config.timeout = abort.promise;

          $http(config)
            .catch(function () {
              // have one failure, abort all other requests
              abort.resolve();
            });
         });

         TokenAuthService.requestBufferClear();
      };

      TokenAuthService.requestBufferClear = function () {
        TokenAuthService._requestBuffer = [];
      };

      TokenAuthService.navToLogin = function () {
        TokenAuthService.requestBufferClear();
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      TokenAuthService.isAuthenticated = function () {
        return TokenAuthService._authenticated;
      };

      return TokenAuthService;
    }
  ]);
