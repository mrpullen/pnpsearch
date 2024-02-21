'use strict';

const gulp = require('gulp');
const path = require('path');
const webpack = require('webpack');
const build = require('@microsoft/sp-build-web');
const bundleAnalyzer = require('webpack-bundle-analyzer');
const log = require('fancy-log');
const fs = require('fs');
const colors = require('colors');


build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));

const findFilesByExt = (base, ext, files, result) => {
  files = files || fs.readdirSync(base)
  result = result || []

  files.forEach(
      function (file) {
          var newbase = path.join(base, file)
          if (fs.statSync(newbase).isDirectory()) {
              result = findFilesByExt(newbase, ext, fs.readdirSync(newbase), result)
          } else {
              if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
                  result.push(newbase)
              }
          }
      }
  );
  return result
}

const readJson = (path, cb) => {
  fs.readFile(require.resolve(path), (err, data) => {
      if (err)
          log.error(err)
      else
          cb(null, JSON.parse(data))
  });
}
gulp.task('update-version', async () => {

  // List all manifest files
 
  const semver = require('semver')
  const versionArgIdx = process.argv.indexOf('--value');
  const newVersionNumber = semver.valid(process.argv[versionArgIdx + 1]);

  if (versionArgIdx !== -1 && newVersionNumber) {

      // Update version in the package-solution
      const pkgSolutionFilePath = './config/package-solution.json';

      readJson(pkgSolutionFilePath, (err, pkgSolution) => {
          log.info('Old package-solution.json version:\t' + pkgSolution.solution.version);
          const pkgVersion = `${semver.major(newVersionNumber)}.${semver.minor(newVersionNumber)}.${semver.patch(newVersionNumber)}.0`;
          pkgSolution.solution.version = pkgVersion
          log.info('New package-solution.json version:\t' + pkgVersion);
          fs.writeFile(pkgSolutionFilePath, JSON.stringify(pkgSolution, null, 4), (error) => { });
      });

    
  } else {
      log.error(`The provided version ${process.argv[versionArgIdx + 1]} is not a valid SemVer version`);
  }
});

gulp.task('update-package-name', async () => {

  const pkgSolutionFilePath = './config/package-solution.json';

  const fileNameArg = process.argv.indexOf('--name');
  const fileName = process.argv[fileNameArg + 1];

  if (fileNameArg !== -1 && fileName) {
      readJson(pkgSolutionFilePath, (err, pkgSolution) => {
          const currentPackageName = path.basename(pkgSolution.paths.zippedPackage, '.sppkg');
          log.info(`Rename ${currentPackageName}.sppkg to ${fileName}.sppkg`);
          pkgSolution.paths.zippedPackage = pkgSolution.paths.zippedPackage.replace(path.basename(pkgSolution.paths.zippedPackage, '.sppkg'), fileName);
          fs.writeFile(pkgSolutionFilePath, JSON.stringify(pkgSolution, null, 4), (error) => { });
      });
  } else {
      log.error(`Error: wrong parameters`);
  }
});