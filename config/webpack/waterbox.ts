import { Configuration } from "webpack-dev-server";
import WebpackBar from "webpackbar";
import { VueLoaderPlugin } from "vue-loader";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { merge } from "webpack-merge";
import path from "path";
import common from "./common";
import serverConfig from "../server";
export default merge({
    entry: "@framework/ui/waterbox.ts",
    output: {
        filename: `${serverConfig.waterBox.output}.dist.js`,
        path: path.resolve(`dist/${serverConfig.waterBox.output}`),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.vue$/i,
                use: "vue-loader"
            },
            {
                test: /\.css$/i,
                use: ["vue-style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".vue"]
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html",
        }),
        new WebpackBar({
            name: "WaterBox",
            color: "blue"
        })
    ]
}, common);
export const devServer: Configuration = {
    port: serverConfig.waterBox.port,
};