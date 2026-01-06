// pages/health/health.js
Page({
  data: {
    healthScore: 82
  },
  onReady() {
    this.drawGauge(this.data.healthScore)
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

      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - 12
      const start = Math.PI * 0.75
      const span = Math.PI * 1.5
      const end = start + span

      // 背景弧
      ctx.lineWidth = 14
      ctx.strokeStyle = '#e5e8ef'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, start, end)
      ctx.stroke()

      // 渐变弧：红->黄->绿
      const grad = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY)
      grad.addColorStop(0, '#e54d42')
      grad.addColorStop(0.5, '#f5b400')
      grad.addColorStop(1, '#0cb34a')
      ctx.strokeStyle = grad

      const ratio = Math.max(0, Math.min(1, score / 100))
      const endActive = start + span * ratio
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, start, endActive)
      ctx.stroke()

      // 指针
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(endActive)
      ctx.fillStyle = '#1a73e8'
      ctx.beginPath()
      ctx.moveTo(-6, -6)
      ctx.lineTo(radius - 6, 0)
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
