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
const fs = require("fs");
const path = require("path");
const util = require("util");
const {spawnSync} = require("child_process");

const yargs = require("yargs");
const _ = require("lodash");
const which = require("which");

const log = require("./logger");

/*
 * WEBPACK CONFIGURATIONs
 */
const __CONFIG_FILE_NAME = "ewebpack.json";

/*
 *
 */
var __BASE_CONFIG =
{
  "main": {
    "path": "src/main",
    "webpack-file": "webpack.config.js",
  },
  "renderer": {
    "path": "src/renderer",
    "webpack-file": "webpack.config.js",
  }
};

/**
 * Helper utility for dumping objects
 *
 * @param  {[type]} obj       [description]
 * @param  {Number} [depth=1] [description]
 * @return {[type]}           [description]
 */
var __inspectObj = function(obj, depth = 1)
{return util.inspect(obj, {showHidden: false, depth}, {}, true);};

/**
 * [description]
 * @return {[type]} [description]
 */
var __getConfig = function(p)
{
  var file = path.resolve(p, __CONFIG_FILE_NAME);
  var raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "{}";

  try {
    log.debug(`Loaded ewebpack.json from ${p}`);
    return JSON.parse(raw);
  } catch (e)
  {
    log.debug(`${e.message};`);
    throw new Error(`Maliformed ${__CONFIG_FILE_NAME} @ ${p}. ${e.message}`);
  }
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

/**
 * [description]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
var __validateConfig = function(config)
{
  if (config.main.path == config.renderer.path && config.main["webpack-file"] == config.renderer["webpack-file"])
  {
    log.warn("Conflicting webpack-file names in ewebpack.json.");

    var msg = `When your 'src' folder for main and renderer are both '${config.main.path}' \n`
      .concat(`you cannot have the same 'webpack-file' value '${config.main["webpack-file"]}.\n`)
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


  var config;
  try {
    config = _.clone(__getConfig(argv.path));
  } catch (e) {log.error(e.message); return;}

  /*
   * If user only provides paths and config.renderer.path == config.main.paths
   * change the webpack.config names
   */
  if (config && config.main && config.renderer && !config.main["webpack-file"] && !config.renderer["webpack-file"] && config.main.path == config.renderer.path)
  {config.renderer["webpack-file"] = "webpack.renderer.js";}

  _.defaultsDeep(config, __BASE_CONFIG);
  log.info(__inspectObj(config));

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
  var paths = [config.main.path, config.renderer.path];
  for (let p of paths)
  {
    log.info(`Created directory ${p}`);
    fs.mkdirSync(path.resolve(argv.path, p), {recursive: true});
  }

  log.info(`Writing Electron main process: main.js @ ${config.main.path}`);
  var mainTemplate = path.resolve(__dirname, "templates", "electron-main.js");
  var mainOutputPath = path.resolve(argv.path, config.main.path, "main.js");
  if (!fs.existsSync(mainOutputPath) || argv.force)
  {
    fs.writeFileSync(mainOutputPath, fs.readFileSync(mainTemplate, "utf8"));
  }
  else
  {
    log.warn("main.js already exists ignoring overwrite; use --force=true to overwrite.");
  }

  var rendererFile = config.main.path == config.renderer.path ? "renderer.js" : "main.js";
  log.info(`Writing Electron renderer process: ${rendererFile} @ ${config.renderer.path}`);
  var rendererOutputPath = path.resolve(argv.path, config.renderer.path, rendererFile);
  if (!fs.existsSync(rendererOutputPath) || argv.force)
  {
    fs.writeFileSync(rendererOutputPath, "");
  }
  else
  {
    log.warn(`${rendererFile} already exists ignoring overwrite; use --force=true to overwrite.`);
  }

  var mainWebpackOutputPath = path.resolve(argv.path, config.main["webpack-file"].indexOf("/") == -1 ? config.main.path : ".", config.main["webpack-file"]);
  var rendererWebpackOutputPath = path.resolve(argv.path, config.renderer["webpack-file"].indexOf("/") == -1 ? config.renderer.path : ".", config.renderer["webpack-file"]);

  var mainWebpackTemplate = path.resolve(__dirname, "templates", "main-webpack.config.js");
  var rendererWebpackTemplate = path.resolve(__dirname, "templates", "renderer-webpack.config.js");

  log.info(`Writing webpack.config.js files @ ${config.main.path} ${config.renderer.path}`);

  if (!fs.existsSync(mainWebpackOutputPath) || argv.force)
  {fs.writeFileSync(mainWebpackOutputPath, fs.readFileSync(mainWebpackTemplate, "utf8"));}
  else
  {log.warn(`${config.main["webpack-file"]} already exists ignoring overwrite; use --force=true to overwrite.`);}

  if (!fs.existsSync(rendererWebpackOutputPath) || argv.force)
  {fs.writeFileSync(rendererWebpackOutputPath, fs.readFileSync(rendererWebpackTemplate, "utf8"));}
  else
  {log.warn(`${config.renderer["webpack-file"]} already exists ignoring overwrite; use --force=true to overwrite.`);}
};

