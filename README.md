# token-auth-frontend
Angular library for token auth with [django-rest-framework-jwt](https://github.com/GetBlimp/django-rest-framework-jwt).

## Setup
1. Since this is a private repo, you'll need to add this line to your ```bower.json``` ```"dependencies"``` section manually:
```json
"token-auth-frontend": "https://github.com/theonion/token-auth-frontend.git#<version>"
```
Given ```<version>``` is the version number you want to use.
2. Install token auth with bower (if this is the frist time running bower on a new project):
```bash
$ bower install
```
Or do
```bash
bower update token-auth-frontend
```
if using this on a existing project (there are some unspecified issues with doing ```bower install token-auth-frontend``` directly.)
3. Provide this framework as a dependency of your app, for example:
```javascript
angular.module('myApp', ['tokenAuth'])
```
4. Then somewhere within a ```config``` step of some module, setup a reference to the logout function provided by the ```tokenAuth.authService``` module. Also setup the ```AuthInterceptor``` so the library can intercept and authenticate requests. For example:
```javascript
angular.module('myApp.settings', ['tokenAuth'])
  .config([
    'AuthServiceProvider', 'MyLoginService', '$httpProvider',
    function (AuthServiceProvider, MyLoginService, $httpProvider) {
      // set up logout callback
      MyLoginService.setLogoutCallback(function () {
        AuthServiceProvider.$get().logout();
      });

      // setup interceptor to authenticate requests
      $httpProvider.interceptors.push('AuthInterceptor');
    }
  ]);
```
where ```MyLoginService``` is some service used to handle login/logout configuration.
5. Configure ```TokenAuthConfig``` itself:
```javascript
angular.module('tokenAuth.config')
  .config(function (TokenAuthConfigProvider) {
    TokenAuthConfigProvider.setLogoUrl('myLogo.png');
    TokenAuthConfigProvider.setApiHost('base.url.for.api.with.drf.token.auth.com');
    TokenAuthConfigProvider.setApiEndpointAuth('/authentication/endpoint/provided/by/api');
    TokenAuthConfigProvider.setApiEndpointRefresh('/token/refresh/endpoint/provied/by/api');
    TokenAuthConfigProvider.setLoginPagePath('/where/the/login/page/is/hosted');
  });
```
