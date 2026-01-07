// pages/schedule/schedule.js
Page({
  data: {
    user: null,
    month: 1,
    weekOfYear: 1,
    selectedDay: 6,
    dates: [
      { label: '一', day: 5 },
      { label: '二', day: 6 },
      { label: '三', day: 7 },
      { label: '四', day: 8 },
      { label: '五', day: 9 },
      { label: '六', day: 10 },
      { label: '日', day: 11 }
    ],
    events: [
      { id: 1, start: '08:00', end: '10:45', title: '软件工程@安楼A219', location: '安楼A219 嘉定校区', note: '第1-16周 周二 | 第1-3节', teacher: '杜庆峰', timeLabel: '第1-16周 周二 | 第1-3节 (08:00 - 10:45)' },
      { id: 2, start: '13:30', end: '15:15', title: '软件设计模式@复楼F204', location: '复楼F204', note: '第1-16周 周二 | 第5节', teacher: '王老师', timeLabel: '第1-16周 周二 | 第5节 (13:30 - 15:15)' },
      { id: 3, start: '16:20', end: '18:00', title: '语音识别@安楼A306', location: '安楼A306', note: '第1-16周 周二 | 第8节', teacher: '张老师', timeLabel: '第1-16周 周二 | 第8节 (16:20 - 18:00)' }
    ],
    showDetail: false,
    detail: {}
  },
  onLoad() {
    // 获取用户信息
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ user })

    const now = new Date()
    const { month, weekOfYear } = this.calcDateInfo(now)
    this.setData({ month, weekOfYear })
    // TODO: 请求后端获取实际日程和日期行数据
  },
  calcDateInfo(d) {
    const month = d.getMonth() + 1
    const weekOfYear = this.getWeekNumber(d)
    return { month, weekOfYear }
  },
  getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  },
  onSelectDate(e) {
    const day = e.currentTarget.dataset.day
    this.setData({ selectedDay: day })
    // TODO: 根据日期重新拉取日程
  },
  onAdd() {
    wx.navigateTo({ url: '/pages/schedule/add/add' })
  },
  onEventTap(e) {
    const idx = e.currentTarget.dataset.idx
    const detail = this.data.events[idx]
    this.setData({ detail, showDetail: true })
  },
  closeDetail() {
    this.setData({ showDetail: false })
  },
  onEdit() {
    wx.showToast({ title: '编辑待接入', icon: 'none' })
  },
  onDelete() {
    wx.showToast({ title: '删除待接入', icon: 'none' })
    this.closeDetail()
  }
})
