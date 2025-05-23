<template>
    <div class="overlay" :style="{ display: open ? 'flex' : 'none' }">
        <span class="title">FSContext监听到运行错误！</span>
        <div class="stacks">
            <div v-for="stack, index in info" :key="index" class="stack-line">
                <span class="place" v-if="index !== 0"></span>
                {{ stack }}<br>
            </div>
        </div>
        <WButton @click="open = false">Close</WButton>
    </div>
</template>
<style scoped>
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.overlay * {
    color: inherit;
}

.title {
    font-size: 20px;
    font-weight: bold;
}

.stack-line {
    max-width: 100%;
    text-wrap: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.stacks {
    width: 80%;
    margin-top: 10px;
}

.place {
    display: inline-block;
    width: 10px;
}
</style>
<script setup lang="ts">
import WButton from "./WButton.vue";
</script>
<script lang="ts">
export default {
    data() {
        return {
            open: false,
            info: [] as string[]
        };
    }
};
</script>