// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // ensure native tabBar is hidden (we use a custom tabbar component)
    try { if (wx.hideTabBar) wx.hideTabBar() } catch (e) {}
  },
  globalData: {
    userInfo: null
  }
})
