// pages/schedule/add/add.js
Page({
  data: {
    title: '',
    desc: '',
    date: '2026-01-06',
    sectionText: '第一节 08:00 - 08:45',
    repeat: 'none',
    repeatOptions: [
      { key: 'none', label: '无' },
      { key: 'daily', label: '每天' },
      { key: 'weekly', label: '每周' }
    ]
  },
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },
  onDescInput(e) {
    this.setData({ desc: e.detail.value })
  },
  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },
  onChooseSection() {
    wx.showToast({ title: '选择时间段（待接入）', icon: 'none' })
  },
  onChangeRepeat(e) {
    this.setData({ repeat: e.currentTarget.dataset.key })
  },
  onSubmit() {
    const { title } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请填写日程名称', icon: 'none' })
      return
    }
    wx.showToast({ title: '已添加（待接入后端）', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 600)
  }
})
