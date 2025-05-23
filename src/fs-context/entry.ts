import { Extensions } from ".";
import type { ExtensionPlain, ScratchWaterBoxed } from "@framework/internal";
import loaderConfig from "@config/loader";
import { Extension } from "./structs";
import { OriginalState } from "./tools";
try {
    window.FSContext = Extensions;
} catch {
    console.warn("Failed to inject FS-Context, some plugins will be invalid.");
}
declare let injectBlocks: (extension: ExtensionPlain) => void;
const currentScratch = Extensions.getScratch() as ScratchWaterBoxed;
if (currentScratch) {
    let loaded = await loaderConfig.target;
    let target = Object.hasOwn(loaded, "default") ? loaded.default : loaded;
    if (OriginalState.isConstructorExtends(target, Extension)) {
        const extensionLoaded = Extensions.load(target);
        if (loaderConfig.mode === "debug") {
            extensionLoaded.debugPrint();
            console.warn("You're running on a Debug environment, don't publish it on production! It could divulge Scratch Runtime.");
            console.warn("Check `mode` of @config/loader.ts to `release` to close this warning.");
            if (!OriginalState.everyIncludes(
                extensionLoaded.objectPlain.id,
                "abcdefghijklmnopqrstuvwxyz"
            )) {
                console.warn("In consideration of platform compatibility, you should make id only has a-z.");
            };
        };
        extensionLoaded.to(...loaderConfig.platform);
        if (Extensions.isInWaterBoxed()) {
            currentScratch.loadTempExt();
        };
    } else {
        try {
            injectBlocks = (extension) => {
                const injector = new target(extension);
                injector.start();
            };
            injectBlocks.bind(null);
            console.log("Exposed injector");
        } catch {
            console.warn("injector exposer isn't created, skipping.");
        };
    };
};
export const extension = window.ScratchWaterBoxed?.currentExtensionPlain;