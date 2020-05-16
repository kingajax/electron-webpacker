#!/usr/bin/env node

/*
 * electron-webpacker
 * -------------------------------------------------
 *
 * A stupid simple solution for building Electron + Webpack applications.
 *
 * Provides quick mechanism to setup structure and configuration files
 * needed to run. `init` will initialize a project structure using default
 * settings. `build` will run `webpack-cli` passing in all args to build
 * including the specified webpack.config.js file. `run` will run tool
 * `webpack-dev-server` and `electron`. The server will start at
 * http://localhost:9000/renderer and run electron dist/main.js
 *
 * You can configure the application using ewebpack.js file.
 */
/*
 * main.js
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
const {spawn, spawnSync} = require("child_process");

// npm modules
const yargs = require("yargs");
const _ = require("lodash");
const which = require("which");

// local
const log = require("./logger");

/*
 * WEBPACK CONFIGURATIONs
 */
const __CONFIG_FILE_NAME = "epack.json";

/*
 * base configuration for epack.json file
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
 * Load the configuration file from the directory p
 *
 * @return {[type]} [description]
 */
var __getConfig = function(p)
{
  var file = path.resolve(p, __CONFIG_FILE_NAME);
  var raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "{}";

  try {
    log.debug(`Loaded epack.json from ${p}`);
    return JSON.parse(raw);
  } catch (e)
  {
    log.debug(`${e.message};`);
    throw new Error(`Maliformed ${__CONFIG_FILE_NAME} @ ${p}. ${e.message}`);
  }
};

/**
 * Write the configuration file to p
 *
 * @type {[type]}
 */
var __writeConfigFile = function(p)
{
  var f = path.resolve(p, __CONFIG_FILE_NAME);
  fs.writeFileSync(f, JSON.stringify(__BASE_CONFIG, {}, 2));
};

/**
 * validate the configuration file
 *
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
var __validateConfig = function(config)
{
  if (config.main.path == config.renderer.path && config.main["webpack-file"] == config.renderer["webpack-file"])
  {
    log.warn("Conflicting webpack-file names in epack.json.");

    var msg = `When your 'src' folder for main and renderer are both '${config.main.path}' \n`
      .concat(`you cannot have the same 'webpack-file' value '${config.main["webpack-file"]}.\n`)
      .concat(`Use unique file names or change the 'src' location for main or renderer processes.`);

    throw new Error(msg);
  }
};

/**
 * runs before all commands;
 * sets the logging to debug for verbose
 *
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
var __before = function(argv)
{
  log.level = argv.verbose ? "debug" : "info";
};

/**
 * Default command
 *
 * @return {[type]} [description]
 */
var defaultCommand = function(argv)
{
  log.warn("You didn't specify a command. Try --help");
};

/**
 * init command
 *
 * setups up an electron + webpack file structure
 *
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
  log.debug(__inspectObj(config));

  try {
    __validateConfig(config);
  } catch (e) {log.error(e.message); return;}

  if (!config)
  {log.error("Cannot continue due to maliformed epack.json. Any continue could overwrite or currupt project."); return;}

  var f = path.resolve(argv.path, __CONFIG_FILE_NAME);
  if (fs.existsSync(f))
  {
    log.warn(`epack.json exists (using this configuration): delete this file to start over.`);
  }
  else
  {
    log.debug(`epack.json does not exist; writing file.`);
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

  var rendererTemplate = path.resolve(__dirname, "templates", "renderer-main.js");
  var rendererFile = config.main.path == config.renderer.path ? "renderer.js" : "main.js";
  log.info(`Writing Electron renderer process: ${rendererFile} @ ${config.renderer.path}`);
  var rendererOutputPath = path.resolve(argv.path, config.renderer.path, rendererFile);
  if (!fs.existsSync(rendererOutputPath) || argv.force)
  {
    fs.writeFileSync(rendererOutputPath, fs.readFileSync(rendererTemplate, "utf8"));
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
 * check if a binary is installed on the system path
 *
 * @param  {[type]} binary [description]
 * @return {[type]}        [description]
 */
var isBinaryInstalled = function(binary, p)
{
  var npm = run("npm", ["bin"], path.resolve(p));
  var local = npm.status == 0 ? String(npm.stdout).trim() : false;
  log.debug(`Looking for ${binary} @ npm bin path ${local}`);

  /*
   * GLOBALLY installed or locally?
   */
  var resolved = which.sync(binary, {nothrow: true, path: local}) ||
    which.sync(binary, {nothrow: true});
  log.debug(`${binary} found at ${resolved}`);

  return resolved;
};

