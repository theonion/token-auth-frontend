'use strict';

angular.module('tokenAuth.config', [])
  .provider('TokenAuthConfig', function TokenAuthConfigProvider () {
    var logoUrl = '';
    var apiHost = '';

    this.setLogoUrl = function (value) {
      if (typeof(value) === 'string') {
        logoUrl = value;
      } else {
        throw new TypeError('TokenAuthConfig.logoUrl must be a string!');
      }
    };

    this.setApiHost = function (value) {
      if (typeof(value) === 'string') {
        apiHost = value;
      } else {
        throw new TypeError('TokenAuthConfig.apiHost must be a string!');
      }
    };

    this.$get = function () {
      return {
        getLogoUrl: function () {
          return logoUrl;
        },
        getApiHost: function () {
          return apiHost;
        }
      };
    };
  });
