import {
    AllFunction,
    BlocklyType,
    ElementContext,
    HexColorString,
    InputType,
    Scratch,
} from "./internal";
import { Extension } from "./structs";
import { ExtensionLoadError, MissingError, SyntaxError } from "./exceptions";
export namespace Random {
    export function integer(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    export function float(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
    export function string(length: number, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    export function color(): HexColorString {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    }
}
export namespace DOM {
    export function elementTree<T extends keyof HTMLElementTagNameMap>(
        tag: T,
        childs: ElementContext[] = []
    ): ElementContext<HTMLElementTagNameMap[T]> {
        const result = document.createElement(tag);
        childs.forEach(child => result.appendChild(child.result));
        return {
            result,
            store: {},
            child(target) {
                if (target instanceof HTMLElement) {
                    result.appendChild(target);
                } else {
                    result.appendChild(target.result);
                };
                return this;
            },
            class(...classes: string[]) {
                result.classList.add(...classes);
                return this;
            },
            attribute(key, value = undefined) {
                if (value === undefined) {
                    return result[key];
                }
                result[key] = value as any;
                return this;
            },
            style(key, value = undefined) {
                if (value === undefined) {
                    return result.style[key] as any;
                }
                result.style[key] = value as any;
                return this;
            },
            data(key, value = undefined) {
                if (value === undefined) {
                    return this.store[key];
                }
                this.store[key] = value;
                return this;
            }
        };
    }
    export function createStageOverlay<T extends keyof HTMLElementTagNameMap>(
        extension: Extension,
        tag: T = "div" as T
    ): HTMLElementTagNameMap[T] {
        if (extension.allowSandboxed) {
            throw new ExtensionLoadError("Cannot create stage overlay with a sandboxed extension.");
        };
        if (!extension.canvas || !extension.canvas.parentElement) {
            throw new MissingError("Cannot find renderer canvas");
        };
        return extension.canvas.parentElement.appendChild(
            DOM.elementTree(tag)
                .class("fsc-overlay")
                .attribute("id" as any, `ext-${extension.id}`)
                .result
        );
    }
}
export namespace LegacyParser {
    export function splitArgBoxPart(str: string, substrings: string[]) {
        const filteredSubstrings = [];
        for (let i = 0; i < str.length; i++) {
            for (const substring of substrings) {
                if (str.startsWith(substring, i)) {
                    filteredSubstrings.push(substring);
                    i += substring.length - 1;
                    break;
                }
            }
        }
        return filteredSubstrings;
    }
    export function splitTextPart(str: string, separators: string[]) {
        if (!separators.length) return [str];
        const regex = new RegExp(separators.map(s => s.replaceAll("$", "\\$")).join('|'), 'g');
        const result = str.split(regex);
        return result;
    }
}
export namespace Color {
    export function hexToRgb(str: HexColorString): [number, number, number] {
        let hexs: any[] = [];
        const reg = /^#?[0-9A-Fa-f]{6}$/;
        if (!reg.test(str)) throw new SyntaxError('Invalid hex color string');
        str = str.replace('#', '') as HexColorString;
        hexs = str.match(/../g) || [];
        if (hexs.length < 3) throw new SyntaxError('Invalid hex color string');
        return [parseInt(hexs[0], 16), parseInt(hexs[1], 16), parseInt(hexs[2], 16)];
    }
    export function darken(color: HexColorString, level: number): HexColorString {
        const rgb = hexToRgb(color);
        for (let i = 0; i < 3; i++) {
            rgb[i] = Math.floor(rgb[i] - (rgb[i] * level));
        }
        return `#${rgb.map((i) => i.toString(16).padStart(2, "0")).join('')}`;
    }
    export function lighten(color: HexColorString, level: number): HexColorString {
        const rgb = hexToRgb(color);
        for (let i = 0; i < 3; i++) {
            rgb[i] = Math.floor(rgb[i] + (255 - rgb[i]) * level);
        }
        return `#${rgb.map((i) => i.toString(16).padStart(2, "0")).join('')}`;
    }
}
export namespace Cast {
    export function castInputType(inputType: InputType) {
        const inputTypeCastToScratch: any = {
            bool: "Boolean",
            "hat-parameter": "ccw_hat_parameter"
        };
        return Object.hasOwn(inputTypeCastToScratch, inputType) ? inputTypeCastToScratch[inputType] : inputType;
    }
}
export namespace OriginalState {
    export function isAsyncFunction(func: (...args: any[]) => any) {
        return func.constructor.name === "AsyncFunction";
    }
    export function getConstructor<T>(object: object) {
        return object.constructor as T;
    }
    export function placehold<T>(data: T): T {
        return data;
    }
    export function hijack(fn: AllFunction) {
        const _orig = Function.prototype.apply;
        Function.prototype.apply = (thisArg) => thisArg;
        const result = fn();
        Function.prototype.apply = _orig;
        return result;
    }
    export function getBlockly(runtime: Scratch): BlocklyType | null {
        return (
            runtime.scratchBlocks ||
            window.ScratchBlocks ||
            hijack(getEventListener(runtime._events.EXTENSION_ADDED))?.ScratchBlocks
        );
    }
    export function getEventListener(e: AllFunction[]) {
        return e instanceof Array ? e[e.length - 1] : e;
    }
    export function isConstructorExtends<T extends new (...args: any[]) => any>(
        child: new (...args: any[]) => any,
        parent: T
    ): child is T {
        return child.prototype instanceof parent;
    }
    export function someIncludes(parent: string, sub: string): boolean {
        return parent.split("").some(char => sub.includes(char));
    }
    export function everyIncludes(parent: string, sub: string): boolean {
        return parent.split("").every(char => sub.includes(char));
    }
    export function unused<T>(data: T): T { return data; }
}
export namespace Binary {
    export async function uploadFile(accept: string = "*") {
        return new Promise<File>((resolve, reject) => {
            const input = DOM.elementTree("input").attribute("type", "file").attribute("accept", accept);
            input.result.addEventListener("change", () => {
                if (input.result.files) {
                    resolve(input.result.files[0]);
                } else {
                    reject(new Error("No file selected"));
                };
            });
            input.result.accept = accept;
            input.result.click();
        });
    }
    type AcceptType = {
        dataurl: string,
        arraybuffer: ArrayBuffer,
        text: string
    }
    export async function readFile<T extends "dataurl" | "arraybuffer" | "text">(file: File, target: T): Promise<AcceptType[T]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                if (reader.result) resolve(reader.result as AcceptType[T]);
                else reject(null);
            });
            reader.addEventListener("error", () => {
                reject(null);
            });
            if (target === "dataurl") {
                reader.readAsDataURL(file);
            } else if (target === "arraybuffer") {
                reader.readAsArrayBuffer(file);
            } else if (target === "text") {
                reader.readAsText(file);
            };
        });
    }
    export function base64ToBlob(base64: string, mimeType: string) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        };
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return blob;
    }
    export function createObjectURL(data: BlobPart, type?: BlobPropertyBag): string {
        return URL.createObjectURL(new Blob([data], type ?? { type: "application/text" }));
    }
}
export * from "./parser";