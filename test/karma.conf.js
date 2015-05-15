'use strict';

module.exports = function (config) {

  var customLaunchers = {
    SL_Chrome: {
      base: 'SauceLabs',
      browserName: 'chrome'
    },
    SL_Firefox: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '27'
    }
  };

  config.set({
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: [
      'mocha',
      'sinon',
      'chai',
      'expect'
    ],

    preprocessors: {
      'src/**/*.html': ['ng-html2js']
    },

    // list of files / patterns to load in the browser
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-local-storage/dist/angular-local-storage.js',
      'bower_components/lodash/lodash.js',
      'src/*.js',
      'src/**/*.js',
      'src/**/*.html'
    ],

    ngHtml2JsPreprocessor: {
      stripPrefix: 'src/',
      moduleName: 'tokenAuth.templates'
    },

    exclude: [],

    sauceLabs: {
      testName: 'Onion token-auth-frontend Karma Tests',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      startConnect: false
    },

    port: 9876,
    browsers: ['Chrome'],

    plugins: [
      'karma-sauce-launcher',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-expect',
      'karma-mocha',
      'karma-chai',
      'karma-ng-html2js-preprocessor',
      'karma-sinon'
    ],

    singleRun: false,
    colors: true,
    logLevel: config.LOG_INFO
  });

  if (process.env.TRAVIS) {
    var buildLabel = 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')';

    config.captureTimeout = 0; // rely on SL timeout
    config.singleRun = true;
    config.autoWatch = false;
    config.sauceLabs = {
      build: buildLabel,
      startConnect: false,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
    };

    config.customLaunchers = customLaunchers;
    config.browsers = Object.keys(customLaunchers);
    config.reporters.push('saucelabs');
  } else {
    config.singleRun = false;
    config.autoWatch = true;
  }
};
