<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";


let router = useRouter();
const click = ()=>{
  router.replace({
    path: "/main/page2",
  })
}

click();

</script>

<template>
  <div class="container">
    <span>主页</span>

    <van-button type="primary" @click="click">主要按钮</van-button>
  </div>
</template>

<style scoped lang="scss">
.container {
  border-top-left-radius: 10px; /* 设置左上角的圆角半径 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-wrapper {
  width: 100%;
  --van-nav-bar-text-color: #303133;
  --van-nav-bar-icon-color: #303133;
  --van-nav-bar-height: 50px
}
</style>
