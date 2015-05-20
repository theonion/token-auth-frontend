'use strict';

angular.module('tokenAuth.httpRequestBuffer', [])
  .service('HttpRequestBuffer',
    ['$injector',
    function ($injector) {
      var buffer = [];

      var _retryHttpRequest = function (config, deferred) {
        var successCallback = function (response) {
          deferred.resolve(response);
        };

        var errorCallback = function (response) {
          deferred.reject(response);
        };

        config.headers.ignoreAuthModule = true;
        var $http = $http || $injector.get('$http');
        $http(config).then(successCallback, errorCallback);
      };

      return {
        append: function (config, deferred) {
          buffer.push({
            config: config,
            deferred: deferred
          });
        },
        rejectAll: function (reason) {
          if (reason) {
            _.each(buffer, function (request) {
              request.deferred.reject(reason);
            });
          }
          buffer = [];
        },
        retryAll: function () {
          _.each(buffer, function (request) {
            _retryHttpRequest(request.config, request.deferred);
          });
          buffer = [];
        }
      };
    }]);
