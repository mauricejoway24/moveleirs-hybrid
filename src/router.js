import Vue from 'vue'
import Router from 'vue-router'
import Layout from '@/components/Layout'
import Login from '@/components/Login'
import auth from '@/utils/auth'
import { default as store, SET_CURRENT_STORE, JOIN_NEW_CHANNEL } from '@/store'

Vue.use(Router)

const routes = new Router({
  routes: [
    {
      path: '/agent',
      name: 'Agent',
      component: Layout
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    }
  ]
})

routes.beforeEach((to, from, next) => {
  let query = {
    storeId: to.query.storeId || from.query.storeId,
    relogin: to.query.relogin
  }

  let isAgent = auth.isAgent()

  if (query.storeId) {
    store.commit(SET_CURRENT_STORE, query.storeId)
  }

  if (!auth.userAuthenticated()) {
    if (to.path === '/login') {
      return next()
    } else {
      return next({ path: '/login' })
    }
  }

  if (to.path === '/agent') {
    return next()
  } else {
    return next({ path: '/agent' })
  }
})

export default routes
