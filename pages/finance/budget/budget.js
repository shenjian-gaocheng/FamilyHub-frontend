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
    selectedMemberId: 'family',
    selectedMemberLabel: '家庭总和',
    isEditable: true
  },
  onShow() {
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ user })
    // read selection from finance main page
    const sel = wx.getStorageSync('finance_selected_member') || { id: 'family', name: '家庭总和' }
    const isAdmin = user && user.role === 'admin'
    // if not admin and selection is not self, restrict view to self
    let viewUserId = sel.id
    let viewLabel = sel.name || '家庭总和'
    if (!isAdmin && String(sel.id) !== String(user.id)) {
      viewUserId = user.id
      viewLabel = user.name || user.email || ('用户' + user.id)
    }
    const isEditable = String(viewUserId) === String(user.id)
    this.setData({ selectedMemberId: viewUserId, selectedMemberLabel: viewLabel, isEditable })
    this.loadBudget()
    // no per-category UI; only total budget is supported
  },
  getMonthKey() {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`
  },
  loadBudget() {
    const user = this.data.user
    if (!user) return
    const month = this.getMonthKey()
    const sel = this.data.selectedMemberId
    const userId = (sel === 'family') ? user.id : sel
    const selScope = (this.data.selectedMemberId === 'family') ? 'family' : 'self'
    wx.request({
      url: 'http://localhost:8080/api/finance/budgets',
      method: 'GET',
      data: { userId, month, scope: selScope },
      success: (res) => {
        if (res.data) {
          const d = res.data
          const budgetNum = Number(d.budget || 0)
          const spentNum = Number(d.spent || 0)
          const leftNum = Math.max(0, budgetNum - spentNum)
          const pct = budgetNum > 0 ? Math.min(100, Math.round((spentNum / budgetNum) * 100)) : 0
          this.setData({
            month: d.month || month,
            budget: budgetNum,
            budgetFmt: formatCurrency(budgetNum),
            spent: spentNum,
            spentFmt: formatCurrency(spentNum),
            leftFmt: formatCurrency(leftNum),
            percent: pct
          })
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

  // per-category logic removed; only total budget is supported
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
    // kept for compatibility but UI no longer exposes a save button.
    const user = this.data.user
    const month = this.getMonthKey()
    if (!user) return
    const selScope = (this.data.selectedMemberId === 'family') ? 'family' : 'self'
    // save for the currently viewed user (allows admins to save for selected member)
    const targetUserId = (this.data.selectedMemberId === 'family') ? user.id : this.data.selectedMemberId
    const payload = { userId: targetUserId, month, budget: this.data.budget, scope: selScope }
    const that = this
    const doSave = (attemptsLeft) => {
      wx.request({
        url: 'http://localhost:8080/api/finance/budgets',
        method: 'POST',
        data: payload,
        success: (res) => {
          console.log('saveBudget response', res)
          if (res.data && res.data.ok) {
            wx.showToast({ title: '预算已保存', icon: 'success', duration: 800 })
            // If backend returned canonical values, use them; otherwise reload
            if (res.data.budget !== undefined && res.data.spent !== undefined) {
              const budgetNum = Number(res.data.budget || 0)
              const spentNum = Number(res.data.spent || 0)
              const leftNum = Math.max(0, budgetNum - spentNum)
              const pct = budgetNum > 0 ? Math.min(100, Math.round((spentNum / budgetNum) * 100)) : 0
              that.setData({
                budget: budgetNum,
                budgetFmt: formatCurrency(budgetNum),
                spent: spentNum,
                spentFmt: formatCurrency(spentNum),
                leftFmt: formatCurrency(leftNum),
                percent: pct
              })
            } else {
              // backend did not return canonical values; keep local UI as-is (do not force reload)
            }
          } else {
            if (attemptsLeft > 0) {
              setTimeout(() => doSave(attemptsLeft - 1), 800)
            } else {
              wx.showModal({ title: '保存失败', content: res.data && res.data.error ? res.data.error : '未知错误', showCancel: false })
            }
          }
        },
        fail: () => {
          if (attemptsLeft > 0) {
            setTimeout(() => doSave(attemptsLeft - 1), 800)
          } else {
            wx.showModal({ title: '保存失败', content: '网络错误', showCancel: false })
          }
        }
      })
    }
    doSave(2)
  }
  ,
  // per-category handlers removed
})
