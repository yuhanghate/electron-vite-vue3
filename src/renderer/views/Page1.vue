<script setup lang="ts">
import {ref} from "vue";
import { onBeforeRouteLeave } from 'vue-router'
import { useRouter } from 'vue-router'
import {log} from "electron-log";

const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const onLoad = () => {

  setTimeout(() => {
    // showDialog({ message: '进入listview' });
    for (let i = 0; i < 40; i++) {
      list.value.push(list.value.length + 1);
    }

    // 加载状态结束
    loading.value = false;

    // 数据全部加载完成
    if (list.value.length >= 400) {
      finished.value = true;
    }

  }, 300);
}
let router = useRouter();
const clickItem = () => {
  router.replace("/list/item");

};

</script>

<template>
  <div class="container">
    <van-nav-bar
        class="navbar-wrapper" title="班级列表"/>

    <div class="content">
      <van-list
          style="width: 100%; height: 100%; overflow-y: auto;"
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          loading-text="正在加载.."
          @load="onLoad"
      >
        <van-cell v-for="item in list" :key="item" :border="true" :center="true" is-link @click="clickItem">
          <div class="item">
            <span style="margin-left: 25px">1</span>
            <span style="margin-left: 100px; color: #606266">多媒体教室</span>
            <span style="margin-left: 100px; color: #606266">192.168.100.210</span>
            <span style="margin-left: 100px; color: #606266">4路</span>
          </div>
        </van-cell>
      </van-list>

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

.content {
  width: 100%;
  height: 85%; /* 改为自适应高度 */
  display: flex;
  justify-content: left;
  flex-direction: column;

  /* 自定义滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px; /* 设置滚动条的宽度 */
  }

  ::-webkit-scrollbar-track {
    background-color: #ffffff; /* 设置滚动条轨道的背景色 */
  }

  ::-webkit-scrollbar-thumb {
    background-color: #dedfe0; /* 设置滚动条滑块的背景色 */
    border-radius: 4px; /* 设置滚动条滑块的边框圆角 */
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #555; /* 设置滚动条滑块的鼠标悬停背景色 */
  }
}

.item {
  display: flex;
  flex-direction: row;
}

</style>
