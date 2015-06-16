'use strict';

angular.module('tokenAuth.authService', [
  'tokenAuth.config',
  'LocalStorageModule'
])
  .service('TokenAuthService', [
    '$q', '$rootScope', '$location', '$http', 'localStorageService', 'TokenAuthConfig',
    function ($q, $rootScope, $location, $http, localStorageService, TokenAuthConfig) {

      var TokenAuthService = this;
      var requestInProgress = false;

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
          TokenAuthService._authenticated = false;
          TokenAuthService.navToLogin();
          deferred.reject();
        };
      };

      TokenAuthService.tokenVerify = function () {
        var verification = $q.defer();

        if (!requestInProgress) {
          // no currently running request, start a new one
          requestInProgress = true;
          TokenAuthService._pendingVerification = verification;

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
              if (TokenAuthConfig.isStatusCodeToHandle(response.status)) {
                // not authed, attempt refresh, resolve as refresh does
                TokenAuthService.tokenRefresh()
                  .then(verification.resolve)
                  .catch(verification.reject);
              } else {
                // this is not an auth error, reject verification
                verification.reject();
              }
            })
            .finally(function () {
              // reset request flag so other requests can go through
              requestInProgress = false;
            });
          } else {
            noTokenFailure(verification)();

            // reset request flag so other requests can go through
            requestInProgress = false;
          }
        } else if (!TokenAuthService._pendingVerification) {
          // there is a request happening, and it's not a verify request, reject promise
          verification.reject();
        } else {
          // request in progress and it's a verify request, return existing promise
          verification = TokenAuthService._pendingVerification;
        }

        return verification.promise;
      };

      TokenAuthService.tokenRefresh = function () {
        var refresh = $q.defer();

        if (!requestInProgress) {
          // no currently running request, start a new one
          requestInProgress = true;
          TokenAuthService._pendingRefresh = refresh;

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());
          if (token) {
            // has token, fire off request
            $http.post(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: token},
              {headers: {ignoreTokenAuth: true}}
            )
            .success(authSuccess(refresh))
            .catch(noTokenFailure(refresh))
            .finally(function () {
              // reset request flag so other requests can go through
              requestInProgress = false;
            });
          } else {
            noTokenFailure(refresh)();

            // reset request flag so other requests can go through
            requestInProgress = false;
          }

        } else if (!TokenAuthService._pendingRefresh) {
          // there is a request happening, and it's not a refresh request, reject promise
          refresh.reject();
        } else {
          // request in progress and it's a refresh request, return existing promise
          refresh = TokenAuthService._pendingRefresh;
        }

        return refresh.promise;
      };

      TokenAuthService.login = function (username, password) {
        var login = $q.defer();

        if (!requestInProgress) {
          // no currently running request, start a new one
          requestInProgress = true;
          TokenAuthService._pendingLogin = login;

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
            TokenAuthService._authenticated = true;
            TokenAuthConfig.loginCallback();
            login.resolve();
          })
          .catch(function () {
            TokenAuthService._authenticated = false;
            login.reject();
          })
          .finally(function () {
            // reset request flag so other requests can go through
            requestInProgress = false;
          });
        } else if (!TokenAuthService._pendingLogin) {
          // there is a request happening, and it's not a login request, reject promise
          login.reject();
        } else {
          // request in progress and it's a login request, return existing promise
          login = TokenAuthService._pendingLogin;
        }

        return login.promise;
      };

      TokenAuthService.logout = function () {
        TokenAuthService._authenticated = false;
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
          // hook for canceling requests after a failure
          config.timeout = abort.promise;

          $http(config)
            .catch(function (response) {
              if (TokenAuthConfig.isStatusCodeToHandle(response.status)) {
                // have one failure, abort all other requests
                abort.resolve();
              }
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
