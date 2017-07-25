const gulp = require('gulp');

const less = require('gulp-less');
const concat = require('gulp-concat');
const minify = require('gulp-minify-css');

const browserify = require("browserify");
const source = require('vinyl-source-stream');
const watchify = require("watchify");
const tsify = require("tsify");
const gutil = require("gulp-util");


gulp.task('less', function () {
    return gulp.src('./src/less/**/*.less')
        .pipe(less())
        .pipe(concat('app.css'))
        .pipe(minify())
        .pipe(gulp.dest('./build/css'));
});

const watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: ['./src/ts/app.ts'],
    cache: {},
    packageCache: {}
}).plugin(tsify));

function bundle() {
    return watchedBrowserify
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest("build/js"));
}

gulp.task('watch', function() {
    gulp.watch('./src/less/**/*.less', ['less']);
});

gulp.task("browserify", bundle);
watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);

gulp.task('default', ['watch', 'browserify']);
