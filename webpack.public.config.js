const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
module.exports = (publicPath, outputPath, manifestFile, targetBrowser) => {
  return new CopyWebpackPlugin({
    patterns: [
      {
        from: publicPath,
        to: outputPath,
        // avoid copying the HTML templates to not cause conflicts
        filter: file => !file.endsWith('.html')
      },
      {
        from: path.join(publicPath, manifestFile),
        to: path.join(outputPath, 'manifest.json'),
        toType: 'file',
        transform: content => {
          const manifest = transformManifestKeys(JSON.parse(content), targetBrowser);
          return JSON.stringify(manifest, null, 2);
        }
      }
    ]
  });
};

/**
 *  Fork of `wext-manifest`
 */
const browserVendors = ['chrome', 'firefox', 'opera', 'edge', 'safari'];
const vendorRegExp = new RegExp(`^__((?:(?:${browserVendors.join('|')})\\|?)+)__(.*)`);

const transformManifestKeys = (manifest, vendor) => {
  if (Array.isArray(manifest)) {
    return manifest.map(newManifest => {
      return transformManifestKeys(newManifest, vendor);
    });
  }

  if (typeof manifest === 'object') {
    return Object.entries(manifest).reduce((newManifest, [key, value]) => {
      const match = key.match(vendorRegExp);

      if (match) {
        const vendors = match[1].split('|');

        // Swap key with non prefixed name
        if (vendors.indexOf(vendor) > -1) {
          newManifest[match[2]] = value;
        }
      } else {
        newManifest[key] = transformManifestKeys(value, vendor);
      }

      return newManifest;
    }, {});
  }

  return manifest;
};
