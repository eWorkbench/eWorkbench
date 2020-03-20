'use strict';
/**
 * Gulp file for compiling application.
 *
 * - gulp build
 *   Builds the application under the configured dist folder
 * - gulp watch
 *   Watches for changes in the sources and triggers a build
 * - gulp make-messages
 *   Scan sources for translatable texts, builds a POT and syncs with existing PO files
 * - gulp clean
 *   Cleans all auto generated files
 */

/*
 * Gulp file configuration
 */
var config = {
    'dist': './public',
    'app': './app',
    'testSources': [
        'public/js/deps.js',
        'public/js/app.js',
        'public/js/app.config.js',
        // 'node_modules/angular-mocks/angular-mocks.js',
        'tests/mockAngularMock.js',
        'tests/test*.js'
    ],
    'assetsDir': '.',
    'messagesDir': 'locales',
    'moduleLicenseDir': 'LICENSES',
    'runserverHost': '0.0.0.0',
    'runserverPort': '8080',
    'assetPrefixes': {
        'imgs': '../img/',
        'fonts': '../fonts/'
    },
    'htmlSources': [
        'app/index.html',
        'app/maintenance.html'
    ],
    'lessSources': [
        'app/js/**/*.less',
        'app/theme/patternfly.less',
        'app/theme/patternfly-additions.less',
        'app/theme/custom.less'
    ],
    // define static files that need to be copied to the destination
    // .../{,myFolderName}/... => files are taken from folder "myFolderName" and put into a folder with the same name
    'assetSources': [
        // app config needs to be copied
        'app/{_,js}/app.config.js',
        // images need to be copied
        'app/{_,img}/**',
        'app/{_,fonts}/**',
        // locales (translations) need to be copied
        'app/{_,locales}/**/*.json',
        // fonts need to be copied
        'node_modules/patternfly/dist/{_,fonts}/*.{otf,eot,svg,ttf,woff,woff2}',
        // make sure font awesome is on the bottom, so it overwrites the older versions packed with patternfly
        'node_modules/font-awesome/{_,fonts}/*.{otf,eot,svg,ttf,woff,woff2}',
        'node_modules/angular-ui-grid/{_,fonts}/*.{woff,ttf,eot,svg}',
        // tinymce uses their own plugin system
        '{_,node_modules}/tinymce/**',
        '{_,node_modules}/tinymce-formula/**'
    ],
    'messagesSources': [
        'app/index.html',
        'app/**/*.{js,html}'
    ],
    'angularTemplateModule': 'templates',
    'angularTemplateSources': [
        'app/{_,js}/**/*.html'
    ]
};

/*
 * Gulp module imports
 */
