'use strict';

angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.templates'
])
  .directive('tokenAuthLoginForm', [
    function () {
      return {
        controller: [
          '$location', '$scope', 'TokenAuthService', 'TokenAuthConfig',
          function ($location, $scope, TokenAuthService, TokenAuthConfig) {

            // check if user is already authenticated
            TokenAuthService.tokenVerify()
              .then(function () {
                // already authenticated, call login callback, navigate away
                TokenAuthConfig.loginCallback();
                $location.path(TokenAuthConfig.getAfterLoginPath());
              });

            $scope.username = '';
            $scope.password = '';
            $scope.submitted = '';
            $scope.LOGO_URL = TokenAuthConfig.getLogoUrl();

            $scope.submitLogin = function () {
              $scope.submitted = 'submitted';

              if(!_.isEmpty($scope.username) && !_.isEmpty($scope.password)) {
                TokenAuthService.login($scope.username, $scope.password);
              }
            };
          }
        ],
        restrict: 'E',
        scope: {},
        templateUrl: 'token-auth-login-form/token-auth-login-form.html'
      };
    }
  ]);