/**
 * Spawn a command inside of Promise. Output stdout to log.
 * When process closes, exit.
 *
 * @return {[type]} [description]
 */
var run = function(cmd, args, cwd, stdio = "pipe", env = {})
{
  var environment = Object.create(process.env);
  _.extend(environment, env);
  log.debug(__inspectObj(environment));

  log.debug(`Run cmd: ${cmd} ${args.toString().replace(/,/g, " ")} @ cwd: ${cwd}`);
  const result = spawnSync(cmd, args, {cwd: path.resolve(cwd), stdio, env: environment, shell: true});
  if (result.status !== 0) {
    log.debug(`Error running ${cmd} ${args.toString().replace(/,/g, " ")} @ cwd=${path.resolve(cwd)}: exited with ${result.status}`);
  }
  return result || {};
};

/**
 *  load in webpack.config.js configuration file
 *
 * @param  {[type]} p      [description]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
var __loadWebpackConfig = function(file)
{
  try {
    var config = require(file);
    if (_.isObject(config)) return config;
  } catch (e) {log.warn(`Could not find ${file} message: ${e.message}`);}
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
 * These settings may be override by webpack-file specified in epack.json;
 * @param {string} p relative path to resolve all paths
 * @return {[type]} [description]
 */
var __buildWebpackCliArgs = function(p, config, webpack, env, target, output, configFile, context)
{
  var args = [];

  // add config file path; required arg
  args.push(`--config="${configFile}"`);

  // add entry file
  if (!_.has(webpack, "entry")) {
    args.push(`--entry="./main.js"`);
  }

  // add context
  if (!_.has(webpack, "context")) {
    args.push(`--context=${context}`);
  }

  // set target environment
  if (!_.has(webpack, "target")) {
    args.push(`--target="${target}"`);
  }
  else
  {log.warn(`Webpack-file contains target ${webpack.target}; This should be 'electron-main' or 'electron-renderer'; Hope you know what you're doing!`);}

  // set env
  if(!_.has(webpack, "mode") && _.isString(env))
  {
    args.push(`--mode="${env}"`);
  }

  // output filename
  if (!_.has(webpack, "output.path")) {
    args.push(`--output-path="./dist"`);
  }

  // output filename
  if (!_.has(webpack, "output.filename")) {
    args.push(`--output-filename="${output}"`);
  }

  return args;
};

/**
 * Build webpack.config.js files specified in epack.json
 *
 * build for main and/or renderer processes
 *
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
   * Load epack.json; extend settings with user defined:
   *  Catch: When the file fails to load, stop the program.
   *  Override with --force=true to run with defaults
   */
  try {
    config = __getConfig(argv.path);
  } catch (e)
  {
    log.warn(`Use --force=true to override; reverts to default epack.json configuation. See documentation.`);
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
    run("npm", ["install", "webpack", "webpack-cli", "--save-dev"], argv.path, "inherit");
  }

  /*
   * run main build
   */
  if (argv.type == "main" || argv.type == "all")
  {buildMain(argv, config);}

  /*
   * run renderer build
   */
  if (argv.type == "renderer" || argv.type == "all")
  {buildRenderer(argv, config);}

};

/**
 * Build main webpack.config.js file only.
 *
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

  var webpackConfig = __loadWebpackConfig(webpackFile);
  log.debug(__inspectObj(webpackConfig));

  /*
   * check if webpack-cli is installed;
   * install it if it does not existing
   */

  /*
   * We installed webpack-cli? Check again!
   */
  var webpack = isBinaryInstalled("webpack-cli", argv.path);
  if (!webpack)
  { log.info(webpack); log.error("webpack-cli could not be found. Check path environment. Put webpack-cli on it."); return;}

  log.info(`Running webpack-cli for main process @ ${config.main.path}`);
  var args = __buildWebpackCliArgs(
    argv.path, config, webpackConfig, argv.environment, "electron-main",
    "main.js", webpackFile, path.resolve(argv.path, config.main.path)
  );
  run(webpack, args, argv.path, "inherit");
};

/**
 * Build webpack.confgi.js file for the renderer
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

  var webpackConfig = __loadWebpackConfig(webpackFile);
  log.debug(__inspectObj(webpackConfig));

  /*
   * We installed webpack-cli? Check again!
   */
  var webpack = isBinaryInstalled("webpack-cli", argv.path);
  if (!webpack)
  {log.error("webpack-cli could not be found. Check path environment. Put webpack-cli on it."); return;}

  log.info(`Running webpack-cli for renderer process @ ${config.renderer.path}`);
  var args = __buildWebpackCliArgs(
    argv.path, config, webpackConfig, argv.environment, "electron-renderer",
    "renderer.js", webpackFile, path.resolve(argv.path, config.renderer.path)
  );
  run(webpack, args, argv.path, "inherit");
};

