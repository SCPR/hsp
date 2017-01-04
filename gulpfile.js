'use strict';

const gulp         = require('gulp'),
      sass         = require('gulp-sass'),
      autoprefixer = require('gulp-autoprefixer'),
      browserify   = require('browserify'),
      source       = require('vinyl-source-stream'),
      babel        = require('babelify'),
      browserSync  = require('browser-sync').create(),
      md5          = require('gulp-md5-plus'),
      clean        = require('gulp-clean'),
      cleanCSS     = require('gulp-clean-css'),
      uglify       = require('gulp-uglify'),
      del          = require('del'),
      runSequence  = require('run-sequence');


gulp.task('build:sass', () => {
  return gulp.src('./app/styles/index.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./'))
    .pipe(browserSync.stream());
});

gulp.task('build:js', () => {
  return browserify('./app/javascripts/index.js', {debug: true, extensions: ['.js']})
    // .transform('browserify-shim')
    .transform('brfs')
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('./'))
    .pipe(browserSync.stream());
});

gulp.task('build', ['build:sass', 'build:js']);

gulp.task('serve', ['build:sass', 'build:js'], () => {
  browserSync.init({
    server: "./"
  });
  gulp.watch('./app/styles/*.sass', ['build:sass']);
  gulp.watch('./app/javascripts/*.js', ['build:js']);
  gulp.watch('./app/images/*.svg').on('change', browserSync.reload);
  gulp.watch('./index.html').on('change', browserSync.reload);
})

gulp.task('default', ['serve']);

gulp.task('compile:html', (cb) => {
  return gulp.src('./index.html')
    .pipe(gulp.dest('./build')); 
})

gulp.task('compile:css', () => {
  return gulp.src(['./index.css'])
    .pipe(md5(10, './build/index.html'))
    .pipe(cleanCSS({compatibility: 'ie11'}))
    .pipe(gulp.dest('./build'));
});

gulp.task('compile:js', () => {
  return gulp.src(['./index.js'])
    .pipe(md5(10, './build/index.html'))
    .pipe(uglify())
    .pipe(gulp.dest('./build'));
});

gulp.task('compile:images', () => {
  return gulp.src(['./images/**/*'])
    .pipe(md5(10, ['./build/index.html', './build/index_*.css']))
    .pipe(gulp.dest('./build/images'));
});

gulp.task('clean', () => {
  return del(['./build']);
});

gulp.task('compile', (cb) => {
  return runSequence('clean', 'build', 'compile:html', 'compile:css', 'compile:js', 'compile:images', cb)
});

