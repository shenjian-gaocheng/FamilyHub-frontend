// pages/finance/finance.js
Page({
  data: {
    summary: {
      out: 3200,
      in: 8500,
      budgetLeft: 1800
    }
  },
  goBills() {
    wx.navigateTo({ url: '/pages/finance/bills/bills' })
  },
  goBudget() {
    wx.navigateTo({ url: '/pages/finance/budget/budget' })
  }
})
