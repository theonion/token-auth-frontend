'use strict';

describe('Interceptor: TokenAuthInterceptor', function () {

  var $location;
  var $q;
  var TokenAuthHttpRequestBuffer;
  var localStorageService;
  var TokenAuthConfig;
  var TokenAuthInterceptor;
  var TokenAuthService;
  var testRequestConfig;
  var url = '/some/test/url';

  beforeEach(function () {
    module('tokenAuth.authInterceptor');

    inject(function (_$location_, _$q_, _localStorageService_, _TokenAuthHttpRequestBuffer_,
        _TokenAuthConfig_, _TokenAuthInterceptor_, _TokenAuthService_) {
      $location = _$location_;
      $q = _$q_;
      localStorageService = _localStorageService_;
      TokenAuthHttpRequestBuffer = _TokenAuthHttpRequestBuffer_;
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

      localStorageService.get = sinon.stub().returns(token);
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);

      TokenAuthInterceptor.request(testRequestConfig);

      expect(testRequestConfig.headers.Authorization).to.equal('JWT ' + token);
    });

    it('should abort when no token in session, set path to login page', function () {
      var loginPagePath = '/some/path/to/login';

      localStorageService.get = sinon.stub().returns();
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);
      TokenAuthConfig.getLoginPagePath = sinon.stub().returns(loginPagePath);
      $location.path = sinon.spy().withArgs(loginPagePath);

      TokenAuthInterceptor.request(testRequestConfig);

      expect(testRequestConfig.headers).to.be.undefined;
      expect(testRequestConfig.timeout).to.be.a(typeof($q.defer().promise));
      expect($location.path.withArgs(loginPagePath).calledOnce).to.be.true;

      // test if abort has been resolved, so request is cancelled, status 1 === resolved
      expect(testRequestConfig.timeout.$$state.status).to.equal(1);
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

      // ignore provided in headers
      delete testRequestConfig.ignoreAuthModule;
      testRequestConfig.headers = {ignoreAuthModule: true};
      TokenAuthInterceptor.request(testRequestConfig);

      expect(localStorageService.get.calledOnce).to.be.false;
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
      TokenAuthHttpRequestBuffer.append = sinon.spy();
      TokenAuthService.refreshToken = sinon.spy();

      TokenAuthInterceptor.responseError(response);

      expect(TokenAuthHttpRequestBuffer.append.withArgs(testRequestConfig).calledOnce).to.be.true;
      expect(TokenAuthService.refreshToken.calledOnce).to.be.true;
    });

    it('should only intercept urls matching those provided by config', function () {
      TokenAuthConfig.shouldBeIntercepted = sinon.spy().withArgs(url);

      TokenAuthInterceptor.responseError(response);

      expect(TokenAuthConfig.shouldBeIntercepted.withArgs(url).calledOnce).to.be.true;
    });

    it('should be ignored when ignore flag is provided', function () {
      TokenAuthHttpRequestBuffer.append = sinon.spy();
      TokenAuthService.refreshToken = sinon.spy();

      // request config is undefined
      delete response.config;
      TokenAuthInterceptor.responseError(response);

      // ignore provided directly on config
      response.config = {ignoreAuthModule: true};
      TokenAuthInterceptor.responseError(response);

      // ignore provided in headers
      delete response.config.ignoreAuthModule;
      response.config.headers = {ignoreAuthModule: true};
      TokenAuthInterceptor.responseError(response);

      expect(TokenAuthHttpRequestBuffer.append.calledOnce).to.be.false;
      expect(TokenAuthService.refreshToken.calledOnce).to.be.false;
    });

    it('should only handle 403 or 401 responses', function () {
      TokenAuthConfig.shouldBeIntercepted = sinon.stub().returns(true);

      TokenAuthHttpRequestBuffer.append = sinon.spy();
      TokenAuthService.refreshToken = sinon.spy();

      response.status = 403;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthHttpRequestBuffer.append.callCount).to.equal(1);
      expect(TokenAuthService.refreshToken.callCount).to.equal(1);

      response.status = 401;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthHttpRequestBuffer.append.callCount).to.equal(2);
      expect(TokenAuthService.refreshToken.callCount).to.equal(2);

      response.status = 400;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthHttpRequestBuffer.append.callCount).to.equal(2);
      expect(TokenAuthService.refreshToken.callCount).to.equal(2);

      response.status = 500;
      TokenAuthInterceptor.responseError(response);
      expect(TokenAuthHttpRequestBuffer.append.callCount).to.equal(2);
      expect(TokenAuthService.refreshToken.callCount).to.equal(2);
    });
  });
});
