// pages/register/register.js
Page({
  data: {
    email: '',
    password: '',
    name: '',
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
  onName(e) {
    this.setData({ name: e.detail.value })
  },
  goLogin() {
    wx.redirectTo({ url: '/pages/login/login' })
  },
  onSubmit() {
    const { email, password, name } = this.data

    // 验证输入
    if (!email.trim()) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    // 显示加载中
    wx.showLoading({ title: '创建中...' })

    wx.request({
      url: 'http://192.144.228.237:8080/api/user/register',
      method: 'POST',
      data: {
        email: email,
        password: password,
        name: name
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data && res.data.id) {
          // 创建家庭
          this.createFamilyForUser(res.data)
        } else {
          wx.showToast({ title: '注册失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('注册失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  },

  createFamilyForUser(user) {
    wx.request({
      url: 'http://192.144.228.237:8080/api/family/create',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        adminId: user.id,
        familyName: `${user.name}的家庭`
      },
      success: (res) => {
        if (res.data && res.data.success) {
          // 更新用户信息（包含家庭ID和角色）
          const updatedUser = Object.assign({}, user, {
            familyId: res.data.familyId,
            role: 'admin'
          })
          wx.setStorageSync('user', updatedUser)
          wx.showToast({ title: '管理员账户创建成功', icon: 'success' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/schedule/schedule' })
          }, 600)
        } else {
          wx.showToast({ title: '家庭创建失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('创建家庭失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  }
})
