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
const sourcemaps = require('gulp-sourcemaps');

const pug = require('gulp-pug');


gulp.task('default', ['watch less', 'watch views', 'browserify']);
gulp.task('watch front', ['watch less', 'watch views']);

// scripts
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
        // .pipe(buffer())
        // .pipe(uglify())
        .pipe(gulp.dest("dist/js"));
}

gulp.task("browserify", bundle);
watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);

// styles
gulp.task('less', function () {
    return gulp.src('./src/less/_import.less')
        // .pipe(sourcemaps.init({largeFile: true}))
        .pipe(less())
        // .pipe(sourcemaps.write())
        .pipe(concat('app.css'))
        // .pipe(minify())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('watch less', function () {
    gulp.watch('./src/less/*.less', ['less']);
});

// views
gulp.task('views', function buildHTML() {
    return gulp.src('./src/views/*.pug')
        .pipe(pug())
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch views', function () {
    gulp.watch('./src/views/**/*.pug', ['views']);
});