/**
 * [description]
 * @param  {[type]} binary [description]
 * @return {[type]}        [description]
 */
var isBinaryInstalled = function(binary, p)
{
  var local = path.resolve(p, "node_modules", ".bin");
  log.debug(`Looking for ${binary} local path ${local}`);
  /*
   * GLOBALLY installed or locally?
   */
  return which.sync(binary, {nothrow: true, path: path.resolve(p, "node_modules", ".bin")}) ||
    which.sync(binary, {nothrow: true});
};

/**
 * Spawn a command inside of Promise. Output stdout to log.
 * When process closes, exit.
 *
 * @return {[type]} [description]
 */
var run = function(cmd, args, cwd)
{
  log.debug(`Run cmd: ${cmd} ${args.toString().replace(/,/g, " ")} @ cwd: ${cwd}`);
  const result = spawnSync(cmd, args, {cwd: path.resolve(cwd), stdio: "inherit"});
  if (result.status !== 0) {
    log.debug(`Error running ${cmd} ${args.toString().replace(/,/g, " ")} @ cwd=${path.resolve(cwd)}: exited with ${result.status}`);
  }
};

/**
 * [description]
 * @param  {[type]} p      [description]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
var __loadWebpackConfig = function(context, p, filename)
{
  var file = path.resolve(context, p, filename);
  try {
    var config = require(file);
    if (_.isObject(config)) return config;
  } catch (e) {log.warn(`Could not find ${filename} @ ${p}`);}
  return {};
};

/**
 *
 * Given a Webpack.config.js object; build the CLI args not to override
 * any user defined settings.
 *
 *  note: webpack-cli at minimium must use these arguments
 *    CLI args                                webpack key
 *    --entry="{entry}" ->                    entry
 *    --context="{dir}" ->                    context
 *    --target="electron-main" ->             target
 *    --mode="development" or "production" -> mode
 *    --output-filename={output} ->           output.filenmae
 *    --config="{webpack.config.js}" ->       [none]
 *
 * These settings may be override by webpack-file specified in ewebpack.json;
 * @param {string} p relative path to resolve all paths
 * @return {[type]} [description]
 */
var __buildWebpackCliArgs = function(p, config, webpack, env, target, output, configFile)
{
  var args = [];

  // add config file path; required arg
  args.push(`--config="${configFile}"`);

  // add entry file
  if (!_.has(webpack, "entry")) {
    args.push(`--entry="./main.js"`);
  }

  // add context
  var context = path.resolve(p, config.main.path);
  if (!_.has(webpack, "context")) {
    args.push(`--context=${context}`);
  }

  // set target environment
  if (!_.has(webpack, "target")) {
    args.push(`--target="${target}"`);
  }
  else
  {log.warn(`Webpack-file contains target ${webpack.target}; This should be 'electron-main'; Hope you know what you're doing!`);}

  // set env
  if(!_.has(webpack, "mode") && _.isString(env))
  {
    args.push(`--mode="${env}"`);
  }

  // output filename
  if (!_.has(webpack, "output.filename")) {
    args.push(`--output-filename="${output}"`);
  }

  return args;
};

/**
 * [description]
 * @return {[type]} [description]
 */
