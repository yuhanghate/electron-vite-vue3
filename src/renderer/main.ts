import {createApp} from 'vue'
import {createPinia} from 'pinia'
import 'virtual:svg-icons-register'
import App from './App.vue'
import router from './router'
import {errorHandler} from './error'

// 引入样式
import 'vant/lib/index.css';
import './styles/index.scss'
import './permission'


// 2. 引入组件
import SvgIcon from "../renderer/components/SvgIcon/index.vue" // Svg Component
import {NavBar} from 'vant/lib/nav-bar';
import {Dialog} from 'vant/lib/dialog';
import {List} from 'vant/lib/list';
import {Cell} from 'vant/lib/cell';
import {Button} from 'vant/lib/button';
import {Popup} from 'vant';
import {Field, CellGroup} from 'vant';
import {Col, Row} from 'vant';
import {Toast} from 'vant';
import {Icon} from 'vant';
import {Step, Steps} from 'vant';





const app = createApp(App)
const store = createPinia()
app.use(router)
app.use(store)
app.component("SvgIcon", SvgIcon)
app.use(NavBar);
app.use(Dialog);
app.use(List);
app.use(Cell);
app.use(Button);
app.use(Popup);
app.use(Field);
app.use(CellGroup);
app.use(Col);
app.use(Row);
app.use(Toast);
app.use(Icon);
app.use(Step);
app.use(Steps);


errorHandler(app)

app.mount("#app")
