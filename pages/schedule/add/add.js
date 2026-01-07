// pages/schedule/add/add.js
const app = getApp() 
const API_BASE = 'http://localhost:8080/api'

Page({
  data: {
    currentUserId: null,
    mode: 'add', // add 或 edit
    taskId: null,
    
    // 表单数据
    title: '',
    content: '',
    type: 'study',
    beginDate: '',
    beginTime: '08:00',
    endDate: '',
    endTime: '09:00',
    
    // 类型选项
    typeOptions: [
      { key: 'study', label: '学习', color: '#FF6B6B' },
      { key: 'sport', label: '运动', color: '#4ECDC4' },
      { key: 'work', label: '工作', color: '#FFE66D' },
      { key: 'entertainment', label: '娱乐', color: '#95E1D3' },
      { key: 'meeting', label: '会议', color: '#DDA0DD' },
      { key: 'life', label: '生活', color: '#87CEEB' },
      { key: 'other', label: '其他', color: '#C8C8C8' }
    ],
    
    // 参与人员
    familyMembers: [],
    selectedParticipants: [],
    showParticipantPicker: false,
    
    // 复合事务
    isComposite: false,
    subTasks: [],
    showSubTaskForm: false,
    editingSubTaskIndex: -1,
    subTaskForm: {
      title: '',
      beginDate: '',
      beginTime: '08:00',
      endDate: '',
      endTime: '09:00'
    },
    
    // 重复设置
    isRepeat: false,
    repeatWeeks: 1,
    
    // 状态
    status: 'TODO',
    statusOptions: [
      { key: 'TODO', label: '待办' },
      { key: 'DOING', label: '进行中' },
      { key: 'DONE', label: '已完成' }
    ],
    
    // 冲突信息
    conflictInfo: null
  },

  onLoad(options) {
    const user = wx.getStorageSync('user')

    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    const targetUserId = options.userId ? parseInt(options.userId) : user.id
    
    const mode = options.mode || 'add'
    const taskId = options.taskId
    const date = options.date || this.formatDate(new Date())
    
    this.setData({
      currentUserId: targetUserId,
      mode,
      taskId: taskId ? parseInt(taskId) : null,
      beginDate: date,
      endDate: date
    })
    
    wx.setNavigationBarTitle({
      title: mode === 'edit' ? '编辑日程' : '添加日程'
    })
    
    this.loadFamilyMembers()
    
    if (mode === 'edit' && taskId) {
      this.loadTaskDetail(taskId)
    }
  },

  // 加载家庭成员
  loadFamilyMembers() {
    const { currentUserId } = this.data
    
    wx.request({
      url: `${API_BASE}/task/family-members`,
      method: 'GET',
      data: { userId: currentUserId },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ familyMembers: res.data.data })
        }
      },
      fail: () => {
        // 模拟数据
        this.setData({
          familyMembers: [
            { userId: 1, name: '张三', role: '户主' },
            { userId: 2, name: '李四', role: '配偶' },
            { userId: 3, name: '张小明', role: '子女' }
          ]
        })
      }
    })
  },

  // 加载任务详情
  loadTaskDetail(taskId) {
    wx.request({
      url: `${API_BASE}/task/detail/${taskId}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          const task = res.data.data
          this.populateForm(task)
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  // 填充表单数据
  populateForm(task) {
    const beginDateTime = task.beginTime.split('T')
    const endDateTime = task.endTime.split('T')
    
    this.setData({
      title: task.title,
      content: task.content || '',
      type: task.type,
      beginDate: beginDateTime[0],
      beginTime: beginDateTime[1].substring(0, 5),
      endDate: endDateTime[0],
      endTime: endDateTime[1].substring(0, 5),
      status: task.status,
      selectedParticipants: task.participants ? task.participants.map(p => p.userId) : [],
      isComposite: task.isComposite || false,
      subTasks: task.subTasks ? task.subTasks.map(st => ({
        id: st.id,
        title: st.title,
        beginDate: st.beginTime.split('T')[0],
        beginTime: st.beginTime.split('T')[1].substring(0, 5),
        endDate: st.endTime.split('T')[0],
        endTime: st.endTime.split('T')[1].substring(0, 5),
        status: st.status
      })) : []
    })
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  // 获取今天日期
  getTodayDate() {
    return this.formatDate(new Date())
  },

  // 输入事件
  onTitleInput(e) {
    this.setData({ title: e.detail.value, conflictInfo: null })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 类型选择
  onTypeChange(e) {
    this.setData({ type: e.currentTarget.dataset.key })
  },

  // 日期时间选择
  onBeginDateChange(e) {
    const value = e.detail.value
    if (value < this.getTodayDate() && this.data.mode === 'add') {
      wx.showToast({ title: '不能选择过去的日期', icon: 'none' })
      return
    }
    this.setData({ beginDate: value, conflictInfo: null })
    
    // 如果结束日期早于开始日期，自动调整
    if (this.data.endDate < value) {
      this.setData({ endDate: value })
    }
  },

  onBeginTimeChange(e) {
    this.setData({ beginTime: e.detail.value, conflictInfo: null })
  },

  onEndDateChange(e) {
    const value = e.detail.value
    if (value < this.data.beginDate) {
      wx.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
      return
    }
    this.setData({ endDate: value, conflictInfo: null })
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value, conflictInfo: null })
  },

  // 状态选择
  onStatusChange(e) {
    this.setData({ status: e.currentTarget.dataset.key })
  },

  // 参与人员选择
  showParticipantSelector() {
    this.setData({ showParticipantPicker: true })
  },

  closeParticipantPicker() {
    this.setData({ showParticipantPicker: false })
  },

  toggleParticipant(e) {
    const userId = e.currentTarget.dataset.userId
    let { selectedParticipants } = this.data
    
    if (selectedParticipants.includes(userId)) {
      selectedParticipants = selectedParticipants.filter(id => id !== userId)
    } else {
      selectedParticipants = [...selectedParticipants, userId]
    }
    
    this.setData({ selectedParticipants, conflictInfo: null })
  },

  confirmParticipants() {
    this.closeParticipantPicker()
  },

  // 复合事务开关
  onCompositeChange(e) {
    this.setData({ 
      isComposite: e.detail.value,
      subTasks: e.detail.value ? this.data.subTasks : []
    })
  },

  // 子任务管理
  showAddSubTask() {
    this.setData({
      showSubTaskForm: true,
      editingSubTaskIndex: -1,
      subTaskForm: {
        title: '',
        beginDate: this.data.beginDate,
        beginTime: '08:00',
        endDate: this.data.beginDate,
        endTime: '09:00'
      }
    })
  },

  editSubTask(e) {
    const index = e.currentTarget.dataset.index
    const subTask = this.data.subTasks[index]
    this.setData({
      showSubTaskForm: true,
      editingSubTaskIndex: index,
      subTaskForm: { ...subTask }
    })
  },

  deleteSubTask(e) {
    const index = e.currentTarget.dataset.index
    const subTasks = [...this.data.subTasks]
    subTasks.splice(index, 1)
    this.setData({ subTasks })
    this.updateParentTimeFromSubTasks();
  },

  closeSubTaskForm() {
    this.setData({ showSubTaskForm: false })
  },

  onSubTaskTitleInput(e) {
    this.setData({ 'subTaskForm.title': e.detail.value })
  },

  onSubTaskBeginDateChange(e) {
    const newDate = e.detail.value
    const { endDate, endTime, beginTime } = this.data.subTaskForm
    
    let updateData = { 'subTaskForm.beginDate': newDate }

    // 如果新的开始日期晚于当前结束日期，将结束日期也设为同一天
    if (newDate > endDate) {
      updateData['subTaskForm.endDate'] = newDate
    } 
    // 如果日期变成了同一天，且开始时间晚于结束时间，调整结束时间
    else if (newDate === endDate && beginTime > endTime) {
       updateData['subTaskForm.endTime'] = beginTime
    }

    this.setData(updateData)
  },

  onSubTaskBeginTimeChange(e) {
    const newTime = e.detail.value
    const { beginDate, endDate, endTime } = this.data.subTaskForm
    
    let updateData = { 'subTaskForm.beginTime': newTime }

    // 如果在同一天，且新的开始时间晚于结束时间，自动将结束时间同步为开始时间
    if (beginDate === endDate && newTime > endTime) {
      updateData['subTaskForm.endTime'] = newTime
    }

    this.setData(updateData)
  },

  onSubTaskEndDateChange(e) {
    const newDate = e.detail.value
    const { beginDate } = this.data.subTaskForm

    // 校验：结束日期不能早于开始日期
    if (newDate < beginDate) {
      wx.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
      // 强制重置回开始日期
      this.setData({ 'subTaskForm.endDate': beginDate })
      return
    }

    this.setData({ 'subTaskForm.endDate': newDate })
  },

  onSubTaskEndTimeChange(e) {
    const newTime = e.detail.value
    const { beginDate, endDate, beginTime } = this.data.subTaskForm

    // 校验：如果是同一天，结束时间不能早于开始时间
    if (beginDate === endDate && newTime < beginTime) {
      wx.showToast({ title: '结束时间不能早于开始时间', icon: 'none' })
      // 强制重置回开始时间
      this.setData({ 'subTaskForm.endTime': beginTime })
      return
    }

    this.setData({ 'subTaskForm.endTime': newTime })
  },
  updateParentTimeFromSubTasks() {
    const { subTasks } = this.data;
    if (!subTasks || subTasks.length === 0) return;

    const firstTask = subTasks[0];
    
    let latestEndDate = firstTask.endDate;
    let latestEndTime = firstTask.endTime;

    subTasks.forEach(task => {
      const currentEnd = `${task.endDate}T${task.endTime}`;
      const maxEnd = `${latestEndDate}T${latestEndTime}`;
      if (currentEnd > maxEnd) {
        latestEndDate = task.endDate;
        latestEndTime = task.endTime;
      }
    });

    this.setData({
      beginDate: firstTask.beginDate,
      beginTime: firstTask.beginTime,
      endDate: latestEndDate,
      endTime: latestEndTime
    });
  },
  checkSubTaskOverlap(newItem, excludeIndex = -1) {
    const { subTasks } = this.data
    const newStart = new Date(`${newItem.beginDate}T${newItem.beginTime}:00`).getTime()
    const newEnd = new Date(`${newItem.endDate}T${newItem.endTime}:00`).getTime()

    for (let i = 0; i < subTasks.length; i++) {
      // 如果是编辑模式，跳过当前正在编辑的这个任务本身
      if (i === excludeIndex) continue

      const existItem = subTasks[i]
      const existStart = new Date(`${existItem.beginDate}T${existItem.beginTime}:00`).getTime()
      const existEnd = new Date(`${existItem.endDate}T${existItem.endTime}:00`).getTime()
      if (newStart < existEnd && newEnd > existStart) {
        return true // 存在重叠
      }
    }
    return false // 无重叠
  },
  saveSubTask() {
    const { subTaskForm, editingSubTaskIndex, subTasks } = this.data
    
    if (!subTaskForm.title.trim()) {
      wx.showToast({ title: '请输入子任务标题', icon: 'none' })
      return
    }

    const startStr = `${subTaskForm.beginDate}T${subTaskForm.beginTime}`
    const endStr = `${subTaskForm.endDate}T${subTaskForm.endTime}`
    if (endStr < startStr) {
       wx.showToast({ title: '结束时间不能早于开始时间', icon: 'none' })
       return
    }

    if (this.checkSubTaskOverlap(subTaskForm, editingSubTaskIndex)) {
      wx.showToast({ title: '该时间段与其他子任务重叠', icon: 'none' })
      return
    }
    
    if (editingSubTaskIndex >= 0) {
      subTasks[editingSubTaskIndex] = { ...subTaskForm }
    } else {
      subTasks.push({ ...subTaskForm, status: 'TODO' })
    }
    
    // 按开始时间排序
    subTasks.sort((a, b) => {
      const timeA = `${a.beginDate}T${a.beginTime}`
      const timeB = `${b.beginDate}T${b.beginTime}`
      return timeA.localeCompare(timeB)
    })
    
    this.setData({ subTasks, showSubTaskForm: false })
    this.updateParentTimeFromSubTasks();
  },

  // 重复设置
  onRepeatChange(e) {
    this.setData({ isRepeat: e.detail.value })
  },

  onRepeatWeeksChange(e) {
    this.setData({ repeatWeeks: parseInt(e.detail.value) })
  },

  // 提交表单
  onSubmit() {
    const { 
      title, content, type, beginDate, beginTime, endDate, endTime,
      selectedParticipants, isComposite, subTasks, isRepeat, repeatWeeks,
      status, mode, taskId, currentUserId
    } = this.data
    
    // 验证
    if (!title.trim()) {
      wx.showToast({ title: '请输入日程标题', icon: 'none' })
      return
    }
    
    // 构建请求数据
    const beginDateTime = `${beginDate}T${beginTime}:00`
    const endDateTime = `${endDate}T${endTime}:00`
    
    // 验证时间
    if (mode === 'add' && beginDateTime < new Date().toISOString()) {
      wx.showToast({ title: '不能创建过去的任务', icon: 'none' })
      return
    }
    
    if (endDateTime <= beginDateTime && !isComposite) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
      return
    }
    
    const requestData = {
      title: title.trim(),
      content: content.trim(),
      type,
      beginTime: beginDateTime,
      endTime: endDateTime,
      participantIds: selectedParticipants.length > 0 ? selectedParticipants : [currentUserId],
      isComposite,
      subTasks: isComposite ? subTasks.map(st => ({
        id: st.id,
        title: st.title,
        beginTime: `${st.beginDate}T${st.beginTime}:00`,
        endTime: `${st.endDate}T${st.endTime}:00`,
        status: st.status || 'TODO'
      })) : null,
      isRepeat,
      repeatWeeks: isRepeat ? repeatWeeks : 1,
      status
    }
    
    wx.showLoading({ title: '保存中...' })
    
    if (mode === 'edit') {
      this.updateTask(taskId, requestData)
    } else {
      this.createTask(requestData)
    }
  },

  createTask(data) {
    const { currentUserId } = this.data
    
    wx.request({
      url: `${API_BASE}/task/create`,
      method: 'POST',
      data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: '创建成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 600)
        } else {
          this.setData({ conflictInfo: res.data.message })
          wx.showToast({ title: res.data.message, icon: 'none', duration: 3000 })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      }
    })
  },

  updateTask(taskId, data) {
    wx.request({
      url: `${API_BASE}/task/update/${taskId}`,
      method: 'PUT',
      data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          wx.showToast({ title: '更新成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 600)
        } else {
          this.setData({ conflictInfo: res.data.message })
          wx.showToast({ title: res.data.message, icon: 'none', duration: 3000 })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '更新成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      }
    })
  },

  // 获取选中参与者的名字
  getSelectedParticipantNames() {
    const { familyMembers, selectedParticipants } = this.data
    return familyMembers
      .filter(m => selectedParticipants.includes(m.userId))
      .map(m => m.name)
      .join('、') || '点击选择'
  }
})
