Page({
    data: {
      aiSuggestion: '建议每周保持 3 次以上规律运动',
  
      plans: [],
  
      showForm: false,
  
      title: '',
      date: '',
      startTime: '',
      endTime: ''
    },
  
    onLoad() {
      this.loadPlans();
    },
  
    loadPlans() {
      const user = wx.getStorageSync('user');
      const userId = user.id;
  
      wx.request({
        url: 'http://192.144.228.237:8080/api/health/plan',
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
        date: '',
        startTime: '',
        endTime: ''
      });
    },
  
    onTitleInput(e) {
      this.setData({ title: e.detail.value });
    },
  
    onDateChange(e) {
      this.setData({ date: e.detail.value });
    },
  
    onStartTimeChange(e) {
      this.setData({ startTime: e.detail.value });
    },
  
    onEndTimeChange(e) {
      this.setData({ endTime: e.detail.value });
    },
  
    onSubmit() {
      const { title, date, startTime, endTime } = this.data;
  
      if (!title || !date || !startTime || !endTime) {
        wx.showToast({ title: '请填写完整', icon: 'none' });
        return;
      }
  
      const user = wx.getStorageSync('user');
      const userId = user.id;
  
      wx.request({
        url: `http://192.144.228.237:8080/api/health/plan?userId=${userId}`,
        method: 'POST',
        data: {
          title,
          date,
          startTime,
          endTime
        },
        header: { 'content-type': 'application/json' },
        success: () => {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.onCancel();
          this.loadPlans();
        }
      });
    },
  
    onDeletePlan(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个运动计划吗？',
        success: (res) => {
          if (res.confirm) {
            wx.request({
              url: `http://192.144.228.237:8080/api/health/plan/${id}`,
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
  