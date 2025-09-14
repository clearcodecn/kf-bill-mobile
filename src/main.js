import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { Toast } from 'vant';

// 引入Vant
import Vant from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vant)
app.use(Toast)
app.mount('#app')
