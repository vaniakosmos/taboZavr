const gulp = require('gulp');

const less = require('gulp-less');
const concat = require('gulp-concat');
const minify = require('gulp-minify-css');

const browserify = require("browserify");
const source = require('vinyl-source-stream');
const watchify = require("watchify");
const tsify = require("tsify");
const gutil = require("gulp-util");
const uglify = require('gulp-uglify');
const buffer = require('vinyl-buffer');
const babelify = require('babelify');

const browserifyConfig = {
    basedir: '.',
    debug: true,
    entries: ['./src/ts/app.ts'],
    extensions: ['.js', '.ts', '.json'],
    cache: {},
    packageCache: {}
};
const watchedBrowserify = watchify(
    browserify(browserifyConfig)
        .plugin(tsify, {target: 'es6'})
        .transform(babelify.configure({extensions: ['.js', '.ts', '.json']}))
);

function bundle() {
    return watchedBrowserify
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest("build/js"));
}

gulp.task("browserify", bundle);
watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);


gulp.task('less', function () {
    return gulp.src('./src/less/**/*.less')
        .pipe(less())
        .pipe(concat('app.css'))
        .pipe(minify())
        .pipe(gulp.dest('./build/css'));
});

gulp.task('watch', function () {
    gulp.watch('./src/less/**/*.less', ['less']);
});

gulp.task('default', ['watch', 'browserify']);
