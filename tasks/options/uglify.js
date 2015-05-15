/**
 * Minify JS.
 */
'use strict';

module.exports = {
  options: {
    mangle: true,
    mangleProperties: true,
    sourceMap: true
  },
  dist: {
    files: {
      'dist/min/scripts.min.js': [
        '.tmp/js'
      ]
    }
  }
};
