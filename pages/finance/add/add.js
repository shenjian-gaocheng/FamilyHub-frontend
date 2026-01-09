Page({
  data: {
    type: '支出',
    category: '',
    amount: '',
    date: '',
    time: '',
    content: ''
  },
  onLoad(options) {
    this.fetchCategories()
    if (options && options.billId) {
      // edit mode
      const billId = parseInt(options.billId)
      const itemId = options.itemId ? parseInt(options.itemId) : null
      this.setData({ editMode: true, billId, itemId })
      const that = this
      wx.request({
        url: `http://localhost:8080/api/finance/bills/${billId}`,
        method: 'GET',
        success: (res) => {
          if (res.data && res.data.bill) {
            const bill = res.data.bill
            const items = Array.isArray(res.data.items) ? res.data.items : []
            that.setData({ originalItems: items, type: bill.type || '支出' })
            // find the item to edit
            let target = null
            if (itemId != null) {
              target = items.find(it => it.id === itemId)
            }
            if (!target && items.length > 0) target = items[0]
            if (target) {
              const isoDate = target.time ? target.time.split('T')[0] : (new Date()).toISOString().split('T')[0]
              const isoTime = target.time ? (target.time.split('T')[1] || '00:00:00').slice(0,5) : '00:00'
              that.setData({
                category: target.category || '',
                amount: (target.price || 0).toString(),
                date: isoDate,
                time: isoTime,
                content: target.content || ''
              })
            }
          }
        },
        fail: () => { wx.showToast({ title: '读取账单失败', icon: 'none' }) }
      })
    }
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

    const editMode = !!this.data.editMode
    if (!editMode) {
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
      return
    }

    // edit mode: replace the edited item inside originalItems (or replace all if missing)
    const billId = this.data.billId
    const original = this.data.originalItems || []
    const itemId = this.data.itemId
    let itemsPayload = []
    if (original.length === 0) {
      itemsPayload = [item]
    } else {
      itemsPayload = original.map(it => {
        if (itemId != null && it.id === itemId) {
          return {
            content: item.content,
            category: item.category,
            price: item.price,
            time: item.time
          }
        } else {
          return {
            content: it.content || '',
            category: it.category || '',
            price: it.price || 0,
            time: it.time || null
          }
        }
      })
    }

    const payload = {
      userId: user.id,
      type: this.data.type,
      items: itemsPayload
    }
    wx.request({
      url: `http://localhost:8080/api/finance/bills/${billId}`,
      method: 'PUT',
      data: payload,
      success: (res) => {
        if (res.data && res.data.ok) {
          wx.showToast({ title: '更新成功', icon: 'success' })
          setTimeout(() => { wx.navigateBack() }, 600)
        } else {
          wx.showToast({ title: res.data && res.data.error ? res.data.error : '更新失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})


