'use strict';
// project
var projectName = require('path').basename(__dirname); // grabs the current folder name
var assetCDN = 'https://cdn-static.farfetch-contents.com/Content/UP/'+projectName+'/';
var assetPath = '/assets/';
var feedPath = 'https://www.farfetch.com/uk';
// gulp
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp'); // using gulp 4.0, that supports sequential tasks, and parallel tasks
var sass = require("gulp-sass");
var pug = require('gulp-pug');
var data = require('gulp-data');
var fs = require('fs');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var log = require('gulplog');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var rename = require('gulp-rename');

// browserify
var customOpts = {
  entries: ['./src/js/main.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

gulp.task('javascript', bundle);
b.on('update', bundle);
b.on('log', log.info);

function bundle() {
  return b.bundle()
    .on('error', log.error.bind(log, 'Browserify Error'))
    .pipe(source('./main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
      .on('error', log.error)
    .pipe(gulp.dest('./dist/js'))
    .pipe(sourcemaps.write('./')) // writes .map file on tmp only
    .pipe(gulp.dest('./tmp/js'));
}

// sass
gulp.task('sass', function () {
  return gulp.src('./src/css/*.scss', { allowEmpty: true })
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest('./dist/css/'))
    .pipe(gulp.dest('./tmp/css/'))
    .pipe(browserSync.stream());
});

// Assets
gulp.task('assets', function(){
  return gulp.src('./src/assets/**',{ allowEmpty: true })
    .pipe(gulp.dest('./dist/assets'))
    .pipe(gulp.dest('./tmp/assets'));
})

// Clean
gulp.task('clean', function(){
  return gulp.src(['./dist','./tmp'], {read: false, allowEmpty:true})
        .pipe(clean());
})

// HTML / PUG
gulp.task('html-tmp', function(done){
  var translations = JSON.parse(fs.readFileSync('./src/_data/translations.json'));
  translations.forEach(function(item){
    return gulp.src(['!./src/_layout/*','!./src/_modules/*','!./src/html/*','./src/*.pug'])
        .pipe(data(function(file) {
            return item
        }))
        .pipe(data(function(){
            return {'assetPath': assetPath,'feedPath': feedPath}
        }))
        .pipe(pug())
        .pipe(rename({suffix: '_'+item.version}))
        .pipe(gulp.dest('./tmp'))
        .pipe(browserSync.stream());
  })
  done()
});

gulp.task('html-dist', function(done){
  assetPath = assetCDN;
  feedPath = '';
  var translations = JSON.parse(fs.readFileSync('./src/_data/translations.json'));
  translations.forEach(function(item){
    return gulp.src(['./src/html/*.pug'])
        .pipe(data(function(file) {
            return item
        }))
        .pipe(data(function(){
            return {'assetPath': assetPath,'feedPath': feedPath}
        }))
        .pipe(pug({pretty:true}))
        .pipe(rename({suffix: '_'+item.version}))
        .pipe(gulp.dest('./dist'));
  })
  done()
});

// Static Server + watching files
gulp.task('serve', gulp.series('clean', gulp.series('html-tmp','assets','javascript','sass', function() {
    // browser-sync
    browserSync.init({
      server: {
        baseDir: "./tmp/",
        index: "index_en.html" // english version as default
      }
    });
    gulp.watch('./src/js/**/**.js', gulp.parallel('javascript')).on('change', browserSync.reload);
    gulp.watch('./src/css/*.scss', gulp.parallel('sass'));
    gulp.watch('./src/assets/*').on('change', browserSync.reload);
    gulp.watch(['./src/**/*.pug','./src/_data/*.json'], gulp.parallel('html-tmp'));
})));

// serve
gulp.task('default', gulp.parallel('serve'));

// build
gulp.task('build', gulp.series( gulp.series('clean', gulp.series('html-dist','assets','javascript','sass')), function(done){
  done()
  // exit terminal process
  return process.exit(0);
}));
