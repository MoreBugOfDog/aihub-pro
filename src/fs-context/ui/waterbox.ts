import { createApp } from "vue";
import WaterBox from "./componets/WaterBox.vue";
import config from "@config/loader";
import type { LanguageSupported, LanguageStored } from "../internal";
window.__VUE_OPTIONS_API__ = true;
window.__VUE_PROD_DEVTOOLS__ = false;
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
window.ScratchWaterBoxed = {
    extensions: {
        register() { },
        unsandboxed: true
    },
    languageStore: {},
    translate: Object.assign((key: string) => {
        if (!window.ScratchWaterBoxed) return null;
        return window.ScratchWaterBoxed.languageStore[window.ScratchWaterBoxed.translate.language][key] ?? null;
    }, {
        language: "zh-cn" as LanguageSupported,
        setup(data: Record<string, LanguageStored>) {
            if (!window.ScratchWaterBoxed) return;
            Object.assign(window.ScratchWaterBoxed.languageStore, data);
        }
    }),
    currentExtensionPlain: null,
    currentExtension: null,
    loadTempExt() {
        if (window.tempExt && window.ScratchWaterBoxed) {
            const ext = new window.tempExt.Extension(window.ScratchWaterBoxed);
            window.ScratchWaterBoxed.currentExtension = ext;
            window.tempExt = undefined;
        }
    },
    renderer: {
        get canvas() {
            return document.getElementById("scratch-stage") as HTMLCanvasElement;
        }
    },
    currentCatchErrors: config.errorCatches.map(e => e.name)
};
createApp(WaterBox).mount("#ui");