import webpack from "webpack";
import { Configuration } from "webpack-dev-server";
import WebpackBar from "webpackbar";
import { merge } from "webpack-merge";
import path from "path";
import common from "./common";
import serverConfig from "../server";
export default merge({
    entry: "@framework/entry.ts",
    output: {
        filename: `${serverConfig.extension.output}.dist.js`,
        path: path.resolve(`dist/${serverConfig.extension.output}`),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    plugins: [
        new WebpackBar({
            name: "Extension",
            color: "green"
        }),
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
    ],
}, common);
export const devServer: Configuration = {
    headers: {
        'Access-Control-Allow-Origin': '*'
    },
    port: serverConfig.extension.port,
    hot: false,
    liveReload: false,
    webSocketServer: false
};