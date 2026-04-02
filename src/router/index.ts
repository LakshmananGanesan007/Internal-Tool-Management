import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../pages/auth/Login.vue'), meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: () => import('../pages/auth/Register.vue'), meta: { requiresGuest: true } },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../pages/dashboard/Home.vue') },
      { path: 'favorites', name: 'Favorites', component: () => import('../pages/dashboard/Favorites.vue') },
      { path: 'settings', name: 'Settings', component: () => import('../pages/settings/WorkspaceSettings.vue') }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  if (!authStore.isInitialized) await authStore.initAuth()
  
  const isAuthenticated = !!authStore.user
  if (to.meta.requiresAuth && !isAuthenticated) next({ name: 'Login' })
  else if (to.meta.requiresGuest && isAuthenticated) next({ name: 'Dashboard' })
  else next()
})

export default router