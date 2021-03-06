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
      // false if not verified at least once, otherwise promise that resolves when
      //  verification endpoint returns
      var $verified = false;

      TokenAuthService._requestBuffer = [];

      /**
       * Force verification promise to be resolved. Used whenever an endpoint
       *  besides the verify endpoint has been used to successfully authenticate.
       */
      var forceAuthenticated = function () {
        $verified = $q.defer();
        $verified.resolve();
      };

      /**
       * Force verification promise to be rejected. Used whenever an endpoint
       *  besides the verify endpoint has been used to unauthenticate.
       */
      var forceUnauthenticated = function () {
        $verified = $q.defer();
        $verified.reject();
      };

      var authSuccess = function (deferred) {
        return function () {
          forceAuthenticated();
          TokenAuthService.requestBufferRetry();

          // if we're currently on the login page, navigate away from it
          if ($location.path() === TokenAuthConfig.getLoginPagePath()) {
            $location.path(TokenAuthConfig.getAfterLoginPath());
          }

          deferred.resolve();
        };
      };

      var noTokenFailure = function (deferred) {
        return function () {
          forceUnauthenticated();
          TokenAuthService.navToLogin();
          deferred.reject();
        };
      };

      /**
       * Token verification endpoint. Should be used as the initial request when
       *  a page loads to check if user is authenticated. All requests should be
       *  buffered until verify endpoint returns successfully.

       * Because token verification is meant only to occur once when the page loads,
       *  subsequent calls to this function will return the promise from the original
       *  call.
       *
       * @returns {promise} resolves when authenticated, rejects otherwise.
       */
      TokenAuthService.tokenVerify = function () {
        if (!$verified && !requestInProgress) {
          // verify has not been called yet, set it up
          $verified = $q.defer();

          // no currently running request, start a new one
          requestInProgress = true;

          var token = localStorageService.get(TokenAuthConfig.getTokenKey());
          if (token) {

            // has a token, fire off request
            $http.post(
              TokenAuthConfig.getApiEndpointVerify(),
              {token: token},
              {ignoreTokenAuth: true}
            )
            .then(authSuccess($verified))
            .catch(function (response) {
              // some error at the verify endpoint
              if (response.status === 400) {
                // this is an expired token, attempt refresh
                requestInProgress = false;
                TokenAuthService.tokenRefresh()
                  .then($verified.resolve)
                  .catch($verified.reject);
              } else if (TokenAuthConfig.isStatusCodeToHandle(response.status)) {
                // user is not authorized, send them to login page
                noTokenFailure($verified)();
              } else {
                // this is not an auth error, reject verification
                $verified.reject();
              }
            })
            .finally(function () {
              // reset request flag so other requests can go through
              requestInProgress = false;
            });
          } else {
            noTokenFailure($verified)();

            // reset request flag so other requests can go through
            requestInProgress = false;
          }
        }

        return $verified ? $verified.promise : $q.reject();
      };

      /**
       * Token refresh endpoint. Should be used for reauthenticating ajax requests
       *  that have responded with an unauthorized status code. In the event of
       *  an error status code returning from a refresh request, the user will
       *  be routed to the login page.
       *
       * @returns {promise} resolves when authenticated, rejects otherwise.
       */
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
              {ignoreTokenAuth: true}
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

      /**
       * Login endpoint. Should only be used where a user is providing a username
       *  and password to login. After a successful login, the user will be directed
       *  to the configured afterLoginPath location.
       *
       * @param {string} username - username to use to login.
       * @param {string} password - password to use to login.
       * @returns {promise} resolves when authenticated, rejects otherwise.
       */
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
            {ignoreTokenAuth: true}
          )
          .success(function (response) {
            forceAuthenticated();
            localStorageService.set(TokenAuthConfig.getTokenKey(), response.token);
            $location.path(TokenAuthConfig.getAfterLoginPath());
            TokenAuthConfig.loginCallback();
            login.resolve();
          })
          .catch(function () {
            forceUnauthenticated();
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

      /**
       * Log user out by removing token from local storage, sends them back to
       *  login page.
       */
      TokenAuthService.logout = function () {
        forceUnauthenticated();
        localStorageService.remove(TokenAuthConfig.getTokenKey());
        $location.path(TokenAuthConfig.getLoginPagePath());
        TokenAuthConfig.logoutCallback();
      };

      /**
       * Push a request configuration into buffer to be rerun later.
       *
       * @param {object} config - request configuration to be buffered.
       * @returns {object} cloned config object added to the buffer.
       */
      TokenAuthService.requestBufferPush = function (config) {
        var configCopy = _.omit(config, 'timeout');
        TokenAuthService._requestBuffer.push(configCopy);
        return configCopy;
      };

      /**
       * Retry all buffered requests. If any response returns with an
       *  unauthorized status code, all further buffered requests will be aborted.
       *  Clears buffer in every case.
       */
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

      /**
       * Remove all request configurations from request buffer.
       */
      TokenAuthService.requestBufferClear = function () {
        TokenAuthService._requestBuffer = [];
      };

      /**
       * Clear request buffer and send user to login page.
       */
      TokenAuthService.navToLogin = function () {
        TokenAuthService.requestBufferClear();
        $location.path(TokenAuthConfig.getLoginPagePath());
      };

      return TokenAuthService;
    }
  ]);
