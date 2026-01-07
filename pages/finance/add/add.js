Page({
  data: {
    type: '支出',
    category: '',
    amount: '',
    date: '',
    time: '',
    content: ''
  },
  onLoad() {
    this.fetchCategories()
  },
  fetchCategories() {
    const { DEFAULT_CATEGORIES } = require('../../../utils/util')
    wx.request({
      url: 'http://localhost:8080/api/finance/category-list',
      method: 'GET',
      success: (res) => {
        if (res.data && Array.isArray(res.data.categories)) {
          this.setData({ categoriesList: res.data.categories, categoryIndex: 0, category: res.data.categories[0] })
        } else {
          this.setData({ categoriesList: DEFAULT_CATEGORIES, categoryIndex: 0, category: DEFAULT_CATEGORIES[0] })
        }
      },
      fail: () => {
        this.setData({ categoriesList: DEFAULT_CATEGORIES, categoryIndex: 0, category: DEFAULT_CATEGORIES[0] })
      }
    })
  },
  setType(e) {
    const t = e.currentTarget.dataset.type
    if (t) this.setData({ type: t })
  },
  onCategoryPick(e) {
    const idx = e.detail.value
    const list = this.data.categoriesList || []
    this.setData({ categoryIndex: idx, category: list[idx] })
  },
  onCategoryInput(e) {
    this.setData({ category: e.detail.value })
  },
  onAmountInput(e) {
    // allow decimals
    const val = e.detail.value
    this.setData({ amount: val })
  },
  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },
  onTimeChange(e) {
    this.setData({ time: e.detail.value })
  },
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },
  onSubmit() {
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const amount = parseFloat(this.data.amount)
    if (!this.data.category || isNaN(amount) || amount <= 0) {
      wx.showToast({ title: '请填写正确的类别与金额', icon: 'none' })
      return
    }

    const date = this.data.date || new Date().toISOString().split('T')[0]
    const time = this.data.time || '00:00'
    // construct ISO-like string: yyyy-MM-ddTHH:mm:00
    const timeStr = `${date}T${time}:00`

    const item = {
      content: this.data.content || '',
      category: this.data.category,
      price: amount,
      time: timeStr
    }

    const payload = {
      userId: user.id,
      type: this.data.type,
      items: [item]
    }

    wx.request({
      url: 'http://localhost:8080/api/finance/bills',
      method: 'POST',
      data: payload,
      success: (res) => {
        if (res.data && res.data.ok) {
          wx.showToast({ title: '新增成功', icon: 'success' })
          setTimeout(() => { wx.navigateBack() }, 600)
        } else {
          wx.showToast({ title: res.data && res.data.error ? res.data.error : '新增失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})


