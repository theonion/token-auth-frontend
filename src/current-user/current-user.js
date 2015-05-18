'use strict';

angular.module('tokenAuth.currentUser', [
  'LocalStorageModule'
])
  .service('TokenAuthCurrentUser',
    ['localStorageService', '$location',
    function (localStorageService, $location) {
      this.currentUser = null;
      this.getCurrentUser = function () {
        return localStorageService.get('currentUser');
      };

      this.setCurrentUser = function (newCurrentUser) {
        localStorageService.set('currentUser', newCurrentUser);
      };

      this.logout = function () {
        this.currentUser = null;
        localStorageService.remove('authToken');
        localStorageService.remove('currentUser');
        $location.path('cms/login/');
      };
    }]);
