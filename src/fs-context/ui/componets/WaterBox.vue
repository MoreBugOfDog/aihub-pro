<template>
    <div class="container">
        <ScratchStage :big="isBig">
            <span>舞台</span>
        </ScratchStage>
        <span v-if="!extensionLoaded">Loading extension...</span>
        <div class="frame" v-if="extensionLoaded">
            <span class="title">
                WaterBox for FSExtension
                <span v-if="extensionLoaded">- {{ extName }}({{ extId }})</span>
            </span>
            <div class="tools">
                <WButton @click="reloadExtension">重载拓展</WButton>
                <WButton @click="copyExtensionUrl">复制拓展脚本url</WButton>
                <WButton @click="isBig = !isBig">放大/缩小</WButton>
            </div>
            <div class="blocks">
                <ScratchBlock v-for="block in blocks" :key="block.opcode" :colorBlock="colorBlock"
                    :colorInputer="colorInputer" :colorMenu="colorMenu" :opcode="block.opcode" :type="block.type"
                    :unparsedText="block.text">
                    <span v-for="arg in block.parts" :key="arg.content"
                        :class="{ 'texts': true, 'input': arg.type === 'input' }">
                        <span v-if="arg.type === 'text'" class="text">{{ arg.content }}</span>
                        <span v-if="arg.type === 'input'" class="label">({{ arg.inputType }}) {{ arg.content }}:</span>
                        <input type="text" v-if="arg.type === 'input' && arg.inputType !== 'menu'" :value="arg.value"
                            class="inputer" @input="autoWidthInput" />
                        <select v-if="arg.type === 'input' && arg.inputType === 'menu'" class="inputer select" :style="{
                            backgroundColor: colorInputer,
                            borderColor: colorMenu
                        }" :value="findMenu(arg.value || arg.content)?.items[0].value">
                            <option v-for="option in findMenu(arg.value || arg.content)?.items"
                                :value="option.value ? option.value : option.name" :key="option.name">{{ option.name }}
                            </option>
                        </select>
                    </span>
                </ScratchBlock>
            </div>
        </div>
    </div>
    <FullscreenOverlay />
</template>
<script lang="ts">
import { Block, Menu } from "../../structs";
export default {
    data() {
        return {
            extensionLoaded: false,
            colorBlock: "#000000",
            colorInputer: "#000000",
            colorMenu: "#000000",
            blocks: [] as Block[],
            menus: [] as Menu[],
            extName: "",
            extId: "",
            isBig: false
        };
    },
    methods: {
        findMenu(id: any) {
            return id instanceof Menu ? id : this.menus.find(m => m.name === id);
        },
        reloadExtension() {
            this.extensionLoaded = false;
            import("@framework/entry").then((e) => {
                let ext = e.extension;
                if (!ext) return;
                const colors = ext.calcColor();
                this.colorBlock = colors.block;
                this.colorInputer = colors.inputer;
                this.colorMenu = colors.menu;
                this.blocks = ext.blocks;
                this.menus = ext.menus;
                this.extName = ext.displayName;
                this.extId = ext.id;
                setTimeout(() => {
                    this.extensionLoaded = true;
                }, 100);
                this.$nextTick(() => {
                    document.querySelectorAll("input").forEach(e => {
                        this.autoWidthInput({ target: e });
                    });
                });
            });
        },
        copyExtensionUrl() {
            let url = window.location.protocol + "//" + window.location.hostname + ":" + serverConfig.extension.port + "/" + serverConfig.extension.output + ".dist.js";
            try {
                navigator.clipboard.writeText(url);
                alert("已复制");
            }
            catch (e) {
                alert("已尝试自动复制，但复制失败，请手动选中复制：\n" + url + `\n${e}`);
            }
        },
        autoWidthInput(e: { target: EventTarget | null }) {
            const target = e.target as HTMLInputElement;
            if (!target) { return; };
            let tempSpan = document.createElement('span');
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.whiteSpace = 'pre';
            tempSpan.style.font = window.getComputedStyle(target).font;
            tempSpan.textContent = target.value;
            document.body.appendChild(tempSpan);
            target.style.width = (tempSpan.offsetWidth + 5) + 'px';
            document.body.removeChild(tempSpan);
        }
    },
    mounted() {
        this.reloadExtension();
    }
};
</script>
<script setup lang="ts">
import ScratchBlock from "./ScratchBlock.vue";
import ScratchStage from "./ScratchStage.vue";
import serverConfig from "../../../../config/server";
import FullscreenOverlay from "./FullscreenOverlay.vue";
import WButton from "./WButton.vue";
</script>
<style scoped>
.container {
    width: 100vw;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.frame {
    padding: 15px;
    border: gray 3px solid;
    display: flex;
    flex-direction: column;
}

.title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
}

.tools * {
    margin: 0 5px;
}

.blocks {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 20px 10px;
}

.blocks * {
    margin-left: 5px;
}

.texts {
    display: flex;
    align-items: center;
}

.text {
    color: white;
    text-wrap: nowrap;
}

.inputer {
    color: black;
    background-color: white;
    padding: 5px;
    border-radius: 5px;
    min-width: 40px;
}

input {
    width: 40px;
}

.select {
    border-width: 2px;
    border-style: solid;
    color: white;
}

.label {
    color: white;
    background-color: rgb(255, 255, 255, 0.25);
    border-radius: 5px;
    padding: 0 5px;
}
</style>
<style>
* {
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
}
</style>