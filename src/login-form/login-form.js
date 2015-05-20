'use strict';

angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.currentUser',
  'tokenAuth.templates'
])
  .directive('loginForm', [function () {
    return {
      controller:
        ['$scope', '$location', 'AuthService', 'TokenAuthConfig', /*'AlertService',*/ 'TokenAuthCurrentUser', /*'BettyService',*/
        function ($scope, $location, AuthService, TokenAuthConfig, /*AlertService,*/ TokenAuthCurrentUser /*, BettyService*/) {

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
              AuthService.login($scope.username, $scope.password)
                .then($scope.userLoggedIn);
            }
          };

          $scope.userLoggedIn = function () {
            TokenAuthCurrentUser.setCurrentUser($scope.username);
            // BettyService.updateBettyConfig();
            $location.path('cms/');
          };

          $scope.init();
        }],
      restrict: 'E',
      scope: {},
      templateUrl: 'login-form/login-form.html'
    };
  }]);
