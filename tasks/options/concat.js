/**
 * Concat files.
 */
'use strict';

module.exports = {
  options: {
    banner: '\'use strict\';\n',
    process: function (src, filepath) {
      return '// Source: ' + filepath + '\n' +
        src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
    },
  },
  js: {
    src: ['.tmp/**/*.js'],
    dest: 'dist/token-auth.js'
  }
};
