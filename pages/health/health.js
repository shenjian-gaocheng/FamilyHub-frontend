// pages/health/health.js
Page({
  data: {
    healthScore: 0,
    scoreLevel: '',
    scoreText: ''
  },

  onReady() {
    this.loadLatestRating()
  },

  loadLatestRating() {
    const userId = wx.getStorageSync('userId') || 1

    wx.request({
      url: 'http://localhost:8080/api/statistics/latest-rating',
      method: 'GET',
      data: { userId },
      success: (res) => {
        const score = res.data.rating || 0
        this.setData({ healthScore: score })
        this.updateScoreUI(score)
        this.drawGauge(score)
      }
    })
  },

  updateScoreUI(score) {
    let level = 'mid'
    let text = '健康状况一般'

    if (score >= 85) {
      level = 'good'
      text = '健康状况良好'
    } else if (score < 60) {
      level = 'bad'
      text = '需要关注健康'
    }

    this.setData({
      scoreLevel: level,
      scoreText: text
    })
  },

  drawGauge(score) {
    const query = wx.createSelectorQuery()
    query.select('#gauge').fields({ node: true, size: true }).exec((res) => {
      const canvas = res[0].node
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio || 1
      const width = res[0].width
      const height = res[0].height

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      const cx = width / 2
      const cy = height / 2
      const r = Math.min(width, height) / 2 - 12

      const start = Math.PI * 0.75
      const span = Math.PI * 1.5

      // 背景弧
      ctx.lineWidth = 14
      ctx.strokeStyle = '#e5e8ef'
      ctx.beginPath()
      ctx.arc(cx, cy, r, start, start + span)
      ctx.stroke()

      // 渐变弧
      const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
      grad.addColorStop(0, '#e54d42')
      grad.addColorStop(0.5, '#f5b400')
      grad.addColorStop(1, '#0cb34a')

      ctx.strokeStyle = grad
      const ratio = Math.max(0, Math.min(1, score / 100))
      const end = start + span * ratio
      ctx.beginPath()
      ctx.arc(cx, cy, r, start, end)
      ctx.stroke()

      // 指针
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(end)
      ctx.fillStyle = '#1a73e8'
      ctx.beginPath()
      ctx.moveTo(-6, -6)
      ctx.lineTo(r - 6, 0)
      ctx.lineTo(-6, 6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    })
  },

  goPlan() {
    wx.navigateTo({ url: '/pages/health/plan/plan' })
  },
  goRecord() {
    wx.navigateTo({ url: '/pages/health/record/record' })
  },
  goReport() {
    wx.navigateTo({ url: '/pages/health/report/report' })
  },
  goStats() {
    wx.navigateTo({ url: '/pages/health/stats/stats' })
  }
})
