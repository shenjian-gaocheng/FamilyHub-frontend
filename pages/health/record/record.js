// pages/health/record/record.js
Page({
  data: {
    dietText: '',
    sleepHours: 8,
    hasBand: false
  },
  onDietInput(e) {
    this.setData({ dietText: e.detail.value })
  },
  onSleepChange(e) {
    this.setData({ sleepHours: e.detail.value })
  },
  onToggleBand() {
    this.setData({ hasBand: !this.data.hasBand })
  },
  onSubmit() {
    if (!this.data.dietText.trim()) {
      wx.showToast({ title: '请填写饮食记录', icon: 'none' })
      return
    }
    wx.showToast({ title: '已保存（待接入）', icon: 'success' })
  }
})
