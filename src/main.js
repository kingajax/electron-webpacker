#!/usr/bin/env node

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
const webpack = require("webpack");
const log = require("./logger");

/*
 * WEBPACK CONFIGURATIONs
 */
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const __CONFIG_FILE_NAME = "ewebpack.json";

var __BASE_CONFIG =
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

var __WEBPACK_MAIN_CONFIG = {
  mode: "development",
  devtool: "source-map",
  context: ".",
  entry: "./main.js",
  target: "electron-main",
  node: {
    __dirname: false
  },
  output: {},
  plugins: [new CleanWebpackPlugin()]
};

var __inspectHelper = function(obj, depth = 1)
{return util.inspect(obj, {showHidden: false, depth}, {}, true);};

var isObject = function(a)
{return (!!a) && (a.constructor === Object);};

/**
 * [description]
 * @return {[type]} [description]
 */
var __getConfig = function(p)
{
  var data = {};

  var file = path.resolve(p, __CONFIG_FILE_NAME);
  var raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "{}";

  try {
    data = JSON.parse(raw);
  } catch (e)
  {
    log.error(`Maliformed ${__CONFIG_FILE_NAME} @ ${p}. ${e.message}`);
    return false;
  }

  var mix = _.extend(__BASE_CONFIG, data);
  log.debug(`Loaded ewebpack.json from ${p}`);
  log.debug(__inspectHelper(mix));

  return mix;
};

/**
 * [__before description]
 * @type {[type]}
 */
var __writeConfigFile = function(p)
{
  var f = path.resolve(p, __CONFIG_FILE_NAME);
  fs.writeFileSync(f, JSON.stringify(__BASE_CONFIG, {}, 2));
};

var __validateConfig = function(config)
{
  if (config.main.src == config.renderer.src && config.main["webpack-config"] == config.renderer["webpack-config"])
  {
    log.warn("Conflicting webpack-config names in ewebpack.json.");

    var msg = `When your 'src' folder for main and renderer are both '${config.main.src}' \n`
      .concat(`you cannot have the same 'webpack-config' value '${config.main["webpack-config"]}.\n`)
      .concat(`Use unique file names or change the 'src' location for main or renderer processes.`);

    throw new Error(msg);
  }
};

/**
 * runs before all commands
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
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

  log.debug(`Provided path: ${argv.path}`);
  log.debug(`Resolved path to ${path.resolve(argv.path)}`);

  var config = __getConfig(argv.path);
  try {
    __validateConfig(config);
  } catch (e) {log.error(e.message); return;}

  if (!config)
  {log.error("Cannot continue due to maliformed ewebpack.json. Any continue could overwrite or currupt project."); return;}

  var f = path.resolve(argv.path, __CONFIG_FILE_NAME);
  if (fs.existsSync(f))
  {
    log.warn(`ewebpack.json exists (using this configuration): delete this file to start over.`);
  }
  else
  {
    log.debug(`ewebpack.json does not exist; writing file.`);
    __writeConfigFile(argv.path);
    log.debug("Wrote file.");
  }

  log.debug("Loaded config: ", config);

  var paths = [config.main.src, config.renderer.src];
  for (let p of paths)
  {
    log.info(`Created directory ${p}`);
    fs.mkdirSync(path.resolve(argv.path, p), {recursive: true});
  }

  log.info(`Writing Electron main process: main.js @ ${config.main.src}`);
  var mainTemplate = path.resolve(__dirname, "templates", "electron-main.js");
  var mainOutputPath = path.resolve(argv.path, config.main.src, "main.js");
  if (!fs.existsSync(mainOutputPath) || argv.force)
  {
    fs.writeFileSync(mainOutputPath, fs.readFileSync(mainTemplate, "utf8"));
  }
  else
  {
    log.warn("main.js already exists ignoring overwrite; use --force to overwrite.");
  }

  log.info(`Writing Electron renderer process: renderer.js @ ${config.renderer.src}`);
  var rendererOutputPath = path.resolve(argv.path, config.renderer.src, "renderer.js");
  if (!fs.existsSync(rendererOutputPath) || argv.force)
  {
    fs.writeFileSync(rendererOutputPath, "");
  }
  else
  {
    log.warn("renderer.js already exists ignoring overwrite; use --force to overwrite.");
  }

  var mainWebpackOutputPath = path.resolve(argv.path, config.main["webpack-config"].indexOf("/") == -1 ? config.main.src : ".", config.main["webpack-config"]);
  var rendererWebpackOutputPath = path.resolve(argv.path, config.renderer["webpack-config"].indexOf("/") == -1 ? config.renderer.src : ".", config.renderer["webpack-config"]);

  var mainWebpackTemplate = path.resolve(__dirname, "templates", "main-webpack.config.js");
  var rendererWebpackTemplate = path.resolve(__dirname, "templates", "renderer-webpack.config.js");

  log.info(`Writing webpack.config.js files @ ${config.main.src} ${config.renderer.src}`);

  if (!fs.existsSync(mainWebpackOutputPath) || argv.force)
  {fs.writeFileSync(mainWebpackOutputPath, fs.readFileSync(mainWebpackTemplate, "utf8"));}
  else
  {log.warn(`${config.main["webpack-config"]} already exists ignoring overwrite; use --force to overwrite.`);}

  if (!fs.existsSync(rendererWebpackOutputPath) || argv.force)
  {fs.writeFileSync(rendererWebpackOutputPath, fs.readFileSync(rendererWebpackTemplate, "utf8"));}
  else
  {log.warn(`${config.renderer["webpack-config"]} already exists ignoring overwrite; use --force to overwrite.`);}
};

/**
 * Run webpack using default + provided config files
 *
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
var build = async function(argv, type)
{
  var config = __getConfig(argv.path);
  if (!config && !argv.force) {log.warn("Use --force to bypass ewebpack.json check and use defaults."); return;}
  if (!config && argv.force) {config = __BASE_CONFIG;}
  if (["main", "all"].indexOf(type) > -1) buildMain(argv, config);
  if (["renderer", "all"].indexOf(type) > -1) buildRenderer(argv, config);
};


var buildMain = async function(argv, config)
{
  log.info(`Build process started for main process @ ${argv.path}`);
  if (!fs.existsSync(path.resolve(argv.path, config.main.src)))
  {
    log.warn(`Did you run init?`);
    log.info(`${path.resolve(argv.path, config.main.src)} directory doesn't exist.`);
    log.error(`Webpack looks in ${path.resolve(argv.path, config.main.src)} for entry file. You can specify this file in ewebpack.json.`);
    return;
  }

  log.info(`Loading ${config.main["webpack-config"]} @ ${config.main.src}`);

  __WEBPACK_MAIN_CONFIG.mode = argv.environment;
  __WEBPACK_MAIN_CONFIG.context = path.resolve(argv.path, config.main.src);
  __WEBPACK_MAIN_CONFIG.output.path = path.resolve(argv.path, "dist");

  /*
   * load in custom webpack.config.js file specified in ewebpack.json
   */
  var custom = {context: __WEBPACK_MAIN_CONFIG.context, entry: __WEBPACK_MAIN_CONFIG.entry, target: "electron-main", output: {path: __WEBPACK_MAIN_CONFIG.output.path}};
  if (fs.existsSync(path.resolve(argv.path, config.main.src, config.main["webpack-config"])))
  {
    try {
      var load = require(path.resolve(argv.path, config.main.src, config.main["webpack-config"]));
      if (isObject(load))
      {custom = _.extend(custom, load);}
    } catch(e) {console.log(e);}
  }
  else
  {log.warn(`${config.main["webpack-config"]} @ ${config.main.src} does not exist.`);}

  if (argv["override-webpack"] || config.main["webpack-override"]) log.warn("Webpack override engaged loading minimal defaults:");
  var webpackConfig = argv["override-webpack"] || config.main["webpack-override"] ? custom : _.extend(__WEBPACK_MAIN_CONFIG, custom);
  log.info(util.inspect(webpackConfig, {showHidden: false, depth: 1}, {}, true));

  var pack = util.promisify(webpack);
  var result;
  try {
    result = await pack(webpackConfig);
  } catch (e) {log.error("Webpack build resulted in error:"); log.error(__inspectHelper(e));}

  if (result && result.hasErrors())
  {
    log.error(`Webpack build error ${result.compilation.compiler.options.entry} @ ${config.main.src}; to change the filename modify ${config.main["webpack-config"]}.`);
    log.error(__inspectHelper(result.compilation.errors));
  }
};

