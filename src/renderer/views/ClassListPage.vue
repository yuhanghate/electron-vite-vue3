<script setup lang="ts">

import {ref} from "vue";

const items = ref([{message: 'Foo'}, {message: 'Bar'}])
</script>

<template>

  <div id="wrapper">
    <li v-for="item in items">
      {{ item.message }}
    </li>

  </div>
</template>

<style scoped lang="scss">

#wrapper {
  padding: 120px 20px 20px 20px;
}
</style>
