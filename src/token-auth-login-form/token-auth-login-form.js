'use strict';

angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.templates'
])
  .directive('tokenAuthLoginForm', [function () {
    return {
      controller:
        ['$scope', 'TokenAuthService', 'TokenAuthConfig', /*'AlertService', BettyService',*/
        function ($scope, TokenAuthService, TokenAuthConfig /*, AlertService, BettyService*/) {

          $scope.init = function () {
            $scope.username = '';
            $scope.password = '';
            $scope.submitted = '';
            $scope.LOGO_URL = TokenAuthConfig.getLogoUrl();
          };

          $scope.submitLogin = function () {
            $scope.submitted = 'submitted';
            // AlertService.clear();
            if(!_.isEmpty($scope.username) && !_.isEmpty($scope.password)) {
              TokenAuthService.login($scope.username, $scope.password)
                .then($scope.userLoggedIn);
            }
          };

          $scope.userLoggedIn = function () {
            // BettyService.updateBettyConfig();
          };

          $scope.init();
        }],
      restrict: 'E',
      scope: {},
      templateUrl: 'token-auth-login-form/token-auth-login-form.html'
    };
  }]);
