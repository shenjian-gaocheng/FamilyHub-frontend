// pages/schedule/schedule.js
const app = getApp()
const API_BASE = 'http://localhost:8080/api'

Page({
  data: {
    currentUserId: null, // 从 app.globalData 获取
    viewUserId: null, // 当前查看的用户ID
    year: 2026,
    month: 1,
    weekOfYear: 1,
    weekStartDate: null, // 当前周的周一
    selectedDay: null,
    
    // 家庭成员列表
    familyMembers: [],
    showMemberSelector: false,
    
    // 时间段配置（对应课表的节次）
    timeSlots: [
      { id: 0, start: '00:00', end: '02:00', label: '00:00' },
      { id: 1, start: '02:00', end: '04:00', label: '02:00' },
      { id: 2, start: '04:00', end: '06:00', label: '04:00' },
      { id: 3, start: '06:00', end: '08:00', label: '06:00' },
      { id: 4, start: '08:00', end: '10:00', label: '08:00' },
      { id: 5, start: '10:00', end: '12:00', label: '10:00' },
      { id: 6, start: '12:00', end: '14:00', label: '12:00' },
      { id: 7, start: '14:00', end: '16:00', label: '14:00' },
      { id: 8, start: '16:00', end: '18:00', label: '16:00' },
      { id: 9, start: '18:00', end: '20:00', label: '18:00' },
      { id: 10, start: '20:00', end: '22:00', label: '20:00' },
      { id: 11, start: '22:00', end: '24:00', label: '22:00' }
    ],
    
    // 一周的日期
    weekDays: [],
    
    // 任务数据，按位置分组
    taskMatrix: {}, // key: "dayIndex-slotId", value: task info
    
    // 原始任务数据
    tasks: [],
    
    // 详情弹窗
    showDetail: false,
    detail: {},
    
    // 类型颜色映射
    typeColors: {
      study: '#FF6B6B',
      sport: '#4ECDC4',
      work: '#FFE66D',
      entertainment: '#95E1D3',
      meeting: '#DDA0DD',
      life: '#87CEEB',
      other: '#C8C8C8'
    },
    
    // 状态文字
    statusText: {
      TODO: '待办',
      DOING: '进行中',
      DONE: '已完成'
    },

    // 滑动相关
    touchStartX: 0,
    touchEndX: 0
  },

  onLoad() {
    const user = wx.getStorageSync('user')

    if (user && user.id) {
      this.setData({
        currentUserId: user.id,
        viewUserId: user.id
      })

      this.initWeek(new Date())
      this.loadFamilyMembers()
    } else {
      wx.redirectTo({ url: '/pages/login/login' })
    }

  },

  onShow() {
    const user = wx.getStorageSync('user')
    
    if (user && user.id) {
      if (this.data.currentUserId !== user.id) {
        this.setData({ 
          currentUserId: user.id,
          viewUserId: user.id 
        })
        this.loadFamilyMembers()
        if (this.data.weekStartDate) {
          this.initWeek(new Date()) 
        }
      }
      
      if (this.data.weekStartDate) {
        this.loadWeeklyTasks()
      }
    } else {
      wx.redirectTo({ url: '/pages/login/login' })
    }
    // TabBar refresh is centralized (login / permission change). Removed per-page refresh to avoid conflicts.
  },

  // 加载家庭成员列表
  loadFamilyMembers() {
    const user = wx.getStorageSync('user')
    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    
    wx.request({
      url: `${API_BASE}/task/family-members`,
      method: 'GET',
      data: { userId: user.id },
      success: (res) => {
        if (res.data.code === 200) {
          const members = res.data.data || []
          this.setData({ familyMembers: members })
        }
      },
      fail: () => {
      }
    })
  },

  // 切换成员选择器
  toggleMemberSelector() {
    this.setData({ showMemberSelector: !this.data.showMemberSelector })
  },

  closeMemberSelector() {
    this.setData({ showMemberSelector: false })
  },

  // 选择家庭成员
  onSelectMember(e) {
    const userId = e.currentTarget.dataset.userId
    this.setData({ 
      viewUserId: userId,
      showMemberSelector: false
    })
    this.loadWeeklyTasks()
  },

  // 获取当前查看成员的名字
  getViewMemberName() {
    const { familyMembers, viewUserId, currentUserId } = this.data
    if (viewUserId === currentUserId) {
      return '我的'
    }
    const member = familyMembers.find(m => m.userId === viewUserId)
    return member ? member.name + '的' : '我的'
  },

  // 初始化周视图
  initWeek(date) {
    const weekStart = this.getWeekStart(date)
    const weekDays = this.generateWeekDays(weekStart)
    const { month, weekOfYear, year } = this.calcDateInfo(weekStart)
    
    this.setData({
      weekStartDate: weekStart,
      weekDays,
      month,
      weekOfYear,
      year,
      selectedDay: date.getDate()
    })
    
    this.loadWeeklyTasks()
  },

  // 获取周一日期
  getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  },

  // 生成一周的日期
  generateWeekDays(weekStart) {
    const days = []
    const labels = ['一', '二', '三', '四', '五', '六', '日']
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      days.push({
        label: labels[i],
        day: d.getDate(),
        month: d.getMonth() + 1,
        fullDate: this.formatDate(d),
        date: d
      })
    }
    return days
  },

  // 计算日期信息
  calcDateInfo(d) {
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const weekOfYear = this.getWeekNumber(d)
    return { month, weekOfYear, year }
  },

  // 获取周数
  getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  // 格式化日期时间
  formatDateTime(date) {
    return `${this.formatDate(date)}T00:00:00`
  },

  // 加载周任务数据
  loadWeeklyTasks() {
    const { viewUserId, weekStartDate } = this.data
    if (!viewUserId) return
    
    const weekStartStr = this.formatDateTime(weekStartDate)
    
    wx.request({
      url: `${API_BASE}/task/weekly`,
      method: 'GET',
      data: {
        userId: viewUserId, // 使用 viewUserId 而不是 currentUserId
        weekStart: weekStartStr
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.processTasksForDisplay(res.data.data)
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        // 使用模拟数据用于测试
        this.loadMockData()
      }
    })
  },

  // 处理任务数据用于显示
  processTasksForDisplay(tasks) {
    const { weekDays, timeSlots } = this.data
    const SLOT_HEIGHT = 60; 
    const PX_PER_MIN = SLOT_HEIGHT / 120;

    const tasksByDay = Array.from({ length: 7 }, () => []);
    const processedTasks = [];
    
    tasks.forEach(task => {
      // 如果是复合事务，需要为每个子任务创建渲染块
      if (task.isComposite && task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(subTask => {
          const beginTime = new Date(subTask.beginTime)
          const endTime = new Date(subTask.endTime)
          
          const dayIndex = weekDays.findIndex(d => 
            d.fullDate === this.formatDate(beginTime)
          )
          
          if (dayIndex === -1) return
          
          const startSlotIndex = this.findSlotIndex(beginTime, timeSlots);
          const startTotalMinutes = beginTime.getHours() * 60 + beginTime.getMinutes();
          const endTotalMinutes = endTime.getHours() * 60 + endTime.getMinutes();
          const durationMinutes = endTotalMinutes - startTotalMinutes;
          const slotStartMinutes = startSlotIndex * 120;
          const topOffset = (startTotalMinutes - slotStartMinutes) * PX_PER_MIN;
          const height = Math.max(20, durationMinutes * PX_PER_MIN);

          // 为子任务创建渲染对象，但关联到父任务
          const subTaskInfo = {
            ...task, // 继承父任务的所有属性
            subTaskId: subTask.id, // 记录子任务ID
            subTaskTitle: subTask.title, // 子任务标题
            subTaskStatus: subTask.status, // 子任务状态
            dayIndex,
            startSlotId: timeSlots[startSlotIndex].id,
            
            // 样式属性
            top: topOffset,
            height: height,
            displayColor: task.typeColor || this.data.typeColors[task.type] || '#C8C8C8',
            isCompleted: subTask.status === 'DONE',
            
            // 标记这是复合事务的子块
            isSubTaskBlock: true,
            parentTaskId: task.id,
            
            // 默认宽度属性
            width: 100,
            left: 0
          }
          
          processedTasks.push(subTaskInfo)
          tasksByDay[dayIndex].push(subTaskInfo);
        })
      } else {
        // 普通任务的处理逻辑不变
        const beginTime = new Date(task.beginTime)
        const endTime = new Date(task.endTime)
        
        const dayIndex = weekDays.findIndex(d => 
          d.fullDate === this.formatDate(beginTime)
        )
        
        if (dayIndex === -1) return
        
        const startSlotIndex = this.findSlotIndex(beginTime, timeSlots);
        const startTotalMinutes = beginTime.getHours() * 60 + beginTime.getMinutes();
        const endTotalMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        const slotStartMinutes = startSlotIndex * 120;
        const topOffset = (startTotalMinutes - slotStartMinutes) * PX_PER_MIN;
        const height = Math.max(20, durationMinutes * PX_PER_MIN);

        const taskInfo = {
          ...task,
          dayIndex,
          startSlotId: timeSlots[startSlotIndex].id,
          
          top: topOffset,
          height: height,
          displayColor: task.typeColor || this.data.typeColors[task.type] || '#C8C8C8',
          isCompleted: task.status === 'DONE',
          isSubTaskBlock: false,
          
          width: 100,
          left: 0
        }
        
        processedTasks.push(taskInfo)
        tasksByDay[dayIndex].push(taskInfo);
      }
    })
    
    // 处理多任务重叠逻辑
    const finalTasks = [];
    tasksByDay.forEach(dayTasks => {
      if (dayTasks.length === 0) return;
      dayTasks.forEach(taskA => {
        let overlapCount = 1;
        let index = 0;
        dayTasks.forEach(taskB => {
          if (taskA.id === taskB.id && taskA.subTaskId === taskB.subTaskId) return;
          
          // 计算重叠时需要考虑实际的开始和结束时间
          let startA, endA, startB, endB;
          
          if (taskA.isSubTaskBlock) {
            const subTaskA = taskA.subTasks.find(st => st.id === taskA.subTaskId);
            startA = new Date(subTaskA.beginTime).getTime();
            endA = new Date(subTaskA.endTime).getTime();
          } else {
            startA = new Date(taskA.beginTime).getTime();
            endA = new Date(taskA.endTime).getTime();
          }
          
          if (taskB.isSubTaskBlock) {
            const subTaskB = taskB.subTasks.find(st => st.id === taskB.subTaskId);
            startB = new Date(subTaskB.beginTime).getTime();
            endB = new Date(subTaskB.endTime).getTime();
          } else {
            startB = new Date(taskB.beginTime).getTime();
            endB = new Date(taskB.endTime).getTime();
          }
          
          if (Math.max(startA, startB) < Math.min(endA, endB)) {
            overlapCount++;
            if (taskB.id < taskA.id || (taskB.id === taskA.id && taskB.subTaskId < taskA.subTaskId)) {
              index++;
            }
          }
        });
        if (overlapCount > 1) {
          taskA.width = 100 / overlapCount;
          taskA.left = index * taskA.width;
        }
        finalTasks.push(taskA);
      });
    });

    this.setData({ tasks: finalTasks })
  },

  // 找到时间对应的时间段索引
  findSlotIndex(time, slots, isEnd = false) {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    
    const totalMinutes = hours * 60 + minutes;
    let slotIndex = Math.floor(totalMinutes / 120);
    
    if (isEnd && totalMinutes % 120 === 0 && totalMinutes > 0) {
      slotIndex--;
    }
    
    return Math.min(Math.max(slotIndex, 0), 11);
  },

  // 获取格子的任务
  getTaskAtCell(dayIndex, slotId) {
    const key = `${dayIndex}-${slotId}`
    return this.data.taskMatrix[key]
  },

  // 选择日期
  onSelectDate(e) {
    const day = e.currentTarget.dataset.day
    this.setData({ selectedDay: day })
  },

  // 点击日期进入日历
  onDateTap(e) {
    const { fullDate } = e.currentTarget.dataset
    const { viewUserId } = this.data
    wx.navigateTo({
      url: `/pages/schedule/calendar/calendar?date=${fullDate}&userId=${viewUserId}`
    })
  },

  // 上一周
  onPrevWeek() {
    const prevWeek = new Date(this.data.weekStartDate)
    prevWeek.setDate(prevWeek.getDate() - 7)
    this.initWeek(prevWeek)
  },

  // 下一周
  onNextWeek() {
    const nextWeek = new Date(this.data.weekStartDate)
    nextWeek.setDate(nextWeek.getDate() + 7)
    this.initWeek(nextWeek)
  },

  // 滑动开始
  onTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX
    })
  },

  // 滑动结束
  onTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchEndX - this.data.touchStartX
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.onPrevWeek()
      } else {
        this.onNextWeek()
      }
    }
  },

  // 添加日程
  onAdd() {
    const user = wx.getStorageSync('user')
    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    
    wx.navigateTo({ 
      url: `/pages/schedule/add/add?userId=${user.id}` 
    })
  },

  // 统计
  onStatistics() {
    const { viewUserId } = this.data
    wx.navigateTo({
      url: `/pages/schedule/statistics/statistics?userId=${viewUserId}`
    })
  },

  // 点击任务
  onEventTap(e) {
    const taskId = e.currentTarget.dataset.taskId
    const task = this.data.tasks.find(t => t.id === taskId)
    if (task) {
      // 如果是复合事务的子块，显示父任务信息
      if (task.isSubTaskBlock) {
        // 可以选择显示子任务的额外信息
        this.setData({ 
          detail: {
            ...task,
            displayTitle: task.title, // 父任务标题
            currentSubTask: task.subTaskTitle, // 当前子任务
            currentSubTaskStatus: task.subTaskStatus
          }, 
          showDetail: true 
        })
      } else {
        this.setData({ detail: task, showDetail: true })
      }
    }
  },

  // 关闭详情
  closeDetail() {
    this.setData({ showDetail: false })
  },

  // 查看详情
  onViewDetail() {
    const { detail, viewUserId } = this.data
    // 使用 parentTaskId 如果存在，否则使用 id
    const taskId = detail.parentTaskId || detail.id
    wx.navigateTo({
      url: `/pages/schedule/detail/detail?taskId=${taskId}&userId=${viewUserId}`
    })
    this.closeDetail()
  },

  // 编辑
  onEdit() {
    const { detail, currentUserId } = this.data
    const taskId = detail.parentTaskId || detail.id

    const user = wx.getStorageSync('user')
    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    wx.navigateTo({
      url: `/pages/schedule/add/add?taskId=${taskId}&userId=${currentUserId}&mode=edit`
    })
    this.closeDetail()
  },

  // 标记完成/未完成
  onToggleStatus() {
    const { detail } = this.data
    
    // 如果是复合事务的子任务块，更新子任务状态
    if (detail.isSubTaskBlock) {
      const newStatus = detail.subTaskStatus === 'DONE' ? 'TODO' : 'DONE'
      
      wx.request({
        url: `${API_BASE}/task/status/${detail.subTaskId}`,
        method: 'PUT',
        data: { status: newStatus },
        success: (res) => {
          if (res.data.code === 200) {
            wx.showToast({ title: '状态已更新', icon: 'success' })
            this.closeDetail()
            this.loadWeeklyTasks()
          } else {
            wx.showToast({ title: res.data.message, icon: 'none' })
          }
        },
        fail: () => {
          wx.showToast({ title: '状态已更新', icon: 'success' })
          this.closeDetail()
          this.loadWeeklyTasks()
        }
      })
    } else {
      // 普通任务的状态切换
      const newStatus = detail.status === 'DONE' ? 'TODO' : 'DONE'
      
      wx.request({
        url: `${API_BASE}/task/status/${detail.id}`,
        method: 'PUT',
        data: { status: newStatus },
        success: (res) => {
          if (res.data.code === 200) {
            wx.showToast({ title: '状态已更新', icon: 'success' })
            this.closeDetail()
            this.loadWeeklyTasks()
          } else {
            wx.showToast({ title: res.data.message, icon: 'none' })
          }
        },
        fail: () => {
          wx.showToast({ title: '状态已更新', icon: 'success' })
          this.closeDetail()
          this.loadWeeklyTasks()
        }
      })
    }
  },

  // 删除
  onDelete() {
    const { detail } = this.data
    const taskId = detail.parentTaskId || detail.id
    
    // 先检查是否为重复任务
    wx.request({
      url: `${API_BASE}/task/is-repeat/${taskId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200 && res.data.data.isRepeat) {
          this.showDeleteOptions()
        } else {
          this.confirmDelete(false)
        }
      },
      fail: () => {
        this.confirmDelete(false)
      }
    })
  },

  showDeleteOptions() {
    wx.showActionSheet({
      itemList: ['仅删除本次', '删除所有重复任务'],
      success: (res) => {
        this.confirmDelete(res.tapIndex === 1)
      }
    })
  },

  confirmDelete(deleteAll) {
    wx.showModal({
      title: '确认删除',
      content: deleteAll ? '确定删除所有重复任务吗？' : '确定删除此任务吗？',
      success: (res) => {
        if (res.confirm) {
          this.executeDelete(deleteAll)
        }
      }
    })
  },

  executeDelete(deleteAll) {
    const { detail } = this.data
    const taskId = detail.parentTaskId || detail.id
    
    wx.request({
      url: `${API_BASE}/task/delete/${taskId}`,
      method: 'DELETE',
      data: { deleteAll },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.closeDetail()
          this.loadWeeklyTasks()
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.closeDetail()
        this.loadWeeklyTasks()
      }
    })
  },

  // 返回今天
  onBackToToday() {
    this.initWeek(new Date())
  }
  
})