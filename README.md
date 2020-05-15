# Electron-Webpacker (epack for short)

Electron-Webpacker, or `epack` for short, is a lightweight build tool for Electron + Webpack projects. A toolkit that helps you setup and run Electron + Webpack projects fast removing all the unecessary infastructure you'd do manually.

In a nutshell it does these three things

* Initializes the base files and folder structure for an Electron + Webpack project. (see init)
* Builds Webpack configuration files for both main and renderer processes.
* Runs Electron and webpack-dev-server

These are just highlights, it's a lot more complex under the hood. It uses the CLI to run `webpack-cli`
`webpack-dev-server` `electron` `electron-builder` `npm`. It will search the environment PATH for an available
version of these tools. If not found, it will use `npm install` to install dependencies necessary to build
a project.

Epack is simple stupid. It doesn't require you to add anything at all to your package.json and
gets out of the way to help you stay focused on what's important--your project. It runs many of
the commands you'd execute yourself such as `electron` and `webpack-dev-server` behind the scenes
speeding up your development process and saving you time. And it's configurable. (see ewebpack.json)

It's really just a build tool. At any time you can stop using Epack and still have a fully
working project.

# Getting started

Before using the `electron-webpacker` or the aliases `epacker` or `epack` (all do the same thing) commands you must install Epack.


## Install

Epack is on NPM. You can install it using the command below.

````bash
npm install electron-webpacker -g
````

or locally in the current project
````bash
npm install electron-webpacker
````

# Documentation

Epack is very lightweight. It's entire purpose is helping speed up the build and run process of
Electron + Webpack applications. We all know getting the work done is the best part not getting
caught up in the process of setup and scripts.

Adding Webpack to your Electron app adds a task to your build process and complicates a bit. When starting
your Electron app you must make sure your code has been compiled by Webpack and is built and ready to
run.

Epack can help with that--saving you time.

It runs the commands for you loading in the Webpack config files in your project--just be
sure to tell it where those files reside. (see ewebpack.json).

Epack depends on many different CLI tools. `webpack-cli` `webpack-dev-server` `electron` `electron-builder` and `npm`.

If it cannot find any of these tools on the path env it will try to install them--it will not try and install NPM
it expects it to be available in environment.

Remember Epack has various aliases such as `epacker` and `epack` and the full version `electron-webpacker`.
When this article refers to `epack` you can use any of the aliases. They all do the same thing.

## Folder structure

Epack adheres to the standard Electron/Webpack folder structure. It uses this structure as a default. You
can structure your project as you wish. Epack forces no structure. Just be sure to tell it where your Webpack
configuration files are using ewebpack.json configuration file (see below)

The standard project structure Epack configures using `epack init .` is:

````bash

  Project/
  |
  |— — src/
  |    |
  |    |— — main/
  |    |    |
  |    |    |— — main.js
  |    |    |— — webpack.config.js
  |    |
  |    |— — renderer/
  |         |
  |         |— — main.js
  |         |— — webpack.config.js
  |
  |— — dist/
  |    |
  |    |— — main.js
  |    |— — renderer.js
  |
  |— — ewebpack.json


````

Add Webpack config settings for the Electron main and renderer process in the webpack.config.js file.
Epack will see any settings you add here and pass it on to Webpack.

## Init

Every project starts somewhere. You can `git clone` a quick start or manually put the files into
the right spot. With Epack it's easy to get a base project started quick. Epack loads
a boiler plate setup into your project to help get you going fast and does the tedious part for you.

Run the command below in a project folder to initialize it as an Epack project.
`````bash
epack init
`````

or

````bash
epack init ../any-folder
````

By default, `epack init` will use the current folder '.' to initialize the project.


Example:

Running the command init:

````bash
epack init
````

Yields the output:

````bash
➜  project-folder epack init
info: Created directory src/main
info: Created directory src/renderer
info: Writing Electron main process: main.js @ src/main
info: Writing Electron renderer process: main.js @ src/renderer
info: Writing webpack.config.js files @ src/main src/renderer
````

