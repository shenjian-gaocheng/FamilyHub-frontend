// pages/finance/bills/bills.js
Page({
  data: {
    summary: {
      month: '2026-01',
      totalOut: 3200,
      totalIn: 8500,
      count: 12
    },
    categories: [
      { key: 'all', label: '全部' },
      { key: 'out', label: '支出' },
      { key: 'in', label: '收入' },
      { key: 'transfer', label: '转账' },
      { key: 'refund', label: '退款' }
    ],
    currentCategory: 'all',
    bills: [
      { id: 1, type: '支出', category: '餐饮', amount: 68, date: '2026-01-05', note: '午餐', merchant: '公司食堂' },
      { id: 2, type: '支出', category: '出行', amount: 42, date: '2026-01-05', note: '地铁公交', merchant: '交通卡' },
      { id: 3, type: '收入', category: '工资', amount: 8500, date: '2026-01-01', note: '1月工资', merchant: '公司' }
    ],
    filteredBills: [],
    showDetail: false,
    detail: {}
  },
  onShow() {
    this.applyFilter(this.data.currentCategory)
  },
  applyFilter(key) {
    const list = this.data.bills.filter(item => {
      if (key === 'all') return true
      if (key === 'out') return item.type === '支出'
      if (key === 'in') return item.type === '收入'
      if (key === 'transfer') return item.type === '转账'
      if (key === 'refund') return item.type === '退款'
      return true
    })
    this.setData({ currentCategory: key, filteredBills: list })
  },
  onCategoryTap(e) {
    const { key } = e.currentTarget.dataset
    this.applyFilter(key)
  },
  onAdd() {
    wx.showToast({ title: '新增账单（待接入）', icon: 'none' })
  },
  onImport() {
    wx.showToast({ title: '导入账单（待接入）', icon: 'none' })
  },
  onBillTap(e) {
    const { id } = e.currentTarget.dataset
    const detail = this.data.bills.find(b => b.id === id)
    if (!detail) return
    this.setData({ detail, showDetail: true })
  },
  closeDetail() {
    this.setData({ showDetail: false })
  },
  onEditDetail() {
    wx.showToast({ title: '修改账单（待接入）', icon: 'none' })
  },
  onDeleteDetail() {
    wx.showToast({ title: '删除账单（待接入）', icon: 'none' })
    this.closeDetail()
  }
})
