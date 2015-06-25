'use strict';

describe('Interceptor: TokenAuthInterceptor', function () {

  var $location;
  var $q;
  var $rootScope;
  var localStorageService;
  var TokenAuthConfig;
  var TokenAuthInterceptor;
  var TokenAuthService;
  var testRequestConfig;
  var url = '/some/test/url';

  beforeEach(function () {
    module('tokenAuth.authInterceptor');

    inject(function (_$location_, _$q_, _$rootScope_, _localStorageService_,
        _TokenAuthConfig_, _TokenAuthInterceptor_, _TokenAuthService_) {
      $location = _$location_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      localStorageService = _localStorageService_;
      TokenAuthConfig = _TokenAuthConfig_;
      TokenAuthInterceptor = _TokenAuthInterceptor_;
      TokenAuthService = _TokenAuthService_;
      testRequestConfig = {
        url: url
      };
    });
  });

  describe('request handler', function () {

    it('should return the config passed in', function () {
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(false);

      var returnConfig = TokenAuthInterceptor.request(testRequestConfig);

      expect(returnConfig).to.equal(testRequestConfig);
    });

    it('should add an authorization header when a token is in storage', function () {
      var token = 'something';
      var verifyDeferred = $q.defer();

      localStorageService.get = sinon.stub().returns(token);
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);
      TokenAuthService.tokenVerify = sinon.stub().returns(verifyDeferred.promise);

      TokenAuthInterceptor.request(testRequestConfig);

      verifyDeferred.resolve();
      $rootScope.$digest();

      expect(testRequestConfig.headers.Authorization).to.equal('JWT ' + token);
    });

    it('should abort when no token in session, set path to login page, clear request buffer', function () {
      var loginPagePath = '/some/path/to/login';

      localStorageService.get = sinon.stub();
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);
      TokenAuthConfig.getLoginPagePath = sinon.stub().returns(loginPagePath);
      TokenAuthService.navToLogin = sinon.stub();

      TokenAuthInterceptor.request(testRequestConfig);

      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
      expect(testRequestConfig.headers).to.be.undefined;
      expect(testRequestConfig.timeout).to.be.a(typeof($q.defer().promise));

      // test if abort has been resolved, so request is cancelled, status 1 === resolved
      expect(testRequestConfig.timeout.$$state.status).to.equal(1);
    });

    it('should abort when verification fails', function () {
      var verifyDeferred = $q.defer();

      localStorageService.get = sinon.stub().returns('123');
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);
      TokenAuthService.tokenVerify = sinon.stub().returns(verifyDeferred.promise);

      TokenAuthInterceptor.request(testRequestConfig);

      verifyDeferred.reject();
      $rootScope.$digest();

      expect(testRequestConfig.headers).to.be.undefined;
      expect(testRequestConfig.timeout).to.be.a(typeof($q.defer().promise));
    });

    it('should only intercept urls matching thosed provided by config', function () {
      TokenAuthConfig.shouldBeIntercepted = sinon.spy().withArgs(url);

      TokenAuthInterceptor.request(testRequestConfig);

      expect(TokenAuthConfig.shouldBeIntercepted.withArgs(url).calledOnce).to.be.true;
    });

    it('should be ignored when ignore flag is provided', function () {
      localStorageService.get = sinon.spy();

      // request config is undefined
      TokenAuthInterceptor.request();

      // ignore provided directly on config
      testRequestConfig.ignoreAuthModule = true;
      TokenAuthInterceptor.request(testRequestConfig);

      expect(localStorageService.get.calledOnce).to.be.true;
    });

    it('should delay requests until auth service is authenticated', function () {
      var config1 = {url: '1'};
      var config2 = {url: '2'};
      var token = 'something';
      var verifyDeferred = $q.defer();

      localStorageService.get = sinon.stub().returns(token);
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);
      TokenAuthService.tokenVerify = sinon.stub().returns(verifyDeferred.promise);

      TokenAuthInterceptor.request(config1);
      TokenAuthInterceptor.request(config2);

      expect(config1.headers).to.be.undefined;
      expect(config2.headers).to.be.undefined;

      verifyDeferred.resolve();
      $rootScope.$digest();

      expect(config1.headers.Authorization).to.equal('JWT ' + token);
      expect(config2.headers.Authorization).to.equal('JWT ' + token);
    });
  });

  describe('response error handler', function () {
    var response;

    beforeEach(function () {
      response = {
        config: testRequestConfig,
        status: 403
      };
    });

    it('should return a rejected promise', function () {
      var returnPromise = TokenAuthInterceptor.responseError(response);

      // status 2 === rejected
      expect(returnPromise.$$state.status).to.equal(2);
    });

    it('should add failures to request buffer and attempt token refresh', function () {
      TokenAuthService.requestBufferPush = sinon.spy();
      TokenAuthService.tokenRefresh = sinon.spy();

      TokenAuthInterceptor.responseError(response);

      expect(TokenAuthService.requestBufferPush.withArgs(testRequestConfig).calledOnce).to.be.true;
      expect(TokenAuthService.tokenRefresh.calledOnce).to.be.true;
    });

    it('should only intercept urls matching those provided by config', function () {
      TokenAuthConfig.shouldBeIntercepted = sinon.spy().withArgs(url);

      TokenAuthInterceptor.responseError(response);

      expect(TokenAuthConfig.shouldBeIntercepted.withArgs(url).calledOnce).to.be.true;
    });

    it('should be ignored when ignore flag is provided', function () {
      TokenAuthService.requestBufferPush = sinon.spy();
      TokenAuthService.tokenRefresh = sinon.spy();

      // request config is undefined
      delete response.config;
      TokenAuthInterceptor.responseError(response);

      // ignore provided directly on config
      response.config = {ignoreAuthModule: true};
      TokenAuthInterceptor.responseError(response);

      expect(TokenAuthService.requestBufferPush.calledOnce).to.be.true;
      expect(TokenAuthService.tokenRefresh.calledOnce).to.be.true ;
    });

    it('should only handle 403 or 401 responses', function () {
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);

      TokenAuthService.requestBufferPush = sinon.spy();
      TokenAuthService.tokenRefresh = sinon.spy();

      response.status = 403;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthService.requestBufferPush.callCount).to.equal(1);
      expect(TokenAuthService.tokenRefresh.callCount).to.equal(1);

      response.status = 401;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthService.requestBufferPush.callCount).to.equal(2);
      expect(TokenAuthService.tokenRefresh.callCount).to.equal(2);

      response.status = 400;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthService.requestBufferPush.callCount).to.equal(2);
      expect(TokenAuthService.tokenRefresh.callCount).to.equal(2);

      response.status = 500;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthService.requestBufferPush.callCount).to.equal(2);
      expect(TokenAuthService.requestBufferPush.callCount).to.equal(2);
    });
  });
});
