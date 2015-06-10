'use strict';

module.exports = function (grunt) {
  var _ = grunt.util._;
  var path = require('path');
  var gruntConfig = require('load-grunt-config');

  require('./package.json');

  var config = _.extend({},
    gruntConfig(grunt, {
      configPath: path.join(process.cwd(), 'tasks/options'),
      init: false
    })
  );

  grunt.registerTask('mkdir:dist', function () {
    grunt.file.mkdir('dist');
  });

  grunt.registerTask('mkdir:tmp', function () {
    grunt.file.mkdir('.tmp');
  });

  grunt.registerTask('lint', [
    'jscs',
    'jshint'
  ]);

  grunt.loadTasks('tasks');

  grunt.registerTask('build', [
    'lint',
    // setup
    'clean',
    'mkdir:tmp',
    'mkdir:dist',
    // js stuff
    'ngAnnotate',
    'ngtemplates',
    'concat:js',
    // css stuff
    'compass',
    'copy:css',
    // close it all out
    'clean:tmp'
  ]);

  grunt.registerTask('release', [
    'karma',
    'build',
    'bump'
  ]);

  grunt.initConfig(config);
};
