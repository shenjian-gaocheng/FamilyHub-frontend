// pages/schedule/calendar/calendar.js
const API_BASE = 'http://localhost:8080/api'

Page({
  data: {
    currentUserId: null,
    currentYear: 2026,
    currentMonth: 1,
    selectedDate: null,
    
    // 日历数据
    calendarDays: [],
    
    // 有任务的日期
    datesWithTasks: [],
    
    // 星期标签
    weekLabels: ['一', '二', '三', '四', '五', '六', '日'],
    
    // 选中日期的任务列表
    dayTasks: [],
    showTaskList: false
  },

  onLoad(options) {
    const user = wx.getStorageSync('user')
    
    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const targetUserId = options.userId ? parseInt(options.userId) : user.id

    let date = new Date()
    if (options.date) {
      date = new Date(options.date)
    }
    
    this.setData({
      currentUserId: targetUserId, // 使用处理后的真实 ID
      currentYear: date.getFullYear(),
      currentMonth: date.getMonth() + 1,
      selectedDate: this.formatDate(date)
    })
    
    this.generateCalendar()
    this.loadDatesWithTasks()
  },
  // 生成日历
  generateCalendar() {
    const { currentYear, currentMonth } = this.data
    const days = []
    
    // 获取本月第一天是星期几（0-6，0是周日）
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    let startDay = firstDay.getDay()
    startDay = startDay === 0 ? 6 : startDay - 1 // 转换为周一开始
    
    // 获取本月天数
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    
    // 获取上月天数
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate()
    
    // 填充上月日期
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth - 1 || 12,
        year: currentMonth === 1 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
        fullDate: this.formatDateFromParts(
          currentMonth === 1 ? currentYear - 1 : currentYear,
          currentMonth - 1 || 12,
          daysInPrevMonth - i
        )
      })
    }
    
    // 填充本月日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        fullDate: this.formatDateFromParts(currentYear, currentMonth, i)
      })
    }
    
    // 填充下月日期（补齐6行）
    const totalCells = Math.ceil(days.length / 7) * 7
    const remaining = totalCells - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: currentMonth + 1 > 12 ? 1 : currentMonth + 1,
        year: currentMonth === 12 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
        fullDate: this.formatDateFromParts(
          currentMonth === 12 ? currentYear + 1 : currentYear,
          currentMonth + 1 > 12 ? 1 : currentMonth + 1,
          i
        )
      })
    }
    
    this.setData({ calendarDays: days })
  },

  // 加载有任务的日期
  loadDatesWithTasks() {
    const { currentUserId, currentYear, currentMonth } = this.data
    
    wx.request({
      url: `${API_BASE}/task/calendar/dates`,
      method: 'GET',
      data: {
        userId: currentUserId,
        year: currentYear,
        month: currentMonth
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ datesWithTasks: res.data.data || [] })
        }
      },
      fail: () => {
        // 模拟数据
        this.setData({
          datesWithTasks: [
            `${currentYear}-${String(currentMonth).padStart(2, '0')}-06`,
            `${currentYear}-${String(currentMonth).padStart(2, '0')}-07`,
            `${currentYear}-${String(currentMonth).padStart(2, '0')}-08`,
            `${currentYear}-${String(currentMonth).padStart(2, '0')}-13`,
            `${currentYear}-${String(currentMonth).padStart(2, '0')}-14`,
            `${currentYear}-${String(currentMonth).padStart(2, '0')}-20`
          ]
        })
      }
    })
  },

  // 检查日期是否有任务
  hasTask(fullDate) {
    return this.data.datesWithTasks.includes(fullDate)
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatDateFromParts(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  },

  // 上一月
  onPrevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentYear--
      currentMonth = 12
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
    this.loadDatesWithTasks()
  },

  // 下一月
  onNextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentYear++
      currentMonth = 1
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
    this.loadDatesWithTasks()
  },

  // 选择年份
  onYearChange(e) {
    const currentYear = parseInt(e.detail.value)
    this.setData({ currentYear })
    this.generateCalendar()
    this.loadDatesWithTasks()
  },

  // 选择月份
  onMonthChange(e) {
    const currentMonth = parseInt(e.detail.value)
    this.setData({ currentMonth })
    this.generateCalendar()
    this.loadDatesWithTasks()
  },

  // 点击日期
  onDateTap(e) {
    const { fullDate, isCurrentMonth } = e.currentTarget.dataset
    
    this.setData({ selectedDate: fullDate })
    
    // 如果点击的不是当前月，切换到对应月份
    if (!isCurrentMonth) {
      const [year, month] = fullDate.split('-').map(Number)
      this.setData({
        currentYear: year,
        currentMonth: month
      })
      this.generateCalendar()
      this.loadDatesWithTasks()
    }
    
    // 加载该日期的任务
    this.loadDayTasks(fullDate)
  },

  // 加载某天的任务
  loadDayTasks(date) {
    const { currentUserId } = this.data
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))
    
    wx.request({
      url: `${API_BASE}/task/weekly`,
      method: 'GET',
      data: {
        userId: currentUserId,
        weekStart: `${this.formatDate(weekStart)}T00:00:00`
      },
      success: (res) => {
        if (res.data.code === 200) {
          const tasks = res.data.data.filter(task => {
            const taskDate = task.beginTime.split('T')[0]
            return taskDate === date
          })
          this.setData({ dayTasks: tasks, showTaskList: true })
        }
      },
      fail: () => {
        // 模拟数据
        if (this.data.datesWithTasks.includes(date)) {
          this.setData({
            dayTasks: [
              {
                id: 1,
                title: '示例任务',
                content: '这是一个示例任务',
                type: 'study',
                typeColor: '#FF6B6B',
                status: 'TODO',
                beginTime: `${date}T09:00:00`,
                endTime: `${date}T11:00:00`
              }
            ],
            showTaskList: true
          })
        } else {
          this.setData({ dayTasks: [], showTaskList: true })
        }
      }
    })
  },

  // 关闭任务列表
  closeTaskList() {
    this.setData({ showTaskList: false })
  },

  // 点击任务查看详情
  onTaskTap(e) {
    const taskId = e.currentTarget.dataset.taskId
    wx.navigateTo({
      url: `/pages/schedule/detail/detail?taskId=${taskId}&userId=${this.data.currentUserId}`
    })
  },

  // 添加任务
  onAddTask() {
    const { selectedDate, currentUserId } = this.data
    wx.navigateTo({
      url: `/pages/schedule/add/add?userId=${currentUserId}&date=${selectedDate}`
    })
  },

  // 返回周视图
  onBackToWeek() {
    const { selectedDate } = this.data
    wx.navigateBack({
      success: () => {
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 1]
        if (prevPage && prevPage.initWeek) {
          prevPage.initWeek(new Date(selectedDate))
        }
      }
    })
  },

  // 快速跳转到今天
  onGoToToday() {
    const today = new Date()
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1,
      selectedDate: this.formatDate(today)
    })
    this.generateCalendar()
    this.loadDatesWithTasks()
  }
})