## Build

The build command helps build your Webpack files for Electron's main and renderer process. It
will load in the webpack.config.js files (or the files specified in ewebpack.json, see ewebpack.json).
Then, it passes your Webpack config to `webpack-cli` building your source (starting at entry point)
into the configured 'dist' folder. e.g., dist/main.js and dist/renderer.js

`````bash
epack build
`````
or

````bash
epack build ../any-folder
````

For example, running in project-folder:

````bash
epack build
````

yeilds the output,

````bash
➜  project epack build
info: Running webpack-cli for main process @ src/main
Hash: ce38e7e68b11fce74a3e
Version: webpack 4.43.0
Time: 51ms
Built at: 05/14/2020 10:35:44 PM
  Asset      Size  Chunks             Chunk Names
main.js  6.15 KiB    null  [emitted]  null
Entrypoint null = main.js
[./main.js] 1.47 KiB {null} [built]
[electron] external "electron" 42 bytes {null} [built]
[path] external "path" 42 bytes {null} [built]
[url] external "url" 42 bytes {null} [built]
info: Running webpack-cli for renderer process @ src/renderer
Hash: d86739d4cd6704a98522
Version: webpack 4.43.0
Time: 42ms
Built at: 05/14/2020 10:35:44 PM
      Asset      Size  Chunks             Chunk Names
renderer.js  3.92 KiB    null  [emitted]  null
Entrypoint null = renderer.js
[./main.js] 73 bytes {null} [built]
````

## Run

The run command is a charm. This is the one you've been waiting for. The big shabooski. It uses `webpack-dev-server`
and `electron` CLI. It will run those CLI tools to pack up your Webpack main and renderer process. Then,
it runs `webpack-dev-server` to startup your Electron renderer process and runs `electron [src-folder]` to start
Electron. Put simply, it just starts your app and loads up the Electron window with your renderer process. It takes
advantage of hot module reload (HMR) to dynamic reload your renderer.js process while you work in real time.

````bash
epack run
````

or

````bash
epack run ../any-folder/
````
For example, running command

````bash
epack run
````

Yeilds the following output


````bash
➜  project epack run           
info: Running webpack-cli for main process @ src/main
Hash: ce38e7e68b11fce74a3e
Version: webpack 4.43.0
Time: 52ms
Built at: 05/14/2020 10:36:04 PM
  Asset      Size  Chunks             Chunk Names
main.js  6.15 KiB    null  [emitted]  null
Entrypoint null = main.js
[./main.js] 1.47 KiB {null} [built]
[electron] external "electron" 42 bytes {null} [built]
[path] external "path" 42 bytes {null} [built]
[url] external "url" 42 bytes {null} [built]
info: Running webpack-dev-server for renderer process @ src/renderer
info: Using port 9000
info: /Users/kingajax/Documents/apps/test/node_modules/.bin/webpack-dev-server
info: Running webpack-dev-server for renderer process @ src/renderer
(electron) The default value of app.allowRendererProcessReuse is deprecated, it is currently "false".  It will change to be "true" in Electron 9.  For more information please check https://github.com/electron/electron/issues/18397
Loading URL @ http://localhost:9000/renderer for environment=development
GVA encoder info: AMD performance mode : 2
ℹ ｢wds｣: Project is running at http://localhost:9000/
ℹ ｢wds｣: webpack output is served from /
ℹ ｢wds｣: Content not from webpack is served from /Users/kingajax/Documents/apps/test/dist
GVA encoder info: deleteSCDMetalContext : texture cache hits: 0, misses: 0
ℹ ｢wdm｣: Hash: e49d1e67069e3886259c
Version: webpack 4.43.0
Time: 265ms
Built at: 05/14/2020 10:36:06 PM
      Asset     Size  Chunks             Chunk Names
