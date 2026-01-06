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
    wx.showToast({ title: '登录成功（占位）', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/schedule/schedule' })
    }, 600)
  }
})
