'use strict';

describe('Service: TokenAuthService', function () {
  var $httpBackend;
  var $location;
  var $q;
  var $rootScope;
  var localStorageService;
  var testToken = 'some-test-token';
  var TokenAuthConfig;
  var TokenAuthService;

  var requestVerify = function () {
    return $httpBackend.expectPOST(
      TokenAuthConfig.getApiEndpointVerify(),
      {token: testToken}
    );
  };

  var requestRefresh = function () {
    return $httpBackend.expectPOST(
      TokenAuthConfig.getApiEndpointRefresh(),
      {token: testToken}
    );
  };

  beforeEach(function () {
    module('tokenAuth');

    inject(function (_$httpBackend_, _$location_, _$q_, _$rootScope_,
        _localStorageService_, _TokenAuthConfig_, _TokenAuthService_) {

      $httpBackend = _$httpBackend_;
      $location = _$location_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      localStorageService = _localStorageService_;
      TokenAuthConfig = _TokenAuthConfig_;
      TokenAuthService = _TokenAuthService_;
    });
  });

  describe('verification', function () {

    it('should return rejected promise, nav to login when no token is available', function () {
      localStorageService.get = sinon.stub();
      TokenAuthService.navToLogin = sinon.stub();

      var fail = sinon.stub();
      var verification = TokenAuthService.tokenVerify();

      verification.catch(fail);

      $rootScope.$digest();

      expect(fail.calledOnce).to.be.true;
      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
    });

    it('should set authentication flag and retry request buffer on success', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.requestBufferRetry = sinon.stub();

      var success = sinon.stub();
      var verification = TokenAuthService.tokenVerify();

      verification.then(success);

      requestVerify().respond(200);
      $httpBackend.flush();

      expect(TokenAuthService.requestBufferRetry.calledOnce).to.be.true;
      expect(success.calledOnce).to.be.true;
    });

    it('should attempt to refresh token on HTTP 400', function () {
      var success = sinon.stub();

      localStorageService.get = sinon.stub().returns(testToken);

      TokenAuthService.tokenVerify()
        .then(success);

      requestVerify().respond(400);
      requestRefresh().respond(200);
      $httpBackend.flush();

      expect(success.calledOnce).to.be.true;
    });

    it('should send user to login on HTTP 401', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.navToLogin = sinon.stub();

      var fail = sinon.stub();

      TokenAuthService.tokenVerify().catch(fail);

      requestVerify().respond(401);
      $httpBackend.flush();

      expect(fail.calledOnce).to.be.true;
      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
    });

    it('should send user to login on HTTP 403', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.navToLogin = sinon.stub();

      var fail = sinon.stub();

      TokenAuthService.tokenVerify().catch(fail);

      requestVerify().respond(403);
      $httpBackend.flush();

      expect(fail.calledOnce).to.be.true;
      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
    });

    it('should resolve as refresh does on HTTP 400', function () {
      localStorageService.get = sinon.stub().returns(testToken);

      var verifySuccess = $q.defer();
      var success = sinon.stub();
      verifySuccess.resolve();
      TokenAuthService.tokenRefresh = sinon.stub().returns(verifySuccess.promise);

      TokenAuthService.tokenVerify().then(success);
      requestVerify().respond(400);
      $httpBackend.flush();

      expect(success.calledOnce).to.be.true;
    });

    it('should reject as refresh does on HTTP 400', function () {
      localStorageService.get = sinon.stub().returns(testToken);

      var verifyFailure = $q.defer();
      var fail = sinon.stub();
      verifyFailure.reject();
      TokenAuthService.tokenRefresh = sinon.stub().returns(verifyFailure.promise);

      TokenAuthService.tokenVerify().catch(fail);
      requestVerify().respond(400);
      $httpBackend.flush();

      expect(fail.calledOnce).to.be.true;
    });

    it('should reject without refresh on other error codes', function () {
      var fail = sinon.stub();

      localStorageService.get = sinon.stub().returns(testToken);
      sinon.spy(TokenAuthService, 'tokenRefresh');

      TokenAuthService.tokenVerify()
        .catch(fail);

      requestVerify().respond(500);
      $httpBackend.flush();

      expect(TokenAuthService.tokenRefresh.notCalled).to.be.true;
      expect(fail.calledOnce).to.be.true;
    });
  });

  describe('refresh', function () {

    it('should return rejected promise, nav to login when no token is available', function () {
      var fail = sinon.stub();
      var failVerification = sinon.stub();

      localStorageService.get = sinon.stub().returns(null);
      TokenAuthService.navToLogin = sinon.stub();

      TokenAuthService.tokenRefresh().catch(fail);

      TokenAuthService.tokenVerify().catch(failVerification);

      $rootScope.$digest();

      expect(fail.calledOnce).to.be.true;
      expect(failVerification.calledOnce).to.be.true;
      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
    });

    it('should retry request buffer on success', function () {
      var success = sinon.stub();
      var successVerification = sinon.stub();

      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.requestBufferRetry = sinon.stub();

      TokenAuthService.tokenRefresh().then(success);

      requestRefresh().respond(200);
      $httpBackend.flush();

      TokenAuthService.tokenVerify().then(successVerification);
      $rootScope.$digest();

      expect(successVerification.calledOnce).to.be.true;
      expect(TokenAuthService.requestBufferRetry.calledOnce).to.be.true;
      expect(success.calledOnce).to.be.true;
    });

    it('should return rejected promise, nav to login when refresh fails', function () {
      var fail = sinon.stub();
      var failVerification = sinon.stub();

      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.navToLogin = sinon.stub();

      TokenAuthService.tokenRefresh().catch(fail);

      requestRefresh().respond(400);
      $httpBackend.flush();

      TokenAuthService.tokenVerify().catch(failVerification);
      $rootScope.$digest();

      expect(failVerification.calledOnce).to.be.true;
      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
      expect(fail.calledOnce).to.be.true;
    });
  });

  describe('request buffer', function () {

    it('should have functionality to add to buffer', function () {
      var config = {url: '1'};

      TokenAuthService.requestBufferPush(config);

      expect(TokenAuthService._requestBuffer.length).to.equal(1);
      expect(TokenAuthService._requestBuffer[0]).not.to.equal(config);
      expect(TokenAuthService._requestBuffer[0].url).to.equal(config.url);
    });

    it('should remove timeouts from added configs', function () {
      var config = {url: '1', timeout: {a: '123'}};

      TokenAuthService.requestBufferPush(config);

      expect(TokenAuthService._requestBuffer[0].url).to.equal(config.url);
      expect(TokenAuthService._requestBuffer[0].timeout).to.be.undefined;
    });

    it('should have functionality to retry buffer', function () {
      var config1 = {method: 'GET', url: '1'};
      var config2 = {method: 'GET', url: '2'};
      var config3 = {method: 'GET', url: '3'};

      TokenAuthService.requestBufferClear = sinon.stub();

      TokenAuthService.requestBufferPush(config1);
      TokenAuthService.requestBufferPush(config2);
      TokenAuthService.requestBufferPush(config3);

      TokenAuthService.requestBufferRetry();

      $httpBackend.expectGET('1').respond(200);
      $httpBackend.expectGET('2').respond(200);
      $httpBackend.expectGET('3').respond(200);
      $httpBackend.flush();

      expect(config1.timeout).to.be.defined;
      expect(config2.timeout).to.be.defined;
      expect(config3.timeout).to.be.defined;
      expect(TokenAuthService.requestBufferClear.calledOnce).to.be.true;
    });

    it('should cancel other requests when one request fails on HTTP 401 or 403', function () {
      var config1 = {method: 'GET', url: '1'};
      var config2 = {method: 'GET', url: '2'};
      var config3 = {method: 'GET', url: '3'};

      var buffered1 = TokenAuthService.requestBufferPush(config1);
      var buffered2 = TokenAuthService.requestBufferPush(config2);
      var buffered3 = TokenAuthService.requestBufferPush(config3);

      TokenAuthService.requestBufferRetry();

      $httpBackend.expectGET('1').respond(401);
      $httpBackend.expectGET('2').respond(200);
      $httpBackend.expectGET('3').respond(200);
      $httpBackend.flush();

      // according to angular $http docs, a config.timeout that's a resolved promise
      //  will result in a request failure, which is what we want in this case, note:
      //  a promise with $$state.status === 1 is a resolved promise
      expect(buffered1.timeout.$$state.status).to.equal(1);
      expect(buffered2.timeout.$$state.status).to.equal(1);
      expect(buffered3.timeout.$$state.status).to.equal(1);
    });

    it('should not cancel requests for error codes not HTTP 401 or 403', function () {
      var config1 = {method: 'GET', url: '1'};
      var config2 = {method: 'GET', url: '2'};
      var config3 = {method: 'GET', url: '3'};

      var buffered1 = TokenAuthService.requestBufferPush(config1);
      var buffered2 = TokenAuthService.requestBufferPush(config2);
      var buffered3 = TokenAuthService.requestBufferPush(config3);

      TokenAuthService.requestBufferRetry();

      $httpBackend.expectGET('1').respond(500);
      $httpBackend.expectGET('2').respond(400);
      $httpBackend.expectGET('3').respond(404);
      $httpBackend.flush();

      expect(buffered1.timeout.$$state.status).to.equal(0);
      expect(buffered2.timeout.$$state.status).to.equal(0);
      expect(buffered3.timeout.$$state.status).to.equal(0);
    });

    it('should have functionality to clear buffer', function () {
      TokenAuthService.requestBufferPush({});
      TokenAuthService.requestBufferPush({});
      TokenAuthService.requestBufferPush({});

      TokenAuthService.requestBufferClear();

      expect(TokenAuthService._requestBuffer.length).to.equal(0);
    });
  });

  describe('login', function () {
    var username = 'abc';
    var password = '123';

    it('should setup token in local storage, redirect user, call callback on success', function () {
      var success = sinon.stub();
      var successVerification = sinon.stub();

      $location.path = sinon.stub();
      TokenAuthConfig.loginCallback = sinon.stub();

      TokenAuthService.login(username, password).then(success);

      $httpBackend.expectPOST(
        TokenAuthConfig.getApiEndpointAuth(),
        {
          username: username,
          password: password
        }
      ).respond({token: testToken});
      $httpBackend.flush();

      TokenAuthService.tokenVerify().then(successVerification);
      $rootScope.$digest();

      expect(successVerification.calledOnce).to.be.true;
      expect(localStorageService.get(TokenAuthConfig.getTokenKey())).to.equal(testToken);
      expect($location.path.withArgs(TokenAuthConfig.getAfterLoginPath()).calledOnce).to.be.true;
      expect(TokenAuthConfig.loginCallback.calledOnce).to.be.true;
      expect(success.calledOnce).to.be.true;
    });

    it('should reject on failure', function () {
      var fail = sinon.stub();
      var failVerification = sinon.stub();

      TokenAuthService.login(username, password).catch(fail);

      $httpBackend.expectPOST(
        TokenAuthConfig.getApiEndpointAuth(),
        {
          username: username,
          password: password
        }
      ).respond(401);
      $httpBackend.flush();

      TokenAuthService.tokenVerify().catch(failVerification);
      $rootScope.$digest();

      expect(failVerification.calledOnce).to.be.true;
      expect(fail.calledOnce).to.be.true;
    });
  });

  it('should have a logout function', function () {
    var fail = sinon.stub();

    localStorageService.remove = sinon.stub();
    $location.path = sinon.stub();
    TokenAuthConfig.logoutCallback = sinon.stub();

    TokenAuthService.logout();

    // future verify requests now fail
    TokenAuthService.tokenVerify().catch(fail);
    $rootScope.$digest();

    expect(fail.calledOnce).to.be.true;
    expect(localStorageService.remove.withArgs(TokenAuthConfig.getTokenKey()).calledOnce).to.be.true;
    expect($location.path.withArgs(TokenAuthConfig.getLoginPagePath()).calledOnce).to.be.true;
    expect(TokenAuthConfig.logoutCallback.calledOnce).to.be.true;
  });

  it('should have a way to navigate to the login page', function () {
    $location.path = sinon.stub();
    TokenAuthService.requestBufferClear = sinon.stub();

    TokenAuthService.navToLogin();

    expect(TokenAuthService.requestBufferClear.calledOnce).to.be.true;
    expect($location.path.withArgs(TokenAuthConfig.getLoginPagePath()).calledOnce).to.be.true;
  });

  it('should not allow multiple token auth requests to occur', function () {
    localStorageService.get = sinon.stub().returns(testToken);

    TokenAuthService.tokenVerify();
    TokenAuthService.tokenRefresh();
    TokenAuthService.login('abc', '123');

    // we should only get a request to the verify endpoint
    requestVerify().respond(403);
    $httpBackend.flush();
  });
});
