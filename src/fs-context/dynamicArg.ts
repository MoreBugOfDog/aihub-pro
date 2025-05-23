/**
 * @description 使拓展积木支持动态参数，基于Blockly注入
 * 
 * @author Nights        - 原作者
 * @author FurryR        - 原作者
 * @author zxq           - 原作者
 * @author FallingShrimp - 优化&整合
 */
import rightArrow from "./icons/rightArrow.svg";
import leftArrow from "./icons/leftArrow.svg";
import minusButton from "./icons/minusButton.svg";
import plusButton from "./icons/plusButton.svg";
import defaultPlusSelectImage from "./icons/defaultPlusSelectImage.svg";
import { InputTypeOptionsLabel, AcceptedInputType } from "@framework/internal";
import type {
    Scratch,
    ExtensionPlain,
    AllFunction,
    BlocklyType,
    SourceBlockTypeButScratch,
    ConnectionMapper
} from "@framework/internal";
import type { Input } from "blockly";
const enabledDynamicArgBlocksInfo: Record<string | symbol, any> = {};
const extInfo: Record<string | symbol, any> = {};
let proxingBlocklyBlocks = false;
function hijack(fn: AllFunction) {
    const _orig = Function.prototype.apply;
    Function.prototype.apply = (thisArg) => thisArg;
    const result = fn();
    Function.prototype.apply = _orig;
    return result;
}
function getEventListener(e: AllFunction[]) {
    return e instanceof Array ? e[e.length - 1] : e;
}
function getScratchBlocks(runtime: Scratch) {
    return (
        runtime.scratchBlocks ||
        runtime.runtime.scratchBlocks ||
        window.ScratchBlocks ||
        hijack(getEventListener(runtime._events.EXTENSION_ADDED))?.ScratchBlocks
    );
}
function setLocales(Blockly: BlocklyType) {
    Object.assign(Blockly.ScratchMsgs.locales.en, {
        ADD_TEXT_PARAMETER: "Add Text Parameter",
        ADD_NUM_PARAMETER: "Add Num Parameter",
        ADD_BOOL_PARAMETER: "Add Boolean Parameter",
        DELETE_DYNAMIC_PARAMETER: "Delete Dynamic Parameter",
    });
    Object.assign(Blockly.ScratchMsgs.locales["zh-cn"], {
        ADD_TEXT_PARAMETER: "添加文本参数",
        ADD_NUM_PARAMETER: "添加数字参数",
        ADD_BOOL_PARAMETER: "添加布尔值参数",
        DELETE_DYNAMIC_PARAMETER: "删除动态参数",
    });
}
function translate(Blockly: BlocklyType, key: any) {
    return Blockly.ScratchMsgs.translate(key);
}
function createButtons(Blockly: BlocklyType, plusImage = rightArrow, minusImage = leftArrow) {
    let w = 25;
    let h = 47;
    let size = 0.35;
    if (plusImage === "+") {
        plusImage = plusButton;
        w = 18;
        h = 18;
        size = 0.7;
    }
    if (minusImage === "-") {
        minusImage = minusButton;
        w = 18;
        h = 18;
        size = 0.7;
    }
    class FieldButton extends Blockly.FieldImage {
        initialized: boolean;
        declare sourceBlock_: SourceBlockTypeButScratch;
        constructor(src: string, width = w * size, height = h * size) {
            super(src, width, height, undefined, undefined, false);
            this.initialized = false;
        }
        override init() {
            super.init();
            if (!this.initialized) {
                (this.getSvgRoot() as SVGElement).style.cursor = "pointer";
                Blockly.bindEventWithChecks_(this.getSvgRoot(), "mousedown", this, (e) => {
                    e.stopPropagation();
                });
                Blockly.bindEventWithChecks_(this.getSvgRoot(), "mouseup", this, this.handleClick.bind(this));
            }
            this.initialized = true;
        }
        handleClick(e: Event) {
            if (!this.sourceBlock_ || !this.sourceBlock_.workspace) return;
            if (this.sourceBlock_.workspace.isDragging()) return;
            if (this.sourceBlock_.isInFlyout) return;
            this.onClick(e);
        }
        onClick(e: Event): Event | void { return e; }
    }
    class PlusSelectButton extends FieldButton {
        constructor() {
            super(defaultPlusSelectImage, 54, 32);
        }
        override onClick(e: PointerEvent) {
            const menuOptions = this.sourceBlock_.dynamicArgOptionalTypes_.map(i => ({
                text: translate(Blockly, InputTypeOptionsLabel[i]),
                enabled: true,
                callback: () => {
                    this.sourceBlock_.addDynamicArg(i);
                },
            }));
            Blockly.ContextMenu.show(e, menuOptions, false);
        }
    }
    class PlusButton extends FieldButton {
        constructor() {
            super(plusImage);
        }
        override onClick() {
            this.sourceBlock_.addDynamicArg(this.sourceBlock_.dynamicArgOptionalTypes_[0]);
        }
    }
    class MinusButton extends FieldButton {
        constructor() {
            super(minusImage);
        }
        override onClick() {
            const { dynamicArgumentIds_ } = this.sourceBlock_;
            this.sourceBlock_.removeDynamicArg(dynamicArgumentIds_[dynamicArgumentIds_.length - 1]);
        }
    }
    return {
        PlusSelectButton,
        PlusButton,
        MinusButton,
    };
}
function proxyBlocklyBlocksObject(runtime: Scratch) {
    if (proxingBlocklyBlocks) return;
    proxingBlocklyBlocks = true;
    const Blockly = getScratchBlocks(runtime);
    if (!Blockly) return;
    setLocales(Blockly);
    Blockly.Blocks = new Proxy(Blockly.Blocks, {
        set(target, opcode, blockDefinition) {
            if (Object.prototype.hasOwnProperty.call(enabledDynamicArgBlocksInfo, opcode)) {
                initExpandableBlock.call(blockDefinition, runtime, blockDefinition, enabledDynamicArgBlocksInfo[opcode]);
            }
            return Reflect.set(target, opcode, blockDefinition);
        },
    });
}
function initExpandableBlock(this: SourceBlockTypeButScratch, runtime: Scratch, blockDefinition: SourceBlockTypeButScratch, dynamicArgInfo: any) {
    const { PlusSelectButton, PlusButton, MinusButton } = dynamicArgInfo.extInfo;
    const Blockly = getScratchBlocks(runtime);
    function getValue(value: any, i: any, defaultValue: any, valueWhenOutOfRange?: any) {
        if (value === undefined) return defaultValue;
        if (Array.isArray(value)) {
            if (i < value.length) return value[i];
            if (valueWhenOutOfRange !== undefined) return valueWhenOutOfRange;
            return value[value.length - 1];
        }
        return typeof value === "function" ? value(i) : value;
    }
    function getParamsIncPerClick(this: any, i: any) {
        return getValue(this.dynamicArgInfo_.paramsIncrement, i, 1, 0);
    }
    function getAddClickCount(this: any, num: number) {
        let sum = 0;
        let i = 0;
        while (sum < num) {
            const inc = getParamsIncPerClick.call(this, i);
            if (inc === 0) throw new Error(`Unreachable param num`);
            sum += inc;
            i++;
        }
        return i;
    }
    function getParamsGroupindexes(this: any, num: number) {
        let sum = 0;
        let i = 0;
        let inc = 0;
        while (sum < num) {
            inc = getParamsIncPerClick.call(this, i);
            if (inc === 0) throw new Error(`Unreachable param num`);
            sum += inc;
            i++;
        }
        sum -= inc;
        return Array.from({ length: inc }, (_, j) => sum + j + 1);
    }
    function getNextParamInc(this: any) {
        return getParamsIncPerClick.call(this, getAddClickCount.call(this, this.dynamicArgumentTypes_.length));
    }
    const moveButtonToTheRightPlace = function (this: SourceBlockTypeButScratch) {
        const showPlus = getNextParamInc.call(this) > 0;
        if (showPlus) {
            this.getInput("PLUS")?.setVisible(true);
            const { afterArg } = this.dynamicArgInfo_;
            if (afterArg) {
                this.moveInputBefore("PLUS", afterArg);
                this.moveInputBefore(afterArg, "PLUS");
            } else {
                this.moveInputBefore("PLUS", null);
            }
        } else {
            this.getInput("PLUS")?.setVisible(false);
        }
        if (this.getInput("ENDTEXT")) this.moveInputBefore("ENDTEXT", "PLUS");
        const cnt = this.dynamicArgumentTypes_.length;
        if (cnt === 0) {
            this.removeInput("MINUS");
        } else {
            if (!this.getInput("MINUS")) this.appendDummyInput("MINUS").appendField(new MinusButton());
            this.moveInputBefore("MINUS", "PLUS");
        }
    };
    const orgInit = blockDefinition.init ?? (() => { });
    blockDefinition.init = function () {
        orgInit.call(this);
        this.dynamicArgumentIds_ = [];
        this.dynamicArgumentTypes_ = [];
        this.dynamicArgInfo_ = dynamicArgInfo;
        this.dynamicArgOptionalTypes_ = dynamicArgInfo.dynamicArgTypes;
        this.plusButton_ = dynamicArgInfo.dynamicArgTypes.length > 1 ? new PlusSelectButton() : new PlusButton();
        this.minusButton_ = new MinusButton();
        const { afterArg, endText } = dynamicArgInfo;
        if (!this.getInput) return;
        updatePreText(this, 0);
        const endTxt = getValue(endText, 0, "");
        if (endTxt !== "") this.appendDummyInput("ENDTEXT").appendField(endTxt, "ENDTEXT");
        this.appendDummyInput("PLUS").appendField(this.plusButton_);
        if (afterArg) {
            const plusInput = this.getInput("PLUS") as Input;
            const endTxtInput = this.getInput("ENDTEXT") as Input;
            const afterArgInput = this.getInput(afterArg) as Input;
            const plusIndex = this.inputList.indexOf(plusInput);
            const endTxtIndex = this.inputList.indexOf(endTxtInput);
            const afterArgIndex = this.inputList.indexOf(afterArgInput);
            if (plusIndex > -1 && afterArgIndex > -1) {
                this.inputList.splice(plusIndex, 1);
                this.inputList.splice(afterArgIndex + 1, 0, plusInput);
                if (endTxtIndex > -1) {
                    this.inputList.splice(endTxtIndex, 1);
                    this.inputList.splice(afterArgIndex + 1, 0, endTxtInput);
                }
            }
        }
    };
    blockDefinition.customContextMenu = function (contextMenu) {
        this.dynamicArgOptionalTypes_.forEach((i: AcceptedInputType) =>
            contextMenu.push({
                text: translate(Blockly, InputTypeOptionsLabel[i]),
                enabled: true,
                callback: () => {
                    this.addDynamicArg(i);
                },
            })
        );
    };
    blockDefinition.attachShadow_ = function (input: any, argumentType: any, defaultValue = "") {
        if (argumentType === "number" || argumentType === "string") {
            const blockType = argumentType === "number" ? "math_number" : "text";
            Blockly.Events.disable();
            const newBlock = this.workspace.newBlock(blockType) as SourceBlockTypeButScratch;
            try {
                if (argumentType === "number") {
                    newBlock.setFieldValue(defaultValue, "NUM");
                } else {
                    newBlock.setFieldValue(defaultValue, "TEXT");
                }
                newBlock.setShadow(true);
                if (!this.isInsertionMarker()) {
                    newBlock.initSvg();
                    newBlock.render(false);
                }
            } finally {
                Blockly.Events.enable();
            }
            if (Blockly.Events.isEnabled()) {
                Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
            }
            newBlock.outputConnection?.connect(input.connection);
        }
    };
    blockDefinition.mutationToDom = function () {
        const container = document.createElement("mutation");
        container.setAttribute("dynamicargids", JSON.stringify(this.dynamicArgumentIds_));
        container.setAttribute("dynamicargtypes", JSON.stringify(this.dynamicArgumentTypes_));
        return container;
    };
    blockDefinition.domToMutation = function (xmlElement: Element) {
        this.dynamicArgumentIds_ = JSON.parse(xmlElement.getAttribute("dynamicargids") || "[]");
        this.dynamicArgumentTypes_ = JSON.parse(xmlElement.getAttribute("dynamicargtypes") || "[]");
        this.updateDisplay_();
    };
    blockDefinition.addDynamicArg = function (type: any) {
        const oldMutationDom = this.mutationToDom?.call(this);
        const oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);
        Blockly.Events.setGroup(true);
        let index = 0;
        const lastArgName = this.dynamicArgumentIds_.slice(-1)[0];
        if (lastArgName) {
            index = Number((lastArgName.match(/\d+/g) ?? [])[0]);
        }
        const cnt = getNextParamInc.call(this);
        for (let i = 0; i < cnt; i++) {
            this.dynamicArgumentIds_.push(`DYNAMIC_ARGS${index + i + 1}`);
            this.dynamicArgumentTypes_.push(type);
        }
        this.updateDisplay_();
        const newMutationDom = this.mutationToDom?.call(this);
        const newMutation = newMutationDom && Blockly.Xml.domToText(newMutationDom);
        if (oldMutation !== newMutation) {
            Blockly.Events.fire(new Blockly.Events.BlockChange(this, "mutation", null, oldMutation, newMutation));
        }
        Blockly.Events.setGroup(false);
    };
    blockDefinition.removeDynamicArg = function (id: string) {
        Blockly.Events.setGroup(true);
        const oldMutationDom = this.mutationToDom?.call(this);
        const oldMutation = oldMutationDom && Blockly.Xml.domToText(oldMutationDom);
        const matches = id.match(/^([^\d]+)(\d+)$/) || [];
        const name = matches[1];
        const i = Number(matches[2]);
        const paramsToRemove = getParamsGroupindexes.call(this, i);
        paramsToRemove.forEach((it) => {
            const curId = `${name}${it}`;
            const idx = this.dynamicArgumentIds_.indexOf(curId);
            this.dynamicArgumentIds_.splice(idx, 1);
            this.dynamicArgumentTypes_.splice(idx, 1);
            this.removeInput(curId);
        });
        this.updateDisplay_();
        const newMutationDom = this.mutationToDom?.call(this);
        const newMutation = newMutationDom && Blockly.Xml.domToText(newMutationDom);
        if (oldMutation !== newMutation) {
            Blockly.Events.fire(new Blockly.Events.BlockChange(this, "mutation", null, oldMutation, newMutation));
            setTimeout(() => {
                const target = runtime.getEditingTarget();
                const block = target.blocks._blocks[this.id];
                Object.keys(block.inputs).forEach((name) => {
                    if (/^DYNAMIC_ARGS\d+$/.test(name) && !this.dynamicArgumentIds_.includes(name)) {
                        target.blocks.deleteBlock(block.inputs[name].shadow, {
                            source: "default",
                            targetId: target.id,
                        });
                        delete block.inputs[name];
                        if (runtime.emitTargetBlocksChanged) {
                            runtime.emitTargetBlocksChanged(target.id, ["deleteInput", { id: block.id, inputName: name }]);
                        }
                    }
                });
            }, 0);
        }
        Blockly.Events.setGroup(false);
    };
    blockDefinition.updateDisplay_ = function () {
        const wasRendered = this.rendered;
        this.rendered = false;
        const connectionMap = this.disconnectDynamicArgBlocks_();
        this.removeAllDynamicArgInputs_();
        this.createAllDynamicArgInputs_(connectionMap);
        this.deleteShadows_(connectionMap);
        this.rendered = wasRendered;
        if (wasRendered && !this.isInsertionMarker()) {
            this.initSvg();
            this.render();
        }
    };
    blockDefinition.disconnectDynamicArgBlocks_ = function () {
        const connectionMap: ConnectionMapper = {};
        for (let i = 0; this.inputList[i]; i++) {
            const input = this.inputList[i];
            if (input.connection && /^DYNAMIC_ARGS\d+$/.test(input.name)) {
                const target = input.connection.targetBlock();
                const saveInfo = {
                    shadow: input.connection.getShadowDom(),
                    block: target,
                };
                connectionMap[input.name] = saveInfo;
                input.connection.setShadowDom(null);
                if (target) {
                    input.connection.disconnect();
                }
            }
        }
        return connectionMap;
    };
    blockDefinition.removeAllDynamicArgInputs_ = function () {
        const inputList = [];
        for (let i = 0; this.inputList[i]; i++) {
            const input = this.inputList[i];
            if (/^DYNAMIC_ARGS\d+$/.test(input.name)) {
                input.dispose();
            } else {
                inputList.push(input);
            }
        }
        this.inputList = inputList;
    };
    function updatePreText(block: any, num: number) {
        const { preText, afterArg } = block.dynamicArgInfo_;
        if (preText) {
            const txt = getValue(preText, num, "");
            const input = afterArg
                ? block.inputList.find((i: any) => i.name === afterArg)
                : block.inputList.findLast((it: any) => it.name !== "PLUS" && it.name !== "MINUS" && it.name !== "ENDTEXT");
            input.fieldRow.findLast((it: any) => it instanceof Blockly.FieldLabel)?.setText(txt);
        }
    }
    blockDefinition.createAllDynamicArgInputs_ = function (this: SourceBlockTypeButScratch, connectionMap: any) {
        const num = this.dynamicArgumentTypes_.length;
        const { endText, joinCh, afterArg } = this.dynamicArgInfo_;
        updatePreText(this, num);
        for (let i = 0; i < num; i++) {
            const argumentType = this.dynamicArgumentTypes_[i];
            if (!Object.keys(InputTypeOptionsLabel).includes(argumentType)) {
                throw new Error(`Found an dynamic argument with an invalid type: ${argumentType}`);
            }
            const id = this.dynamicArgumentIds_[i];
            const input = this.appendValueInput(id);
            if (joinCh && (i !== 0 || afterArg)) {
                input.appendField(getValue(joinCh, i, ""));
            }
            if (argumentType === "bool") {
                input.setCheck("Boolean");
            }
            this.populateArgument_(argumentType, connectionMap, id, input, i);
        }
        const txt = getValue(endText, num, "");
        if (txt === "") {
            this.removeInput("ENDTEXT", true);
        } else {
            const field = this.getField("ENDTEXT");
            if (field) field.setValue(txt);
            else this.appendDummyInput("ENDTEXT").appendField(txt, "ENDTEXT");
        }
        moveButtonToTheRightPlace.call(this);
        if (afterArg) {
            const cnt = this.dynamicArgumentTypes_.length;
            for (let i = cnt - 1; i >= 0; i--) {
                const id = this.dynamicArgumentIds_[i];
                this.moveInputBefore(id, afterArg);
                this.moveInputBefore(afterArg, id);
            }
        }
    };
    blockDefinition.populateArgument_ = function (type: any, connectionMap: any, id: string, input, i) {
        let oldBlock = null;
        let oldShadow = null;
        if (connectionMap && id in connectionMap) {
            const saveInfo = connectionMap[id];
            oldBlock = saveInfo.block;
            oldShadow = saveInfo.shadow;
        }
        const getDefaultValue = (id: string, i: number) => {
            const { defaultValues } = this.dynamicArgInfo_;
            if (typeof defaultValues === "function") return defaultValues(i, id);
            if (Array.isArray(defaultValues)) {
                const len = defaultValues.length;
                if (i < len - 1) return defaultValues[i];
                if (i === len - 1) return defaultValues[len - 1];
                return `${defaultValues[len - 1]}${i - len + 2}`;
            }
            return defaultValues;
        };
        if (connectionMap && oldBlock) {
            connectionMap[input.name] = null;
            oldBlock.outputConnection.connect(input.connection);
            if (type !== "bool") {
                const shadowDom = oldShadow || this.buildShadowDom_(type);
                input.connection?.setShadowDom(shadowDom);
            }
        } else {
            this.attachShadow_(input, type, getDefaultValue(id, i));
        }
    };
    blockDefinition.deleteShadows_ = Blockly.ScratchBlocks.ProcedureUtils.deleteShadows_;
    blockDefinition.buildShadowDom_ = Blockly.ScratchBlocks.ProcedureUtils.buildShadowDom_;
}
const patchSymbol = Symbol("patch");
export function initExpandableBlocks(extension: ExtensionPlain, plusImage = rightArrow, minusImage = leftArrow): void {
    const { runtime } = extension;
    if (!runtime) { throw new Error("Cannot get Scratch runtime"); };
    const Blockly = getScratchBlocks(runtime);
    const { PlusSelectButton, PlusButton, MinusButton } = createButtons(Blockly, plusImage, minusImage);
    proxyBlocklyBlocksObject(runtime);
    if (extension[patchSymbol]) return;
    extension[patchSymbol] = true;
    const origGetInfo = extension.getInfo;
    extension.getInfo = function () {
        const info = origGetInfo.call(this);
        const { id, blocks: blocksInfo } = info;
        extInfo[id] = { id, PlusSelectButton, PlusButton, MinusButton };
        blocksInfo.forEach((i: { opcode: string; dynamicArgsInfo?: any; } | string) => {
            if (typeof i === "string") return;
            const { dynamicArgsInfo } = i;
            if (dynamicArgsInfo) {
                dynamicArgsInfo.dynamicArgTypes = dynamicArgsInfo.dynamicArgTypes || ["string"];
                dynamicArgsInfo.extInfo = extInfo[id];
                enabledDynamicArgBlocksInfo[`${id}_${i.opcode}`] = dynamicArgsInfo;
            }
        });
        return info;
    };
}
export function getDynamicArgKeys(args: Record<string, any>): string[] {
    const argNameSuffix = "DYNAMIC_ARGS";
    return Object.keys(args)
        .filter((key) => key.startsWith(argNameSuffix))
        .map((key) => key.replace(argNameSuffix, ""))
        .map((key) => Number(key))
        .filter((key) => !isNaN(key))
        .sort((a, b) => a - b)
        .filter((key, index) => key === index)
        .map((key) => `${argNameSuffix}${key}`);
};
export function getDynamicArgs(args: Record<string, any>): string[] {
    return getDynamicArgKeys(args).map(key => args[key]);
};
declare let initExpandableBlocksExposed: (extension: ExtensionPlain) => void;
try {
    initExpandableBlocksExposed = initExpandableBlocks;
    initExpandableBlocksExposed.bind(null);
} catch {
    console.warn("initExpandableBlocks() exposer isn't created, skipping.");
};
declare let getDynamicArgKeysExposed: (extension: ExtensionPlain) => void;
try {
    getDynamicArgKeysExposed = getDynamicArgKeys;
    getDynamicArgKeysExposed.bind(null);
} catch {
    console.warn("getDynamicArgKeys() exposer isn't created, skipping.");
};
declare let getDynamicArgsExposed: (extension: ExtensionPlain) => void;
try {
    getDynamicArgsExposed = getDynamicArgs;
    getDynamicArgsExposed.bind(null);
} catch {
    console.warn("getDynamicArgs() exposer isn't created, skipping.");
};