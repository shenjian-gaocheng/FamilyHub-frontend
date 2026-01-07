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
    const userId = wx.getStorageSync('userId');
    wx.request({
      url: 'http://localhost:8080/api/health/record',
      data: { userId },
      success: (res) => {
        this.setData({ records: res.data });
      }
    });
  },

  onSubmit() {
    const userId = wx.getStorageSync('userId');
    const now = new Date().toISOString();

    const requests = [];

    if (this.data.dietText) {
      requests.push({
        type: 'DIET',
        content: this.data.dietText,
        date: now
      });
    }

    requests.push({
      type: 'SLEEP',
      content: `${this.data.sleepHours}`,
      date: now
    });

    requests.forEach(record => {
      wx.request({
        url: `http://localhost:8080/api/health/record?userId=${userId}`,
        method: 'POST',
        header: { 'content-type': 'application/json' },
        data: record
      });
    });

    wx.showToast({ title: '记录成功', icon: 'success' });
    this.setData({ dietText: '' });
    this.loadRecords();
  }
});
