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
      url: 'http://localhost:8080/api/user/login',
      method: 'POST',
      data: {
        email: email,
        password: password
      },
      success: (res) => {
        if (res.data && res.data.id) {
          wx.showToast({ title: '登录成功', icon: 'success' })
          wx.setStorageSync('user', res.data)
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
