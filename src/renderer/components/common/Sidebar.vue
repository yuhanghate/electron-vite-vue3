<script setup lang="ts">

import SvgIcon from "@renderer/components/SvgIcon/index.vue";
import {ref} from "vue";
import {useRouter} from 'vue-router'

// 是否选中
const isActive = ref(1);

// 是否移动到tab-time 范围
const isMoved = ref(-1);

// 当前vue组件路由地址
let curPath = ref("/main/page1");

const route = useRouter()

const enter = function (index) {
  isMoved.value = index;
}

const leave = function (index) {
  isMoved.value = -1;
}

const active = function (index, path) {
  console.log(`Active=${index + 1}`);
  isActive.value = index;
  curPath.value = path;
  route.push({
    path: path,
  })
}

// active(isActive, curPath);

route.beforeEach((to, from, next) => {

  if (to.path === "/main/page1" && isActive.value != 0) {
    return false;
  } else if (to.path === "/main/page2" && isActive.value != 1) {
    return false;
  } else if (to.path === "/main/page3" && isActive.value != 2) {
    return false;
  } else if (to.path === "/main/page4" && isActive.value != 3) {
    return false;
  } else if (to.path === "/main/page5" && isActive.value != 4) {
    return false;
  } else {
    next();
  }

});
</script>

<template>
  <div id="container">
    <div class="head">
      <div class="logo">
        <SvgIcon icon-name="apple" class-name="svg-logo"></SvgIcon>
        <span>愉阅工具箱</span>
      </div>
      <div style="margin-top: 15px; margin-bottom: 15px; margin-left: 25px; font-size: 12px; color: #73767a">
        <span>在线列表</span>
      </div>
      <div id="index0" class="tab-item" :class="{active: isActive == 0, move: isMoved == 0 && isActive !=0}"
           @mouseenter="enter(0)" @mouseleave="leave(0)" @click="active(0, '/main/page1')">
        <SvgIcon v-if="isActive !== 0" icon-name="copyright-unselect"></SvgIcon>
        <SvgIcon v-if="isActive === 0" icon-name="copyright-selected"/>
        <span class="tab-item-text" :class="{active: isActive == 0}">班级</span>
      </div>

      <div id="index1" class="tab-item" :class="{active: isActive == 1, move: isMoved == 1 && isActive !=1}"
           @mouseenter="enter(1)" @mouseleave="leave(1)" @click="active(1, '/main/page2')">
        <SvgIcon v-if="isActive != 1" icon-name="user-unselect"></SvgIcon>
        <SvgIcon v-if="isActive == 1" icon-name="user-selected"/>
        <span class="tab-item-text" :class="{active: isActive == 1}">NVR账号</span>
      </div>
      <div id="index2" class="tab-item" :class="{active: isActive == 2, move: isMoved == 2 && isActive !=2}"
           @mouseenter="enter(2)" @mouseleave="leave(2)" @click="active(2, '/main/page3')">
        <SvgIcon v-if="isActive != 2" icon-name="lemon-unselect"></SvgIcon>
        <SvgIcon v-if="isActive == 2" icon-name="lemon-selected"></SvgIcon>
        <span class="tab-item-text" :class="{active: isActive == 2}">推荐</span>
      </div>

      <div id="index3" class="tab-item" :class="{active: isActive == 3, move: isMoved == 3 && isActive !=3}"
           @mouseenter="enter(3)" @mouseleave="leave(3)" @click="active(3, '/main/page4')">
        <SvgIcon v-if="isActive != 3" icon-name="video_unselect"></SvgIcon>
        <SvgIcon v-if="isActive == 3" icon-name="video-selected"></SvgIcon>
        <span class="tab-item-text" :class="{active: isActive == 3}">视频</span>
      </div>

      <div id="index4" class="tab-item" :class="{active: isActive == 4, move: isMoved == 4 && isActive !=4}"
           @mouseenter="enter(4)" @mouseleave="leave(4)" @click="active(4, '/main/page5')">
        <SvgIcon v-if="isActive != 4" icon-name="copyright-unselect"></SvgIcon>
        <SvgIcon v-if="isActive == 4" icon-name="copyright-selected"></SvgIcon>
        <span class="tab-item-text" :class="{active: isActive == 4}">雷达</span>
      </div>
    </div>
  </div>

</template>

<style scoped lang="scss">
#container {
  display: flex;
  flex-direction: column;
  margin-top: 30px;
  background-color: #f4f4f4;
}

.head {
  display: flex;
  flex-direction: column;
  margin-top: 30px;
  background-color: #f4f4f4;
  width: 200px;
  height: 100%;
  user-select: none;
}

.logo {
  display: flex;
  height: 60px;
  width: 100%;
  margin-left: 25px;
  align-items: center;
}

.logo span {
  margin-left: 8px;
  font-weight: bold;
  font-size: 18px;
}

.svg-logo {
  width: 1.6em;
  height: 1.6em;
  position: relative;
  fill: currentColor;
  vertical-align: -1px;
}

.tab-menu {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  width: 100%;
  background-color: #f4f4f4;
}

.tab-item {
  display: flex;
  align-items: center;
  justify-content: left;
  margin-left: 15px;
  margin-right: 16px;
  padding-left: 10px;
  margin-top: 4px;
  height: 35px;
  width: 170px;
  cursor: pointer;
}

.tab-item.active {
  background-color: #dedfe0;
  border-radius: 3px; /* 设置圆角半径 */
}

.tab-item.move {
  background-color: #e9e9eb;
  border-radius: 3px; /* 设置圆角半径 */
}

.tab-item-text {
  color: #606266;
  margin-left: 8px;
  font-size: 13px;
  letter-spacing: 0.02em;
}

.tab-item-text.active {
  color: #303133;
  font-weight: bold;
}
</style>
