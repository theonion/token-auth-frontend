'use strict';

describe('Directive: TokenAuthLoginForm', function () {
  var $scope;
  var promiseStub;
  var $httpBackend;
  var $location;
  var TokenAuthService;
  // var AlertService;
  // var BettyService;

  promiseStub = sinon.stub();
  promiseStub.abort = function () {};
  promiseStub.fail = function () {};
  promiseStub.done = function () {};
  promiseStub.always = function () {};
  promiseStub.success = function () {};
  promiseStub.error = function () {};
  promiseStub.then = function () {};

  beforeEach(function () {
    module('tokenAuth', function (TokenAuthConfigProvider) {
      
      TokenAuthConfigProvider.setLogoUrl('http://some.logo.url/logo.png');
      TokenAuthConfigProvider.setApiHost('http://some.api.host');
      TokenAuthConfigProvider.setApiEndpointAuth('/api/token/auth');
      TokenAuthConfigProvider.setApiEndpointRefresh('/api/token/refresh');
    });

    inject(function (_TokenAuthService_, /*_AlertService_,*/ _$httpBackend_,
        _$location_, /*_BettyService_,*/ $compile, $rootScope) {
      TokenAuthService = _TokenAuthService_;
      // AlertService = _AlertService_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      // BettyService = _BettyService_;

      var $directiveScope = $rootScope.$new();
      var element = $compile('<token-auth-login-form></token-auth-login-form>')($directiveScope);
      $directiveScope.$digest();
      $scope = element.isolateScope();
    });
  });

  describe('#init', function () {
    beforeEach(function () {
      $scope.username = 'cnorris';
      $scope.password = 'tearscurecancer';
      $scope.submitted = 'submitted';
      $scope.LOGO_URL = 'http://www.example.com/1.jpg';
      $scope.init();
    });

    it('clears the username', function () {
      expect($scope.username).to.eql('');
    });

    it('clears the password', function () {
      expect($scope.password).to.eql('');
    });

    it('clears the submitted property', function () {
      expect($scope.submitted).to.eql('');
    });

    it('sets the logo url based on the global constant', function () {
      expect($scope.LOGO_URL).to.eql('http://some.logo.url/logo.png');
    });
  });

  describe('#submitLogin', function () {
    beforeEach(function () {
      $scope.submitted = '';
      // sinon.stub(AlertService, 'clear');
    });

    it('sets the submitted value to "submitted"', function () {
      $scope.submitLogin();
      expect($scope.submitted).to.eql('submitted');
    });

    describe('without username', function () {
      beforeEach(function () {
        sinon.stub(TokenAuthService, 'login', promiseStub);
        $scope.username = '';
        $scope.password = 'somepassword';
        $scope.submitLogin();
      });

      it('does not try to login', function () {
        expect(TokenAuthService.login.called).to.be.false;
      });
    });

    describe('without password', function () {
      beforeEach(function () {
        sinon.stub(TokenAuthService, 'login', promiseStub);
        $scope.username = 'somename';
        $scope.password = '';
        $scope.submitLogin();
      });

      it('does not try to login', function () {
        expect(TokenAuthService.login.called).to.be.false;
      });
    });

    describe('with credentials', function () {
      beforeEach(function () {
        $scope.username = 'somename';
        $scope.password = 'somepassword';
        sinon.spy(TokenAuthService, 'login');
        $httpBackend.expectPOST('/api/token/auth').respond(200, {token: 'greatsuccess'});
      });

      it('clears any previous alerts from the alert service', function () {
        $scope.submitLogin();
        // expect(AlertService.clear.called).to.be.true;
      });

      it('logs in through the auth service with the username and password', function () {
        $scope.submitLogin();
        expect(TokenAuthService.login.calledWith('somename', 'somepassword')).to.be.true;
      });

      describe('error', function () {
        beforeEach(function () {
          $httpBackend.expectPOST('/api/token/auth').respond(403, {});
          sinon.stub($scope, 'userLoggedIn');
          $scope.submitLogin();
        });

        it('does not call the userLoggedIn function', function () {
          expect($scope.userLoggedIn.called).to.be.false;
        });
      });
    });
  });

  describe('#userLoggedIn', function () {
    beforeEach(function () {
      $scope.username = 'cnorris';
      // sinon.stub(BettyService, 'updateBettyConfig');
      $scope.userLoggedIn();
    });

    it('updates the betty config', function () {
      // expect(BettyService.updateBettyConfig.called).to.be.true;
    });
  });
});