const
    // Gulp modules
    gulp = require('gulp'),
    gulpPlumber = require('gulp-plumber'),
    gulpIf = require('gulp-if'),
    gulpUtil = require('gulp-util'),
    gulpSourcemaps = require('gulp-sourcemaps'),
    gulpLess = require('gulp-less'),
    gulpUseref = require('gulp-useref'),
    gulpClean = require('gulp-clean'),
    gulpConcat = require('gulp-concat'),
    gulpConvertNewline = require("gulp-convert-newline"),
    gulpExit = require("gulp-exit"),
    gulpHtmlmin = require('gulp-htmlmin'),
    gulpCleanCss = require('gulp-clean-css'),
    gulpRework = require('gulp-rework'),
    gulpUglify = require('gulp-uglify'),
    gulpStripDebug = require('gulp-strip-debug'),
    gulpExec = require('gulp-exec'),
    gulpNgAnnotate = require('gulp-ng-annotate'),
    gulpAngularTemplateCache = require('gulp-angular-templatecache'),
    gulpAngularGettext = require('gulp-angular-gettext'),
    gulpCacheBuster = require('gulp-cache-bust'),
    gulpWebserver = require('gulp-webserver'),
    gulpKarmaRunner = require('gulp-karma-runner'),

    // exec
    exec = require('child_process').exec,

    // Other modules
    reworkPluginUrl = require('rework-plugin-url'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    lazypipe = require('lazypipe'),
    licenseChecker = require('license-checker');


/*
 * Environment constants
 */
const
    temp = path.join(config.app, '.temp'),
    production = !!gulpUtil.env.production,
    development = !production;

process.env.CHROME_BIN = require('puppeteer').executablePath();


/**
 * Output a string to a file
 * Attribution: https://stackoverflow.com/questions/23230569/how-do-you-create-a-file-from-a-string-in-gulp
 * @param filename
 * @param string
 * @returns {*}
 */
function string_src(filename, string) {
    var src = require('stream').Readable({ objectMode: true })
    src._read = function () {
        this.push(new gulpUtil.File({
            cwd: "",
            base: "",
            path: filename,
            contents: new Buffer.from(string)
        }));
        this.push(null)
    };

    return src;
}

/**
 * Builds the application's LESS
 */
gulp.task('styles-less', function () {
    return gulp.src(config.lessSources)
        .pipe(development ? gulpPlumber() : gulpUtil.noop())
        // wrap tasks in a sourcemap
        .pipe(development ? gulpSourcemaps.init() : gulpUtil.noop())
         // execute less on the source files
        .pipe(gulpLess({'paths': ['node_modules']}))
        .on('error', function (err) {
            console.log(err.toString());

            this.emit('end');
        })
        // merge to single file
        .pipe(gulpConcat('less.css'))
        // write source map files
        .pipe(development ? gulpSourcemaps.write({'mapSources': function (f) {
            return '/' + f;
        }}) : gulpUtil.noop())
        // write css
        .pipe(gulp.dest(temp));
});

/**
 * Builds the application's CSS from LESS
 */
gulp.task('styles', gulp.series('styles-less', function (cb) {
    cb();
}));

/**
 * Watch for changes on less files
 */
gulp.task('watchStyles', gulp.series('styles', function() {
    return gulp.watch(['**/**/*.less', '!' + path.join(temp, '**')], gulp.series('styles'));
}));

var devServer = function () {
    return gulp.src('.')
        .pipe(gulpWebserver(
            {
                'port': config.runserverPort,
                'host': config.runserverHost,
                'middleware': function(req, res, next) {
                    // avoid opening templates.js within your dev instance
                    if (req.url.match(/templates.js/)) {
                        res.end("");
                    } else {
                        console.log(req.url);
                        // disable caching headers
                        res.setHeader('Cache-Control', "no-cache, no-store, must-revalidate");
                        res.setHeader('Pragma', 'no-cache');
                        res.setHeader('Expires', 0);
                        next();
                    }
                }
            }
        )
    );
};
devServer.displayName = 'devServer';

/**
 * Serves the application via a web-server
 */
gulp.task('run-server', gulp.parallel('watchStyles', devServer));

/**
 * Cleans dist and temp files
 */
gulp.task('clean', function (cb) {
    return gulp.series('clean-temp', 'clean-dist', cb);
});


/**
 * Extracts all application message strings, builds a POT file and merges it with the PO files
 */
gulp.task('make-messages', function (cb) {
    return gulp.series('extract-messages', 'merge-messages', cb);
});


/**
 * Extracts all application message strings and builds a POT file
 */
gulp.task('extract-messages', function () {
    return gulp.src(config.messagesSources)
        .pipe(gulpPlumber())
        .pipe(gulpAngularGettext.extract('template.pot', { }))
        .pipe(gulp.dest(path.join(config.app, config.messagesDir)));
});


/**
 * Merges the POT file with the PO file
 */
gulp.task('merge-messages', function () {
    var
        potFile = path.join(config.app, config.messagesDir, 'template.pot'),
        options = {
            'pipeStdout': true,
            'potFile': potFile
        };

    return gulp.src(path.join(config.app, config.messagesDir, '**', '*.po'))
        .pipe(gulpPlumber())
        .pipe(gulpExec('msgmerge "<%= file.path %>" "<%= options.potFile %>"', options))
        .pipe(gulp.dest(path.join(config.app, config.messagesDir)));
});

/**
 * Builds all PO translation files
 */
gulp.task('compile-messages', function () {
    return gulp.src(path.join(config.app, config.messagesDir, '**', '*.po'))
        .pipe(gulpPlumber())
        .pipe(gulpAngularGettext.compile({'format': 'json'}))
        .pipe(gulp.dest(path.join(config.app, config.messagesDir)));
});

/**
 * Append a hash/string after each javascript and css include in index.html to make sure that we get the latest version
 * of the file (browser cache bust)
 */
gulp.task('cache-bust', function(cb) {
    return gulp.src(path.join(config.dist, 'index.html'))
        .pipe(gulpCacheBuster())
        .pipe(gulp.dest(config.dist))
    ;
});

/**
 * Builds the application HTML
 */
gulp.task('html', function () {
    return gulp.src(config.htmlSources)
        .pipe(development ? gulpPlumber() : gulpUtil.noop())
        // extract refs from html and transform pipe to use sourcemap
        .pipe(development ? gulpUseref({}, lazypipe().pipe(gulpSourcemaps.init, {'loadMaps': true})) : gulpUseref())
        // write source map files
        .pipe(development ? gulpSourcemaps.write() : gulpUtil.noop())
        // ng annotate
        .pipe(gulpIf('*.js', gulpNgAnnotate({'add': true, 'remove': false, 'single_quotes': true})))
        // rewrite referenced files in css
        .pipe(gulpIf('*.css', gulpRework(reworkPluginUrl(function (urlToRework) {
            var
                parsedUrl = url.parse(urlToRework),
                pathName = parsedUrl.pathname,
                hostName = parsedUrl.hostname,
                fileName = path.basename(pathName);

            // do not rewrite external urls
            if (hostName) {
                return urlToRework;
            }
            // rewrite font files to ../font/...
            else if (/(\.(otf|eot|ttf|woff|woff2))|(fonts\/.+\.svg)$/.test(pathName)) {
                return config.assetPrefixes.fonts + fileName;
            }
            // rewrite image files to ../img/...
            else if (/\.(png|svg|gif|jpg|jpeg|webp)$/.test(pathName)) {
                return config.assetPrefixes.imgs + fileName;
            }

            return urlToRework;
        }))))
        // remove logging
        .pipe(production ? gulpIf('*.js', gulpStripDebug()) : gulpUtil.noop())
        // minify js
        .pipe(production ? gulpIf('*.js', gulpUglify()) : gulpUtil.noop())
        // minify css
        .pipe(production ? gulpIf('*.css', gulpCleanCss()) : gulpUtil.noop())
        // minify html
        .pipe(production ? gulpIf('*.html',
                gulpHtmlmin({'collapseWhitespace': true, 'minifyCSS': true, 'minifyJS': true, 'removeComments': true})) : gulpUtil.noop()
        )
        // write compiled html
        .pipe(gulp.dest(config.dist));
});

/**
 * Copies the asset files to the assets target directory
 */
gulp.task('assets', function () {
    return gulp.src(config.assetSources)
        .pipe(development ? gulpPlumber() : gulpUtil.noop())
        // write collected assets to the assets dir
        .pipe(gulp.dest(path.join(config.dist, config.assetsDir)));
});

gulp.task('store_dependency_versions', function (cb) {
// npm ls | grep -o "\S\+@\S\+$" | tr @ " " | awk -v q='\''"'\'' '\''{print q$1q": "q"^"$2q","}'\''
    exec('npm ls --depth=0 | grep -o "\\S\\+@\\S\\+$" | tr @ \' \' | awk -v q=\'"\' \'{print q$1q": "q""$2q}\' | sort -V > public/dependency_versions.txt', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    })
});