/**
 * Distribute the package.
 *
 * Calls build for both main and renderer and main. Uses
 * `electron-builder` in webpack output.path location
 *
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
var distribute = function(argv)
{
  var config = {};

  /*
   * SET defaults for dist build
   */
  argv.type = "all";
  argv.environment = "production";
  build(argv);

  /*
   * check if webpack-cli is installed;
   * install it if it does not existing
   */
  var builder = isBinaryInstalled("electron-builder", argv.path);
  var electron = isBinaryInstalled("electron", argv.path);
  if (!builder || !electron) {
    log.warn("electron-builder not found on environment path.");
    log.info("Installing electron-builder:");
    run("npm", ["install", "electron-builder", "electron", "--save-dev"], argv.path, "inherit");
    builder = isBinaryInstalled("electron-builder", argv.path);
  }

  if (!builder)
  {log.error("electron-builder could not be found. Check path environment. Put electron-builder on it."); return;}

  /*
   * Load epack.json; extend settings with user defined:
   *  Catch: When the file fails to load, stop the program.
   *  Override with --force=true to run with defaults
   */
  try {
    config = __getConfig(argv.path);
  } catch (e)
  {
    log.warn(`Use --force=true to override; reverts to default epack.json configuation. See documentation.`);
    if (!argv.force) return;
  }

  /*
   * mixin default settings not overriding user configs
   */
  _.defaultsDeep(config, __BASE_CONFIG);
  log.debug(`${__CONFIG_FILE_NAME} loaded: ${__inspectObj(config)}`);

  var webpackFile = path.resolve(argv.path, config.main.path, config.main["webpack-file"]);
  var webpackConfig = __loadWebpackConfig(webpackFile);
  log.debug(__inspectObj(webpackConfig));

  /*
   * Run electron builder
   */
  var output = _.has(webpackConfig, "output.path") ? webpackConfig.output.path : "./dist";
  log.info(`Running electron-builder @ ${output}`);
  var dist = run(builder, [output], argv.path, "inherit");
  if (dist.status !== 0)
  {log.error(`electron-builder failed; see electron-builder documentation. Make sure your package.json file has everything it needs!`);}
};

/**
 * Run electron + webpack-dev-server
 *
 * Find the webpack.config.js for both main and renderer, build it,
 * run `webpack-dev-server` and then `electron`
 *
 * @return {[type]} [description]
 */
