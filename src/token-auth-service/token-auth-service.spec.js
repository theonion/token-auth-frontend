'use strict';

describe('Service: TokenAuthService', function () {
  var $q;
  var $httpBackend;
  var $rootScope;
  var $location;
  var $window;
  var localStorageService;
  var TokenAuthService;
  var TokenAuthConfig;
  var testToken = 'some-test-token';
  var afterLoginPath = '/some/path';
  var loginPagePath = '/cms/login';
  var loginCallback;
  var logoutCallback;

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
    module('tokenAuth', function (TokenAuthConfigProvider) {
      TokenAuthConfigProvider.setLoginPagePath(loginPagePath);
      TokenAuthConfigProvider.setAfterLoginPath(afterLoginPath);

      loginCallback = sinon.stub();
      TokenAuthConfigProvider.setLoginCallback(loginCallback);

      logoutCallback = sinon.stub();
      TokenAuthConfigProvider.setLogoutCallback(logoutCallback);
    });

    inject(function (_$q_, _$httpBackend_, _$rootScope_, _$location_, _$window_,
        _TokenAuthService_, _localStorageService_, _TokenAuthConfig_) {

      $q = _$q_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      TokenAuthService = _TokenAuthService_;
      localStorageService = _localStorageService_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      TokenAuthConfig = _TokenAuthConfig_;
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

      TokenAuthService.clearRequestBuffer = sinon.stub();

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
      expect(TokenAuthService.clearRequestBuffer.calledOnce).to.be.true;
    });

    it('should have functionality to clear buffer', function () {
      TokenAuthService.requestBufferPush({});
      TokenAuthService.requestBufferPush({});
      TokenAuthService.requestBufferPush({});

      TokenAuthService.requestBufferClear();

      expect(TokenAuthService._requestBuffer.length).to.equal(0);
    });
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

  // describe('login', function () {
  //   var expectedPayload = {
  //     username: 'cnorris',
  //     password: 'tearskillcancer'
  //   };
  //   beforeEach(function () {
  //     sinon.stub(TokenAuthService, 'loginSuccess');
  //     sinon.stub(TokenAuthService, 'loginError');
  //   });
  //
  //   describe('always', function () {
  //     it('returns a promise', function () {
  //       $httpBackend.when(
  //           'POST',
  //           TokenAuthConfig.getApiEndpointAuth())
  //         .respond({token: '12345'});
  //       var response = TokenAuthService.login('username', 'password');
  //       expect(response.then).to.be.a('function');
  //     });
  //   });
  //
  //   describe('success', function () {
  //     beforeEach(function () {
  //       $httpBackend.expectPOST(
  //           TokenAuthConfig.getApiEndpointAuth(),
  //           expectedPayload)
  //         .respond(201, {token: '12345'});
  //       TokenAuthService.login('cnorris', 'tearskillcancer');
  //     });
  //
  //     it('should call loginSuccess on successful login', function () {
  //       $httpBackend.flush();
  //       $rootScope.$digest();
  //       expect(TokenAuthService.loginSuccess.calledWith({token: '12345'})).to.be.true;
  //     });
  //   });
  //
  //   describe('error', function () {
  //     beforeEach(function () {
  //       $httpBackend.expectPOST(TokenAuthConfig.getApiEndpointAuth(), expectedPayload).respond(403, {});
  //       TokenAuthService.login('cnorris', 'tearskillcancer');
  //     });
  //
  //     it('should call loginError on unsuccessful login', function () {
  //       $httpBackend.flush();
  //       expect(TokenAuthService.loginError.calledWith({})).to.be.true;
  //     });
  //   });
  // });
  //
  // describe('verifySuccess', function () {
  //   it('should redirect user to cms root path', function () {
  //     sinon.stub($location, 'path');
  //     TokenAuthService.verifySuccess();
  //     expect($location.path.calledWith(afterLoginPath)).to.be.true;
  //   });
  // });
  //
  // describe('loginSuccess', function () {
  //   beforeEach(function () {
  //     sinon.stub($location, 'path');
  //     sinon.stub(localStorageService, 'set');
  //     TokenAuthService.loginSuccess({token: '12345'});
  //   });
  //
  //   it('should redirect the user to the cms root path', function () {
  //     expect($location.path.calledWith(afterLoginPath)).to.be.true;
  //   });
  //
  //   it('should store the token using local storage service', function () {
  //     expect(localStorageService.set.calledWith(TokenAuthConfig.getTokenKey(), '12345')).to.be.true;
  //   });
  //
  //   it('should call loginCallback', function () {
  //     expect(loginCallback.calledOnce).to.be.true;
  //   });
  // });
  //
  // describe('loginError', function () {
  //   beforeEach(function () {
  //   //   sinon.stub(alertService, 'error');
  //   //   TokenAuthService.loginError({});
  //   });
  //
  //   it('should register an error with the alert service', function () {
  //     // expect(alertService.error.called).to.be.true;
  //   });
  // });
  //
  // describe('refreshToken', function () {
  //
  //   it('should not make a request if user has no token in session', function () {
  //     sinon.stub(localStorageService, 'get').returns(undefined);
  //
  //     var failure = sinon.stub();
  //     TokenAuthService.refreshToken().catch(failure);
  //     $rootScope.$digest();
  //
  //     expect(failure.calledOnce).to.be.true;
  //   });
  //
  //   it('should only do one refresh request at a time', function () {
  //     localStorageService.get = sinon.stub().returns('sometoken');
  //
  //     TokenAuthService.refreshToken();
  //     TokenAuthService.refreshToken();
  //
  //     // only a single request should come out of this
  //     $httpBackend
  //       .expectPOST(
  //         TokenAuthConfig.getApiEndpointRefresh(),
  //         {token: 'sometoken'}
  //       )
  //       .respond(200, {token: 'someothertoken'});
  //     $httpBackend.flush();
  //   });
  //
  //   describe('with token', function () {
  //
  //     beforeEach(function () {
  //       sinon.stub(localStorageService, 'get').returns('sometoken');
  //       sinon.stub(TokenAuthService, 'tokenRefreshed');
  //       sinon.stub(TokenAuthService, 'navToLogin');
  //     });
  //
  //     it('should return a promise', function () {
  //       expect(TokenAuthService.refreshToken().then).to.be.a('function');
  //     });
  //
  //     describe('success', function () {
  //       beforeEach(function () {
  //         $httpBackend.expectPOST(
  //             TokenAuthConfig.getApiEndpointRefresh(),
  //             {token: 'sometoken'})
  //           .respond(200, {token: 'someothertoken'});
  //         TokenAuthService.refreshToken();
  //       });
  //
  //       it('should call tokenRefreshed', function () {
  //         $httpBackend.flush();
  //         expect(TokenAuthService.tokenRefreshed.calledWith({token: 'someothertoken'})).to.be.true;
  //         expect(TokenAuthService.navToLogin.called).to.be.false;
  //       });
  //     });
  //
  //     describe('error', function () {
  //       beforeEach(function () {
  //         $httpBackend.expectPOST(
  //             TokenAuthConfig.getApiEndpointRefresh(),
  //             {token: 'sometoken'})
  //           .respond(403, {token: 'someothertoken'});
  //         TokenAuthService.refreshToken();
  //       });
  //
  //       it('should call navToLogin', function () {
  //         $httpBackend.flush();
  //         expect(TokenAuthService.navToLogin.called).to.be.true;
  //         expect(TokenAuthService.tokenRefreshed.called).to.be.false;
  //       });
  //     });
  //   });
  // });
  //
  // describe('logout', function () {
  //   beforeEach(function () {
  //     sinon.stub(localStorageService, 'remove');
  //     sinon.stub($location, 'path');
  //
  //     TokenAuthService.logout();
  //   });
  //
  //   it('should remove the token from local storage and redirect to the login page', function () {
  //     expect(localStorageService.remove.called).to.be.true;
  //     expect($location.path.calledWith(loginPagePath));
  //   });
  //
  //   it('should call logoutCallback', function () {
  //     expect(logoutCallback.calledOnce).to.be.true;
  //   });
  // });
  //
  // describe('verifyToken', function () {
  //
  //   it('should call verifySuccess on success', function () {
  //     sinon.stub(TokenAuthService, 'verifySuccess');
  //     sinon.stub(localStorageService, 'get').returns('sometoken');
  //
  //     var success = sinon.stub();
  //
  //     TokenAuthService.verifyToken()
  //       .then(success);
  //
  //     $httpBackend.expectPOST(
  //         TokenAuthConfig.getApiEndpointVerify(),
  //         {token: 'sometoken'})
  //       .respond(200);
  //     $httpBackend.flush();
  //
  //     expect(success.calledOnce).to.be.true;
  //     expect(TokenAuthService.verifySuccess.calledOnce).to.be.true;
  //   });
  //
  //   it('should return a deferred that is rejected on failure', function () {
  //     var failure = sinon.stub();
  //
  //     localStorageService.get = sinon.stub().returns('sometoken');
  //
  //     TokenAuthService.verifyToken()
  //       .catch(failure);
  //
  //     $httpBackend.expectPOST(
  //         TokenAuthConfig.getApiEndpointVerify(),
  //         {token: 'sometoken'})
  //       .respond(400);
  //     $httpBackend.flush();
  //
  //     expect(failure.calledOnce).to.be.true;
  //   });
  //
  // });
  //
  // describe('tokenRefreshed', function () {
  //   beforeEach(function () {
  //     sinon.stub(localStorageService, 'set');
  //     sinon.stub(TokenAuthService, 'retryRequestBuffer');
  //     TokenAuthService.tokenRefreshed({token: 'thetoken'});
  //   });
  //
  //   it('should store the token using local storage service', function () {
  //     expect(localStorageService.set.calledWith(TokenAuthConfig.getTokenKey(), 'thetoken')).to.be.true;
  //   });
  //
  //   it('should retry all requests', function () {
  //     expect(TokenAuthService.retryRequestBuffer.called).to.be.true;
  //   });
  // });
  //
  // describe('navToLogin', function () {
  //   beforeEach(function () {
  //     sinon.stub(TokenAuthService, 'clearRequestBuffer');
  //     // sinon.stub(alertService, 'error');
  //     sinon.stub($location, 'path');
  //     TokenAuthService.navToLogin();
  //   });
  //
  //   it('should tell the request buffer to reject all pending requests', function () {
  //     expect(TokenAuthService.clearRequestBuffer.called).to.be.true;
  //   });
  //
  //   it('should register an error with the alert service', function () {
  //     // expect(alertService.error.called).to.be.true;
  //   });
  //
  //   it('should redirect the user back to the login page', function () {
  //     expect($location.path.calledWith(TokenAuthConfig.getLoginPagePath())).to.be.true;
  //   });
  // });
});