/**
 * Builds the license file for 3rd party node modules
 */
gulp.task('module-licenses', function (cb) {
    var
        // collect license files in an array
        licenseFiles = [];

    // run license crawler to find all licenses
    licenseChecker.init({
        production: true, // only use production environment, we do not need licencses of dev dependencies
        start: '.', // use current folder
        relativeLicensePath: '.'
    }, function (err, json) {
        if (err) {
            console.error(err);
            return;
        }

        // create a basic json that lists all licenses
        var licenseJson = [];

        // iterate over the returned license dictionary
        for (var key in json)
        {
            // key = name of dependency
            if (json.hasOwnProperty(key)) {
                /**
                 * Examples for key:
                 * - "@types/d3@1.2.3"
                 * - "angular@1.6.7"
                 *
                 * We need to strip the last "@" to hide the version number
                 */
                var lastIndex = key.lastIndexOf('@');

                var newKey = key;

                if (lastIndex >= 1) {
                    newKey = newKey.substr(0, lastIndex);
                }

                // init the json
                var oneLicenseJson = {
                    'key': newKey
                };

                if (json[key].licenses !== undefined) {
                    oneLicenseJson.licenses = json[key].licenses;
                } else {
                    oneLicenseJson.licenses = "license not listed in package.json";
                }

                // see if license file is set
                if (json[key].licenseFile !== undefined) {
                    licenseFiles.push(json[key].licenseFile);

                    var licenseFileName = json[key].licenseFile;
                    // strip node_modules/ from that filename
                    licenseFileName = licenseFileName.replace("node_modules/", "");

                    oneLicenseJson.licenseFile = path.join(config.moduleLicenseDir,  licenseFileName);
                } else {
                    // print that we did not find a license file
                    console.warn('dependency "' + key + '" does not have a license file.');
                    oneLicenseJson.licenseFile = null;
                }

                if (json[key].repository !== undefined) {
                    oneLicenseJson.repository = json[key].repository;
                }

                licenseJson.push(oneLicenseJson);
            }
        }

        // copy all license files from node_modules
        gulp.src(licenseFiles, {'base': 'node_modules'})
            .pipe(gulpPlumber())
            .pipe(gulpConvertNewline())
            .pipe(gulp.dest(path.join(config.dist, config.moduleLicenseDir)))
            .on('end', cb);

        // output licenseJson into a .json file
        string_src("osslicenses_frontend.json", JSON.stringify(licenseJson)).pipe(gulp.dest(config.dist));
    });
});

