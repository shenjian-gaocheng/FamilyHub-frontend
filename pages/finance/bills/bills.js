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
    detail: {},
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
    // read global finance selection (set on finance main page)
    const sel = wx.getStorageSync('finance_selected_member') || { id: 'family', name: '家庭总和' }
    const isEditable = (sel.id === 'family' || sel.id === user.id)
    this.setData({ selectedMemberId: sel.id, selectedMemberLabel: sel.name || '家庭总和', isEditable })
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
    // allow admin to select a member or family
    const sel = this.data.selectedMemberId
    const scope = (sel === 'family') ? 'family' : 'self'
    const userId = (sel === 'family') ? user.id : sel
    wx.request({
      url: 'http://localhost:8080/api/finance/summary',
      method: 'GET',
      data: { userId, begin, end, scope },
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
    const sel = this.data.selectedMemberId
    const scope = (sel === 'family') ? 'family' : 'self'
    const userId = (sel === 'family') ? user.id : sel
    wx.request({
      url: 'http://localhost:8080/api/finance/bills',
      method: 'GET',
      data: { userId, begin, end, scope },
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
                billId: bill.id,
                itemId: it.id,
                type: bill.type || '支出',
                category: it.category || '其他',
                amount: it.price || 0,
                date: it.time ? it.time.split('T')[0] : (bill.beginDate ? bill.beginDate.split('T')[0] : ''),
                note: it.content || '',
                merchant: ''
              })
            })
          })
          this.setData({ bills: flat, 'summary.count': flat.length })
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
    if (!this.data.isEditable) {
      wx.showToast({ title: '无权限导入他人账单', icon: 'none' })
      return
    }
    // 导航到导入页面
    wx.navigateTo({ url: '/pages/finance/import/import' })
  },
  onExport() {
    const user = this.data.user
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const { begin, end } = this.getMonthRange()
    const sel = this.data.selectedMemberId || 'family'
    const scope = (sel === 'family') ? 'family' : 'self'
    const userId = (sel === 'family') ? user.id : sel
    const url = `http://localhost:8080/api/finance/bills/export?userId=${encodeURIComponent(userId)}&begin=${encodeURIComponent(begin)}&end=${encodeURIComponent(end)}&scope=${encodeURIComponent(scope)}`
    wx.showLoading({ title: '导出中...' })
    // Use arraybuffer request so we can write a file with the correct .xlsx suffix
    wx.request({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      success: (res) => {
        console.log('request success', res)
        if (res.statusCode === 200 && res.data) {
          try {
            const arrayBuffer = res.data
            const base64 = wx.arrayBufferToBase64(arrayBuffer)
            const fs = wx.getFileSystemManager()
            const path = `${wx.env.USER_DATA_PATH}/bills_${Date.now()}.xlsx`
            fs.writeFile({
              filePath: path,
              data: base64,
              encoding: 'base64',
              success: () => {
                wx.hideLoading()
                console.log('writeFile success', path)
                wx.showToast({ title: '导出成功，正在打开', icon: 'success' })
                wx.openDocument({
                  filePath: path,
                  showMenu: true,
                  success: () => { console.log('openDocument success') },
                  fail: (e) => {
                    console.error('openDocument fail', e)
                    wx.showModal({ title: '打开文件失败', content: `路径：${path}\n错误：${e && e.errMsg}`, showCancel: false })
                  }
                })
              },
              fail: (e) => {
                wx.hideLoading()
                console.error('writeFile fail', e)
                wx.showModal({ title: '保存文件失败', content: '无法保存导出文件到本地。', showCancel: false })
              }
            })
          } catch (e) {
            wx.hideLoading()
            console.error('export handling error', e)
            wx.showModal({ title: '导出失败', content: String(e), showCancel: false })
          }
        } else {
          wx.hideLoading()
          console.error('request bad status', res.statusCode, res)
          wx.showModal({ title: '导出失败', content: `网络返回：${res.statusCode}`, showCancel: false })
        }
      },
      fail: (e) => {
        wx.hideLoading()
        console.error('request fail', e)
        wx.showModal({ title: '网络错误', content: '下载失败（网络或域名未配置）。请检查后端地址是否可从小程序访问。', showCancel: false })
      }
    })
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
    const detail = this.data.detail
    if (!detail || !detail.billId) {
      wx.showToast({ title: '无法编辑：缺少账单信息', icon: 'none' })
      return
    }
    // navigate to add page in edit mode, pass billId and itemId
    wx.navigateTo({
      url: `/pages/finance/add/add?billId=${detail.billId}&itemId=${detail.itemId}`,
      fail: (err) => {
        console.error('navigateTo edit failed', err)
        wx.showToast({ title: '无法打开编辑页面', icon: 'none' })
      }
    })
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
