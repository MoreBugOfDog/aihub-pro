import type { InputLoader } from "@framework/internal";
export const vector2: InputLoader = {
    load(src) {
        const splited = src.split(" ");
        if (splited.length < 2) splited.push("");
        let x = Number(splited[0]);
        if (Number.isNaN(x)) { x = 0; };
        let y = Number(splited[1]);
        if (Number.isNaN(y)) { y = 0; };
        return { x, y };
    },
    format: /(.*?) (.*?)/
};
export const vector3: InputLoader = {
    load(src) {
        const splited = src.split(" ");
        if (splited.length < 3) splited.push("", "");
        let x = Number(splited[0]);
        if (Number.isNaN(x)) { x = 0; };
        let y = Number(splited[1]);
        if (Number.isNaN(y)) { y = 0; };
        let z = Number(splited[2]);
        if (Number.isNaN(z)) { z = 0; };
        return { x, y, z };
    },
    format: /(.*?) (.*?) (.*?)/
};
export const json: InputLoader = {
    load(src) {
        return JSON.parse(src);
    }
};
export const html: InputLoader = {
    load(src) {
        const parser = new DOMParser();
        return parser.parseFromString(src, "text/html");
    }
};
export const textArray: InputLoader = {
    load(src) {
        return src.split(/[, \n;|]/).filter(Boolean);
    }
};