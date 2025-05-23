<template>
    <div class="block-container">
        <div class="block" :style="{ backgroundColor: colorBlock, borderColor: colorInputer }">
            <button class="oval" :style="{ backgroundColor: colorMenu }" @click="runMethod($el, opcode)">Run</button>
            <button class="oval" :style="{ backgroundColor: colorMenu }"
                @click="view(opcode, type, unparsedText)">View</button>
            <button class="oval" :style="{ backgroundColor: colorMenu }" @click="alerter(calcArgs($el))">Arg</button>
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
function calcArgs(ele: HTMLDivElement) {
    let result: Record<string, any> = {};
    ele.querySelectorAll('span.texts').forEach(el => {
        if ([...el.classList].includes("input")) {
            result[
                (el.querySelector("span") as HTMLSpanElement)
                    .innerText
                    .slice(0, -1)
                    .split(" ")
                    .slice(1)
                    .join(" ")
            ] = (el.querySelector(".inputer") as HTMLInputElement).value;
        };
    });
    return result;
};
function alerter(sth: any) {
    window.alert(JSON.stringify(sth));
};
function runMethod(ele: HTMLDivElement, opcode: string) {
    if (
        window.ScratchWaterBoxed
        && window.ScratchWaterBoxed.currentExtension
        && window.ScratchWaterBoxed.currentExtensionPlain
    ) {
        const data = window.ScratchWaterBoxed.currentExtension[opcode].call(window.ScratchWaterBoxed.currentExtensionPlain, calcArgs(ele));
        if (data instanceof Promise) {
            data.then(e => console.log(e));
        } else {
            console.log("Return:", data);
        };
    };
};
function view(opcode: string, type: string, unparsedText: string) {
    alert(JSON.stringify({
        opcode, type, unparsedText
    }, null, 4));
};
</script>
<script lang="ts">
export default {
    props: {
        colorBlock: {
            type: String,
            default: '#FF0000'
        },
        colorInputer: {
            type: String,
            default: '#00FF00'
        },
        colorMenu: {
            type: String,
            default: '#0000FF'
        },
        opcode: {
            type: String,
            default: 'opcode'
        },
        type: {
            type: String,
            default: "command"
        },
        unparsedText: {
            type: String,
            default: "Unparsed Text"
        }
    }
};
</script>
<style scoped>
.block-container {
    display: block;
}

.block {
    border: 3px solid transparent;
    padding: 3px 5px;
    display: flex;
    border-radius: 5px;
    align-items: center;
    margin: 5px 0;
}

.block * {
    text-wrap: nowrap;
}

.oval {
    height: 25px;
    border-radius: 10px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    font-size: 14px;
    padding: 5px;
    color: white;
}

.oval::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
}

.oval:hover::before {
    background-color: rgba(255, 255, 255, 0.2);
}

.oval:active::before {
    background-color: rgba(255, 255, 255, 0.4);
}
</style>