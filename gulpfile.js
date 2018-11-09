'use strict';
// project
var projectName = require('path').basename(__dirname); // grabs the current folder name
var assetCDN = 'https://cdn-static.farfetch-contents.com/Content/UP/editorial_assets/'+projectName+'/';
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
var puppeteer = require('puppeteer');

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
    gulp.watch('./src/css/**/*.scss', gulp.parallel('sass'));
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

// GULP DEPLOY & GULP DEPLOY-BUILD
const htmlFiles = getFilesFromPath('./dist', '.html')
const CREDS = require('./deploy_creds');

// helper functions
function getFilesFromPath(path, extension) {
    let dir = fs.readdirSync( path );
    return dir.filter( elm => elm.match(new RegExp(`.*\.(${extension})`, 'ig')));
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const createSegments = async (page) => {
  await console.log('Creating Segments....')
  await asyncForEach(htmlFiles, async (el,i) => {
    await page.waitFor(1500);
    let cloneButton = await page.$x("//td[normalize-space(text())='CMS_US']/following::td//a").then(function(result){
      // copy button
      return result[1]
    });
    let version = el.toString();
    version = version.replace('index_','').replace('.html','').toUpperCase();
    if (version !== 'SE' && version !== 'BR') { // ignore SE and BR as they aren't options on the CMS
      await cloneButton.click();
      await page.waitFor(2000);
      await page.select('#TargetContentZone', version)
      await page.waitFor(1000);
      await page.click('#versioning-actions-modal-confirm-button');
      await page.waitFor(2000);
    }
  })
  await console.log('Segments Created.')
}

const segmentFillRoutine = async(page,el,version) => {
  await console.log('Poulating CMS_'+version+'......')
  let editButton = await page.$x("//td[normalize-space(text())='CMS_"+version+"']/following::td//a").then(function(result){
      // edit button
      return result[0]
  });
  await page.waitFor(1000);
  await editButton.click();
  await page.waitForNavigation();
  let htmlContent = await fs.readFileSync('./dist/'+el, 'utf-8').toString();
  let cssContent = await fs.readFileSync('./dist/css/global.css', 'utf-8').toString();
  let jsContent = await fs.readFileSync('./dist/js/main.js', 'utf-8').toString();
  await page.waitFor(1000);
  await page.$eval('#codemirror-content-html', (el,value) => {
      let dom = document.querySelector('#codemirror-content-html');
      let parent = dom.parentNode;
      parent.removeChild(dom);
      let htmlField = document.createElement('textarea');
      parent.appendChild(htmlField);
      htmlField.name = 'HtmlContent';
      htmlField.value = value
  }, htmlContent);
  await page.$eval('#codemirror-content-css', (el, value) => el.value = value, cssContent);
  await page.$eval('#codemirror-content-js', (el, value) => el.value = value, jsContent);
  let saveButton = await page.$('input#buttonEditFlat');
  await saveButton.click();
  await page.waitForNavigation();
  let backButton = await page.$('.pull-left a');
  await backButton.click();
  await page.waitForNavigation();
  await page.waitFor(1500);
}

const populateSegments = async (page) => {
  await asyncForEach(htmlFiles, async (el,i) => {
    let version = el.toString();
    version = version.replace('index_','').replace('.html','').toUpperCase();
    if (version !== 'SE' && version !== 'BR') { // ignore SE and BR as they aren't options on the CMS
      switch(version){ // adjust version variable for non-matching cell names to match CMS
        case 'CN':
        version = 'China';
        break;
        case 'DE':
        version = 'German';
        break;
        case 'ES':
        version = 'Spanish';
        break;
        case 'FR':
        version = 'France';
        break;
        case 'JP':
        version = 'Japan';
        break;
        case 'KO':
        version = 'Korean';
        break;
        case 'MX':
        version = 'Latin America';
        break;
        case 'RU':
        version = 'Russia';
        break;
      }
      await page.waitFor(1500);
      await segmentFillRoutine(page,el,version);
    }
  })
  // populate US content last, same as EN
  await segmentFillRoutine(page,'index_en.html','US');
  await console.log('Segments Populated!')
}

gulp.task('deploy', gulp.series( gulp.series('clean', gulp.series('html-dist','assets','javascript','sass')),function(done){
  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(CREDS.deploy_url);
    await page.waitFor(2000);
    // login
    await page.click('#username');
    await page.keyboard.type(CREDS.username);
    await page.click('#password');
    await page.keyboard.type(CREDS.password);
    await page.click('.FF-button');
    await page.waitFor(3000);
    // for each translation, perform deployment routine
    await createSegments(page);
    await populateSegments(page);
    // exit terminal process
    await done();
    await process.exit(0);
  })();
}));

gulp.task('deploy-update', gulp.series( gulp.series('clean', gulp.series('html-dist','assets','javascript','sass')),function(done){
  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(CREDS.deploy_url);
    await page.waitFor(2000);
    // login
    await page.click('#username');
    await page.keyboard.type(CREDS.username);
    await page.click('#password');
    await page.keyboard.type(CREDS.password);
    await page.click('.FF-button');
    await page.waitFor(3000);
    // for each translation, perform deployment routine
    await populateSegments(page);
    // exit terminal process
    await done();
    await process.exit(0);
  })();
}));
