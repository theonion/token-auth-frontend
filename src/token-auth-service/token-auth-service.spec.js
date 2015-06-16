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

  var hasIgnoreTokenAuthHeader = function (headers) {
    return headers.ignoreTokenAuth === true;
  };

  var requestVerify = function () {
    return $httpBackend.expectPOST(
      TokenAuthConfig.getApiEndpointVerify(),
      {token: testToken},
      hasIgnoreTokenAuthHeader
    );
  };

  var requestRefresh = function () {
    return $httpBackend.expectPOST(
      TokenAuthConfig.getApiEndpointRefresh(),
      {token: testToken},
      hasIgnoreTokenAuthHeader
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
      localStorageService.get = sinon.stub().returns(null);
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

      expect(TokenAuthService.isAuthenticated()).to.be.true;
      expect(TokenAuthService.requestBufferRetry.calledOnce).to.be.true;
      expect(success.calledOnce).to.be.true;
    });

    it('should attempt to refresh token on HTTP 401', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.tokenRefresh = sinon.stub().returns($q.defer().promise);

      TokenAuthService.tokenVerify();

      requestVerify().respond(401);
      $httpBackend.flush();

      expect(TokenAuthService.tokenRefresh.calledOnce).to.be.true;
      expect(TokenAuthService.isAuthenticated()).to.be.false;
    });

    it('should attempt to refresh token on HTTP 403', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.tokenRefresh = sinon.stub().returns($q.defer().promise);

      TokenAuthService.tokenVerify();

      requestVerify().respond(403);
      $httpBackend.flush();

      expect(TokenAuthService.tokenRefresh.calledOnce).to.be.true;
      expect(TokenAuthService.isAuthenticated()).to.be.false;
    });

    it('should resolve or reject as refresh does on HTTP 401 or 403', function () {
      localStorageService.get = sinon.stub().returns(testToken);

      var verifySuccess = $q.defer();
      var success = sinon.stub();
      TokenAuthService.tokenRefresh = sinon.stub().returns(verifySuccess.promise);
      TokenAuthService.tokenVerify().then(success);
      TokenAuthService.tokenVerify().then(success);

      requestVerify().respond(401);
      requestVerify().respond(403);

      verifySuccess.resolve();
      $httpBackend.flush();

      var verifyFailure = $q.defer();
      var fail = sinon.stub();
      TokenAuthService.tokenRefresh = sinon.stub().returns(verifyFailure.promise);
      TokenAuthService.tokenVerify().catch(fail);
      TokenAuthService.tokenVerify().catch(fail);

      requestVerify().respond(401);
      requestVerify().respond(403);

      verifyFailure.reject();
      $httpBackend.flush();

      expect(success.calledTwice).to.be.true;
      expect(fail.calledTwice).to.be.true;
    });

    it('should reject without refresh on other error codes', function () {
      var fail = sinon.stub();

      localStorageService.get = sinon.stub().returns(testToken);
      sinon.spy(TokenAuthService, 'tokenRefresh');

      TokenAuthService.tokenVerify()
        .catch(fail);

      requestVerify().respond(500);
      $httpBackend.flush();

      TokenAuthService.tokenVerify()
        .catch(fail);

      requestVerify().respond(400);
      $httpBackend.flush();

      expect(TokenAuthService.tokenRefresh.notCalled).to.be.true;
      expect(TokenAuthService.isAuthenticated()).to.be.false;
      expect(fail.callCount).to.equal(2);
    });
  });

  describe('refresh', function () {

    it('should return rejected promise, nav to login when no token is available', function () {
      localStorageService.get = sinon.stub().returns(null);
      TokenAuthService.navToLogin = sinon.stub();

      var fail = sinon.stub();
      var refresh = TokenAuthService.tokenRefresh();

      refresh.catch(fail);

      $rootScope.$digest();

      expect(fail.calledOnce).to.be.true;
      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
    });

    it('should set authentication flag and retry request buffer on success', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.requestBufferRetry = sinon.stub();

      var success = sinon.stub();
      var refresh = TokenAuthService.tokenRefresh();

      refresh.then(success);

      requestRefresh().respond(200);
      $httpBackend.flush();

      expect(TokenAuthService.isAuthenticated()).to.be.true;
      expect(TokenAuthService.requestBufferRetry.calledOnce).to.be.true;
      expect(success.calledOnce).to.be.true;
    });

    it('should return rejected promise, nav to login when refresh fails', function () {
      localStorageService.get = sinon.stub().returns(testToken);
      TokenAuthService.navToLogin = sinon.stub();

      var fail = sinon.stub();
      var refresh = TokenAuthService.tokenRefresh();

      refresh.catch(fail);

      requestRefresh().respond(400);
      $httpBackend.flush();

      expect(TokenAuthService.navToLogin.calledOnce).to.be.true;
      expect(TokenAuthService.isAuthenticated()).to.be.false;
      expect(fail.calledOnce).to.be.true;
    });
  });

  describe('request buffer', function () {

    it('should have funtionality to add to buffer', function () {
      var config = {a: 123};

      TokenAuthService.requestBufferPush(config);

      expect(TokenAuthService._requestBuffer.length).to.equal(1);
      expect(TokenAuthService._requestBuffer[0]).to.equal(config);
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

      expect(config1.headers.ignoreTokenAuth).to.be.true;
      expect(config2.headers.ignoreTokenAuth).to.be.true;
      expect(config3.headers.ignoreTokenAuth).to.be.true;
      expect(TokenAuthService.requestBufferClear.calledOnce).to.be.true;
    });

    it('should cancel other requests when one request fails', function () {
      var config1 = {method: 'GET', url: '1'};
      var config2 = {method: 'GET', url: '2'};
      var config3 = {method: 'GET', url: '3'};

      TokenAuthService.requestBufferPush(config1);
      TokenAuthService.requestBufferPush(config2);
      TokenAuthService.requestBufferPush(config3);

      TokenAuthService.requestBufferRetry();

      $httpBackend.expectGET('1').respond(401);
      $httpBackend.expectGET('2').respond(200);
      $httpBackend.expectGET('3').respond(200);
      $httpBackend.flush();

      // according to angular $http docs, a config.timeout that's a resolved promise
      //  will result in a request failure, which is what we want in this case, note:
      //  a promise with $$state.status === 1 is a resolved promise
      expect(config1.timeout.$$state.status).to.equal(1);
      expect(config2.timeout.$$state.status).to.equal(1);
      expect(config3.timeout.$$state.status).to.equal(1);
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

      $location.path = sinon.stub();
      TokenAuthConfig.loginCallback = sinon.stub();

      TokenAuthService.login(username, password).then(success);

      $httpBackend.expectPOST(
        TokenAuthConfig.getApiEndpointAuth(),
        {
          username: username,
          password: password
        },
        hasIgnoreTokenAuthHeader
      ).respond({token: testToken});
      $httpBackend.flush();

      expect(localStorageService.get(TokenAuthConfig.getTokenKey())).to.equal(testToken);
      expect($location.path.withArgs(TokenAuthConfig.getAfterLoginPath()).calledOnce).to.be.true;
      expect(TokenAuthConfig.loginCallback.calledOnce).to.be.true;
      expect(success.calledOnce).to.be.true;
    });

    it('should reject on failure', function () {
      var fail = sinon.stub();

      TokenAuthService.login(username, password).catch(fail);

      $httpBackend.expectPOST(
        TokenAuthConfig.getApiEndpointAuth(),
        {
          username: username,
          password: password
        },
        hasIgnoreTokenAuthHeader
      ).respond(401);
      $httpBackend.flush();

      expect(fail.calledOnce).to.be.true;
    });
  });

  it('should have a logout function', function () {
    localStorageService.remove = sinon.stub();
    $location.path = sinon.stub();
    TokenAuthConfig.logoutCallback = sinon.stub();

    TokenAuthService.logout();

    expect(localStorageService.remove.withArgs(TokenAuthConfig.getTokenKey()).calledOnce).to.be.true;
    expect($location.path.withArgs(TokenAuthConfig.getLoginPagePath()).calledOnce).to.be.true;
    expect(TokenAuthConfig.logoutCallback.calledOnce).to.be.true;
  });

  it('should have a getter for authentication status', function () {
    TokenAuthService._authenticated = false;
    expect(TokenAuthService.isAuthenticated()).to.equal(false);

    TokenAuthService._authenticated = true;
    expect(TokenAuthService.isAuthenticated()).to.equal(true);
  });

  it('should have a way to navigate to the login page', function () {
    $location.path = sinon.stub();
    TokenAuthService.requestBufferClear = sinon.stub();

    TokenAuthService.navToLogin();

    expect(TokenAuthService.requestBufferClear.calledOnce).to.be.true;
    expect($location.path.withArgs(TokenAuthConfig.getLoginPagePath()).calledOnce).to.be.true;
  });
});
