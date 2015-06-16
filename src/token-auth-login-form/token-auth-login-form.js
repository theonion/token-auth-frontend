'use strict';

angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.templates'
])
  .directive('tokenAuthLoginForm', [
    function () {
      return {
        controller: [
          '$scope', 'TokenAuthService', 'TokenAuthConfig',
          function ($scope, TokenAuthService, TokenAuthConfig) {

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
