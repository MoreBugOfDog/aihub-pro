import type { Input } from "blockly";
import type Blockly from "blockly";
import type { Block, BlocklyInjector, BlockMode, Extension, Menu } from "./structs";
export class ArgumentPart {
    content: string;
    type: ArgumentPartType;
    value: AcceptedArgType = "";
    inputType: InputType = "string";
    dyConfig?: DynamicArgConfigDefine;
    inlineMenu?: string[];
    constructor(content: string, type: ArgumentPartType, value?: AcceptedArgType, inputType?: InputType, dyConfig?: DynamicArgConfigDefine, inlineMenu?: string[]) {
        this.content = content;
        this.type = type;
        if (value) this.value = value;
        if (inputType) this.inputType = inputType;
        this.dyConfig = dyConfig;
        this.inlineMenu = inlineMenu;
    }
}
export interface ArgumentDefine<T extends ValidArgumentName = ValidArgumentName> {
    name: T;
    value?: AcceptedArgType;
    inputType?: InputType;
    rest?: DynamicArgConfigDefine;
}
export type ValidArgumentName = `${"$" | "_"}${string}`;
export type MethodFunction<T> = (this: Extension, args: T) => any;
export type Scratch = {
    extensions: {
        register: (target: ExtensionPlain) => void;
        unsandboxed?: boolean;
    } & { [key: string]: any };
    translate: ScratchTranslateFunction;
    renderer: {
        get canvas(): HTMLCanvasElement;
    } & { [key: string]: any };
} & { [key: string]: any };
export interface ScratchWaterBoxed extends Scratch {
    currentExtensionPlain: Extension | null;
    currentExtension: ExtensionPlain | null;
    loadTempExt: () => void;
    currentCatchErrors: string[];
    languageStore: Record<string, LanguageStored>;
}
export type BlockTypePlain = "command" | "reporter" | "Boolean" | "hat" | "label" | "separator" | "event";
export type ExtractField<A extends (string | ArgumentDefine)[]> = {
    [K in keyof A as A[K] extends ArgumentDefine<infer R> ? R : never]: any;
}
export interface BlockConfigA<T extends (string | ArgumentDefine)[]> {
    method?: MethodFunction<ExtractField<T>>;
    type?: BlockTypePlain;
    opcode?: string;
}
export interface BlockConfigB<T extends ArgumentDefine[]> {
    arguments?: T;
    type?: BlockTypePlain;
}
export interface BlockConfiger<T extends (string | ArgumentDefine)[], O extends Extension> {
    config: (arg: BlockConfigA<T>) => Block<O>;
}
export type HexColorString = `#${string}`;
export interface ColorDefine {
    block?: HexColorString;
    inputer?: HexColorString;
    menu?: HexColorString;
    theme?: HexColorString;
}
export type AcceptedMenuValue = string | number | boolean | object;
export interface MenuItem {
    name: string;
    value: AcceptedMenuValue;
}
export type InputTypeCast = {
    string: string;
    number: number;
    bool: boolean;
    menu: Menu | string;
    angle: number;
    color: HexColorString;
    "hat-parameter": string;
}
export type TranslatorStoredData = {
    [K in LanguageSupported]?: LanguageStored;
}
export type LanguageSupported = "zh-cn" | "en";
// export type PlatformSupported = "GandiIDE" | "TurboWarp";
export type LanguageStored = { [key: string]: string; };
export type ArgumentPartType = "text" | "input";
export type InputType = typeof AcceptedInputType[number];
export const AcceptedInputType = ["string", "number", "bool", "menu", "angle", "color", "hat-parameter"] as const;
export const InputTypeCastConstructor: Record<string, any> = {
    string: String,
    number: Number,
    bool: Boolean,
    menu: String,
    angle: Number,
    color: String,
    "hat-parameter": String,
};
export interface ScratchTranslateFunction {
    language: LanguageSupported;
    setup: (data: Record<string, LanguageStored>) => void;
    (key: string): string | null;
}
export interface StyleSetFunc<E extends HTMLElement> {
    <K extends keyof FilterWritableKeys<CSSStyleDeclaration>>
        (key: K, value: CSSStyleDeclaration[K]): ElementContext<E>;
    <K extends keyof FilterWritableKeys<CSSStyleDeclaration>>
        (key: K): CSSStyleDeclaration[K];
};
export interface AttributeSetFunc<E extends HTMLElement> {
    <K extends keyof FilterWritableKeys<E>>
        (key: K, value: E[K]): ElementContext<E>;
    <K extends keyof FilterWritableKeys<E>>
        (key: K): E[K];
}
export interface DataSetFunc<E extends HTMLElement> {
    (key: string, value: any): ElementContext<E>;
    (key: string): any;
}
export interface ElementContext<T extends HTMLElement = any> {
    result: T;
    store: Record<string, any>;
    child: (target: ElementContext | HTMLElement) => ElementContext<T>;
    class: (...classes: string[]) => ElementContext<T>;
    attribute: AttributeSetFunc<T>;
    style: StyleSetFunc<T>;
    data: DataSetFunc<T>;
}
export type WritableKeys<T> = {
    [K in keyof T]: If<
        Equal<Pick<T, K>, Readonly<Pick<T, K>>>,
        never,
        K
    >;
}[keyof T];
export type FilterWritableKeys<T> = {
    [K in WritableKeys<T>]: T[K];
}
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
export type VersionString = `${number}.${number}.${number}`;
export type FilterKey<T, K> = {
    [P in keyof T as P extends K ? never : P]: never;
}
export type FilterOut<T, U> = T extends U ? never : T;
export type AcceptedArgType = InputTypeCast[FilterOut<InputType, "">];
export type ExtensionOrBlocklyInjector = typeof Extension | SubOfAbstractClassConstructor<typeof BlocklyInjector>
export interface LoaderConfig {
    target: CopyAsGenericsOfPromise<ExtensionOrBlocklyInjector> | CopyAsGenericsOfPromise<Record<"default", ExtensionOrBlocklyInjector>>;
    errorCatches: (new () => Error)[];
    platform: InternalSupportedPlatform[];
    mode: "debug" | "release";
}
export type InternalRegistersLibrary = Just<typeof import("@framework/built-ins/registers"), ExtensionRegister>;
export type InternalSupportedPlatform = keyof InternalRegistersLibrary;
export type KeyMirrored<T> = { [K in keyof T]: K };
export type SubOfAbstractClassConstructor<
    T extends abstract new (...args: any[]) => any