var runElectronWebpack = function(argv)
{
  // if we are running for production, we must build both main and renderer
  argv.type = argv.environment == "production" ? "all" : "main";

  // build webpack-cli
  build(argv);

  /*
   * We need to run Electron as a background job.
   */
  var server = isBinaryInstalled("webpack-dev-server", argv.path);
  if (!server) {
    log.warn("webpack-dev-server not found on environment path.");
    log.info("Installing webpack-dev-server:");
    run("npm", ["install", "webpack-dev-server", "--save-dev"], argv.path, "inherit");
    server = isBinaryInstalled("webpack-dev-server", argv.path);
  }

  /*
   * We need to run Electron as a background job.
   */
  var electron = isBinaryInstalled("electron", argv.path);
  if (!electron) {
    log.warn("electron not found on environment path.");
    log.info("Installing electron:");
    run("npm", ["install", "electron", "--save-dev"], argv.path, "inherit");
    electron = isBinaryInstalled("electron", argv.path);
  }

  /*
   * ENSURE DEPS INSTALLED?
   */
  // is webpack-dev-server installed?
  if (!server)
  {log.error("webpack-dev-server could not be found. Check path environment. Put webpack-dev-server on it."); return;}

  // is electron installed?
  if (!electron)
  {log.error("electron could not be found. Check path environment. Put electron on it."); return;}

  var config = {};

  /*
   * Load epack.json; extend settings with user defined:
   *  Catch: When the file fails to load, stop the program.
   *  Override with --force=true to run with defaults
   */
  try {
    config = __getConfig(argv.path);
  } catch (e)
  {
    log.warn(`Use --force=true to override; reverts to default epack.json configuation. See documentation.`);
    if (!argv.force) return;
  }

  /*
   * mixin default settings not overriding user configs
   */
  _.defaultsDeep(config, __BASE_CONFIG);
  log.debug(`${__CONFIG_FILE_NAME} loaded: ${__inspectObj(config)}`);

  /*
   * prepare environment variables for Electron and webpack-dev-server
   */
  var env = Object.create(process.env);
  env.NODE_ENV = argv.environment;

  /*
   * Don't run webpack-dev-server in production
   */
  var dev;
  if (argv.environment != "production")
  {
    var webpackRendererFile = path.resolve(argv.path, config.renderer.path, config.renderer["webpack-file"]);
    var webpackRendererConfig = __loadWebpackConfig(webpackRendererFile);
    log.debug(__inspectObj(webpackRendererConfig));
    env.WEBPACK_DEV_SERVER_PORT = argv.port;
    env.WEBPACK_DEV_SERVER_PATH = _.has(webpackRendererConfig, "output.filename") ? webpackRendererConfig.output.filename.slice(0, -3) : "renderer";

    var serverArgs = __buildWebpackCliArgs(
      argv.path, config, webpackRendererConfig, argv.environment, "electron-renderer",
      "renderer.js", webpackRendererFile, path.resolve(argv.path, config.renderer.path)
    );

    if (_.has(webpackRendererConfig, "devServer.port"))
    {
      argv.port = webpackRendererConfig.devServer.port;
    }
    serverArgs.unshift(`--port=${argv.port}`);

    var contentBase = _.has(webpackRendererConfig, "devServer.contentBase") ? webpackRendererConfig.devServer.contentBase : "./dist";
    serverArgs.push(`--content-base=${path.resolve(argv.path, contentBase)}`);

    /*
     * SPAWN webpack-dev-server & Electron
     */

    log.debug(serverArgs);
    log.info(`Running webpack-dev-server for renderer process @ ${config.renderer.path}`);
    log.info(`Using port ${argv.port}`);

    log.debug(__inspectObj(env));
    log.info(server);

    dev = spawn(server, serverArgs, {
      stdio: "inherit",
      windowsHide: true
    });
  }

  var webpackMainFile = path.resolve(argv.path, config.main.path, config.main["webpack-file"]);
  var webpackMainConfig = __loadWebpackConfig(webpackMainFile);
  log.debug(__inspectObj(webpackMainConfig));

  var output = _.has(webpackMainConfig, "output.path") ? webpackMainConfig.output.path : "./dist";
  var main = _.has(webpackMainConfig, "output.filename") ? webpackMainConfig.output.filename : "./main.js";
  log.debug(`Electron main file is ${main}`);
  log.info(`Running electron for main process @ ${config.renderer.path}`);
  var elect = spawn(electron, [path.resolve(argv.path, output, main)], {
    cwd: path.resolve(argv.path),
    stdio: "inherit",
    windowsHide: true,
    env
  });

  /*
   * Handle closing of both webpack-dev-server + electron
   */
  if (dev) {
    dev.on("close", (c) => {log.warn(`webpack-dev-server quit with status ${c}`); elect.kill("SIGTERM");});
  }
  elect.on("close", (c) => {
    log.warn(`electron quit with status ${c}`); if (dev) {dev.kill("SIGTERM");}
  });
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

/**
 * ARG builder for distribute
 *
 * @return {[type]} [description]
 */
var _yargDistBuilder = function(y) {
  return y.option("force", {
    description: "Force build.",
    default: false
  })
  .option("path", {
    description: "Path",
    default: "."}
  );
};

/**
 * ARG build for run
 *
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
var _yargRunBuilder = function(y)
{
  return y.option("port", {
    description: "Webpack dev server port.",
    default: 9000
  })
  .option("force", {
    description: "Force build.",
    default: false
  })
  .option("environment", {
    description: "Environment passed to Electron",
    default: "development"
  })
  .option("path", {
    description: "Path",
    default: "."}
  );
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
    "Initializes an .epack.json configuration file and electron+webpack project structure",
    _yargInitBuilder, init
  )

  /*
   * build [type] [path] command
   */
  .command("build [type] [path]", "Build to dist/; config webpack-file location @ epack.json; default is src/main/webpack.config.js.", _yargBuildBuilder, (argv) => {build(argv);})

  /*
   *
   */
  .command(["dist [path]", "distribute"], "Dist and build electron package.", _yargDistBuilder, (argv) => {distribute(argv);})

  /*
   *
   */
  .command(["run [path]", "r", "start"], "Run Electron Webpack application.", _yargRunBuilder, (argv) => {runElectronWebpack(argv);})
  /*
   * Add verbose loggining option
   */
  .option("verbose", {
    description: "Enable verbose logging. ewebpack will output extra log data to help debug issues."
  })

  .middleware([__before])

  .help()
  .parse();
