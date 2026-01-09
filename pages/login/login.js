// pages/login/login.js
Page({
  data: {
    email: '',
    password: '',
    showPwd: false
  },
  onEmail(e) {
    this.setData({ email: e.detail.value })
  },
  onPassword(e) {
    this.setData({ password: e.detail.value })
  },
  togglePwd() {
    this.setData({ showPwd: !this.data.showPwd })
  },
  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },
  onLogin() {
    const { email, password } = this.data
    if (!email.trim()) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    wx.request({
      url: 'http://192.144.228.237:8080/api/user/login',
      method: 'POST',
      data: {
        email: email,
        password: password
      },
      success: (res) => {
        if (res.data && res.data.id) {
          wx.showToast({ title: '登录成功', icon: 'success' })
          // persist returned user
          let user = res.data || {}
          // remove any legacy permissions cache
          try { wx.removeStorageSync('permissions') } catch (e) {}
          // ensure access fields exist (support snake_case & camelCase)
          const ensureNum = (u, snake, camel) => {
            const raw = (u[snake] !== undefined) ? u[snake] : (u[camel] !== undefined ? u[camel] : 1)
            const n = Number(raw)
            return Number.isNaN(n) ? 1 : n
          }
          user.task_access = ensureNum(user, 'task_access', 'taskAccess')
          user.health_access = ensureNum(user, 'health_access', 'healthAccess')
          user.finance_access = ensureNum(user, 'finance_access', 'financeAccess')
          wx.setStorageSync('user', user)
          // refresh custom tabbar on all open pages so icons immediately reflect permissions
          const pages = getCurrentPages()
          pages.forEach(p => {
            if (typeof p.getTabBar === 'function' && p.getTabBar()) {
              try { p.getTabBar().refresh() } catch (e) {}
            }
          })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/schedule/schedule' })
          }, 600)
        } else {
          wx.showToast({ title: '邮箱或密码错误', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('登录失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  }
})
