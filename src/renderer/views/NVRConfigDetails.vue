<script setup lang="ts">
import {useRouter} from "vue-router";
import {ref} from "vue";
import {MixAudioOut} from "@renderer/model/MixAudioOut";
import {AudioOutVlome} from "@renderer/model/AudioOutVlome";
import {Account} from "@renderer/model/Account";
import {StorageProgress} from "@renderer/model/StorageProgress";
let {ipcRenderer, shell, crash} = window;

const active = ref<number>(0);
let router = useRouter();
const onClickLeft = () => {
  // isBack.value = true;
  router.replace("/main/page2");
};

let params = router.currentRoute.value.query;
const username = params.username as string; // "value1"
const password = params.password as string; // "value2"
const ip = params.ip as string; // "value2"
const primaryDNS = params.primaryDNS as string; // "value"
const secondaryDNS  = params.secondaryDNS as string;
const subnetMask = params.subnetMask as string;
const defaultGateway = params.defaultGateway as string;

let account = new Account();
account.ip = ip;
account.username = username;
account.password = password;
account.primaryDNS = primaryDNS;
account.secondaryDNS = secondaryDNS;
account.subnetMask = subnetMask;
account.defaultGateway = defaultGateway;

let cookie;

ipcRenderer.invoke('get-cookies', {username: username, password:password, ip:ip}).then(response => {
  console.log(`cookie: ${response.cookie}`);
  cookie = response.cookie;
  setIntervalCookie(ip, cookie);
});

/**
 * 定时器心跳
 * @param ip
 * @param cookie
 */
function setIntervalCookie(ip, cookie) {
  ipcRenderer.invoke('session-heartbeat', {ip:ip, cookie: cookie})
 .then(response => {
      console.log(response);
    })
}

/**
 * 获取硬盘信息
 * @param id
 */
function submitConfig(id:number) {
  ipcRenderer.invoke('get-storage-status', {ip: ip, cookie: cookie})
      .then(response => {
         console.log(`获取硬盘信息：${response.data}`);
      });
}

/**
 * 配置视频
 * @param id
 */
function configVideo(id:number) {
  ipcRenderer.invoke("configVideo", {ip: ip, cookie: cookie})
      .then(response => {
        console.log(`配置视频：${response}`)
      })
}

/**
 * 混音配置
 * @param id
 */
function configAudio(id:number) {

  ipcRenderer.invoke('configAudio', {ip: ip, cookie: cookie})
      .then(response => {
        let MixAudioOutList = response.AudioOut.MixAudioOut[0]
        let AudioOutVlomeList = response.AudioOut.AudioOutVolumelist[0].AudioOutVlome
        for (let i = 0; i < MixAudioOutList.length; i++) {
          let obj = MixAudioOutList[i] as MixAudioOut
          obj.enabled = true;
          obj.outputGain = 8;
          obj.outputMute = false;
          obj.soundQualityHanding = false;
          obj.outputVolume = 6;
        }

        for (let i = 0; i < AudioOutVlomeList.length; i++) {
          let obj = AudioOutVlomeList[i] as AudioOutVlome
          obj.volume = -1000;
          obj.type = 'specific';
        }
        console.log(`配置混音信息：${response}`);
      })
}

/**
 * 配置网络
 * @param id
 */
function configNetwork(id:number){
  ipcRenderer.invoke('configNetwork', {ip: ip, cookie: cookie, account: account})
    .then(response => {

      console.log(`配置网络信息：${response}`);

      })
}

// 进度条
let progress:number = 0;


/**
 * 配置硬盘
 * @param id
 */
function configStorage(id: number) {
  ipcRenderer.invoke("configStorage", {ip: ip, cookie: cookie})
      .then(response => {
        let timer = setInterval(() => {
          if (progress < 100) {
            getStorageProgress();
            clearInterval(timer); // 清除定时器
          }
        }, 1000); // 每隔1秒执行一次任务
      });
}

/**
 * 查找格式化进度
 */
function getStorageProgress() {
  ipcRenderer.invoke("getStorageStatus", {ip: ip, cookie: cookie})
      .then(response => {
        let sp = response as StorageProgress;
        progress = sp.percent;
      })
}

/**
 * 配置通道
 * @param id
 */
function configChannel(id:number){
  ipcRenderer.invoke("configChannel", {ip: ip, cookie: cookie})
      .then(response => {
        console.log(response);
      });
}

</script>

<template>

  <div class="container">

    <div class="navbar-wrapper">
      <van-nav-bar
          title="班级详情" left-arrow left-text="返回" @click-left="onClickLeft"/>
      <div class="scroll-container">
        <div style="display: flex; flex-direction: row; width: 100%; height: 100%">
          <van-steps direction="vertical" :active="active" style="width: 240px">
            <van-step>
              <h3>【进度】视频配置</h3>
              <p>2016-07-12 12:40</p>
            </van-step>
            <van-step>
              <h3>【进度】混音配置</h3>
              <p>2016-07-11 10:00</p>
            </van-step>
            <van-step>
              <h3>【进度】网络配置</h3>
              <p>2016-07-10 09:30</p>
            </van-step>
            <van-step>
              <h3>【进度】硬盘管理格式化</h3>
              <p>2016-07-10 09:30</p>
            </van-step>
            <van-step>
              <h3>【进度】通道配置</h3>
              <p>2016-07-10 09:30</p>
            </van-step>
            <van-step>
              <h3> 配置完成！</h3>
              <p>2016-07-10 09:30</p>
            </van-step>
          </van-steps>
          <div style="width: 500px">
            <div style="height: 105px;width: 100%; display: flex; justify-content: flex-end; align-items: center  ">
              <van-button id="0" type="primary" size="small" loading-type="spinner" loading-size="12px"
                          loading-text="执行中" @click="configVideo(0)">重新配置
              </van-button>
            </div>

            <div style="height: 105px;width: 100%; display: flex; justify-content: flex-end; align-items: center  ">
              <van-button id="1" type="primary" size="small" loading-type="spinner" loading-size="10px"
                          loading-text="执行中" @click="configAudio(1)">重新配置
              </van-button>
            </div>

            <div style="height: 105px;width: 100%; display: flex; justify-content: flex-end; align-items: center  ">
              <van-button id="2" type="primary" size="small" loading-type="spinner" loading-size="10px"
                          loading-text="执行中" @click="configNetwork(2)">重新配置
              </van-button>
            </div>

            <div style="height: 105px;width: 100%; display: flex; justify-content: flex-end; align-items: center  ">
              <van-button id="3" type="primary" size="small" loading-type="spinner" loading-size="10px"
                          loading-text="执行中" @click="configStorage(3)">重新配置
              </van-button>
            </div>

            <div style="height: 105px;width: 100%; display: flex; justify-content: flex-end; align-items: center  ">
              <van-button id="4" type="primary" size="small" loading-type="spinner" loading-size="10px"
                          loading-text="执行中" @click="configChannel(4)">重新配置
              </van-button>
            </div>


          </div>
        </div>


      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 85%; /* 改为自适应高度 */
  display: flex;
  flex-direction: column;
  border-top-left-radius: 10px; /* 设置左上角的圆角半径 */

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

.navbar-wrapper {
  width: 100%;
  --van-nav-bar-text-color: #303133;
  --van-nav-bar-icon-color: #303133;
  --van-nav-bar-height: 50px
}

.scroll-container {
  width: 100%; /* 设置容器宽度 */
  height: 570px; /* 设置容器高度 */
  padding-left: 24px;
  padding-right: 24px;
  overflow: auto; /* 显示滚动条，根据内容是否溢出自动显示滚动条 */
}
</style>
