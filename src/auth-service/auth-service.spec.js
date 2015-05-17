'use strict';

describe('Service: authService', function () {
  var $httpBackend;
  var $rootScope;
  var $location;
  var httpRequestBuffer;
  var $window;
  var localStorageService;
  var authService;
  // var alertService;
  var TokenAuthConfig;

  beforeEach(function () {
    module('tokenAuth', function (TokenAuthConfigProvider) {
      TokenAuthConfigProvider.setLogoUrl('http://some.logo.url/something.png');
      TokenAuthConfigProvider.setApiHost('http://some.api.host');
    });

    inject(function (_$httpBackend_, _$rootScope_, _$location_, _$window_,
        _authService_, /*_AlertService_,*/ _localStorageService_, _httpRequestBuffer_,
        _TokenAuthConfig_) {
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      authService = _authService_;
      // alertService = _AlertService_;
      localStorageService = _localStorageService_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      httpRequestBuffer = _httpRequestBuffer_;
      TokenAuthConfig = _TokenAuthConfig_;
    });
  });

  describe('#login', function () {
    var expectedPayload = {
      username: 'cnorris',
      password: 'tearskillcancer'
    };
    beforeEach(function () {
      sinon.stub(authService, 'loginSuccess');
      sinon.stub(authService, 'loginError');
    });

    describe('always', function () {
      it('returns a promise', function () {
        $httpBackend.when(
            'POST',
            TokenAuthConfig.getApiHost() + '/api/token/auth')
          .respond({token: '12345'});
        var response = authService.login('username', 'password');
        expect(response.then).to.be.a('function');
      });
    });

    describe('success', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(
            TokenAuthConfig.getApiHost() + '/api/token/auth',
            expectedPayload)
          .respond(201, {token: '12345'});
        authService.login('cnorris', 'tearskillcancer');
      });

      it('calls loginSuccess if successful login', function () {
        $httpBackend.flush();
        expect(authService.loginSuccess.calledWith({token: '12345'})).to.be.true;
      });
    });

    describe('error', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(TokenAuthConfig.getApiHost() + '/api/token/auth', expectedPayload).respond(403, {});
        authService.login('cnorris', 'tearskillcancer');
      });

      it('calls loginError if unsuccessful login', function () {
        $httpBackend.flush();
        expect(authService.loginError.calledWith({})).to.be.true;
      });
    });
  });

  describe('#loginSuccess', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'set');
      authService.loginSuccess({token: '12345'});
    });

    it('stores the token using local storage service', function () {
      expect(localStorageService.set.calledWith('authToken', '12345')).to.be.true;
    });
  });

  describe('#loginError', function () {
    beforeEach(function () {
    //   sinon.stub(alertService, 'error');
    //   authService.loginError({});
    });

    it('registers an error with the alert service', function () {
      // expect(alertService.error.called).to.be.true;
    });
  });

  describe('#refreshToken', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'get').returns('sometoken');
      sinon.stub(authService, 'tokenRefreshed');
      sinon.stub(authService, 'tokenRefreshError');
    });

    it('returns a promise', function () {
      expect(authService.refreshToken().then).to.be.a('function');
    });

    describe('success', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(
            TokenAuthConfig.getApiHost() + '/api/token/refresh',
            {token: 'sometoken'})
          .respond(200, {token: 'someothertoken'});
        authService.refreshToken();
      });

      it('calls tokenRefreshed', function () {
        $httpBackend.flush();
        expect(authService.tokenRefreshed.calledWith({token: 'someothertoken'})).to.be.true;
        expect(authService.tokenRefreshError.called).to.be.false;
      });
    });

    describe('error', function () {
      beforeEach(function () {
        $httpBackend.expectPOST(
            TokenAuthConfig.getApiHost() + '/api/token/refresh',
            {token: 'sometoken'})
          .respond(403, {token: 'someothertoken'});
        authService.refreshToken();
      });

      it('calls tokenRefreshError', function () {
        $httpBackend.flush();
        expect(authService.tokenRefreshError.called).to.be.true;
        expect(authService.tokenRefreshed.called).to.be.false;
      });
    });
  });

  describe('#tokenRefreshed', function () {
    beforeEach(function () {
      sinon.stub(localStorageService, 'set');
      sinon.stub(httpRequestBuffer, 'retryAll');
      authService.tokenRefreshed({token: 'thetoken'});
    });

    it('stores the token using local storage service', function () {
      expect(localStorageService.set.calledWith('authToken', 'thetoken')).to.be.true;
    });

    it('tells the httpRequestBuffer to retry all requests', function () {
      expect(httpRequestBuffer.retryAll.called).to.be.true;
    });
  });

  describe('#tokenRefreshError', function () {
    beforeEach(function () {
      sinon.stub(httpRequestBuffer, 'rejectAll');
      // sinon.stub(alertService, 'error');
      sinon.stub($location, 'path');
      authService.tokenRefreshError();
    });

    it('tells the request buffer to reject all pending requests', function () {
      expect(httpRequestBuffer.rejectAll.called).to.be.true;
    });

    it('registers an error with the alert service', function () {
      // expect(alertService.error.called).to.be.true;
    });

    it('redirects the user back to the login page', function () {
      expect($location.path.calledWith('cms/login')).to.be.true;
    });
  });
});
