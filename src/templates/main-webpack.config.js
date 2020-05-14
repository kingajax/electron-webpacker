// const path = require('path');

module.exports = {
  /*
   * This is just a webpack.config.js file see documentation for
   * configuration of Webpack.
   *
   * Below is the default options automatically applied when running
   *  `epack build`
   *
   * You can override any of the settings below. Settings defined below takes
   * preceedance. If these defaults aren't disired, simply change them.
   *
   */
  // entry: "./main.js",
  // context: path.resolve(__dirname),
  // target: "electron-main",
  // mode: "development",
  // output: {
  //   filename: "./main.js"
  // }
  node: {
    __dirname: false,
    __filename: false
  }
};
