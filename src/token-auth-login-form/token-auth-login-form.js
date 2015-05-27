'use strict';

angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.currentUser',
  'tokenAuth.templates'
])
  .directive('tokenAuthLoginForm', [function () {
    return {
      controller:
        ['$scope', '$location', 'TokenAuthService', 'TokenAuthConfig', /*'AlertService',*/ 'TokenAuthCurrentUser', /*'BettyService',*/
        function ($scope, $location, TokenAuthService, TokenAuthConfig, /*AlertService,*/ TokenAuthCurrentUser /*, BettyService*/) {

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
            TokenAuthCurrentUser.setCurrentUser($scope.username);
            // BettyService.updateBettyConfig();
            $location.path(TokenAuthConfig.getAfterLoginPath());
          };

          $scope.init();
        }],
      restrict: 'E',
      scope: {},
      templateUrl: 'token-auth-login-form/token-auth-login-form.html'
    };
  }]);
