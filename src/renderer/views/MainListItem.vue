<script setup lang="ts">

import {useRouter} from "vue-router";
import {ref} from "vue";

let router = useRouter();
// let isBack = ref(false);

const onClickLeft = () => {
  // isBack.value = true;
  router.replace("/main/page1");
};

// router.beforeEach((to, from, next)=> {
//   if (!isBack.value && from.path == "/list/item" && to.path == "/") {
//     // 如果不是点击返回键返回的，默认不处理
//     return true;
//   } else if(isBack.value && from.path == "/" && to.path == "/list/item"){
//     return true;
//   }else {
//     isBack.value = false;
//     next();
//   }
// })

</script>

<template>
  <div class="container">
    <div class="navbar-wrapper">
      <van-nav-bar
          class="" title="班级详情" left-arrow left-text="返回"  @click-left="onClickLeft"/>
      <h1 style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center">Home</h1>
    </div>

  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.navbar-wrapper {
  width: 100%;
  --van-nav-bar-text-color: #303133;
  --van-nav-bar-icon-color: #303133;
  --van-nav-bar-height: 50px
}
</style>
