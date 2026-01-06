// pages/health/stats/stats.js
Page({
  data: {
    member: '我',
    range: '最近30天',
    charts: [
      { id: 1, title: '体重趋势', desc: '近30天体重变化', placeholder: true },
      { id: 2, title: '睡眠时长', desc: '近30天平均睡眠 7.5h', placeholder: true },
      { id: 3, title: '运动频率', desc: '每周 3 次运动', placeholder: true }
    ],
    tips: '结合健康记录与体检报告生成 AI 建议（待接入）'
  },
  onMemberPick() {
    wx.showToast({ title: '选择成员（待接入权限）', icon: 'none' })
  },
  onRangePick() {
    wx.showToast({ title: '选择时间范围（待接入）', icon: 'none' })
  }
})
