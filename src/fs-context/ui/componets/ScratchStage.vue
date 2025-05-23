<template>
    <div class="block">
        <div class="content">
            <slot></slot>
        </div>
        <canvas id="scratch-stage" :class="{ big }"></canvas>
    </div>
</template>
<style scoped>
canvas {
    width: 640px;
    height: 360px;
    border-radius: 5px;
    border: 2px solid gray;
}

canvas.big {
    width: 1280px;
    height: 720px;
}

.block {
    position: relative;
    display: inline-block;
    margin: 20px;
    user-select: none;
}

.content {
    position: absolute;
    left: 0;
    top: 0;
    width: 640px;
    height: 360px;
    justify-content: center;
    align-items: center;
    display: flex;
}
</style>
<script lang="ts">
export default {
    props: {
        big: {
            type: Boolean,
            default: false
        }
    }
};
</script>