> =
    T extends abstract new (...args: infer R) => any ? new (...args: R) => InstanceType<T> : never;
export type KeyValueString<T extends string = "="> = `${string}${T}${string}`;
export type CopyAsGenericsOfArray<E> = E | E[];
export type CopyAsGenericsOfPromise<E> = E | Promise<E>;
export type MenuDefine = CopyAsGenericsOfArray<string | KeyValueString | MenuItem | StringArray>;
export type StringArray = KeyValueString<",">;
export type AnyArg = Record<string, any>;
export interface MenuItemPlain {
    text: string;
    value: any;
}
export type MenuReactMethodName = `${string}_${string}_${number}`;
export interface MenuPlain {
    acceptReporters: boolean;
    items: MenuItemPlain[] | MenuReactMethodName;
}
export interface ArgumentPlain {
    type?: InputType;
    defaultValue?: any;
    menu?: string;
}
export interface BlockPlain {
    opcode: string;
    arguments: Record<string, ArgumentPlain>;
    text: string;
    blockType: BlockTypePlain;
    dynamicArgsInfo?: DynamicArgConfigPlain;
    overloads?: string[];
    hideFromPalette?: boolean;
    disableMonitor: boolean;
    shouldRestartExistingThreads: boolean;
    filter: BlockMode.TargetType[];
    isEdgeActivated: boolean;
}
export type ExtensionPlain = {
    getInfo: (this: ExtensionPlain) => ExtensionInfo;
    runtime?: Scratch;
} & {
    [key: string]: any;
    [key: symbol]: any;
}
export interface ExtensionInfo {
    id: string;
    name: string;
    blocks: (BlockPlain | "---")[];
    menus: Record<string, MenuPlain>;
    color1: HexColorString;
    color2: HexColorString;
    color3: HexColorString;
}
export interface InputLoader {
    format?: RegExp;
    defaultValue?: any;
    load: (data: string) => any;
}
export enum InputTypeOptionsLabel {
    string = "ADD_TEXT_PARAMETER",
    number = "ADD_NUM_PARAMETER",
    bool = "ADD_BOOL_PARAMETER",
};
export type AcceptedInputType = keyof typeof InputTypeOptionsLabel;
export type BlocklyType = typeof Blockly & {
    ScratchMsgs: {
        locales: Record<string, Record<string, string>>;
        translate: (key: string) => string;
    };
    bindEventWithChecks_: <T extends keyof HTMLElementEventMap>(
        a: SVGElement | null,
        b: T,
        c: Blockly.FieldImage,
        d: (event: HTMLElementEventMap[T]) => any
    ) => void;
};
export type ConnectionMapper = Record<string, {
    shadow: Element | null;
    block: Blockly.Block | null;
}>;
export type SourceBlockTypeButScratch = Blockly.Block & {
    rendered: boolean;
    plusButton_: Blockly.FieldImage;
    minusButton_: Blockly.FieldImage;
    customContextMenu: (menu: any) => void;
    attachShadow_: (a: any, b: any, c: any, d?: any) => void;
    addDynamicArg: (id: AcceptedInputType) => void;
    removeDynamicArg: (id: string) => void
    disconnectDynamicArgBlocks_: () => ConnectionMapper;
    removeAllDynamicArgInputs_: () => void;
    createAllDynamicArgInputs_: (connection: ConnectionMapper) => void;
    deleteShadows_: (connection: ConnectionMapper) => void;
    render: (d?: boolean) => void;
    updateDisplay_: () => void;
    buildShadowDom_: (type: AcceptedInputType) => void;
    initSvg: () => void;
    dynamicArgOptionalTypes_: (AcceptedInputType)[];
    dynamicArgumentIds_: string[];
    dynamicArgInfo_: DynamicArgConfigPlain;
    dynamicArgumentTypes_: AcceptedInputType[];
    populateArgument_: (type: AcceptedInputType, connectionMap: any, id: string, input: Input, i: number) => void;
    workspace: Blockly.Workspace & {
        isDragging: () => boolean;
    };
    overloads_: string[];
    currentOverload_: string;
    setOverload: (overload: string) => void;
};
export type AllFunction = (...args: any[]) => any;
export interface DynamicArgConfigPlainAllRequired {
    defaultValues: CopyAsGenericsOfArray<string> | ((index: number, id?: string) => string);
    afterArg: string; //Ban in define
    joinCh: string | ((index: number) => string);
    dynamicArgTypes: AcceptedInputType[]; //Ban in define
    preText: string | ((count: number) => string);
    endText: string | ((count: number) => string);
    paramsIncrement: CopyAsGenericsOfArray<number>;
};
export type DynamicArgConfigPlain = {
    [K in keyof DynamicArgConfigPlainAllRequired]?: DynamicArgConfigPlainAllRequired[K];
};
export type DynamicArgConfigDefine = {
    [K in keyof DynamicArgConfigPlain as K extends "afterArg" | "dynamicArgTypes" ? never : K]:
    DynamicArgConfigPlain[K];
};
export interface ExtensionMetadataLoader {
    objectPlain: Extension;
    objectGenerated: ExtensionPlain;
    constructors: {
        plain: typeof Extension;
        generated: new (runtime?: Scratch) => ExtensionPlain;
    };
    to(...platforms: string[]): void;
    debugPrint(): void;
}
export interface ExtensionRegister {
    (metadata: ExtensionMetadataLoader, scratch: ScratchWaterBoxed): any;
}
export type Just<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
export type ReadbackFunction<T extends Extension> = (menu: Menu<T>, extension: T) => MenuItemPlain[];