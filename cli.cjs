const { program } = require("commander");
const child_process = require("child_process");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const WebpackDevServer = require("webpack-dev-server");
const currentPackage = require("./package.json");
/**
 * 
 * @param {string[]} cmd 
 */
async function run(cmd) {
    if (typeof cmd === "string") {
        cmd = cmd.split(" ");
    };
    return new Promise(resolve => {
        console.log(`Running: ${cmd.filter(Boolean).map(e => e.includes(" ") ? '"' + e + '"' : e).join(" ")}`);
        child_process.spawn("powershell", cmd.filter(Boolean), {
            stdio: "inherit"
        }).addListener("exit", e => resolve(e));
    });
};
async function buildWebpack(config) {
    return new Promise(resolve => {
        let compiler = webpack({ ...config, stats: "none" });
        compiler.run((err) => {
            if (err) {
                console.error(err);
            };
            setTimeout(() => {
                compiler = null;
                resolve();
            }, 100);
        });
    });
};
program.description("FS-Context project manager");
program.command("init")
    .description("init workspace, build webpack config files")
    .alias("setup")
    .action(() => {
        console.log("Building webpack config...");
        run(["tsc", "--project", "tsconfig.webpackConfig.json"]);
    });
const buildCommand = program.command("build")
    .description("about building production");
buildCommand.command("extension")
    .description("build extension as production environment")
    .alias("ext")
    .action(async () => {
        console.log("Building extension...");
        const extensionConfig = require("./config/webpack/generated/webpack/extension");
        await buildWebpack({
            ...extensionConfig.default,
            mode: "production"
        });
    });
buildCommand.command("waterbox")
    .description("build WaterBox UI as production environment")
    .alias("ui")
    .action(async () => {
        console.log("Building UI...");
        const waterboxConfig = require("./config/webpack/generated/webpack/waterbox");
        await buildWebpack({
            ...waterboxConfig.default,
            mode: "production"
        });
    });
buildCommand.command("lib")
    .description("build node module as production environment")
    .action(async () => {
        console.log("Building node_module...")
        await run("tsc -p tsconfig.node.json");
    });
buildCommand.command("standalone")
    .description("build standalone module as production environment")
    .alias("sm")
    .action(async () => {
        console.log("Building standalone module...")
        const standaloneConfig = require("./config/webpack/generated/webpack/standalone");
        await buildWebpack({
            ...standaloneConfig.default,
            mode: "production"
        });
    });
buildCommand.command("all")
    .description("build all modules as production environment")
    .action(async () => {
        await program.parseAsync([process.argv[0], process.argv[1], "build", "extension"]);
        await program.parseAsync([process.argv[0], process.argv[1], "build", "waterbox"]);
        await program.parseAsync([process.argv[0], process.argv[1], "build", "lib"]);
        await program.parseAsync([process.argv[0], process.argv[1], "build", "standalone"]);
    });
const devCommand = program.command("dev")
    .description("about dev server");
devCommand.command("extension")
    .description("start extension live server as development environment")
    .alias("ext")
    .action(() => {
        console.log("Running extension development server...");
        const commonConfig = require("./config/webpack/generated/webpack/common");
        const extensionConfig = require("./config/webpack/generated/webpack/extension");
        const compiler = webpack({
            ...extensionConfig.default,
            mode: "development"
        });
        new WebpackDevServer(merge(commonConfig.devServer, extensionConfig.devServer), compiler).start();
    });
devCommand.command("waterbox")
    .description("start WaterBox dev server as development environment")
    .alias("ui")
    .action(() => {
        console.log("Running UI development server...");
        const commonConfig = require("./config/webpack/generated/webpack/common");
        const waterboxConfig = require("./config/webpack/generated/webpack/waterbox");
        const compiler = webpack({
            ...waterboxConfig.default,
            mode: "development"
        });
        new WebpackDevServer(merge(commonConfig.devServer, waterboxConfig.devServer), compiler).start();
    });
program.command("update")
    .description("pull the latest version of the framework")
    .action(async () => {
        console.log("Checking version...");
        const latestPackage = await fetch("https://github.com/Rundll86/fs-context/blob/main/package.json").then(res => res.json());
        if (latestPackage.version === currentPackage.version) {
            console.log("Already up to date.");
            return;
        }
        console.log("Updating...");
        await run(["git", "pull"]);
        console.log("Installing...");
        await run(["yarn", "install"]);
        console.log("Done.");
    })
program.command("lint")
    .description("check code syntaxes and styles")
    .alias("eslint")
    .option("-f, --fix", null, false)
    .option("-t, --target <target>", null, "src")
    .action(
        /**
         * 
         * @param {{target:string,fix:boolean}} option 
         */
        option => {
            console.log("Linting...");
            run(["eslint", option.target, option.fix ? "--fix" : null]);
        }
    );
program.parse();