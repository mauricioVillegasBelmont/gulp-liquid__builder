const dartSass = require('sass'); 
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const typescript = require('gulp-typescript'); // Add this!
const chokidar = require('chokidar'); // Replace gulp-watch
const rimraf = require('rimraf');
const { sync: glob } = require('glob');

// Sass
const sass = gulpSass(dartSass);

// List of files/folders to PROTECT
const protectedPaths = [
  '.git',
  '.github',
  '.shopifyignore',
  '.gitignore',
  '.gitattributes',
  '.theme-check.yml',
  'README.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'LICENSE.md',
];

// Paths
const paths = {
  styles: {
    src: 'src/styles/**/*.scss',
    dest: 'theme/assets'
  },
  scripts: {
    src: 'src/scripts/**/*.ts', // Now .ts!
    dest: 'theme/assets'
  },
  images: {
    src: 'src/**/*.{gif,jpg,png,webp,svg}',
    dest: 'theme/assets'
  },
  liquid: {
    src: [
      'src/**/*.{liquid,json,html}', 
      '!src/**/*.{gif,jpg,png,webp,svg}', 
      '!src/styles/**/*.scss', 
      '!src/scripts/**/*.ts'
    ],
    dest: 'theme'
  }
};

// Clean task: remove all in theme/ except protected
function clean(done) {
  const baseDir = 'theme/';
  
  // Build glob pattern: match everything except protected
  const pattern = `${baseDir}*`;
  const filesToDelete = glob(pattern, {
    dot: true, // Include dotfiles
    nodir: false // Include directories
  }).filter(file => {
    const basename = file.replace(baseDir, '');
    return !protectedPaths.includes(basename);
  });

  if (filesToDelete.length > 0) {
    filesToDelete.forEach(file => {
      rimraf.sync(file);
    });
    console.log('Cleaned:', filesToDelete.map(f => f.replace(baseDir, '')).join(', '));
  } else {
    console.log('No files to clean.');
  }

  done();
}

function assets() {
  return gulp.src(paths.images.src)
    .pipe(gulp.dest(paths.images.dest));
}


// CSS: SCSS → Tailwind + Autoprefixer + Minify
function css() {
  return gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss())
    // .pipe(rename('theme.css'))
    .pipe(gulp.dest(paths.styles.dest));
}

// TypeScript: .ts → .js + minify
function scripts() {
  const tsProject = typescript.createProject('tsconfig.json');

  return gulp.src(paths.scripts.src)
    .pipe(tsProject())
    .js // Get the compiled JS stream
    .pipe(uglify())
    // .pipe(rename('theme.js'))
    .pipe(gulp.dest(paths.scripts.dest));
}

// Copy Liquid, JSON, HTML files
function liquid() {
  return gulp.src(paths.liquid.src)
    .pipe(gulp.dest(paths.liquid.dest));
}

// Watch using chokidar (modern, safe)
function watchFiles() {
  chokidar.watch(paths.styles.src).on('all', () => gulp.series(css) );
  chokidar.watch(paths.scripts.src).on('all', () => gulp.series(scripts) );
  chokidar.watch(paths.liquid.src).on('all', () => gulp.series(liquid) );
}

//  Clean 
const cleanFiles = gulp.series(clean);
// Build task
const build = gulp.series(clean, gulp.parallel(css, scripts, assets,liquid));
// Default task
const dev = gulp.series(build, watchFiles);

// Export tasks
exports.css = css;
exports.scripts = scripts;
exports.liquid = liquid;
exports.build = build;
exports.watch = watchFiles;
exports.clear = cleanFiles;
exports.default = dev;