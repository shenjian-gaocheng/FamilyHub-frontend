Page({
  data: {
    dietText: '',
    sleepHours: 7,
    hasBand: false,

    records: []   // 历史记录
  },

  onLoad() {
    this.loadRecords();
  },

  onDietInput(e) {
    this.setData({ dietText: e.detail.value });
  },

  onSleepChange(e) {
    this.setData({ sleepHours: e.detail.value });
  },

  onToggleBand() {
    wx.showToast({
      title: '当前暂不支持真实设备',
      icon: 'none'
    });
  },

  loadRecords() {
    const user = wx.getStorageSync('user')
    const userId = user.id

    wx.request({
      url: 'http://192.144.228.237:8080/api/health/record',
      data: { userId },
      success: (res) => {
        this.setData({ records: res.data });
      }
    });
  },

  onSubmit() {
    const user = wx.getStorageSync('user')
    const userId = user.id
  
    const now = new Date().toISOString()
  
    const records = []
  
    if (this.data.dietText) {
      records.push({
        type: 'DIET',
        content: this.data.dietText,
        date: now
      })
    }
  
    records.push({
      type: 'SLEEP',
      content: `${this.data.sleepHours}`,
      date: now
    })
  
    // ⭐ 把请求封装成 Promise
    const promises = records.map(record => {
      return new Promise((resolve, reject) => {
        wx.request({
          url: `http://192.144.228.237:8080/api/health/record?userId=${userId}`,
          method: 'POST',
          header: { 'content-type': 'application/json' },
          data: record,
          success: () => resolve(),
          fail: err => reject(err)
        })
      })
    })
  
    // ⭐ 所有请求完成后再刷新
    Promise.all(promises)
      .then(() => {
        wx.showToast({ title: '记录成功', icon: 'success' })
        this.setData({ dietText: '' })
        this.loadRecords()   // ✅ 这里再刷新
      })
      .catch(() => {
        wx.showToast({ title: '记录失败', icon: 'none' })
      })
  }  
});
