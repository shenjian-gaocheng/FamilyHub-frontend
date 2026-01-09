// pages/mine/mine.js
Page({
  data: {
    user: null,
    familyMembers: [],
    selectedMemberId: null,
    showAddMember: false,
    memberEmail: '',
    memberPassword: '',
    memberName: '',
    memberShowPwd: false
  },
  
  onLoad() {
    // TabBar refresh centralized; removed per-page refresh to avoid conflicts.
    // 获取用户信息
    const user = wx.getStorageSync('user')
    if (user) {
      // compute display initials for avatar and quick summary numbers
      const initials = (user.name || user.email || 'U').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()
      this.setData({ user, avatarInitials: initials, summaryLoaded: false, familyLoaded: false })
      // placeholders (hidden until real data loads)
      const { formatCurrency } = require('../../utils/util')
      this.setData({ summaryOut: formatCurrency(0), summaryIn: formatCurrency(0), summaryLeft: formatCurrency(0) })
      this.loadFamilyMembers()
    } else {
      // 如果没有用户信息，跳转到登录页
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },
  loadFamilyMembers() {
    const user = this.data.user
    if (user && user.familyId) {
      // backend exposes /api/family/getmembers?userId=... (and older clients may call /api/family/members?familyId=...)
      const tryGetMembers = (url) => {
        return new Promise((resolve, reject) => {
      wx.request({
            url,
        method: 'GET',
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          })
        })
      }

      const primaryUrl = `http://192.144.228.237:8080/api/family/getmembers?userId=${user.id}`
      const fallbackUrl = `http://192.144.228.237:8080/api/family/members?familyId=${user.familyId}`

      tryGetMembers(primaryUrl).then(res => {
      if (Array.isArray(res.data)) {
          // show all family members (including admin); members can view the full list
          // map returned members to include permissions derived from DB columns (task_access/health_access/finance_access)
          const members = (res.data || []).map(m => {
            const taskValRaw = m.task_access === undefined ? m.taskAccess : m.task_access
            const healthValRaw = m.health_access === undefined ? m.healthAccess : m.health_access
            const financeValRaw = m.finance_access === undefined ? m.financeAccess : m.finance_access
            const taskVal = taskValRaw === undefined || taskValRaw === null ? undefined : Number(taskValRaw)
            const healthVal = healthValRaw === undefined || healthValRaw === null ? undefined : Number(healthValRaw)
            const financeVal = financeValRaw === undefined || financeValRaw === null ? undefined : Number(financeValRaw)
            return {
              ...m,
              permissions: {
                tasks: taskVal === undefined ? true : (taskVal !== 0),
                health: healthVal === undefined ? true : (healthVal !== 0),
                finance: financeVal === undefined ? true : (financeVal !== 0)
              }
            }
          })
          // ensure permissions are boolean values
          members.forEach(m => {
            if (!m.permissions) m.permissions = { tasks: true, health: true, finance: true }
            m.permissions.tasks = !!m.permissions.tasks
            m.permissions.health = !!m.permissions.health
            m.permissions.finance = !!m.permissions.finance
          })
          this.setData({ familyMembers: members, familyLoaded: true })
          console.log('loadFamilyMembers -> members', members)
        } else {
          // fallback to older endpoint
          return tryGetMembers(fallbackUrl)
          }
      }).then(res2 => {
        if (!res2) return
        if (Array.isArray(res2.data)) {
          const members2 = (res2.data || []).map(m => {
            const taskValRaw = m.task_access === undefined ? m.taskAccess : m.task_access
            const healthValRaw = m.health_access === undefined ? m.healthAccess : m.health_access
            const financeValRaw = m.finance_access === undefined ? m.financeAccess : m.finance_access
            const taskVal = taskValRaw === undefined || taskValRaw === null ? undefined : Number(taskValRaw)
            const healthVal = healthValRaw === undefined || healthValRaw === null ? undefined : Number(healthValRaw)
            const financeVal = financeValRaw === undefined || financeValRaw === null ? undefined : Number(financeValRaw)
            return {
              ...m,
              permissions: {
                tasks: taskVal === undefined ? true : (taskVal !== 0),
                health: healthVal === undefined ? true : (healthVal !== 0),
                finance: financeVal === undefined ? true : (financeVal !== 0)
              }
            }
          })
          members2.forEach(m => {
            if (!m.permissions) m.permissions = { tasks: true, health: true, finance: true }
            m.permissions.tasks = !!m.permissions.tasks
            m.permissions.health = !!m.permissions.health
            m.permissions.finance = !!m.permissions.finance
          })
          this.setData({ familyMembers: members2, familyLoaded: true })
          console.log('loadFamilyMembers (fallback) -> members2', members2)
        } else {
          console.error('获取家庭成员返回非数组:', res2.data)
        }
      }).catch(err => {
          console.error('获取家庭成员失败:', err)
      })
    }
  },
  showAddMemberForm() {
    this.setData({ showAddMember: true })
  },
  hideAddMemberForm() {
    this.setData({
      showAddMember: false,
      memberEmail: '',
      memberPassword: '',
      memberName: '',
      memberShowPwd: false
    })
  },
  onMemberEmail(e) {
    this.setData({ memberEmail: e.detail.value })
  },
  onMemberPassword(e) {
    this.setData({ memberPassword: e.detail.value })
  },
  onMemberName(e) {
    this.setData({ memberName: e.detail.value })
  },
  toggleMemberPwd() {
    this.setData({ memberShowPwd: !this.data.memberShowPwd })
  },
  addMember() {
    const { user, memberEmail, memberPassword, memberName } = this.data

    if (!memberEmail.trim()) {
      wx.showToast({ title: '请输入成员邮箱', icon: 'none' })
      return
    }
    if (!memberPassword.trim()) {
      wx.showToast({ title: '请输入成员密码', icon: 'none' })
      return
    }
    if (!memberName.trim()) {
      wx.showToast({ title: '请输入成员姓名', icon: 'none' })
      return
    }

    wx.showLoading({ title: '添加中...' })

    wx.request({
      url: 'http://192.144.228.237:8080/api/family/add-member',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        adminId: user.id,
        memberInfo: {
          email: memberEmail,
          password: memberPassword,
          name: memberName
        }
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data && res.data.success) {
          wx.showToast({ title: '成员添加成功', icon: 'success' })
          this.hideAddMemberForm()
          this.setData({ selectedMemberId: null })
          this.loadFamilyMembers() // 重新加载成员列表
        } else {
          wx.showToast({ title: res.data.message || '添加失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('添加成员失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  },
  onPermToggle(e) {
    const admin = this.data.user
    if (!admin || admin.role !== 'admin') return
    const userId = e.currentTarget.dataset.id
    const key = e.currentTarget.dataset.key
    const checked = e.detail.value
    // find member and update local UI
    const members = this.data.familyMembers || []
    const idx = members.findIndex(m => m.id === Number(userId))
    if (idx === -1) return
    members[idx].permissions = members[idx].permissions || { tasks: true, health: true, finance: true }
    members[idx].permissions[key] = checked
    this.setData({ familyMembers: members })

    // save to backend (send only the changed field so we don't overwrite other DB columns)
    const fieldMap = { tasks: 'task_access', health: 'health_access', finance: 'finance_access' }
    const payload = { adminId: admin.id, userId: Number(userId) }
    payload[fieldMap[key]] = checked ? 1 : 0
    wx.request({
      url: 'http://192.144.228.237:8080/api/permissions',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: payload,
      success: (res) => {
        if (res.data && res.data.ok) {
          // re-fetch the saved user's permissions from backend to ensure UI matches DB
          wx.request({
            url: `http://192.144.228.237:8080/api/permissions?userId=${userId}`,
            method: 'GET',
            success: (pr) => {
              if (pr.data) {
                const perms = pr.data
                const arr = this.data.familyMembers || []
                if (idx !== -1 && arr[idx]) {
                  arr[idx].permissions = {
                    tasks: perms.tasks === undefined ? true : !!perms.tasks,
                    health: perms.health === undefined ? true : !!perms.health,
                    finance: perms.finance === undefined ? true : !!perms.finance
                  }
                  this.setData({ familyMembers: arr })
                }
                // if current logged-in user was changed, update stored user fields too
                const me = wx.getStorageSync('user')
                if (me && me.id === Number(userId)) {
                  me.task_access = perms.tasks === undefined ? 1 : (perms.tasks ? 1 : 0)
                  me.health_access = perms.health === undefined ? 1 : (perms.health ? 1 : 0)
                  me.finance_access = perms.finance === undefined ? 1 : (perms.finance ? 1 : 0)
                  wx.setStorageSync('user', me)
                }
                // refresh custom tabbars on current pages
                const pages = getCurrentPages()
                pages.forEach(p => {
                  if (typeof p.getTabBar === 'function' && p.getTabBar()) {
                    try { p.getTabBar().refresh() } catch (e) {}
                  }
                })
              }
            },
            fail: () => {
              // fallback: still refresh tabbars based on current local UI state
              const pages = getCurrentPages()
              pages.forEach(p => {
                if (typeof p.getTabBar === 'function' && p.getTabBar()) {
                  try { p.getTabBar().refresh() } catch (e) {}
                }
              })
            }
          })
        } else {
          wx.showToast({ title: '保存权限失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '保存权限失败', icon: 'none' })
      }
    })
  },
  onMemberTap(e) {
    const id = Number(e.currentTarget.dataset.id)
    const cur = this.data.selectedMemberId
    const newSelected = (cur === id ? null : id)
    this.setData({ selectedMemberId: newSelected })
    // if opened (not closed), immediately sync this member's permissions from backend
    if (newSelected === id) {
      const members = this.data.familyMembers || []
      const idx = members.findIndex(m => m.id === Number(id))
      // fetch latest permissions for this user
      wx.request({
        url: `http://192.144.228.237:8080/api/permissions?userId=${id}`,
        method: 'GET',
        success: (res) => {
          if (res.data) {
            const perms = res.data
            const arr = this.data.familyMembers || []
            if (idx !== -1 && arr[idx]) {
              arr[idx].permissions = {
                tasks: perms.tasks === undefined ? true : !!perms.tasks,
                health: perms.health === undefined ? true : !!perms.health,
                finance: perms.finance === undefined ? true : !!perms.finance
              }
              this.setData({ familyMembers: arr })
            }
            // if current logged-in user was changed, update stored user fields too
            const me = wx.getStorageSync('user')
            if (me && me.id === Number(id)) {
              me.task_access = perms.tasks === undefined ? 1 : (perms.tasks ? 1 : 0)
              me.health_access = perms.health === undefined ? 1 : (perms.health ? 1 : 0)
              me.finance_access = perms.finance === undefined ? 1 : (perms.finance ? 1 : 0)
              wx.setStorageSync('user', me)
            }
            // refresh tabbars on current pages
            const pages = getCurrentPages()
            pages.forEach(p => {
              if (typeof p.getTabBar === 'function' && p.getTabBar()) {
                try { p.getTabBar().refresh() } catch (e) {}
              }
            })
          }
        },
        fail: () => {}
      })
    }
  },
  
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('user')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  },
  fetchSummary() {
    const user = this.data.user
    if (!user) return
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const begin = `${year}-${month}-01T00:00:00`
    const end = `${year}-${month}-31T23:59:59`
    const { formatCurrency } = require('../../utils/util')
    wx.request({
      url: 'http://192.144.228.237:8080/api/finance/summary',
      method: 'GET',
      data: { userId: user.id, begin, end, scope: 'family' },
      success: (res) => {
        if (res.data) {
          const d = res.data
          this.setData({
            summaryOut: formatCurrency(d.totalOut || 0),
            summaryIn: formatCurrency(d.totalIn || 0),
            summaryLeft: formatCurrency(Math.max(0, (d.totalIn || 0) - (d.totalOut || 0))),
            summaryLoaded: true
          })
        } else {
          this.setData({ summaryLoaded: true })
        }
      },
      fail: () => {
        this.setData({ summaryLoaded: true })
      }
    })
  }
})
