import process from "process";
import path from "path";
import serverConfig from "../server";
import merge from 'webpack-merge';
import commonConfig from "./common";
import Webpackbar from "webpackbar";
import webpack from "webpack";
export default merge({
    entry: {
        dynamicArgs: "@framework/dynamicArg.ts",
        overloadedBlocks: "@framework/overloadedBlock.ts",
    },
    output: {
        filename: `${serverConfig.standalone.output}.[name].js`,
        path: path.resolve(`dist/${serverConfig.standalone.output}`),
        clean: true
    },
    resolve: {
        alias: {
            "@framework": path.resolve(process.cwd(), "src/fs-context"),
            "@src": path.resolve(process.cwd(), "src"),
            "@config": path.resolve(process.cwd(), "config"),
            "@samples": path.resolve(process.cwd(), "src/fs-context/samples"),
            "@componets": path.resolve(process.cwd(), "src/fs-context/ui/componets"),
        },
        extensions: [".ts", ".js"]
    },
    plugins: [
        new Webpackbar({
            name: "Standalone Package",
            color: "green"
        }),
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
    ]
}, commonConfig);