Component({
  data: {
    tabs: [],
    itemUrlMap: {
      tasks: '/pages/schedule/schedule',
      health: '/pages/health/health',
      finance: '/pages/finance/finance',
      mine: '/pages/mine/mine'
    }
  },
  attached() {
    this.refresh()
  },
  methods: {
    refresh() {
      // Simplified: strictly use DB access fields on the stored `user` object.
      // Supported names: snake_case (task_access) or camelCase (taskAccess).
      const user = wx.getStorageSync('user') || {}

      const readAccess = (u, snake, camel) => {
        if (!u) return 1
        if (u[snake] !== undefined && u[snake] !== null) {
          const n = Number(u[snake])
          return Number.isNaN(n) ? 1 : n
        }
        if (u[camel] !== undefined && u[camel] !== null) {
          const n = Number(u[camel])
          return Number.isNaN(n) ? 1 : n
        }
        return 1
      }

      const taskAccess = readAccess(user, 'task_access', 'taskAccess')
      const healthAccess = readAccess(user, 'health_access', 'healthAccess')
      const financeAccess = readAccess(user, 'finance_access', 'financeAccess')

      const tabs = []
      if (taskAccess === 1) tabs.push({ key: 'tasks', label: '事务', icon: '/assets/tabbar/affairs.png' })
      if (healthAccess === 1) tabs.push({ key: 'health', label: '健康', icon: '/assets/tabbar/health.png' })
      if (financeAccess === 1) tabs.push({ key: 'finance', label: '财务', icon: '/assets/tabbar/finance.png' })
      // always show mine
      tabs.push({ key: 'mine', label: '我的', icon: '/assets/tabbar/mine.png' })

      // determine current route to set active tab
      const pages = getCurrentPages() || []
      const currentRoute = pages.length ? ('/' + pages[pages.length - 1].route) : ''
      const tabsWithActive = tabs.map(t => {
        const url = this.data.itemUrlMap[t.key] || ''
        return { ...t, active: (url === currentRoute || url === ('/' + currentRoute) || ('/' + url) === currentRoute) }
      })
      this.setData({ tabs: tabsWithActive })
    },
    onTabTap(e) {
      const url = e.currentTarget.dataset.url
      if (url) wx.switchTab({ url })
    }
  }
})


