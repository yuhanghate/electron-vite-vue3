import {RouteRecordRaw} from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    {path: '/:pathMatch(.*)*', component: () => import("@renderer/views/404.vue")},
    {path: '/', name: '总览', component: () => import('@renderer/views/Page2.vue')},
    {path: '/class/list', name: '班级列表', component: () => import('@renderer/components/LandingPage.vue')},
    {
        path: '/main/page1', name: '班级', component: () => import('@renderer/views/Page1.vue'),
        children: [
            {path: 'list/id', name: 'list', component: () => import('@renderer/views/ClassListPage.vue')}
        ]
    },
    {path: '/main/page2', name: '账号列表', component: () => import('@renderer/views/Page2.vue')},
    {path: '/main/page3', name: '推荐', component: () => import('@renderer/views/Page3.vue')},
    {path: '/main/page4', name: '视频', component: () => import('@renderer/views/Page4.vue')},
    {path: '/main/page5', name: '雷达', component: () => import('@renderer/views/Page5.vue')},
    {path: '/sidebar', name: 'sidebar', component: () => import('@renderer/components/common/Sidebar.vue')},
    {path: '/list/id', name: 'list', component: () => import('@renderer/views/ClassListPage.vue')},
    {path: '/list/item', name: "listItem", component: () => import('@renderer/views/MainListItem.vue')},
    {path: '/nvr/config/video', name: 'NVR视频配置', component: () => import('@renderer/views/NVRConfigDetails.vue')}
]

export default routes
