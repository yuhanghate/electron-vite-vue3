<template>
  <div class="container">
    <TitleBar/>
    <div class="content-wrapper">
      <Sidebar/>
      <div class="router-view">
        <router-view v-slot="{ Component }" >
          <component :is="Component"/>
        </router-view>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import TitleBar from "@renderer/components/common/TitleBar.vue";
import Sidebar from "@renderer/components/common/Sidebar.vue";

</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 让容器占据整个视口高度 */
}

.content-wrapper {
  display: flex;
  width: 100%; /* 让内容区域占据剩余空间 */
  height: 100%;
  background-color: #f4f4f4;
}

.router-view {
  width: 100%;
  height: 100%;
  margin-top: 20px;
  border-top-left-radius: 10px;
  background-color: #ffffff;
  padding: 10px;
  /* 其他 router-view 样式 */
}
</style>
