'use strict';

describe('Directive: TokenAuthLoginForm', function () {
  var $compile;
  var $httpBackend;
  var $location;
  var $q;
  var $rootScope;
  var $scope;
  var TokenAuthConfig;
  var TokenAuthService;

  beforeEach(function () {
    module('tokenAuth');

    inject(function (_$compile_, _$httpBackend_, _$location_, _$q_, _$rootScope_,
        _TokenAuthConfig_, _TokenAuthService_) {

      $compile = _$compile_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      TokenAuthConfig = _TokenAuthConfig_;
      TokenAuthService = _TokenAuthService_;
    });
  });

  describe('when not authenticated', function () {

    beforeEach(function () {
      TokenAuthService.isAuthenticated = sinon.stub().returns(false);

      var $directiveScope = $rootScope.$new();
      var element = $compile('<token-auth-login-form></token-auth-login-form>')($directiveScope);
      $directiveScope.$digest();
      $scope = element.isolateScope();
    });

    it('should attempt to verify authentication status', function () {
      expect(TokenAuthService.isAuthenticated.calledOnce).to.be.true;
    });

    it('should set some scope variables', function () {
      expect($scope.username).to.equal('');
      expect($scope.password).to.equal('');
      expect($scope.submitted).to.equal('');
      expect($scope.LOGO_URL).to.equal(TokenAuthConfig.getLogoUrl());
    });

    it('should have a function to login', function () {
      $scope.username = 'abc';
      $scope.password = '123';

      TokenAuthService.login = sinon.stub();

      $scope.submitLogin();

      expect(TokenAuthService.login.withArgs($scope.username, $scope.password).calledOnce).to.be.true;
    });

    it('should not login when username or password is blank', function () {
      TokenAuthService.login = sinon.stub();

      $scope.username = 'abc';
      $scope.password = '';
      $scope.submitLogin();

      $scope.username = '';
      $scope.password = '123';
      $scope.submitLogin();

      $scope.username = '';
      $scope.password = '';
      $scope.submitLogin();

      expect(TokenAuthService.login.notCalled).to.be.true;
    });
  });

  it('when already authenticated it should call login callback and reroute to root page', function () {
    TokenAuthConfig.loginCallback = sinon.stub();
    $location.path = sinon.stub();

    TokenAuthService.isAuthenticated = sinon.stub().returns(true);

    var $directiveScope = $rootScope.$new();
    var element = $compile('<token-auth-login-form></token-auth-login-form>')($directiveScope);
    $directiveScope.$digest();
    $scope = element.isolateScope();

    expect(TokenAuthConfig.loginCallback.calledOnce).to.be.true;
    expect($location.path.withArgs(TokenAuthConfig.getAfterLoginPath()).calledOnce).to.be.true;
  });
});
