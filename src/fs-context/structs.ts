import type {
    ArgumentDefine,
    BlockTypePlain,
    ColorDefine,
    MenuItem,
    TranslatorStoredData,
    LanguageSupported,
    LanguageStored,
    BlockConfigB,
    ExtractField,
    Scratch,
    VersionString,
    BlockConfigA,
    MenuDefine,
    InputLoader,
    ExtensionPlain,
    CopyAsGenericsOfArray,
    BlocklyType,
    ExtensionInfo,
    BlockPlain,
    DynamicArgConfigDefine,
    MenuReactMethodName,
    MenuPlain,
    MenuItemPlain,
    ReadbackFunction
} from "./internal";
import { ArgumentPart } from "./internal";
import { Color, MenuParser, OriginalState, Random, TextParser } from "./tools";
import { GeneratedFailed, InjectionError, MissingError, OnlyInstanceWarn } from "./exceptions";
import md5 from "md5";
import type { Block as BlocklyBlock } from "blockly";
export class Extension {
    id: string = "example-extension";
    displayName: string = "Example extension";
    version: Version = new Version("1.0.0");
    allowSandboxed: boolean = true;
    requires: Record<string, Version> = {};
    blocks: Block<any>[] = [];
    menus: Menu[] = [];
    description: string = "An example extension";
    collaborators: Collaborator[] = [];
    autoDeriveColors: boolean = true;
    colors: ColorDefine = {
        theme: "#FF0000"
    };
    disableBlockInjection: boolean = false;
    runtime?: Scratch;
    canvas?: HTMLCanvasElement;
    loaders: Record<string, InputLoader> = {};
    generated?: ExtensionPlain;
    get loadersWithDefault(): Record<string, InputLoader> {
        return {
            ...this.loaders,
            string: {
                load: String
            },
            number: {
                load: Number
            },
            bool: {
                load: Boolean
            }
        };
    }
    private static instance?: Extension;
    static get onlyInstance(): Extension {
        if (!this.instance) {
            this.instance = new this(true);
            this.instance.blocks.push(...this.blockDecorated);
            this.instance.menus.push(...this.menuDecorated);
        };
        return this.instance;
    };
    static blockDecorated: Block[] = [];
    static menuDecorated: Menu[] = [];
    static getTempInstance() {
        return new this(true);
    }
    calcColor() {
        if (this.autoDeriveColors) {
            if (this.colors.theme) {
                this.colors.block = Color.darken(this.colors.theme, 0);
                this.colors.inputer = Color.darken(this.colors.theme, 0.15);
                this.colors.menu = Color.darken(this.colors.theme, 0.3);
            } else {
                throw new MissingError(`FSExtension "${this.id}" can auto derive colors but have no theme color.`);
            };
        };
        return this.colors as Required<ColorDefine>;
    };
    callLoader(name: string[], src: string): any {
        const loader = this.loaders[name[0]];
        if (loader) {
            return loader.load(src);
        } else {
            throw new MissingError(`Loader "${name[0]}" is not found.`);
        };
    };
    callBlock(opcode: string, arg: Record<string, any>) {
        if (this.generated) {
            const block = this.generated.getInfo().blocks.filter(e => typeof e !== "string").find(i => i.opcode === opcode);
            if (block) {
                this.generated[block.opcode].call(this, arg);
            } else {
                throw new MissingError(`Block "${opcode}" is not found.`);
            };
        } else {
            throw new MissingError("Extension is not generated or constructed.");
        };
    };
    init(runtime?: Scratch): any {
        this.runtime = runtime;
    };
    constructor(ignoreError: boolean = false) {
        if (!ignoreError) {
            throw new OnlyInstanceWarn("Extension can not be instantiated directly.");
        };
    };
}
export class Block<O extends Extension = Extension> {
    method: (this: O, args: any, overloadIndex: number) => any = () => { };
    parts: ArgumentPart[] = [];
    overloads: ArgumentPart[][] = [];
    type: BlockTypePlain = "command";
    hidden: boolean = false;
    monitor: boolean = false;
    platform: BlockMode.TargetType[] = ["sprite", "stage"];
    restartable: boolean = false;
    edge: boolean = false;
    private _opcode: string = "";
    get opcode(): string {
        return this._opcode || `_${md5(this.text || this.overloadedText[0] || Date.now().toString())}`;
    }
    get text(): string {
        let result: string = "";
        for (const arg of this.parts) {
            if (arg.type === "text") {
                result += arg.content;
            } else if (!arg.dyConfig) {
                result += `[${arg.content}]`;
            }
        }
        return result;
    }
    get overloadedText(): string[] {
        const results: string[] = [];
        for (const overload of this.overloads) {
            let result: string = "";
            for (const arg of overload) {
                if (arg.type === "text") {
                    result += arg.content;
                } else if (!arg.dyConfig) {
                    result += `[${arg.content}:${arg.inputType}=${arg.value}]`;
                }
            }
            results.push(result);
        }
        return results;
    }
    get haveRestArg() {
        return !!this.parts.find(i => i.dyConfig);
    }
    get plainArguments() {
        return this.parts.filter(i => i.type === "input");
    }
    get textArguments() {
        return this.parts.filter(i => i.type === "text");
    }
    static create<O extends Extension, T extends BlockConfigB<ArgumentDefine[]>>(
        text: CopyAsGenericsOfArray<string>,
        config: T,
        method?: (
            this: O,
            args: T extends BlockConfigB<infer R> ? ExtractField<R> & Record<string, any> : never,
            overloadIndex: number
        ) => any
    ): Block<O> {
        const realConfig: BlockConfigB<ArgumentDefine[]> = { arguments: config.arguments || [], ...config };
        const argumentTypeOverrides = realConfig.arguments ?? [];
        const realMethod = method || (() => { }) as any;
        const result = new Block<O>({
            method: realMethod,
            type: realConfig.type,
            opcode: method?.name
        });
        if (Array.isArray(text)) {
            result.overloads = text.map(i => TextParser.parsePart(i));
        } else {
            result.parts = TextParser.parsePart(text).map(e => {
                const currentOverride = argumentTypeOverrides.find(i => i.name === e.content);
                if (e.type === "input" && currentOverride && currentOverride.inputType) {
                    e.inputType = currentOverride.inputType;
                };
                return e;
            });
        };
        return result;
    }
    constructor(config?: BlockConfigA<[]>) {
        if (config) {
            const data = config;
            if (data.method) {
                this.method = data.method;
            };
            if (data.type) {
                this.type = data.type;
            };
            if (data.opcode) {
                this._opcode = data.opcode;
            };
        };
    };
}
export class Collaborator {
    name?: string;
    url?: string;
    constructor(name?: string, url?: string) {
        this.name = name;
        this.url = url;
    }
}
export class Menu<O extends Extension = Extension> {
    acceptReporters: boolean = true;
    items: MenuItem[] = [];
    name: string = "unnamed";
    reactive: boolean = false;
    reactiveMethod: MenuReactMethodName = "__0";
    readback: ReadbackFunction<O> = (menu) => menu.generated;
    constructor(items?: MenuDefine, config?: Partial<Menu>) {
        this.set(items);
        Object.assign(this, config);
    }
    static from(items: MenuDefine, outputMode: MenuParser.OutputMode = MenuParser.OutputMode.PAIRS, config?: Partial<Menu>) {
        return new Menu([], config).set(items, outputMode);
    }
    set(items?: MenuDefine, outputMode: MenuParser.OutputMode = MenuParser.OutputMode.PAIRS) {
        if (!items) return this;
        this.items = MenuParser.normalize(items, outputMode);
        return this;
    }
    get generated(): MenuItemPlain[] {
        return this.items.map(item => {
            return {
                text: item.name,
                value: item.value
            };
        });
    }
}
export class Translator<L extends LanguageSupported, D extends LanguageStored> {
    private stored: TranslatorStoredData = {};
    language: LanguageSupported = (window.Scratch ?? window.ScratchWaterBoxed)?.translate.language || 'zh-cn';
    defaultLanguage: L = 'zh-cn' as L;
    store<T extends LanguageSupported>(lang: T, data: D & LanguageStored) {
        this.stored[lang] = data;
    }
    load(keyword: keyof D): string {
        const currentStore = this.stored[this.language] as D;
        if (currentStore) {
            return currentStore[keyword] || this.unTranslatedText(keyword);
        } else {
            return this.unTranslatedText(keyword);
        };
    }
    unTranslatedText(keyword: keyof D) {
        const currentStore = this.stored[this.defaultLanguage] as D;
        return currentStore[keyword];
    }
    static create<T extends LanguageSupported, D extends LanguageStored>(lang: T, store: D): Translator<T, D> {
        const result = new Translator<T, D>();
        result.defaultLanguage = lang;
        result.store(lang, store);
        return result;
    }
}
export class DataStorer<T = any> {
    private data: T;
    constructor(data: T) {
        this.data = data;
    }
    read<K extends keyof T>(key: K): T[K] {
        return this.data[key];
    }
    write<K extends keyof T>(key: K, value: T[K] extends (infer R)[] ? R : T[K]) {
        if (Array.isArray(this.data[key])) {
            this.data[key].push(value);
        }
        else this.data[key] = value as T[K];
    }
    clear<K extends keyof T>(key: K) {
        if (Array.isArray(this.data[key])) {
            this.data[key] = [] as T[K];
        }
        else delete this.data[key];
    }
}
export class Version {
    major: number = 1;
    minor: number = 0;
    patch: number = 0;
    constructor(version: VersionString)
    constructor(major: number, minor: number, patch: number)
    constructor(a: number | string = 1, b: number = 0, c: number = 0) {
        if (typeof a === "string") {
            const parts = a.split(".");
            this.major = parseInt(parts[0]);
            this.minor = parseInt(parts[1]);
            this.patch = parseInt(parts[2]);
        } else {
            this.major = a;
            this.minor = b;
            this.patch = c;
        }
    }
    toString(prefix: string = "v") {
        return `${prefix}${this.major}.${this.minor}.${this.patch}`;
    }
    static compare(a: Version, b: Version): Version {
        if (a.major > b.major) return a;
        if (a.major < b.major) return b;
        if (a.minor > b.minor) return a;
        if (a.minor < b.minor) return b;
        if (a.patch > b.patch) return a;
        if (a.patch < b.patch) return b;
        return a;
    }
};
export abstract class BlocklyInjector {
    private extension: ExtensionPlain;
    private runtime: Scratch;
    private blockly: BlocklyType;
    private get availableBlocks(): BlockPlain[] {
        return this.extension.getInfo().blocks?.filter(e => typeof e !== "string").filter(this.isAvailableBlock) ?? [];
    }
    public constructor(extension: ExtensionPlain) {
        if (!extension)
            throw new InjectionError("no extension given.");
        if (!extension.runtime)
            throw new InjectionError(`no runtime found in ${extension.getInfo().id}.`);
        this.runtime = extension.runtime;
        this.extension = extension;
        const blockly = OriginalState.getBlockly(this.runtime);
        if (!blockly)
            throw new InjectionError("failed to get blockly instance.");
        this.blockly = blockly;
    }
    public isAvailableBlock(blockInfo: BlockPlain): boolean {
        return !!blockInfo.opcode;
    }
    public configMap(originBlock: BlockPlain): BlockPlain {
        originBlock.text += "123456";
        return originBlock;
    }
    public getInfo(originInfo: ExtensionInfo) {
        return originInfo;
    }
    public inject(block: BlocklyBlock, myInfo: BlockPlain): void {
        Object.assign({}, block, { opcode: myInfo.opcode });
    }
    public init(block: BlocklyBlock, myInfo: BlockPlain): void {
        block.appendDummyInput("endText").appendField(`(Block injected: ${myInfo.opcode})`);
    }
    private findAvaliable(opcodeWithExtensionID: string): BlockPlain | null {
        return this.availableBlocks.find(
            block =>
                opcodeWithExtensionID === `${this.extension.getInfo().id}_${block.opcode}`
        ) ?? null;
    }
    private isDefinitionAvailable(opcodeWithExtensionID: string): boolean {
        return this.availableBlocks.length > 0 && this.availableBlocks.some(block => opcodeWithExtensionID === `${this.extension.getInfo().id}_${block.opcode}`);
    }
    public start() {
        if (!this.blockly) return;
        const originGetInfo = this.extension.getInfo.bind(this.extension);
        this.extension.getInfo = () => {
            const originInfo = originGetInfo();
            originInfo.blocks = originInfo.blocks?.filter(e => typeof e !== "string").map(
                block => this.isAvailableBlock(block) ? this.configMap(block) : block
            ) ?? [];
            return this.getInfo(originInfo) ?? originInfo;
        };
        this.blockly.Blocks = new Proxy(this.blockly.Blocks, {
            set: (target, opcode: string, definition: BlocklyBlock) => {
                const injected = definition;
                if (this.isDefinitionAvailable(opcode)) {
                    const originInit = injected.init;
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    const injector = this;
                    injected.init = function (this: BlocklyBlock) {
                        originInit?.call(this);
                        injector.init(this, injector.findAvaliable(opcode) as BlockPlain);
                        injector.inject(this, injector.findAvaliable(opcode) as BlockPlain);
                    };
                };
                return Reflect.set(target, opcode, injected);
            }
        });
    }
}
export namespace BlockMode {
    function matchBlock(target: Extension, key: string, descriptor: PropertyDescriptor) {
        const parent = OriginalState.getConstructor<typeof Extension>(target);
        const matches = parent.blockDecorated.filter(e => e.opcode === key);
        if (matches.length > 1) {
            throw new GeneratedFailed(`Cannot match ${key} in ${parent.onlyInstance.id}, repeated opcode.`);
        } else if (matches.length < 1) {
            throw new GeneratedFailed(`Cannot match ${key} in ${parent.onlyInstance.id}, block instance not found.`)
        } else {
            return matches[0];
        }
    }
    export type TargetType = "sprite" | "stage";
    export function Hidden(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        myself.hidden = true;
    }
    export function UseMonitor(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        if (!["reporter", "bool"].includes(myself.type))
            throw new GeneratedFailed(`Monitor can only be used in reporter block.`);
        myself.monitor = true;
    }
    export function Filt(...platform: TargetType[]) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const myself = matchBlock(target, propertyKey, descriptor);
            myself.platform = platform;
        };
    }
    export function ThreadRestartable(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        if (!["hat", "event"].includes(myself.type))
            throw new GeneratedFailed(`ThreadRestartable can only be used in hat or event block.`);
        myself.restartable = true;
    }
    export function ActiveEdge(target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
        const myself = matchBlock(target, propertyKey, descriptor);
        if (!["hat"].includes(myself.type))
            throw new GeneratedFailed(`ActiveEdge can only be used in hat block.`);
        myself.edge = true;
    }
    export function ToDynamic(argName: string, config?: DynamicArgConfigDefine) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const myself = matchBlock(target, propertyKey, descriptor);
            const arg = myself.plainArguments.find(i => i.content === argName);
            if (arg) {
                arg.dyConfig = config ?? {};
            } else {
                throw new GeneratedFailed(`Dynamic argument "${argName}" is not found in block "${myself.opcode}".`);
            };
        };
    }
    export function LabelBefore(text: string) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            const myselfIndex = parent.blockDecorated.indexOf(matchBlock(target, propertyKey, descriptor));
            parent.blockDecorated.splice(myselfIndex, 0, Block.create(text, { type: "label" }));
        };
    }
    export function LabelAfter(text: string) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            const myselfIndex = parent.blockDecorated.indexOf(matchBlock(target, propertyKey, descriptor));
            parent.blockDecorated.splice(myselfIndex + 1, 0, Block.create(text, { type: "label" }));
        };
    }
    export function Separator(position: "before" | "after") {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            const myselfIndex = parent.blockDecorated.indexOf(matchBlock(target, propertyKey, descriptor));
            parent.blockDecorated.splice(myselfIndex + (position === "before" ? 0 : 1), 0, Block.create("", { type: "separator" }));
        };
    }
}
export namespace BlockType {
    export function Plain(type: BlockTypePlain, text: string | string[]) {
        return function (target: Extension, propertyKey: string, descriptor: PropertyDescriptor) {
            const block = new Block({
                opcode: propertyKey,
                type,
                method: descriptor.value
            });
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            if (Array.isArray(text)) {
                block.overloads = text.map(e => TextParser.parsePart(e));
            } else block.parts = TextParser.parsePart(text);
            parent.blockDecorated.push(block);
        };
    }
    export function Command(text: string | string[]) {
        return Plain("command", text);
    }
    export function Reporter(text: string | string[]) {
        return Plain("reporter", text);
    }
    export function Boolean(text: string | string[]) {
        return Plain("Boolean", text);
    }
    export function Hat(text: string | string[]) {
        return Plain("hat", text);
    }
    export function Event(text: string | string[]) {
        return Plain("event", text);
    }
}
export namespace MenuMode {
    function matchMenu(target: Extension, key: string): Menu {
        const parent = OriginalState.getConstructor<typeof Extension>(target);
        const matches = parent.menuDecorated.filter(menu => menu.name === key);
        if (matches.length > 1) {
            throw new GeneratedFailed(`Cannot match menu "${key}" in ${parent.onlyInstance.id}, repeated menu name.`);
        } else if (matches.length < 1) {
            throw new GeneratedFailed(`Cannot match menu "${key}" in ${parent.onlyInstance.id}, menu instance not found.`);
        } else {
            return matches[0];
        }
    }
    function getMenuInstance<T extends Extension>(target: T, key: string): Menu<T> {
        const parent = OriginalState.getConstructor<typeof Extension>(target);
        const menu = parent.getTempInstance()[key as keyof Extension] as Menu<T>;
        return menu;
    }
    export function RefuseReporters<T extends Extension & { [P in K]: Menu }, K extends keyof T>(target: T, propertyKey: K & string) {
        matchMenu(target, propertyKey).acceptReporters = false;
    }
    export function Reactive(state: boolean) {
        return function <T extends Extension & { [P in K]: Menu }, K extends keyof T>(target: T, propertyKey: K & string) {
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            const rawMenu = getMenuInstance(target, propertyKey);
            rawMenu.name = propertyKey;
            rawMenu.reactive = state;
            rawMenu.reactiveMethod = `${target.id}_${propertyKey}_${Random.integer(Number.MIN_VALUE, Number.MAX_VALUE)}`;
            parent.menuDecorated.push(rawMenu as unknown as Menu<Extension>);
        }
    }
    export function Readback<T extends Extension>(executor: ReadbackFunction<T>) {
        return function <K extends keyof T>(target: T, propertyKey: K & string) {
            const parent = OriginalState.getConstructor<typeof Extension>(target);
            const rawMenu = getMenuInstance(target, propertyKey);
            if (!rawMenu.reactive)
                throw new GeneratedFailed(`Cannot set readback of menu "${propertyKey}" in ${parent.getTempInstance().id}, menu is not reactive.`);
            rawMenu.name = propertyKey;
            rawMenu.readback = executor;
        }
    }
}