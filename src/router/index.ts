import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../pages/auth/Login.vue'), meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: () => import('../pages/auth/Register.vue'), meta: { requiresGuest: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../pages/auth/ForgotPassword.vue'), meta: { requiresGuest: true } },
  // Reachable with or without a session: the emailed link signs the user in to set a new password
  { path: '/reset-password', name: 'ResetPassword', component: () => import('../pages/auth/ResetPassword.vue') },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../pages/dashboard/Home.vue') },
      { path: 'favorites', name: 'Favorites', component: () => import('../pages/dashboard/Favorites.vue') },
      { path: 'tasks', name: 'Tasks', component: () => import('../pages/tasks/Tasks.vue') },
      { path: 'settings', name: 'Settings', component: () => import('../pages/settings/WorkspaceSettings.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../pages/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.isInitialized) await auth.initAuth()
  const isAuthenticated = !!auth.user
  if (to.meta.requiresAuth && !isAuthenticated) return { name: 'Login' }
  if (to.meta.requiresGuest && isAuthenticated) return { name: 'Dashboard' }
})

// Close the mobile drawer after every navigation
router.afterEach(() => { useUIStore().closeSidebar() })

export default router
