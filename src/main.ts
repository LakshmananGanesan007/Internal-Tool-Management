import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/index.css'

// After a new deploy, old cached chunks 404: reload once instead of showing a white page
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('toolhive:reloaded')) {
    sessionStorage.setItem('toolhive:reloaded', '1')
    window.location.reload()
  }
})
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('toolhive:reloaded'), 5000))

const app = createApp(App)
app.config.errorHandler = (err) => console.error('[app error]', err)

app.use(createPinia())
app.use(router)
app.mount('#app')
