'use strict';

const gulp         = require('gulp'),
      sass         = require('gulp-sass'),
      autoprefixer = require('gulp-autoprefixer'),
      browserify   = require('browserify'),
      source       = require('vinyl-source-stream'),
      babel        = require('babelify'),
      browserSync  = require('browser-sync').create();


gulp.task('sass', () => {
  return gulp.src('./app/styles/index.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./'))
    .pipe(browserSync.stream());
});

gulp.task('sass:watch', () => {
  gulp.watch('./app/styles/*.sass', ['sass']);
});

gulp.task('browserify', () => {
  browserify('./app/javascripts/index.js', {debug: true, extensions: ['.js']})
    // .transform('browserify-shim')
    .transform('brfs')
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('./'))
    .pipe(browserSync.stream());
});

gulp.task('build', ['sass', 'browserify']);

gulp.task('serve', ['sass', 'browserify'], () => {
  browserSync.init({
    server: "./"
  });

  gulp.watch('./app/styles/*.sass', ['sass']);
  gulp.watch('./app/javascripts/*.js', ['browserify']);
  gulp.watch('./app/images/*.svg').on('change', browserSync.reload);
  gulp.watch('./index.html').on('change', browserSync.reload);
})

gulp.task('default', ['build']);