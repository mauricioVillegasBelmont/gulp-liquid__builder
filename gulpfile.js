const dartSass = require('sass'); 
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const postcss = require('gulp-postcss');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const typescript = require('gulp-typescript'); // Add this!
const rimraf = require('rimraf');
const { sync: glob } = require('glob');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano') ;


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
    src: 'src/styles/**/*.{css,scss}',
    dest: 'theme/assets'
  },
  scripts: {
    src: 'src/scripts/**/*.ts', // Now .ts!
    dest: 'theme/assets'
  },
  assets: {
    src: 'src/**/*.{gif,jpg,png,webp,svg,woff,woff2}',
    dest: 'theme/assets'
  },
  liquid: {
    src: [
      'src/**/*.{liquid,json,html}', 
      '!src/**/*.{gif,jpg,png,webp,svg,woff,woff2}', 
      '!src/styles/**/*.scss', 
      '!src/scripts/**/*.ts'
    ],
    dest: 'theme'
  }
};

// Clean task: remove all in theme/ except protected
function clearTheme() {
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
}

function assets() {
  return gulp.src(paths.assets.src)
    .pipe(rename(path => {
      path.dirname = '';
    }))
    .pipe(gulp.dest(paths.assets.dest));
}


// CSS: SCSS → Tailwind + Autoprefixer + Minify
function styles() {
  const plugins = [
    require('@tailwindcss/postcss')('tailwind.config.js'),
    autoprefixer(),
  ];
  if(process.env.NODE_ENV === 'production') plugins.push(cssnano())

  return gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(plugins))
    
    // .pipe(rename('theme.css'))
    .pipe(rename(path => {
      path.dirname = '';
    }))
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
    .pipe(rename(path => {
      path.dirname = '';
    }))
    .pipe(gulp.dest(paths.scripts.dest));
}

// Copy Liquid, JSON, HTML files
function liquid() {
  return gulp.src(paths.liquid.src)
    .pipe(gulp.dest(paths.liquid.dest));
}





// Tarea gulp para eliminar directorio de producción
gulp.task('clear', async () => {
  clearTheme();
});


gulp.task('assets', async () => {
    assets();
});
gulp.task('css', styles);
gulp.task('js', scripts);
gulp.task('liquid', liquid);

// Tarea gulp para producción
gulp.task('build', gulp.series('clear', 'assets', 'liquid','css', 'js'));

// Tarea gulp para desarrollo
gulp.task('watch', gulp.series('clear', 'assets', 'liquid','css', 'js', async () => {
  // watchFiles()
  gulp.watch(paths.assets.src,  gulp.series('assets'));
  gulp.watch(paths.liquid.src,  gulp.series('liquid'));
  gulp.watch(paths.styles.src,  gulp.series('css'));
  gulp.watch(paths.scripts.src, gulp.series('js'));
}));