var buildRenderer = function(argv, type)
{
  log.warn("Not implemented.");
};

/**
 * yargBuilder callback; helps setup command args in yargs
 *
 * @param  {[type]} y yargs
 * @return {[builder]}   builder
 */
var _yargInitBuilder = function(y)
{
  return y.option("force", {
    alias: "f",
    default: false,
    description: `Override any existing files; initializing the new project
    at the structure specific. Dangerous will overrwrite exsiting data`
  })
  .positional("path", {
    type: "string",
    default: ".",
    describe: "path or folder to initialize project."
  })
  .default({path: "."});
};

/**
 * yargBuilder callback; helps setup command args in yargs
 *
 * @param  {[type]} y yargs
 * @return {[builder]}   builder
 */
var _yargBuildBuilder = function(y)
{
  return y.positional("path", {
    type: "string",
    default: ".",
    describe: "path or folder to initialize project."
  })
  .option("override-webpack", {
    default: false,
    description: `Don't apply any default configuration to webpack.config.js
     at build time; only use custom configuration specified in
     webpack.config.js files.`
  })
  .option("environment", {
    default: "development",
    description: "Set the runtime environment. Will be passed to Webpack and Electron when building or running."
  })
  .option("force", {
    default: false,
    description: "Force build process. Overwriting files as necessary."
  })
  .default("path", ".");
};

var buildMainNote = "Build to dist/ directory or output directory specified "
  .concat("inside webpack.config.js for Electron main process. Configure webpack.config.js location for ")
  .concat("main process in ewebpack.json. Note: Some base configurartions are applied ")
  .concat("to Webpack as necessary to run. If you want to keep this configuration to a minimal ")
  .concat(" use --override-webpack.");

var buildRendererNote = "";

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
   * build [type] [path] command
   */
  .command("build [path]", "Runs build process for Electron main and renderer process. See build:main, build:renderer below.", _yargBuildBuilder, (argv) => build(argv, "all"))
  .command("build:main [path]", buildMainNote, _yargBuildBuilder, (argv) => build(argv, "main"))
  .command("build:renderer [path]", buildRendererNote, _yargBuildBuilder, (argv) => build(argv, "renderer"))

  /*
   * Add verbose loggining option
   */
  .option("verbose", {
    description: "Enable verbose logging. ewebpack will output extra log data to help debug issues."
  })

  .middleware([__before])

  .help()
  .parse(process.argv);
