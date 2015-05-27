/**
 * Automated version bump and git tag creation.
 *
 *  repo: https://github.com/vojtajina/grunt-bump
 */
'use strict';

module.exports = {
  options: {
    files: [
      'package.json'
    ],
    commit: true,
    commitMessage: 'Release %VERSION%',
    commitFiles: [
      'package.json',
      'dist/*'
    ],
    createTag: true,
    tagName: '%VERSION%',
    tagMessage: 'Version %VERSION%',
    push: true,
    pushTo: 'origin',
    gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
    globalReplace: false,
    prereleaseName: false,
    regExp: false
  }
};
