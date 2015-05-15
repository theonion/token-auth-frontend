/**
 * Copy files into necessary locations.
 */
'use strict';

module.exports = {
  css: {
    cwd: '.tmp',
    src: [
      '**/*.css'
    ],
    dest: 'dist',
    expand: true,
    flatten: true
  }
};
