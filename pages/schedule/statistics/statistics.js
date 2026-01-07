// pages/schedule/statistics/statistics.js
const API_BASE = 'http://localhost:8080/api'

Page({
  data: {
    currentUserId: null,
    
    // 时间范围
    period: 'week', // week, month, year
    periodOptions: [
      { key: 'week', label: '本周' },
      { key: 'month', label: '本月' },
      { key: 'year', label: '本年' }
    ],
    
    // 统计数据
    statistics: [],
    totalMinutes: 0,
    
    // 类型配置
    typeConfig: {
      study: { label: '学习', color: '#FF6B6B' },
      sport: { label: '运动', color: '#4ECDC4' },
      work: { label: '工作', color: '#FFE66D' },
      entertainment: { label: '娱乐', color: '#95E1D3' },
      meeting: { label: '会议', color: '#DDA0DD' },
      life: { label: '生活', color: '#87CEEB' },
      other: { label: '其他', color: '#C8C8C8' }
    },
    
    // 饼图数据
    pieData: []
  },

  // Canvas 相关（作为实例变量，不在 data 中）
  canvas: null,
  ctx: null,
  canvasWidth: 300,
  canvasHeight: 300,

  onLoad(options) {
    const user = wx.getStorageSync('user')
    if (!user || !user.id) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    const targetUserId = options.userId ? parseInt(options.userId) : user.id
    
    this.setData({
      currentUserId: targetUserId
    })
    
    // 加载统计数据
    this.loadStatistics()
  },

  onReady() {
    // 页面渲染完成后初始化 Canvas
    this.initCanvas()
  },

  // 初始化 Canvas
  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#pieCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          
          // 获取设备像素比
          const dpr = wx.getSystemInfoSync().pixelRatio
          
          // 设置 Canvas 实际尺寸
          canvas.width = this.canvasWidth * dpr
          canvas.height = this.canvasHeight * dpr
          
          // 缩放上下文以匹配设备像素比
          ctx.scale(dpr, dpr)
          
          // 保存到实例变量
          this.canvas = canvas
          this.ctx = ctx
          
          console.log('Canvas 初始化成功')
          
          if (this.data.pieData.length > 0) {
            this.drawPieChart()
          }
        } else {
          console.error('Canvas 初始化失败')
        }
      })
  },

  // 切换时间范围
  onPeriodChange(e) {
    const period = e.currentTarget.dataset.period
    this.setData({ period })
    this.loadStatistics()
  },

  // 加载统计数据
  loadStatistics() {
    const { currentUserId, period } = this.data
    
    wx.showLoading({ title: '加载中...' })
    
    wx.request({
      url: `${API_BASE}/task/statistics`,
      method: 'GET',
      data: {
        userId: currentUserId,
        period
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          console.log('API 返回数据:', res.data.data)
          this.processStatistics(res.data.data)
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('请求失败:', err)
      }
    })
  },

  // 处理统计数据
  processStatistics(data) {
    const { typeConfig } = this.data
    
    if (!data || data.length === 0) {
      this.setData({
        statistics: [],
        totalMinutes: 0,
        pieData: []
      })
      return
    }
    
    let totalMinutes = 0
    const statistics = data.map(item => {
      totalMinutes += item.totalMinutes
      const config = typeConfig[item.type] || typeConfig.other
      return {
        type: item.type,
        label: config.label,
        color: config.color,
        totalMinutes: item.totalMinutes,
        percentage: item.percentage,
        durationText: this.formatDuration(item.totalMinutes)
      }
    }).sort((a, b) => b.totalMinutes - a.totalMinutes)
    
    // 准备饼图数据
    const pieData = statistics
      .filter(item => item.percentage > 0)
      .map(item => ({
        value: item.percentage,
        color: item.color,
        label: item.label
      }))
    
    console.log('处理后的统计数据:', statistics)
    console.log('饼图数据:', pieData)
    
    this.setData({
      statistics,
      totalMinutes,
      pieData
    }, () => {
      // 数据更新完成后，如果 Canvas 已初始化，则绘制饼图
      if (this.ctx) {
        this.drawPieChart()
      } else {
        console.log('Canvas 尚未初始化，等待 onReady')
      }
    })
  },

  // 格式化时长
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}分钟`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours}小时`
    }
    return `${hours}小时${mins}分钟`
  },

  // 绘制饼图
  drawPieChart() {
    const { pieData, totalMinutes } = this.data
    const ctx = this.ctx
    
    if (!ctx) {
      console.warn('Canvas 上下文未初始化')
      return
    }
    
    if (pieData.length === 0) {
      console.warn('没有饼图数据')
      return
    }
    
    console.log('开始绘制饼图')
    
    const centerX = this.canvasWidth / 2
    const centerY = this.canvasHeight / 2
    const radius = Math.min(centerX, centerY) - 30
    
    // 清空画布
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    
    let startAngle = -Math.PI / 2 // 从12点钟方向开始
    
    pieData.forEach((item, index) => {
      const sliceAngle = (item.value / 100) * 2 * Math.PI
      
      // 绘制扇形
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()
      
      // 绘制白色边框
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 计算标签位置（只为大于5%的扇形显示标签）
      if (item.value >= 5) {
        const labelAngle = startAngle + sliceAngle / 2
        const labelRadius = radius * 0.7
        const labelX = centerX + Math.cos(labelAngle) * labelRadius
        const labelY = centerY + Math.sin(labelAngle) * labelRadius
        
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${item.value.toFixed(1)}%`, labelX, labelY)
      }
      
      startAngle += sliceAngle
    })
    
    // 绘制中心圆（创建环形效果）
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff'
    ctx.fill()
    
    // 中心文字
    ctx.fillStyle = '#1a3a5c'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('总时长', centerX, centerY - 12)
    ctx.font = '14px sans-serif'
    ctx.fillStyle = '#5a7a9a'
    ctx.fillText(this.formatDuration(totalMinutes), centerX, centerY + 12)
    
    console.log('饼图绘制完成')
  },

  // 返回
  onBack() {
    wx.navigateBack()
  }
})