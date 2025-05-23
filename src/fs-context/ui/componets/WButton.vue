<template>
    <button>
        <slot></slot>
    </button>
</template>
<style scoped>
button {
    padding: 3px 5px;
    border: rgb(128, 128, 128) 2px solid;
    background-color: rgb(230, 230, 230);
    color: black !important;
    border-radius: 5px;
}

button:hover {
    border-color: rgb(64, 64, 64);
    background-color: rgb(200, 200, 200);
}
</style>