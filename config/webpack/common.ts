import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import process from "process";
import path from "path";
const config: Configuration = {
    module: {
        rules: [
            {
                test: /\.d\.ts$/i,
                use: "null-loader"
            },
            {
                test: /\.ts$/i,
                use: {
                    loader: "ts-loader",
                    options: {
                        appendTsSuffixTo: [/\.vue$/],
                        transpileOnly: true
                    }
                },
                exclude: /\.d\.ts$/i,
            },
            {
                test: /\.(html|md)$/i,
                use: "raw-loader"
            },
            {
                test: /\.svg$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,
                            name: "[name].[hash:8].[ext]"
                        }
                    }
                ]
            }
        ]
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
    stats: "errors-warnings"
};
export default config;
export const devServer: DevServerConfiguration = {
    static: "./",
    client: {
        overlay: false,
        progress: false,
        logging: "none"
    },
    compress: true,
    hot: true,
    liveReload: true,
    setupExitSignals: false
};