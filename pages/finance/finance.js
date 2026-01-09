// pages/finance/finance.js
const { formatCurrency } = require('../../utils/util')

Page({
  data: {
    summary: {
      out: formatCurrency(0),
      in: formatCurrency(0),
      budgetLeft: formatCurrency(0),
      month: ''
    }
    , recent: [],
    members: [],
    memberNames: [],
    memberIndex: 0,
    selectedMemberLabel: '家庭总和',
    selectedMemberId: 'family',
    isAdmin: false
  },

  onLoad() {
    // TabBar refresh centralized; removed per-page refresh to avoid conflicts.
  },

  onShow() {
    const user = wx.getStorageSync('user')
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ user })
    // set admin flag
    const adminFlag = user && user.role === 'admin'
    this.setData({ isAdmin: adminFlag })
    const { begin, end, monthKey } = this.getMonthRange()
    this.setData({ 'summary.month': monthKey })
    // apply selected member from global storage if present (do this BEFORE loading members to avoid overwriting)
    const sel = wx.getStorageSync('finance_selected_member') || { id: 'family', name: '家庭总和' }
    // Non-admins should not be able to switch selector — show their own info only and do not load members
    if (adminFlag) {
      this.setData({ selectedMemberId: sel.id, selectedMemberLabel: sel.name || '家庭总和' })
      this.loadFamilyMembers()
    } else {
      this.setData({ selectedMemberId: user.id, selectedMemberLabel: user.name || user.email || ('用户' + user.id) })
    }
    const scope = (sel.id === 'family') ? 'family' : 'self'
    const userId = (sel.id === 'family') ? user.id : sel.id
    this.fetchSummary(userId, begin, end, scope)
    this.fetchBudget(userId, monthKey)
    this.fetchRecent(userId, scope)
    this.fetchTrend(userId, scope)
    // TabBar refresh centralized; removed per-page refresh to avoid conflicts.
  },

  loadFamilyMembers() {
    const user = wx.getStorageSync('user')
    if (!user || !user.familyId) return
    const that = this
    wx.request({
      url: 'http://localhost:8080/api/family/members',
      method: 'GET',
      data: { familyId: user.familyId },
      success: (res) => {
        if (Array.isArray(res.data)) {
          const members = res.data.map(m => ({ id: m.id, name: m.name || m.email || ('用户' + m.id) }))
          const list = [{ id: 'family', name: '家庭总和' }].concat(members)
          // preserve existing selection from storage if present to avoid UI flicker
          const stored = wx.getStorageSync('finance_selected_member') || null
          let memberIndex = 0
          if (stored && stored.id) {
            const idx = list.findIndex(x => String(x.id) === String(stored.id))
            if (idx >= 0) memberIndex = idx
          }
          const selected = list[memberIndex]
          that.setData({
            members: list,
            memberNames: list.map(x => x.name),
            memberIndex: memberIndex,
            selectedMemberLabel: selected.name,
            selectedMemberId: selected.id
          })
          // ensure storage exists
          if (!stored) wx.setStorageSync('finance_selected_member', { id: list[0].id, name: list[0].name })
        }
      },
      fail: () => {}
    })
  },

  onMemberPick(e) {
    const idx = Number(e.detail.value || 0)
    const list = this.data.members || []
          const sel = list[idx] || { id: 'family', name: '家庭总和' }
    if (!this.data.isAdmin) {
      wx.showToast({ title: '仅家庭管理员可切换成员', icon: 'none' })
      return
    }
    this.setData({ memberIndex: idx, selectedMemberLabel: sel.name, selectedMemberId: sel.id }, () => {
      // persist selection for other pages
      wx.setStorageSync('finance_selected_member', { id: sel.id, name: sel.name })
      const { begin, end, monthKey } = this.getMonthRange()
      const user = this.data.user
      const scope = (sel.id === 'family') ? 'family' : 'self'
      const userId = (sel.id === 'family') ? user.id : sel.id
      this.fetchSummary(userId, begin, end, scope)
      this.fetchBudget(userId, monthKey)
      this.fetchRecent(userId, scope)
      this.fetchTrend(userId, scope)
    })
      // notify other open pages to refresh their data immediately (avoid stale cache)
      const pages = getCurrentPages ? getCurrentPages() : []
      pages.forEach(p => {
        try {
          if (!p || !p.route) return
          if (p.route === 'pages/finance/bills/bills' || p.route === 'pages/finance/budget/budget' || p.route === 'pages/finance/finance') {
            if (typeof p.onShow === 'function') p.onShow()
          }
        } catch (e) {}
      })
  },

  getMonthRange() {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const begin = `${year}-${month}-01T00:00:00`
    const end = `${year}-${month}-31T23:59:59`
    const monthKey = `${year}-${month}`
    return { begin, end, monthKey }
  },

  fetchSummary(userId, begin, end, scope) {
    const s = scope || 'family'
    wx.request({
      url: 'http://localhost:8080/api/finance/summary',
      method: 'GET',
      data: { userId, begin, end, scope: s },
      success: (res) => {
        if (res.data) {
          const d = res.data
          // animate numbers
          this.animateNumber('summary.out', d.totalOut || 0)
          this.animateNumber('summary.in', d.totalIn || 0)
    }
  },
      fail: () => {
        wx.showToast({ title: '获取汇总失败', icon: 'none' })
      }
    })
  },

  fetchBudget(userId, month) {
    wx.request({
      url: 'http://localhost:8080/api/finance/budgets',
      method: 'GET',
      data: { userId, month },
      success: (res) => {
        if (res.data) {
          const d = res.data
          // budget and spent are numeric, format and compute left
          const budget = Number(d.budget || 0)
          const spent = Number(d.spent || 0)
          const left = Math.max(0, budget - spent)
          this.animateNumber('summary.budgetLeft', left)
    }
  },
      fail: () => {
        wx.showToast({ title: '获取预算失败', icon: 'none' })
      }
    })
  },

  goBills() {
    wx.navigateTo({ url: '/pages/finance/bills/bills' })
  },
  goBudget() {
    wx.navigateTo({ url: '/pages/finance/budget/budget' })
  }
  ,
  animateNumber(fieldPath, target) {
    // fieldPath like 'summary.out'
    const duration = 600
    const frameRate = 30
    const steps = Math.ceil(duration / (1000 / frameRate))
    let current = 0
    const step = target / steps
    const parts = fieldPath.split('.')
    let intId = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(intId)
      }
      const formatted = formatCurrency(Math.round(current * 100) / 100)
      // set nested field
      if (parts.length === 2) {
        this.setData({ [parts[0] + '.' + parts[1]]: formatted })
      } else {
        this.setData({ [fieldPath]: formatted })
      }
    }, Math.round(1000 / frameRate))
  },

  fetchRecent(userId, scope) {
    const now = new Date()
    const end = now.toISOString()
    const beginDate = new Date(now.getTime() - 6 * 24 * 3600 * 1000)
    const begin = beginDate.toISOString()
    wx.request({
      url: 'http://localhost:8080/api/finance/bills',
      method: 'GET',
      data: { userId, begin, end, scope: scope || 'family' },
      success: (res) => {
        if (!Array.isArray(res.data)) { this.setData({ recent: [] }); return }
        const list = []
        res.data.forEach(entry => {
          const bill = entry.bill || {}
          const items = entry.items || []
          items.forEach(it => {
            list.push({
              id: it.id,
              amount: Number(it.price || 0),
              formatted: '￥' + (it.price ? formatCurrency(it.price) : '0'),
              category: it.category || '其他',
              date: (it.time || bill.beginDate || '').split('T')[0],
              time: (it.time || bill.beginDate || ''),
              type: bill.type || '支出'
            })
          })
        })
        list.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
        this.setData({ recent: list.slice(0, 5) })
      }
    })
  }
  ,
  fetchTrend(userId, scope) {
    const now = new Date()
    const end = now.toISOString()
    const beginDate = new Date(now.getTime() - 29 * 24 * 3600 * 1000)
    const begin = beginDate.toISOString()
    wx.request({
      url: 'http://localhost:8080/api/finance/trend',
      method: 'GET',
      data: { userId, begin, end, scope: scope || 'family', interval: 'daily' },
      success: (res) => {
        if (!res.data || !Array.isArray(res.data.trend)) {
          this.drawTrend([], [])
          return
        }
        // res.data.trend: [{ period: '2026-01-01', in: 0, out: 123 }, ...]
        const mapIn = {}
        const mapOut = {}
        res.data.trend.forEach(t => {
          mapIn[t.period] = Number(t.in || 0)
          mapOut[t.period] = Number(t.out || 0)
        })
        // build arrays for last 30 days
        const ins = []
        const outs = []
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 3600 * 1000)
          const key = d.toISOString().split('T')[0]
          ins.push(mapIn[key] || 0)
          outs.push(mapOut[key] || 0)
        }
        this.drawTrend(ins, outs)
      },
      fail: () => {
        this.drawTrend([], [])
      }
    })
  },

  drawTrend(inSeries, outSeries) {
    const ctx = wx.createCanvasContext('trendCanvas', this)
    const sys = wx.getSystemInfoSync()
    const dpr = sys.pixelRatio || 1
    const w = sys.windowWidth - 32 // padding
    const h = 140
    // compute max
    const maxVal = Math.max(1, ...inSeries, ...outSeries)
    const pad = 12
    const len = Math.max(inSeries.length, outSeries.length, 1)
    const stepX = (w - pad * 2) / (len - 1 || 1)
    // clear
    ctx.clearRect(0, 0, w, h)
    // background grid
    ctx.setStrokeStyle('#f0f4f9')
    ctx.setLineWidth(1)
    for (let i = 0; i < 4; i++) {
      const y = pad + (h - pad * 2) * i / 3
      ctx.beginPath()
      ctx.moveTo(pad, y)
      ctx.lineTo(w - pad, y)
      ctx.stroke()
    }
    // draw out (expense) - red
    if (outSeries.length > 0) {
      ctx.setStrokeStyle('#e54d42')
      ctx.setLineWidth(2)
      ctx.beginPath()
      outSeries.forEach((v, i) => {
        const x = pad + i * stepX
        const y = h - pad - (h - pad * 2) * (v / maxVal)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    // draw in (income) - green
    if (inSeries.length > 0) {
      ctx.setStrokeStyle('#0cb34a')
      ctx.setLineWidth(2)
      ctx.beginPath()
      inSeries.forEach((v, i) => {
        const x = pad + i * stepX
        const y = h - pad - (h - pad * 2) * (v / maxVal)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    // labels left
    ctx.setFontSize(10)
    ctx.setFillStyle('#9aa6bf')
    ctx.fillText('高 ' + formatCurrency(maxVal), pad, pad + 10)
    ctx.fillText('低 0', pad, h - pad - 2)
    ctx.draw()
  }
})
