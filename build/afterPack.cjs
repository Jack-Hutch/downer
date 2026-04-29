// Post-pack hook: strip xattrs and apply a clean ad-hoc codesignature.
// This runs AFTER electron-builder's own signing step (which we've disabled
// via identity:null) and BEFORE the .dmg is built.
//
// Why ad-hoc sign?
//   On Apple Silicon, completely unsigned .app bundles trigger
//   "Downer is damaged and can't be opened" — the right-click → Open trick
//   doesn't always bypass it on macOS Sequoia 15+. An ad-hoc signature
//   (sign with identity "-") is enough for Gatekeeper to show the normal
//   "unidentified developer" dialog instead, which DOES allow right-click → Open.
const { execSync } = require('child_process');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  console.log(`  • [afterPack] cleaning xattrs on ${appPath}`);
  execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' });
  console.log(`  • [afterPack] applying ad-hoc codesignature`);
  execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
  console.log(`  • [afterPack] verifying signature`);
  execSync(`codesign --verify --verbose=2 "${appPath}"`, { stdio: 'inherit' });
};
