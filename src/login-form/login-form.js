'use strict';

angular.module('tokenAuth.loginForm', [
  'tokenAuth.authService',
  'tokenAuth.currentUser',
  'tokenAuth.templates'
])
  .directive('loginForm', [function () {
    return {
      controller:
        ['$scope', '$location', 'authService', 'TOKEN_AUTH_LOGO_URL', /*'AlertService',*/ 'CurrentUser', /*'BettyService',*/
        function ($scope, $location, authService, TOKEN_AUTH_LOGO_URL, /*AlertService,*/ CurrentUser /*, BettyService*/) {

          $scope.init = function () {
            $scope.username = '';
            $scope.password = '';
            $scope.submitted = '';
            $scope.LOGO_URL = TOKEN_AUTH_LOGO_URL;
          };

          $scope.submitLogin = function () {
            $scope.submitted = 'submitted';
            // AlertService.clear();
            if(!_.isEmpty($scope.username) && !_.isEmpty($scope.password)) {
              authService.login($scope.username, $scope.password)
                .then($scope.userLoggedIn);
            }
          };

          $scope.userLoggedIn = function () {
            CurrentUser.setCurrentUser($scope.username);
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
