'use strict';

describe('Service: AuthService', function () {
  var $httpBackend;
  var $rootScope;
  var $location;
  var HttpRequestBuffer;
  var $window;
  var localStorageService;
  var AuthService;
  // var alertService;
  var TokenAuthConfig;
  var loginPagePath = '/cms/login';

  beforeEach(function () {
    module('tokenAuth', function (TokenAuthConfigProvider) {
      TokenAuthConfigProvider.setLogoUrl('http://some.logo.url/something.png');
      TokenAuthConfigProvider.setApiHost('http://some.api.host');
      TokenAuthConfigProvider.setApiEndpointAuth('/api/token/auth');
      TokenAuthConfigProvider.setApiEndpointRefresh('/api/token/refresh');
      TokenAuthConfigProvider.setLoginPagePath(loginPagePath);
    });

    inject(function (_$httpBackend_, _$rootScope_, _$location_, _$window_,
        _AuthService_, /*_AlertService_,*/ _localStorageService_, _HttpRequestBuffer_,
        _TokenAuthConfig_) {
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      AuthService = _AuthService_;
      // alertService = _AlertService_;
      localStorageService = _localStorageService_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      HttpRequestBuffer = _HttpRequestBuffer_;
      TokenAuthConfig = _TokenAuthConfig_;
    });
  });

  describe('#login', function () {
    var expectedPayload = {
      username: 'cnorris',
      password: 'tearskillcancer'
    };
    beforeEach(function () {
      sinon.stub(AuthService, 'loginSuccess');
      sinon.stub(AuthService, 'loginError');
    });

    describe('always', function () {
      it('returns a promise', function () {
        $httpBackend.when(
            'POST',
            TokenAuthConfig.getApiEndpointAuth())
          .respond({token: '12345'});
        var response = AuthService.login('username', 'password');
        expect(response.then).to.be.a('function');
      });
    });

    describe('success', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(
            TokenAuthConfig.getApiEndpointAuth(),
            expectedPayload)
          .respond(201, {token: '12345'});
        AuthService.login('cnorris', 'tearskillcancer');
      });

      it('calls loginSuccess if successful login', function () {
        $httpBackend.flush();
        expect(AuthService.loginSuccess.calledWith({token: '12345'})).to.be.true;
      });
    });

    describe('error', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(TokenAuthConfig.getApiEndpointAuth(), expectedPayload).respond(403, {});
        AuthService.login('cnorris', 'tearskillcancer');
      });

      it('calls loginError if unsuccessful login', function () {
        $httpBackend.flush();
        expect(AuthService.loginError.calledWith({})).to.be.true;
      });
    });
  });

  describe('#loginSuccess', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'set');
      AuthService.loginSuccess({token: '12345'});
    });

    it('stores the token using local storage service', function () {
      expect(localStorageService.set.calledWith(TokenAuthConfig.getTokenKey(), '12345')).to.be.true;
    });
  });

  describe('#loginError', function () {
    beforeEach(function () {
    //   sinon.stub(alertService, 'error');
    //   AuthService.loginError({});
    });

    it('registers an error with the alert service', function () {
      // expect(alertService.error.called).to.be.true;
    });
  });

  describe('#refreshToken', function () {

    it('should not make a request if user has no token in session', function () {
      sinon.stub(localStorageService, 'get').returns(undefined);

      var failure = sinon.stub();
      AuthService.refreshToken().catch(failure);
      $rootScope.$digest();

      expect(failure.calledOnce).to.be.true;
    });

    describe('with token', function () {

      beforeEach(function () {
        sinon.stub(localStorageService, 'get').returns('sometoken');
        sinon.stub(AuthService, 'tokenRefreshed');
        sinon.stub(AuthService, 'tokenRefreshError');
      });

      it('returns a promise', function () {
        expect(AuthService.refreshToken().then).to.be.a('function');
      });

      describe('success', function () {
        beforeEach(function () {
          $httpBackend.expectPOST(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: 'sometoken'})
            .respond(200, {token: 'someothertoken'});
          AuthService.refreshToken();
        });

        it('calls tokenRefreshed', function () {
          $httpBackend.flush();
          expect(AuthService.tokenRefreshed.calledWith({token: 'someothertoken'})).to.be.true;
          expect(AuthService.tokenRefreshError.called).to.be.false;
        });
      });

      describe('error', function () {
        beforeEach(function () {
          $httpBackend.expectPOST(
              TokenAuthConfig.getApiEndpointRefresh(),
              {token: 'sometoken'})
            .respond(403, {token: 'someothertoken'});
          AuthService.refreshToken();
        });

        it('calls tokenRefreshError', function () {
          $httpBackend.flush();
          expect(AuthService.tokenRefreshError.called).to.be.true;
          expect(AuthService.tokenRefreshed.called).to.be.false;
        });
      });
    });
  });

  describe('#logout', function () {
    it('removes the token from local storage and redirects to the login page', function () {
      sinon.stub(localStorageService, 'remove');
      sinon.stub($location, 'path');

      AuthService.logout();

      expect(localStorageService.remove.called).to.be.true;
      expect($location.path.calledWith(loginPagePath));
    });
  });

  describe('#tokenRefreshed', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'set');
      sinon.stub(HttpRequestBuffer, 'retryAll');
      AuthService.tokenRefreshed({token: 'thetoken'});
    });

    it('stores the token using local storage service', function () {
      expect(localStorageService.set.calledWith(TokenAuthConfig.getTokenKey(), 'thetoken')).to.be.true;
    });

    it('tells the HttpRequestBuffer to retry all requests', function () {
      expect(HttpRequestBuffer.retryAll.called).to.be.true;
    });
  });

  describe('#tokenRefreshError', function () {
    beforeEach(function () {
      sinon.stub(HttpRequestBuffer, 'rejectAll');
      // sinon.stub(alertService, 'error');
      sinon.stub($location, 'path');
      AuthService.tokenRefreshError();
    });

    it('tells the request buffer to reject all pending requests', function () {
      expect(HttpRequestBuffer.rejectAll.called).to.be.true;
    });

    it('registers an error with the alert service', function () {
      // expect(alertService.error.called).to.be.true;
    });

    it('redirects the user back to the login page', function () {
      expect($location.path.calledWith(TokenAuthConfig.getLoginPagePath())).to.be.true;
    });
  });
});