/**
 * Extracts all application message strings, builds a POT file and merges it with the PO files
 */
gulp.task('make-angular-template-cache', function () {
    return gulp.src(config.angularTemplateSources)
        .pipe(development ? gulpPlumber() : gulpUtil.noop())
        .pipe(production ? gulpHtmlmin({
            // see https://github.com/kangax/html-minifier#options-quick-reference
            'collapseWhitespace': true,
            'conservativeCollapse': true, // do not collapse white spaces to "nothing", but to a single space
            'minifyCSS': true, // minify css
            'minifyJS': true, // minify js
            'removeComments': true, // remove all comments
        }) : gulpUtil.noop())
        .pipe(gulpAngularTemplateCache({'module': config.angularTemplateModule}))
        .pipe(gulp.dest(path.join(temp)));
});

/**
 * Cleans temp files created during build
 */
gulp.task('clean-temp', function (cb) {
    fs.writeFileSync(path.join(temp, 'templates.js'), '/* Dummy template cache file */');
    cb();
});

/**
 * Cleans the dist folder
 */
gulp.task('clean-dist', function () {
    return gulp.src(path.join(config.dist, '*'), {'read': false})
        .pipe(gulpPlumber())
        .pipe(gulpClean({'force': true}));
});

/**
 * Builds the application for distribution
 */
gulp.task('build',
    gulp.series(
        'compile-messages',
        'styles', 'assets', 'make-angular-template-cache',
        'html',
        'store_dependency_versions', 'module-licenses',
        'cache-bust',
        'clean-temp', function (cb) {
            cb();
}));

/**
 * Watches for changes and builds the application for distribution
 */
gulp.task('watch', gulp.series('build', function () {
    return gulp.watch(['**/*', '!' + path.join(temp, '**')], gulp.series('build'));
}));

gulp.task('run-tests', gulp.series('build', function(done) {
    gulp.src(config.testSources, {'read': false})
        .pipe(gulpKarmaRunner.server({
            'frameworks': ['jasmine'],
            'plugins': ['karma-jasmine', 'karma-verbose-reporter', 'karma-chrome-launcher', 'karma-spec-reporter'],
            'reporters': ['verbose'],
            'browsers': ['ChromeHeadlessNoSandbox'],
            customLaunchers: {
                ChromeHeadlessNoSandbox: {
                    base: 'ChromeHeadless',
                    flags: ['--disable-web-security', '--no-sandbox']
                }
            },
            'singleRun': true,
            'showStack': true,
            'autoWatch': false
        }))
        .pipe(gulpExit());
    done();
}));
