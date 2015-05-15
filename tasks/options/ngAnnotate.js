/**
 * Array notation for angular components.
 */
'use strict';

module.exports = {
  dist: {
    files: [
      {
        expand: true,
        cwd: 'src',
        src: [
          './**/*.js',
          '!./**/*.spec.js'
        ],
        rename: function (dest, src) {
          return '.tmp/scripts/' + src;
        }
      }
    ]
  }
};
