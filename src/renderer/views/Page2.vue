<script setup lang="ts">
import {ref} from "vue";
import {Account} from "../model/Account"
import {useRouter} from "vue-router";

let {ipcRenderer, shell, crash} = window;
import {showToast} from 'vant';

const list = ref<Account[]>([]);
const loading = ref(false);
const finished = ref(false);
const show = ref(false);

const username = ref<string>("admin");
const password = ref<string>("zhl-583583");
const nickname = ref<string>("");
const ip = ref<string>("");
const primaryDNS = ref<string>("10.22.108.197");
const secondaryDNS  = ref<string>("10.22.108.198");
const subnetMask = ref<string>("255.255.255.0");
const defaultGateway = ref<string>("10.22.216.1");

let router = useRouter();

let accountList: Array<Account>;

const onLoad = () => {

  // 查询账号列表
  ipcRenderer.invoke("get-account-list").then(data => {
    accountList = JSON.parse(data);

    for (let i = 0; i < accountList.length; i++) {
      let account = accountList[i];
      account.index = i + 1;
      list.value.push(account);
    }
    finished.value = true;
  });

}

const clickItem = (item) => {
  console.log("click");
  router.replace({
    path: "/nvr/config/video",
    query: item,
  })
}

const clickAddAccount = () => {
  show.value = true;
}

const clickCancel = () => {
  show.value = false;
}

const clickSave = () => {
  let act = new Account();
  act.ip = ip.value;
  act.password = password.value;
  act.username = username.value;
  act.index = accountList.length + 1
  act.secondaryDNS = secondaryDNS.value;
  act.primaryDNS = primaryDNS.value;
  act.subnetMask = subnetMask.value;
  act.defaultGateway = defaultGateway.value;
  accountList.push(act)
  list.value.push(act);
  ipcRenderer.invoke("save-account-list", accountList).then(data => {
    if (!data) {
      showToast('保存失败');
      return;
    }
    showToast('保存成功');
    ip.value = '';
    username.value = '';
  })
  show.value = false;
}
</script>

<template>


  <div class="container">
    <!--    <van-nav-bar-->
    <!--        class="navbar-wrapper" title="账号列表"/>-->

    <div class="title" style="height: 50px; font-weight: bold; font-size: 0.9em; margin-left: 16px">
      <span class="index">序号</span>
      <span class="username">用户名</span>
      <span class="ip">IP地址</span>
      <span class="password">密码</span>
      <div style="display: flex; flex: 1; justify-content: right; padding-right: 35px">
        <van-button type="primary" size="small" @click="clickAddAccount">新增账号</van-button>
      </div>

    </div>
    <div style="width: 100%; height: 1px; background-color: #f4f4f4"></div>
    <div class="content">
      <van-list
          style="width: 100%; height: 100%; overflow-y: auto;"
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          loading-text="正在加载.."
          @load="onLoad"
      >
        <van-cell v-for="item in list" :border="true" :center="true" is-link @click="clickItem(item)">
          <div class="title">
            <span class="index">{{ item.index }}</span>
            <span class="username">{{ item.username }}</span>
            <span class="ip">{{ item.ip }}</span>
            <span class="password">{{ item.password }}</span>
          </div>
        </van-cell>
      </van-list>

    </div>
    <van-popup v-model:show="show" :round="true" :style="{ padding: '36px 16px 36px 16px' }">
      <van-cell-group inset>
        <!-- 输入用户名 -->
        <van-field v-model="username" size="normal" label="用户名" placeholder="请输入用户名"/>
        <!-- 输入密码 -->
        <van-field v-model="password" type="text" label="密码" placeholder="请输入密码"/>
        <!-- 输入昵称 -->
        <van-field v-model="nickname" type="text" label="昵称" placeholder="请输入昵称 "/>
        <!-- 允许输入ip地址 -->
        <van-field v-model="ip" type="text" label="IP地址" placeholder="请输入IP地址"/>
        <van-field v-model="primaryDNS" type="text" label="主DNS" placeholder="请输入主DNS"/>
        <van-field v-model="secondaryDNS" type="text" label="备DNS" placeholder="请输入备DNS"/>
        <van-field v-model="subnetMask" type="text" label="子网掩码" placeholder="请输入子网掩码"/>
        <van-field v-model="defaultGateway" type="text" label="网关" placeholder="请输入网关"/>
      </van-cell-group>

      <div style="display: flex; justify-content: center; margin-top: 20px;">
        <van-button type="default" size="normal" style="width: 80px; height: 36px" @click="clickCancel">取消
        </van-button>
        <div style="width: 36px"></div>
        <van-button type="primary" size="normal" style="width: 80px; height: 36px" @click="clickSave">确定</van-button>
      </div>

    </van-popup>
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

.title {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: left;
}

.index {
  width: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;
  color: #606266;
}

.username {
  width: 180px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 16px;
  color: #606266;
}

.ip {
  width: 180px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #606266;
}

.password {
  width: 180px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #606266;
}
</style>
