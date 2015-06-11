'use strict';

describe('Service: TokenAuthService', function () {
  var $httpBackend;
  var $rootScope;
  var $location;
  var $window;
  var localStorageService;
  var TokenAuthService;
  // var alertService;
  var TokenAuthConfig;
  var afterLoginPath = '/some/path';
  var loginPagePath = '/cms/login';
  var loginCallback;
  var logoutCallback;

  beforeEach(function () {
    module('tokenAuth', function (TokenAuthConfigProvider) {
      TokenAuthConfigProvider.setLogoUrl('http://some.logo.url/something.png');
      TokenAuthConfigProvider.setApiHost('http://some.api.host');
      TokenAuthConfigProvider.setApiEndpointAuth('/api/token/auth');
      TokenAuthConfigProvider.setApiEndpointRefresh('/api/token/refresh');
      TokenAuthConfigProvider.setLoginPagePath(loginPagePath);
      TokenAuthConfigProvider.setAfterLoginPath(afterLoginPath);

      loginCallback = sinon.stub();
      TokenAuthConfigProvider.setLoginCallback(loginCallback);

      logoutCallback = sinon.stub();
      TokenAuthConfigProvider.setLogoutCallback(logoutCallback);
    });

    inject(function (_$httpBackend_, _$rootScope_, _$location_, _$window_,
        _TokenAuthService_, /*_AlertService_,*/ _localStorageService_,
        _TokenAuthConfig_) {
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      TokenAuthService = _TokenAuthService_;
      // alertService = _AlertService_;
      localStorageService = _localStorageService_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      TokenAuthConfig = _TokenAuthConfig_;
    });
  });

  describe('login', function () {
    var expectedPayload = {
      username: 'cnorris',
      password: 'tearskillcancer'
    };
    beforeEach(function () {
      sinon.stub(TokenAuthService, 'loginSuccess');
      sinon.stub(TokenAuthService, 'loginError');
    });

    describe('always', function () {
      it('returns a promise', function () {
        $httpBackend.when(
            'POST',
            TokenAuthConfig.getApiEndpointAuth())
          .respond({token: '12345'});
        var response = TokenAuthService.login('username', 'password');
        expect(response.then).to.be.a('function');
      });
    });

    describe('success', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(
            TokenAuthConfig.getApiEndpointAuth(),
            expectedPayload)
          .respond(201, {token: '12345'});
        TokenAuthService.login('cnorris', 'tearskillcancer');
      });

      it('should call loginSuccess on successful login', function () {
        $httpBackend.flush();
        $rootScope.$digest();
        expect(TokenAuthService.loginSuccess.calledWith({token: '12345'})).to.be.true;
      });
    });

    describe('error', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(TokenAuthConfig.getApiEndpointAuth(), expectedPayload).respond(403, {});
        TokenAuthService.login('cnorris', 'tearskillcancer');
      });

      it('should call loginError on unsuccessful login', function () {
        $httpBackend.flush();
        expect(TokenAuthService.loginError.calledWith({})).to.be.true;
      });
    });
  });

  describe('verifySuccess', function () {
    it('should redirect user to cms root path', function () {
      sinon.stub($location, 'path');
      TokenAuthService.verifySuccess();
      expect($location.path.calledWith(afterLoginPath)).to.be.true;
    });
  });

  describe('loginSuccess', function () {
    beforeEach(function () {
      sinon.stub($location, 'path');
      sinon.stub(localStorageService, 'set');
      TokenAuthService.loginSuccess({token: '12345'});
    });

    it('should redirect the user to the cms root path', function () {
      expect($location.path.calledWith(afterLoginPath)).to.be.true;
    });

    it('should store the token using local storage service', function () {
      expect(localStorageService.set.calledWith(TokenAuthConfig.getTokenKey(), '12345')).to.be.true;
    });

    it('should call loginCallback', function () {
      expect(loginCallback.calledOnce).to.be.true;
    });
  });

  describe('loginError', function () {
    beforeEach(function () {
    //   sinon.stub(alertService, 'error');
    //   TokenAuthService.loginError({});
    });

    it('should register an error with the alert service', function () {
      // expect(alertService.error.called).to.be.true;
    });
  });

  describe('refreshToken', function () {

    it('should not make a request if user has no token in session', function () {
      sinon.stub(localStorageService, 'get').returns(undefined);

      var failure = sinon.stub();
      TokenAuthService.refreshToken().catch(failure);
      $rootScope.$digest();

      expect(failure.calledOnce).to.be.true;
    });

    it('should only do one refresh request at a time', function () {
      localStorageService.get = sinon.stub().returns('sometoken');

      TokenAuthService.refreshToken();
      TokenAuthService.refreshToken();

      // only a single request should come out of this
      $httpBackend
        .expectPOST(
          TokenAuthConfig.getApiEndpointRefresh(),
          {token: 'sometoken'}
        )
        .respond(200, {token: 'someothertoken'});
      $httpBackend.flush();
    });

    describe('with token', function () {

      beforeEach(function () {
        sinon.stub(localStorageService, 'get').returns('sometoken');
        sinon.stub(TokenAuthService, 'tokenRefreshed');
        sinon.stub(TokenAuthService, 'tokenRefreshError');
      });

      it('should return a promise', function () {
        expect(TokenAuthService.refreshToken().then).to.be.a('function');
      });

      describe('success', function () {
        beforeEach(function () {
          $httpBackend.expectPOST(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: 'sometoken'})
            .respond(200, {token: 'someothertoken'});
          TokenAuthService.refreshToken();
        });

        it('should call tokenRefreshed', function () {
          $httpBackend.flush();
          expect(TokenAuthService.tokenRefreshed.calledWith({token: 'someothertoken'})).to.be.true;
          expect(TokenAuthService.tokenRefreshError.called).to.be.false;
        });
      });

      describe('error', function () {
        beforeEach(function () {
          $httpBackend.expectPOST(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: 'sometoken'})
            .respond(403, {token: 'someothertoken'});
          TokenAuthService.refreshToken();
        });

        it('should call tokenRefreshError', function () {
          $httpBackend.flush();
          expect(TokenAuthService.tokenRefreshError.called).to.be.true;
          expect(TokenAuthService.tokenRefreshed.called).to.be.false;
        });
      });
    });
  });

  describe('logout', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'remove');
      sinon.stub($location, 'path');

      TokenAuthService.logout();
    });

    it('should remove the token from local storage and redirect to the login page', function () {
      expect(localStorageService.remove.called).to.be.true;
      expect($location.path.calledWith(loginPagePath));
    });

    it('should call logoutCallback', function () {
      expect(logoutCallback.calledOnce).to.be.true;
    });
  });

  describe('verifyToken', function () {

    it('should call verifySuccess on success', function () {
      sinon.stub(TokenAuthService, 'verifySuccess');
      sinon.stub(localStorageService, 'get').returns('sometoken');

      var success = sinon.stub();

      TokenAuthService.verifyToken()
        .then(success);

      $httpBackend.expectPOST(
          TokenAuthConfig.getApiEndpointVerify(),
          {token: 'sometoken'})
        .respond(200);
      $httpBackend.flush();

      expect(success.calledOnce).to.be.true;
      expect(TokenAuthService.verifySuccess.calledOnce).to.be.true;
    });

    it('should return a deferred that is rejected on failure', function () {
      var failure = sinon.stub();

      localStorageService.get = sinon.stub().returns('sometoken');

      TokenAuthService.verifyToken()
        .catch(failure);

      $httpBackend.expectPOST(
          TokenAuthConfig.getApiEndpointVerify(),
          {token: 'sometoken'})
        .respond(400);
      $httpBackend.flush();

      expect(failure.calledOnce).to.be.true;
    });

  });

  describe('tokenRefreshed', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'set');
      sinon.stub(TokenAuthService, 'retryRequestBuffer');
      TokenAuthService.tokenRefreshed({token: 'thetoken'});
    });

    it('should store the token using local storage service', function () {
      expect(localStorageService.set.calledWith(TokenAuthConfig.getTokenKey(), 'thetoken')).to.be.true;
    });

    it('should retry all requests', function () {
      expect(TokenAuthService.retryRequestBuffer.called).to.be.true;
    });
  });

  describe('tokenRefreshError', function () {
    beforeEach(function () {
      sinon.stub(TokenAuthService, 'clearRequestBuffer');
      // sinon.stub(alertService, 'error');
      sinon.stub($location, 'path');
      TokenAuthService.tokenRefreshError();
    });

    it('should tell the request buffer to reject all pending requests', function () {
      expect(TokenAuthService.clearRequestBuffer.called).to.be.true;
    });

    it('should register an error with the alert service', function () {
      // expect(alertService.error.called).to.be.true;
    });

    it('should redirect the user back to the login page', function () {
      expect($location.path.calledWith(TokenAuthConfig.getLoginPagePath())).to.be.true;
    });
  });
});
