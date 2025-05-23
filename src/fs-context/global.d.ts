import type { Component } from "vue";
import type { Extensions } from ".";
import type { ScratchWaterBoxed, Scratch, ExtensionPlain, BlockPlain } from "./internal";
import type { Collaborator } from "./structs";
declare module "*.vue" {
    const content: Component;
    export default content;
}
declare module "*.html" {
    const content: string;
    export default content;
}
declare module "*.md" {
    const content: string;
    export default content;
}
declare module "*.css" {
    const content: Record<never, never>;
    export default content;
}
declare module "*.svg" {
    const content: string;
    export default content;
}
declare global {
    interface ObjectConstructor {
        hasOwn<T, K extends string | number | symbol>(obj: T, key: K): obj is T & Record<K, any>;
    }
    interface Window {
        ScratchWaterBoxed?: ScratchWaterBoxed;
        Scratch?: Scratch;
        __VUE_OPTIONS_API__: boolean;
        __VUE_PROD_DEVTOOLS__: boolean;
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean;
        tempExt?: {
            Extension: new (runtime: Scratch) => ExtensionPlain,
            info: {
                extensionId: string,
                name: string,
                description: string,
                featured: boolean,
                disabled: boolean,
                collaboratorList: Collaborator[]
            }
        };
        ScratchBlocks?: BlockPlain[];
        FSContext?: typeof Extensions;
    }
}