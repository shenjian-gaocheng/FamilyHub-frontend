Page({
  data: {
    aiSuggestion: '建议每周保持 3 次以上规律运动',

    plans: [],

    showForm: false,

    title: '',
    weekOptions: ['周一','周二','周三','周四','周五','周六','周日'],
    weekIndex: 0,
    startTime: '',
    endTime: '',
    weeks: 1
  },

  onLoad() {
    this.loadPlans();
  },

  loadPlans() {
    const user = wx.getStorageSync('user')
    const userId = user.id

    wx.request({
      url: 'http://localhost:8080/api/health/plan',
      data: { userId },
      success: (res) => {
        this.setData({ plans: res.data });
      }
    });
  },

  onAddPlan() {
    this.setData({ showForm: true });
  },

  onCancel() {
    this.setData({
      showForm: false,
      title: '',
      startTime: '',
      endTime: '',
      weeks: 1,
      weekIndex: 0
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onWeekChange(e) {
    this.setData({ weekIndex: e.detail.value });
  },

  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value });
  },

  onWeeksInput(e) {
    this.setData({ weeks: e.detail.value });
  },

  onSubmit() {
    const { title, weekIndex, startTime, endTime, weeks } = this.data;
    if (!title || !startTime || !endTime || weeks <= 0) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }

    const user = wx.getStorageSync('user')
    const userId = user.id


    wx.request({
      url: `http://localhost:8080/api/health/plan/weekly?userId=${userId}`,
      method: 'POST',
      data: {
        title,
        weekDay: weekIndex + 1,
        startTime,
        endTime,
        weeks
      },
      header: { 'content-type': 'application/json' },
      success: () => {
        wx.showToast({ title: '生成成功', icon: 'success' });
        this.onCancel();
        this.loadPlans();
      }
    });
  },

  // ✅ 新增：删除计划
  onDeletePlan(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个运动计划吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `http://localhost:8080/api/health/plan/${id}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadPlans();
            }
          });
        }
      }
    });
  }
});
