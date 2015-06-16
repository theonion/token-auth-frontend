'use strict';

describe('Directive: TokenAuthLoginForm', function () {
  var $httpBackend;
  var $location;
  var $scope;
  var verifyDeferred;
  var TokenAuthConfig;
  var TokenAuthService;

  beforeEach(function () {
    module('tokenAuth');

    inject(function (_$httpBackend_, _$location_, _TokenAuthConfig_, _TokenAuthService_,
        $compile, $q, $rootScope) {

      $httpBackend = _$httpBackend_;
      $location = _$location_;
      TokenAuthConfig = _TokenAuthConfig_;
      TokenAuthService = _TokenAuthService_;

      verifyDeferred = $q.defer();
      TokenAuthService.tokenVerify = sinon.stub().returns(verifyDeferred.promise);

      var $directiveScope = $rootScope.$new();
      var element = $compile('<token-auth-login-form></token-auth-login-form>')($directiveScope);
      $directiveScope.$digest();
      $scope = element.isolateScope();
    });
  });

  it('should attempt to verify authentication status', function () {
    expect(TokenAuthService.tokenVerify.calledOnce).to.be.true;
  });

  it('should call login callback and reroute to root page when authenticated', function () {
    TokenAuthConfig.loginCallback = sinon.stub();
    $location.path = sinon.stub();

    verifyDeferred.resolve();

    $scope.$digest();

    expect(TokenAuthConfig.loginCallback.calledOnce).to.be.true;
    expect($location.path.withArgs(TokenAuthConfig.getAfterLoginPath()).calledOnce).to.be.true;
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
