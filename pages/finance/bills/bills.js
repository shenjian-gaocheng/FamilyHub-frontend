// pages/finance/bills/bills.js
Page({
  data: {
    summary: {
      month: '',
      totalOut: 0,
      totalIn: 0,
      count: 0
    },
    categories: [
      { key: 'all', label: '全部' },
      { key: 'out', label: '支出' },
      { key: 'in', label: '收入' }
    ],
    currentCategory: 'all',
    bills: [],
    filteredBills: [],
    showDetail: false,
    detail: {}
  },
  onShow() {
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ user })
    this.fetchSummary()
    this.fetchBills()
  },
  getMonthRange() {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const begin = `${year}-${month}-01T00:00:00`
    const end = `${year}-${month}-31T23:59:59`
    return { begin, end }
  },
  fetchSummary() {
    const user = this.data.user
    if (!user) return
    const { begin, end } = this.getMonthRange()
    wx.request({
      url: 'http://localhost:8080/api/finance/summary',
      method: 'GET',
      data: { userId: user.id, begin, end, scope: 'family' },
      success: (res) => {
        if (res.data) {
          const d = res.data
          const { formatCurrency } = require('../../../utils/util')
          this.setData({
            summary: {
              month: (new Date()).getFullYear() + '-' + ((new Date()).getMonth() + 1).toString().padStart(2, '0'),
              totalOut: formatCurrency(d.totalOut || 0),
              totalIn: formatCurrency(d.totalIn || 0),
              count: (d.dailyTrend || []).length
            }
          })
        }
      },
      fail: () => {
        wx.showToast({ title: '获取汇总失败', icon: 'none' })
      }
    })
  },
  fetchBills() {
    const user = this.data.user
    if (!user) return
    const { begin, end } = this.getMonthRange()
    wx.request({
      url: 'http://localhost:8080/api/finance/bills',
      method: 'GET',
      data: { userId: user.id, begin, end, scope: 'family' },
      success: (res) => {
        if (Array.isArray(res.data)) {
          // API returns list of { bill, items }
          const flat = []
          res.data.forEach(entry => {
            const bill = entry.bill || {}
            const items = entry.items || []
            items.forEach(it => {
              flat.push({
                id: it.id,
                type: bill.type || '支出',
                category: it.category || '其他',
                amount: it.price || 0,
                date: it.time ? it.time.split('T')[0] : (bill.beginDate ? bill.beginDate.split('T')[0] : ''),
                note: it.content || '',
                merchant: ''
              })
            })
          })
          this.setData({ bills: flat })
    this.applyFilter(this.data.currentCategory)
        }
      },
      fail: () => {
        wx.showToast({ title: '获取账单失败', icon: 'none' })
      }
    })
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
    // navigate to add page (implement separately) or open a modal
    wx.navigateTo({
      url: '/pages/finance/add/add',
      success: () => {},
      fail: (err) => {
        console.error('navigateTo add failed', err)
        wx.showToast({ title: '无法打开新增页面，请重启小程序', icon: 'none' })
      }
    })
  },
  onImport() {
    wx.showToast({ title: '导入账单（待实现）', icon: 'none' })
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
    wx.showToast({ title: '修改账单（待实现）', icon: 'none' })
  },
  onDeleteDetail() {
    const detail = this.data.detail
    if (!detail || !detail.id) return
    wx.request({
      url: `http://localhost:8080/api/finance/bills/${detail.id}`,
      method: 'DELETE',
      success: (res) => {
        if (res.data && res.data.ok) {
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.fetchBills()
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
        this.closeDetail()
      },
      fail: () => {
        wx.showToast({ title: '删除请求失败', icon: 'none' })
    this.closeDetail()
      }
    })
  }
})
