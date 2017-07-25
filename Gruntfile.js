module.exports = function (grunt) {
    [
        'grunt-contrib-less',
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    grunt.initConfig({
        less: {
            options: {
                compress: true,
            },
            build: {
                files: {
                    'build/css/app.min.css': ['src/less/*.less'],
                }
            }
        },
    });

    grunt.registerTask('style', ['less']);
};
