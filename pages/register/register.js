// pages/register/register.js
Page({
  data: {
    email: '',
    password: '',
    name: '',
    showPwd: false,
    members: []
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
  addMember() {
    const members = [...this.data.members, { email: '', password: '', name: '', showPwd: false }]
    this.setData({ members })
  },
  removeMember(e) {
    const { index } = e.currentTarget.dataset
    const members = this.data.members.filter((_, i) => i !== index)
    this.setData({ members })
  },
  toggleMemberPwd(e) {
    const { index } = e.currentTarget.dataset
    const key = `members[${index}].showPwd`
    this.setData({ [key]: !this.data.members[index].showPwd })
  },
  onMemberInput(e) {
    const { index, field } = e.currentTarget.dataset
    const key = `members[${index}].${field}`
    this.setData({ [key]: e.detail.value })
  },
  goLogin() {
    wx.redirectTo({ url: '/pages/login/login' })
  },
  onSubmit() {
    const { email, password, name, members } = this.data
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
    for (let i = 0; i < members.length; i += 1) {
      const m = members[i]
      if (!m.email.trim() || !m.password.trim() || !m.name.trim()) {
        wx.showToast({ title: `请完整填写成员${i + 1}信息`, icon: 'none' })
        return
      }
    }
    wx.showToast({ title: '注册成功（占位）', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/schedule/schedule' })
    }, 600)
  }
})