renderer.js  300 KiB    null  [emitted]  null
Entrypoint null = renderer.js
[0] multi (webpack)-dev-server/client?http://localhost:9000 ./main.js 40 bytes {null} [built]
[../../node_modules/ansi-html/index.js] /Users/kingajax/Documents/apps/test/node_modules/ansi-html/index.js 4.16 KiB {null} [built]
[../../node_modules/html-entities/lib/index.js] /Users/kingajax/Documents/apps/test/node_modules/html-entities/lib/index.js 449 bytes {null} [built]
[../../node_modules/loglevel/lib/loglevel.js] /Users/kingajax/Documents/apps/test/node_modules/loglevel/lib/loglevel.js 8.41 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/clients/SockJSClient.js] (webpack)-dev-server/client/clients/SockJSClient.js 4.06 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/index.js?http://localhost:9000] (webpack)-dev-server/client?http://localhost:9000 4.29 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/overlay.js] (webpack)-dev-server/client/overlay.js 3.51 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/socket.js] (webpack)-dev-server/client/socket.js 1.53 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/utils/createSocketUrl.js] (webpack)-dev-server/client/utils/createSocketUrl.js 2.91 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/utils/log.js] (webpack)-dev-server/client/utils/log.js 964 bytes {null} [built]
[../../node_modules/webpack-dev-server/client/utils/reloadApp.js] (webpack)-dev-server/client/utils/reloadApp.js 1.59 KiB {null} [built]
[../../node_modules/webpack-dev-server/client/utils/sendMessage.js] (webpack)-dev-server/client/utils/sendMessage.js 402 bytes {null} [built]
[../../node_modules/webpack-dev-server/node_modules/strip-ansi/index.js] (webpack)-dev-server/node_modules/strip-ansi/index.js 161 bytes {null} [built]
[../../node_modules/webpack/hot sync ^\.\/log$] (webpack)/hot sync nonrecursive ^\.\/log$ 170 bytes {null} [built]
[./main.js] 73 bytes {null} [built]
````

## Distribute

The dist command help you package up your application when you're ready to build for a targeted platform. It
uses `electron-builder` behind the scenes. Make sure you have a proper package.json file and follow the Documentation
required for Electron-builder.

It will use `webpack-cli` to load your Webpack configuration files and build them in production mode.

````bash
epack dist
````

or

````bash
epack dist ../any-folder
````

## MISC

Add `--verbose` to any command to add additional logging. Useful for tracking down issues with Epack before posting
an issue or asking for help.

````bash
epack init --verbose
````

You can run `--version` to get the version or `--help` if you're unsure about the commands to run.

## ewebpack.json (configuration)

Epack uses a configuration file to find what it needs to run, build, and distribute your project properly. If it
can't find it, it will use the defaults build into it and write the file for you. You can change the settings
in this file at anytime. If you use the standard Epack folder structure you don't need the ewebpack.json file
and can delete it.

````json
{
  "main": {
    "path": "src/main",
    "webpack-file": "webpack.config.js"
  },
  "renderer": {
    "path": "src/renderer",
    "webpack-file": "webpack.config.js"
  }
}
````

### main

`path` The path where your Webpack config file exists for the Electron main process.
The default value is src/main

`webpack-file` The name of the Webpack config file to load for the Electron main.
The default value is webpack.config.js

### renderer

`path` The path where your Webpack config file exists for the Electron main process.
The default value is src/renderer

`webpack-file` The name of the Webpack config file to load for the Electron main.
The default value is webpack.config.js

If Epack can't find these files, it can't do it's work proerly. At a bare minimal you
must configure these paths properly. It will try to use the defaults if no ewebpack.json file
exists in the current project.

# Support

If you have any problems with `epack` be sure to create an issue. Remember you can
run Epack is debug mode by adding `--verbose` to any command. This should provide more inforation
about what's going on.

Most Epack related issues deal with Epack not finding the dependencies it relies on
to do the work. This means the various CLI tools it runs. Make sure these are installed and
available on the path environment.

Happy Electron + Webpack dev.
