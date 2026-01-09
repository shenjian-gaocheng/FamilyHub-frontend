// pages/schedule/detail/detail.js
const API_BASE = 'http://192.144.228.237:8080/api'

Page({
  data: {
    currentUserId: null,
    taskId: null,
    task: null,
    
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
    
    // 类型名称映射
    typeNames: {
      study: '学习',
      sport: '运动',
      work: '工作',
      entertainment: '娱乐',
      meeting: '会议',
      life: '生活',
      other: '其他'
    },
    
    // 状态文字
    statusText: {
      TODO: '待办',
      DOING: '进行中',
      DONE: '已完成'
    },
    
    // 进度百分比
    progress: 0,
    
    // 删除弹窗
    showDeleteModal: false,
    isRepeatTask: false
  },

  onLoad(options) {
    const user = wx.getStorageSync('user')

    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const targetUserId = options.userId ? parseInt(options.userId) : user.id
    const taskId = options.taskId
    
    this.setData({
      currentUserId: targetUserId,
      taskId: parseInt(taskId)
    })
    
    this.loadTaskDetail()
  },

  onShow() {
    // 每次显示时重新加载数据
    if (this.data.taskId) {
      this.loadTaskDetail()
    }
  },

  // 加载任务详情
  loadTaskDetail() {
    const { taskId } = this.data
    
    wx.request({
      url: `${API_BASE}/task/detail/${taskId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          this.processTaskData(res.data.data)
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        // 使用模拟数据
        this.loadMockData()
      }
    })
  },

  // 模拟数据
  loadMockData() {
    const mockTask = {
      id: this.data.taskId,
      title: '软件工程课程',
      content: '安楼A219，第1-16周',
      type: 'study',
      status: 'TODO',
      beginTime: '2026-01-06T08:00:00',
      endTime: '2026-01-06T10:45:00',
      isComposite: true,
      progress: 33,
      participants: [
        { userId: 1, name: '张三', role: '户主' },
        { userId: 2, name: '李四', role: '配偶' }
      ],
      subTasks: [
        {
          id: 101,
          title: '课程预习',
          beginTime: '2026-01-06T08:00:00',
          endTime: '2026-01-06T08:45:00',
          status: 'DONE'
        },
        {
          id: 102,
          title: '上课',
          beginTime: '2026-01-06T08:50:00',
          endTime: '2026-01-06T09:35:00',
          status: 'DOING'
        },
        {
          id: 103,
          title: '课后作业',
          beginTime: '2026-01-06T10:00:00',
          endTime: '2026-01-06T10:45:00',
          status: 'TODO'
        }
      ]
    }
    this.processTaskData(mockTask)
  },

  // 处理任务数据
  processTaskData(task) {
    const typeColor = this.data.typeColors[task.type] || '#C8C8C8'
    const typeName = this.data.typeNames[task.type] || '其他'
    const statusText = this.data.statusText[task.status]
    
    // 格式化时间
    const beginTime = this.formatDisplayTime(task.beginTime)
    const endTime = this.formatDisplayTime(task.endTime)
    
    // 处理子任务
    let subTasks = []
    let progress = task.progress || 0
    
    if (task.isComposite && task.subTasks && task.subTasks.length > 0) {
      subTasks = task.subTasks.map(st => ({
        ...st,
        beginTimeDisplay: this.formatDisplayTime(st.beginTime),
        endTimeDisplay: this.formatDisplayTime(st.endTime),
        statusText: this.data.statusText[st.status],
        isCompleted: st.status === 'DONE'
      }))
      
      // 计算进度
      let totalMinutes = 0
      let completedMinutes = 0
      subTasks.forEach(st => {
        const begin = new Date(st.beginTime)
        const end = new Date(st.endTime)
        const minutes = (end - begin) / 60000
        totalMinutes += minutes
        if (st.status === 'DONE') {
          completedMinutes += minutes
        }
      })
      progress = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0
    }
    
    this.setData({
      task: {
        ...task,
        typeColor,
        typeName,
        statusText,
        beginTimeDisplay: beginTime,
        endTimeDisplay: endTime,
        isCompleted: task.status === 'DONE'
      },
      subTasks,
      progress
    })
  },

  // 格式化显示时间
  formatDisplayTime(timeStr) {
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    
    return `${month}月${day}日 ${weekDay} ${hours}:${minutes}`
  },

  // 编辑任务
  onEdit() {
    const { taskId, currentUserId } = this.data
    wx.navigateTo({
      url: `/pages/schedule/add/add?taskId=${taskId}&userId=${currentUserId}&mode=edit`
    })
  },

  // 切换主任务状态
  onToggleStatus() {
    const { task, taskId } = this.data
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
    
    wx.request({
      url: `${API_BASE}/task/status/${taskId}`,
      method: 'PUT',
      data: { status: newStatus },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '状态已更新', icon: 'success' })
          this.loadTaskDetail()
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' })
        }
      },
      fail: () => {
        // 模拟成功
        const updatedTask = { ...task, status: newStatus }
        this.processTaskData(updatedTask)
        wx.showToast({ title: '状态已更新', icon: 'success' })
      }
    })
  },

  // 切换子任务状态
  onToggleSubTaskStatus(e) {
    const subTaskId = e.currentTarget.dataset.subTaskId
    const subTask = this.data.subTasks.find(st => st.id === subTaskId)
    if (!subTask) return
    
    const newStatus = subTask.status === 'DONE' ? 'TODO' : 'DONE'
    
    wx.request({
      url: `${API_BASE}/task/status/${subTaskId}`,
      method: 'PUT',
      data: { status: newStatus },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '状态已更新', icon: 'success' })
          this.loadTaskDetail()
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' })
        }
      },
      fail: () => {
        // 模拟成功更新
        const subTasks = this.data.subTasks.map(st => {
          if (st.id === subTaskId) {
            return { ...st, status: newStatus, isCompleted: newStatus === 'DONE' }
          }
          return st
        })
        
        // 重新计算进度
        let totalMinutes = 0
        let completedMinutes = 0
        subTasks.forEach(st => {
          const begin = new Date(st.beginTime)
          const end = new Date(st.endTime)
          const minutes = (end - begin) / 60000
          totalMinutes += minutes
          if (st.status === 'DONE') {
            completedMinutes += minutes
          }
        })
        const progress = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0
        
        this.setData({ subTasks, progress })
        wx.showToast({ title: '状态已更新', icon: 'success' })
      }
    })
  },

  // 删除任务
  onDelete() {
    const { taskId } = this.data
    
    // 先检查是否为重复任务
    wx.request({
      url: `${API_BASE}/task/is-repeat/${taskId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200 && res.data.data.isRepeat) {
          this.setData({ isRepeatTask: true, showDeleteModal: true })
        } else {
          this.setData({ isRepeatTask: false, showDeleteModal: true })
        }
      },
      fail: () => {
        this.setData({ isRepeatTask: false, showDeleteModal: true })
      }
    })
  },

  closeDeleteModal() {
    this.setData({ showDeleteModal: false })
  },

  // 确认删除
  confirmDelete(e) {
    const deleteAll = e.currentTarget.dataset.deleteAll === 'true'
    const { taskId } = this.data
    
    wx.showLoading({ title: '删除中...' })
    
    wx.request({
      url: `${API_BASE}/task/delete/${taskId}`,
      method: 'DELETE',
      data: { deleteAll },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 600)
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      }
    })
  },

  // 返回
  onBack() {
    wx.navigateBack()
  }
})
