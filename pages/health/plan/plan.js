// pages/health/plan/plan.js
Page({
  data: {
    aiSuggestion: '根据你的日程与健康档案，推荐本周 3 次有氧 + 2 次力量，每次 45 分钟。',
    plans: [
      { id: 1, title: '周二晚 跑步 5km', time: '20:00 - 20:50', status: '待执行' },
      { id: 2, title: '周四 晨练 HIIT', time: '07:30 - 08:10', status: '已安排' },
      { id: 3, title: '周六 力量训练', time: '16:00 - 17:00', status: '草稿' }
    ]
  },
  onAddPlan() {
    wx.showToast({ title: '新增计划（待接入）', icon: 'none' })
  },
  onEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.showToast({ title: `编辑 ${id}（待接入）`, icon: 'none' })
  },
  onSync() {
    wx.showToast({ title: '已同步到家庭事务（占位）', icon: 'success' })
  }
})