var build = function(argv)
{

  if (["main", "renderer", "all"].indexOf(argv.type) == -1) {
    argv.path = argv.type;
    argv.type = "all";
  }

  var config = {};

  /*
   * Load ewebpack.json; extend settings with user defined:
   *  Catch: When the file fails to load, stop the program.
   *  Override with --force=true to run with defaults
   */
  try {
    config = __getConfig(argv.path);
  } catch (e)
  {
    log.warn(`Use --force=true to override; reverts to default ewebpack.json configuation. See documentation.`);
    if (!argv.force) return;
  }

  /*
   * mixin default settings not overriding user configs
   */
  _.defaultsDeep(config, __BASE_CONFIG);
  log.debug(`${__CONFIG_FILE_NAME} loaded: ${__inspectObj(config)}`);

  /*
   * check if webpack-cli is installed;
   * install it if it does not existing
   */
  var webpack = isBinaryInstalled("webpack-cli", argv.path);
  if (!webpack) {
    log.warn("webpack-cli not found on environment path.");
    log.info("Installing webpack-cli:");
    run("npm", ["install", "webpack", "webpack-cli", "--save-dev"], argv.path);
  }

  /*
   * run main build
   */
  if (argv.type == "main" || argv.type == "all")
  {buildMain(argv, config);}

  console.log("\n");

  /*
   * run renderer build
   */
  if (argv.type == "renderer" || argv.type == "all")
  {buildRenderer(argv, config);}

};

/**
 * [description]
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
var buildMain = async function(argv, config)
{
  var webpackFile = path.resolve(argv.path, config.main.path, config.main["webpack-file"]);
  /*
   * IS WEBPACK-FILE FOUND?
   */
  if (!fs.existsSync(webpackFile) && !argv.force)
  {log.error(`Webpack file ${config.main["webpack-file"]} @ ${config.main.path} doesn't exist? Did you run 'epack init'. If you must, use --force=true as bypass. Use at own risk.?`); return;}

  var webpackConfig = __loadWebpackConfig(argv.path, config.main.path, config.main["webpack-file"]);
  log.debug(__inspectObj(webpackConfig));

  /*
   * check if webpack-cli is installed;
   * install it if it does not existing
   */

  /*
   * We installed webpack-cli? Check again!
   */
  var webpack = isBinaryInstalled("webpack-cli", argv.path);
  log.info(webpack);
  if (!webpack)
  {log.error("webpack-cli could not be found. Check path environment. Put webpack-cli on it."); return;}

  log.info(`Running webpack-cli for main process @ ${config.main.path}`);
  var args = __buildWebpackCliArgs(
    argv.path, config, webpackConfig, argv.environment,
    "electron-main", "main.js", webpackFile
  );
  run(webpack, args, argv.path);
};

/**
 * Build process for renderer
 *
 * @param  {[type]} argv [description]
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
var buildRenderer = function(argv, config)
{
  var webpackFile = path.resolve(argv.path, config.renderer.path, config.renderer["webpack-file"]);

  /*
   * IS WEBPACK-FILE FOUND?
   */
  if (!fs.existsSync(webpackFile) && !argv.force)
  {log.error(`Webpack file ${config.renderer["webpack-file"]} @ ${config.renderer.path} doesn't exist? Did you run 'epack init'. If you must, use --force=true as bypass. Use at own risk.?`); return;}

  var webpackConfig = __loadWebpackConfig(argv.path, config.renderer.path, config.renderer["webpack-file"]);
  log.debug(__inspectObj(webpackConfig));

  /*
   * We installed webpack-cli? Check again!
   */
  var webpack = isBinaryInstalled("webpack-cli", argv.path);
  if (!webpack)
  {log.error("webpack-cli could not be found. Check path environment. Put webpack-cli on it."); return;}

  log.info(`Running webpack-cli for renderer process @ ${config.renderer.path}`);
  var args = __buildWebpackCliArgs(
    argv.path, config, webpackConfig, argv.environment,
    "electron-renderer", "renderer.js", webpackFile
  );
  run(webpack, args, argv.path);
};

var distribute = function(argv)
{
  argv.all = true;
  argv.environment = "production";
  build(argv);
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
  return y.positional("type", {
    type: "string",
    default: "all",
    describe: "Build type: main or renderer"
  })
  .positional("path", {
    type: "string",
    default: ".",
    describe: "path or folder to initialize project."
  })
  .option("environment", {
    default: "development",
    description: "Set the runtime environment. Will be passed to Webpack and Electron when building or running."
  })
  .option("force", {
    default: false,
    description: "Force build process. Overwriting files as necessary."
  });
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
   * build [type] [path] command
   */
  .command("build [type] [path]", "Build to dist/; config webpack-file location @ ewebpack.json; default is src/main/webpack.config.js.", _yargBuildBuilder, (argv) => {build(argv);})
  .command("dist [path]", "Dist and build electron package.", (y) => {return y.option("force", {description: "Force build.", default: false});}, (argv) => {distribute(argv);})
  /*
   * Add verbose loggining option
   */
  .option("verbose", {
    description: "Enable verbose logging. ewebpack will output extra log data to help debug issues."
  })

  .middleware([__before])

  .help()
  .parse();
