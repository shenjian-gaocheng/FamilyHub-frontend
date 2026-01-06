// pages/health/report/report.js
Page({
  data: {
    uploads: [
      { id: 1, name: '体检报告_2025-12.pdf', status: '已解析', notes: '血压正常，血糖稍高' },
      { id: 2, name: '体检报告_2024-12.pdf', status: '已归档', notes: '指标对齐完成' }
    ]
  },
  onUpload() {
    wx.showToast({ title: '上传功能待接入', icon: 'none' })
  },
  onView(e) {
    const { id } = e.currentTarget.dataset
    wx.showToast({ title: `查看报告 ${id}（待接入）`, icon: 'none' })
  }
})
