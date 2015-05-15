/**
 * Creates a cachable templates js file for quick template access.
 */
'use strict';

module.exports = {
  templates: {
    cwd: 'src',
    src: ['**/*.html'],
    dest: '.tmp/templates.js',
    options: {
      htmlmin: {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true
      },
      module: 'tokenAuth.templates',
      standalone: true
    }
  }
};
