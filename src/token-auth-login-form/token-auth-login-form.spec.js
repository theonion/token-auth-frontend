'use strict';
//
// describe('Directive: TokenAuthLoginForm', function () {
//   var $scope;
//   var promiseStub;
//   var $httpBackend;
//   var $location;
//   var TokenAuthService;
//   // var AlertService;
//
//   promiseStub = sinon.stub();
//   promiseStub.abort = function () {};
//   promiseStub.fail = function () {};
//   promiseStub.done = function () {};
//   promiseStub.always = function () {};
//   promiseStub.success = function () {};
//   promiseStub.error = function () {};
//   promiseStub.then = function () {};
//
//   beforeEach(function () {
//     module('tokenAuth', function (TokenAuthConfigProvider) {
//
//       TokenAuthConfigProvider.setLogoUrl('http://some.logo.url/logo.png');
//       TokenAuthConfigProvider.setApiHost('http://some.api.host');
//       TokenAuthConfigProvider.setApiEndpointAuth('/api/token/auth');
//       TokenAuthConfigProvider.setApiEndpointRefresh('/api/token/refresh');
//     });
//
//     inject(function (_TokenAuthService_, /*_AlertService_,*/ _$httpBackend_,
//         _$location_, $compile, $rootScope) {
//       TokenAuthService = _TokenAuthService_;
//       // AlertService = _AlertService_;
//       $httpBackend = _$httpBackend_;
//       $location = _$location_;
//
//       TokenAuthService.verifyToken = sinon.stub();
//
//       var $directiveScope = $rootScope.$new();
//       var element = $compile('<token-auth-login-form></token-auth-login-form>')($directiveScope);
//       $directiveScope.$digest();
//       $scope = element.isolateScope();
//     });
//   });
//
//   it('should have a scope initialization function', function () {
//     TokenAuthService.verifyToken = sinon.stub();
//
//     $scope.username = 'cnorris';
//     $scope.password = 'tearscurecancer';
//     $scope.submitted = 'submitted';
//     $scope.LOGO_URL = 'http://www.example.com/1.jpg';
//
//     $scope.init();
//
//     expect($scope.username).to.eql('');
//     expect($scope.password).to.eql('');
//     expect($scope.submitted).to.eql('');
//     expect($scope.LOGO_URL).to.eql('http://some.logo.url/logo.png');
//     expect(TokenAuthService.verifyToken.calledOnce).to.be.true;
//   });
//
//   describe('#submitLogin', function () {
//     beforeEach(function () {
//       $scope.submitted = '';
//       // sinon.stub(AlertService, 'clear');
//     });
//
//     it('sets the submitted value to "submitted"', function () {
//       $scope.submitLogin();
//       expect($scope.submitted).to.eql('submitted');
//     });
//
//     describe('without username', function () {
//       beforeEach(function () {
//         sinon.stub(TokenAuthService, 'login', promiseStub);
//         $scope.username = '';
//         $scope.password = 'somepassword';
//         $scope.submitLogin();
//       });
//
//       it('does not try to login', function () {
//         expect(TokenAuthService.login.called).to.be.false;
//       });
//     });
//
//     describe('without password', function () {
//       beforeEach(function () {
//         sinon.stub(TokenAuthService, 'login', promiseStub);
//         $scope.username = 'somename';
//         $scope.password = '';
//         $scope.submitLogin();
//       });
//
//       it('does not try to login', function () {
//         expect(TokenAuthService.login.called).to.be.false;
//       });
//     });
//
//     describe('with credentials', function () {
//       beforeEach(function () {
//         $scope.username = 'somename';
//         $scope.password = 'somepassword';
//         sinon.spy(TokenAuthService, 'login');
//         $httpBackend.expectPOST('/api/token/auth').respond(200, {token: 'greatsuccess'});
//       });
//
//       it('clears any previous alerts from the alert service', function () {
//         $scope.submitLogin();
//         // expect(AlertService.clear.called).to.be.true;
//       });
//
//       it('logs in through the auth service with the username and password', function () {
//         $scope.submitLogin();
//         expect(TokenAuthService.login.calledWith('somename', 'somepassword')).to.be.true;
//       });
//     });
//   });
// });
