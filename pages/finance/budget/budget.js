// pages/finance/budget/budget.js
Page({
  data: {
    month: '2026-01',
    budget: 5000,
    spent: 3200,
    categories: [
      { name: '餐饮', budget: 1500, spent: 1200 },
      { name: '出行', budget: 800, spent: 420 },
      { name: '娱乐', budget: 600, spent: 380 },
      { name: '日用', budget: 700, spent: 520 }
    ]
  },
  getRemain() {
    const { budget, spent } = this.data
    return Math.max(0, budget - spent)
  },
  getPercent(spent, budget) {
    if (budget <= 0) return 0
    return Math.min(100, Math.round((spent / budget) * 100))
  },
  getBarWidth(spent, budget) {
    if (budget <= 0) return 0
    return Math.min(100, Math.round((spent / budget) * 100))
  },
  onBudgetInput(e) {
    this.setData({ budget: Number(e.detail.value) || 0 })
  },
  onSave() {
    if (this.data.budget < 0) {
      wx.showToast({ title: '预算不能为负', icon: 'none' })
      return
    }
    wx.showToast({ title: '预算已保存（待接入）', icon: 'success' })
  }
})
