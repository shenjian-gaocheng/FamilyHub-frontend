// pages/mine/mine.js
Page({
  data: {
    user: null,
    familyMembers: [],
    showAddMember: false,
    memberEmail: '',
    memberPassword: '',
    memberName: '',
    memberShowPwd: false
  },
  onLoad() {
    // 获取用户信息
    const user = wx.getStorageSync('user')
    if (user) {
      this.setData({ user })
      this.loadFamilyMembers()
    } else {
      // 如果没有用户信息，跳转到登录页
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },
  loadFamilyMembers() {
    const user = this.data.user
    if (user && user.familyId) {
      wx.request({
        url: `http://localhost:8080/api/family/members?familyId=${user.familyId}`,
        method: 'GET',
        success: (res) => {
          if (res.data) {
            // 过滤掉管理员自己，只显示其他成员
            const otherMembers = res.data.filter(member => member.id !== user.id)
            this.setData({ familyMembers: otherMembers })
          }
        },
        fail: (err) => {
          console.error('获取家庭成员失败:', err)
        }
      })
    }
  },
  showAddMemberForm() {
    this.setData({ showAddMember: true })
  },
  hideAddMemberForm() {
    this.setData({
      showAddMember: false,
      memberEmail: '',
      memberPassword: '',
      memberName: '',
      memberShowPwd: false
    })
  },
  onMemberEmail(e) {
    this.setData({ memberEmail: e.detail.value })
  },
  onMemberPassword(e) {
    this.setData({ memberPassword: e.detail.value })
  },
  onMemberName(e) {
    this.setData({ memberName: e.detail.value })
  },
  toggleMemberPwd() {
    this.setData({ memberShowPwd: !this.data.memberShowPwd })
  },
  addMember() {
    const { user, memberEmail, memberPassword, memberName } = this.data

    if (!memberEmail.trim()) {
      wx.showToast({ title: '请输入成员邮箱', icon: 'none' })
      return
    }
    if (!memberPassword.trim()) {
      wx.showToast({ title: '请输入成员密码', icon: 'none' })
      return
    }
    if (!memberName.trim()) {
      wx.showToast({ title: '请输入成员姓名', icon: 'none' })
      return
    }

    wx.showLoading({ title: '添加中...' })

    wx.request({
      url: 'http://localhost:8080/api/family/add-member',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        adminId: user.id,
        memberInfo: {
          email: memberEmail,
          password: memberPassword,
          name: memberName
        }
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data && res.data.success) {
          wx.showToast({ title: '成员添加成功', icon: 'success' })
          this.hideAddMemberForm()
          this.loadFamilyMembers() // 重新加载成员列表
        } else {
          wx.showToast({ title: res.data.message || '添加失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('添加成员失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  },
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('user')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }
})
