/*
 * ewebpack.js
 *
 * A toolkit and utility belt for managing a electron+webpack plugin.
 *
 * Due to infrastructure involved with setting up an electron+webpack
 * project, this tool helps get started quick by providing commands to
 * build, start and distribute electron+webpack applications.
 *
 * commands:
 *
 * init
 * build
 * start
 * dist
 */
const yargs = require("yargs");
const fs = require("fs");
const path = require("path");
const util = require("util");
const _ = require("lodash");
const log = require("./logger");

var ewebpackConfig =
{
  "main": {
    "src": "src/main",
    "webpack-config": "webpack.config.js",
    "webpack-override": false
  },
  "renderer": {
    "src": "src/renderer",
    "webpack-config": "webpack.config.js",
    "webpack-override": false
  }
};

var webpackConfigMainTextFile = `// const path = require('path');

module.exports = {
  /*
   * This is just a webpack.config.js file see documentation here for
   * configuration of webpack.config.js
   *
   * Below is the default options applied
   * to the main electron webpack.config.js by ewebpack
   *
   * Add custom options to this file to mixin additional
   * settings. If you would like ewebpack to not apply any configurations to
   * webpack.config.js, add CLI option --override-webpack when running.
   *
   * e.g.,
   *
   * ewebpack build --webpack-override
   * ewebpack start --webpack-override
   *
   * You can modify the .ewebpack.json file for more fine-grained control
   * "main-webpack-override": true and "renderer-webpack-override": true;
   *
   * \`ewebpack build\` or \`ewebpack start\`
   *
   * ewebpack will read the configuration file and apply the defaults
   *
   * Below is the default settings ewebpack will apply unless told not to with
   * \`--webpack-override\` or .webpack.json configuration; use this file
   * as a base when overriding ewebpack.
   */
  // entry: "./main.js",
  // type: "electron-main",
  // output: {
  //   filename: "./bundle.js"
  // }
};
`;

var webpackConfigRendererTextFile = `//const path = require('path');

module.exports = {
  /*
   * This is just a webpack.config.js file see documentation here for
   * configuration of webpack.config.js
   *
   * Below is the default options applied
   * to the renderer electron webpack.config.js by ewebpack
   *
   * Add custom options to this file to mixin additional
   * settings. If you would like ewebpack to not apply any configurations to
   * webpack.config.js, add CLI option --override-webpack when running.
   *
   * e.g.,
   *
   * ewebpack build --webpack-override
   * ewebpack start --webpack-override
   *
   * You can modify the .ewebpack.json file for more fine-grained control
   * "main-webpack-override": true and "renderer-webpack-override": true;
   *
   * \`ewebpack build\` or \`ewebpack start\`
   *
   * ewebpack will read the configuration file and apply the defaults
   *
   * Below is the default settings ewebpack will apply unless told not to with
   * \`--webpack-override\` or .webpack.json configuration; use this file
   * as a base when overriding ewebpack.
   */
  // entry: "./main.js",
  // type: "electron-renderer",
  // output: {
  //   filename: "./bundle.js"
  // }
};
`;

var __before = function(argv)
{
  log.level = argv.verbose ? "debug" : "info";
  log.debug("Starting in verbose mode.");
};

/**
 * Default command
 * @return {[type]} [description]
 */
var defaultCommand = function(argv)
{
  log.warn("You didn't specify a command. Try --help");
};

/**
 * init command
 * @return {[type]} [description]
 */
var init = async function(argv)
{

  log.info(`Initialing Electron + Webpack project.`);
  log.debug(`Provided path: ${argv.path}`);
  log.debug(`Resolved path to ${path.resolve(argv.path)}`);

  var f = path.resolve(argv.path, "ewebpack.json");

  if (fs.existsSync(f))
  {
    log.warn(`ewebpack.json already exists: delete this file to start over.`);

    var data = JSON.parse(fs.readFileSync(f, "utf8"));
    log.debug("ewebpack.json data: ", data);
    ewebpackConfig = _.extend(ewebpackConfig, data);
  }
  else
  {
    log.debug(`ewebpack.json does not exist; writing file.`);
    fs.writeFileSync(f, JSON.stringify(ewebpackConfig, {}, 2));
    if (argv.verbose) console.log(`File written`);
  }

  log.debug("Loaded config: ");
  if (argv.verbose) console.log(ewebpackConfig);

  log.debug(`main.src=${ewebpackConfig.main.src}`);

  var paths = [ewebpackConfig.main.src, ewebpackConfig.renderer.src];
  for (p of paths)
  {
    log.info(`Creating directory ${p}`);
    fs.mkdirSync(path.resolve(argv.path, p), {recursive: true});
  }

  log.info(`Initializing webpack.config.js files`);
  var mainPath = path.resolve(argv.path, ewebpackConfig.main.src, ewebpackConfig.main["webpack-config"]);
  var rendererPath = path.resolve(argv.path, ewebpackConfig.renderer.src, ewebpackConfig.renderer["webpack-config"]);
  fs.writeFileSync(mainPath, webpackConfigMainTextFile);
  fs.writeFileSync(rendererPath, webpackConfigRendererTextFile);
};

/**
 * yargBuilder callback; helps setup command args in yargs
 *
 * @param  {[type]} y yargs
 * @return {[builder]}   builder
 */
var _yargInitBuilder = function(y)
{
    y.option("force", {
      alias: "f",
      default: false,
      description: `Override any existing files; initializing the new project
      at the structure specific. Dangerous will overrwrite exsiting data`
    });

    y.positional("path", {
      type: "string",
      default: ".",
      describe: "path or folder to initialize project."
    }).default("path", ".");
};

/*
 * SETUP YARGS CLI interface
 *
 * implement mappings.
 */
yargs

  /*
   * command takes the form
   * ewebpack <cmd> [arguments]
   *
   * e.g, ewebpack init .
   */
  .usage("$0 <cmd> [args]")

  /*
   * DEFINE COMMAND LIST
   * -------------------
   *
   * {default}
   * init, i, initialize [path]
   */
  /*
   * Default command run when no command is given.
   */
  .command("*", "Default command", {}, defaultCommand)

  /*
   * init [path] command
   * alias: i, initialize
   *
   * info:
   */
  .command(
  ["init [path]", "initialize", "i"],
    "Initializes an .ewebpack.json configuration file and electron+webpack project structure",
    _yargInitBuilder, init
  )

  /*
   * Add verbose loggining option
   */
  .option("verbose", {
    description: "Enable verbose logging. ewebpack will output extra log data to help debug issues."
  })

  .middleware([__before])

  .help()
  .argv;
