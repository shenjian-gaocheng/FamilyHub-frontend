// pages/finance/budget/budget.js
const { formatCurrency } = require('../../../utils/util')

Page({
  data: {
    month: '',
    budget: 0,
    budgetFmt: '0',
    spent: 0,
    spentFmt: '0',
    leftFmt: '0',
    percent: 0,
    categories: []
  },
  // color palette for categories
  colorPalette: ['#1a73e8', '#f5b400', '#e54d42', '#0cb34a', '#9b59b6', '#34495e', '#e67e22'],
  onShow() {
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ user })
    this.loadBudget()
    // fetch available categories
    const { DEFAULT_CATEGORIES } = require('../../../utils/util')
    wx.request({
      url: 'http://localhost:8080/api/finance/category-list',
      method: 'GET',
      success: (res) => {
        if (res.data && Array.isArray(res.data.categories)) {
          this.setData({ availableCategories: res.data.categories })
        } else {
          this.setData({ availableCategories: DEFAULT_CATEGORIES })
        }
      },
      fail: () => {
        this.setData({ availableCategories: DEFAULT_CATEGORIES })
      }
    })
  },
  getMonthKey() {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`
  },
  loadBudget() {
    const user = this.data.user
    if (!user) return
    const month = this.getMonthKey()
    wx.request({
      url: 'http://localhost:8080/api/finance/budgets',
      method: 'GET',
      data: { userId: user.id, month },
      success: (res) => {
    if (res.data) {
          // expected: { month, budget, spent, categories: [{name, budget, spent}] }
          const d = res.data
          const budgetNum = Number(d.budget || 0)
          const spentNum = Number(d.spent || 0)
          const leftNum = Math.max(0, budgetNum - spentNum)
          const pct = budgetNum > 0 ? Math.min(100, Math.round((spentNum / budgetNum) * 100)) : 0
          const cats = (d.categories || []).map(c => {
            const b = Number(c.budget || 0)
            const s = Number(c.spent || 0)
            const p = b > 0 ? Math.min(100, Math.round((s / b) * 100)) : 0
            const palette = this.data.colorPalette || ['#1a73e8','#f5b400','#e54d42','#0cb34a']
            // assign color based on index in availableCategories if present; fallback by hash
            let color = palette[(Math.abs((c.name||'').split('').reduce((a,ch)=>a+ch.charCodeAt(0),0))) % palette.length]
            return {
              name: c.name || '',
              budget: b,
              budgetFmt: formatCurrency(b),
              spent: s,
              spentFmt: formatCurrency(s),
              percent: p,
              color: color
            }
          })
          this.setData({
            month: d.month || month,
            budget: budgetNum,
            budgetFmt: formatCurrency(budgetNum),
            spent: spentNum,
            spentFmt: formatCurrency(spentNum),
            leftFmt: formatCurrency(leftNum),
            percent: pct,
            categories: cats
          })
            // compute spent per category from bills and update categories' spent
          const { begin, end } = this.getMonthRangeForKey(month)
          this.fetchBillsAndComputeCategorySpent(user.id, begin, end).then(spentByCat => {
            const updated = (this.data.categories || []).map(c => {
              const s = spentByCat[c.name] || 0
              c.spent = s
              c.spentFmt = formatCurrency(s)
              c.percent = c.budget > 0 ? Math.min(100, Math.round((s / c.budget) * 100)) : 0
              // determine color from availableCategories
              const list = this.data.availableCategories || []
              const idx = list.indexOf(c.name)
              const palette = this.data.colorPalette || ['#1a73e8','#f5b400','#e54d42','#0cb34a']
              c.color = idx >= 0 ? palette[idx % palette.length] : (c.color || palette[Math.abs((c.name||'').split('').reduce((a,ch)=>a+ch.charCodeAt(0),0)) % palette.length])
              return c
            })
            const catsTotal = updated.reduce((a, b) => a + (Number(b.budget) || 0), 0)
            this.setData({
              categories: updated,
              categoriesTotalFmt: formatCurrency(catsTotal),
              mismatch: Math.abs(catsTotal - this.data.budget) > 0.01
            })
          }).catch(() => {})
        }
      },
      fail: () => {
        wx.showToast({ title: '加载预算失败', icon: 'none' })
      }
    })
  },

  getMonthRangeForKey(monthKey) {
    const [y, m] = (monthKey || this.getMonthKey()).split('-')
    const begin = `${y}-${m}-01T00:00:00`
    const end = `${y}-${m}-31T23:59:59`
    return { begin, end }
  },

  fetchBillsAndComputeCategorySpent(userId, begin, end) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:8080/api/finance/bills',
        method: 'GET',
        data: { userId, begin, end, scope: 'family' },
        success: (res) => {
          if (!Array.isArray(res.data)) { resolve({}); return }
          const map = {}
          res.data.forEach(entry => {
            const items = entry.items || []
            items.forEach(it => {
              const cat = it.category || '其他'
              const p = Number(it.price || 0)
              map[cat] = (map[cat] || 0) + p
            })
          })
          resolve(map)
        },
        fail: () => reject()
      })
    })
  },

  syncCategoriesToTotal() {
    const cats = this.data.categories || []
    const total = cats.reduce((a, b) => a + (Number(b.budget) || 0), 0)
    this.setData({
      budget: total,
      budgetFmt: formatCurrency(total),
      leftFmt: formatCurrency(Math.max(0, total - this.data.spent)),
      percent: total > 0 ? Math.min(100, Math.round((this.data.spent / total) * 100)) : 0,
      mismatch: false
    })
  },

  distributeTotalToCategories() {
    const cats = this.data.categories || []
    const total = this.data.budget || 0
    const sum = cats.reduce((a, b) => a + (Number(b.budget) || 0), 0)
    if (sum <= 0) {
      // equal distribute
      const per = Math.floor(total / Math.max(1, cats.length))
      const updated = cats.map((c, idx) => {
        c.budget = per
        c.budgetFmt = formatCurrency(per)
        c.percent = c.spent > 0 ? Math.min(100, Math.round((c.spent / per) * 100)) : 0
        return c
      })
      this.setData({ categories: updated, categoriesTotalFmt: formatCurrency(per * cats.length), mismatch: false })
      return
    }
    const updated = cats.map(c => {
      const ratio = (Number(c.budget) || 0) / sum
      const newB = Math.round(total * ratio)
      c.budget = newB
      c.budgetFmt = formatCurrency(newB)
      c.percent = c.spent > 0 ? Math.min(100, Math.round((c.spent / newB) * 100)) : 0
      return c
    })
    this.setData({ categories: updated, categoriesTotalFmt: formatCurrency(total), mismatch: false })
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
    const val = Number(e.detail.value) || 0
    this.setData({
      budget: val,
      budgetFmt: formatCurrency(val),
      leftFmt: formatCurrency(Math.max(0, val - this.data.spent)),
      percent: val > 0 ? Math.min(100, Math.round((this.data.spent / val) * 100)) : 0
    })
  },
  onSave() {
    if (this.data.budget < 0) {
      wx.showToast({ title: '预算不能为负', icon: 'none' })
      return
    }
    const user = this.data.user
    const month = this.getMonthKey()
    wx.request({
      url: 'http://localhost:8080/api/finance/budgets',
      method: 'POST',
      data: {
        userId: user.id,
        month,
        budget: this.data.budget,
        categories: this.data.categories
      },
      success: (res) => {
        wx.showToast({ title: '预算已保存', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  }
  ,
  addCategory() {
    const cats = this.data.categories || []
    cats.push({ name: '', budget: 0, budgetFmt: '0', spent: 0, spentFmt: '0', percent: 0 })
    this.setData({ categories: cats })
  },
  removeCategory(e) {
    const idx = e.currentTarget.dataset.idx
    const cats = this.data.categories || []
    cats.splice(idx, 1)
    this.setData({ categories: cats })
  },
  onCategoryNameInput(e) {
    const idx = e.currentTarget.dataset.idx
    const val = e.detail.value
    const cats = this.data.categories || []
    if (!cats[idx]) return
    cats[idx].name = val
    this.setData({ categories: cats })
  },
  onCategoryBudgetInput(e) {
    const idx = e.currentTarget.dataset.idx
    const val = Number(e.detail.value) || 0
    const cats = this.data.categories || []
    if (!cats[idx]) return
    cats[idx].budget = val
    cats[idx].budgetFmt = formatCurrency(val)
    cats[idx].percent = val > 0 ? Math.min(100, Math.round((cats[idx].spent / val) * 100)) : 0
    this.setData({ categories: cats })
  }
  ,
  onCategoryPick(e) {
    const idx = e.currentTarget.dataset.idx
    const val = e.detail.value
    const cats = this.data.categories || []
    const list = this.data.availableCategories || []
    if (!cats[idx]) return
    cats[idx].name = list[val] || cats[idx].name
    this.setData({ categories: cats })
  }
})
