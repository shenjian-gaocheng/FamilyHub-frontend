// pages/finance/import/import.js
Page({
  data: {
    filePath: '',
    fileName: '',
    uploading: false,
    result: ''
  },
  chooseFile() {
    const self = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success(res) {
        const file = res.tempFiles[0]
        self.setData({ filePath: file.path, fileName: file.name })
      },
      fail() { wx.showToast({ title: '选择文件失败', icon: 'none' }) }
    })
  },
  uploadFile() {
    const path = this.data.filePath
    if (!path) {
      wx.showToast({ title: '请先选择文件', icon: 'none' })
      return
    }
    this.setData({ uploading: true, result: '' })
    wx.uploadFile({
      url: 'http://localhost:8080/api/finance/import/upload',
      filePath: path,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.ok) {
            this.setData({ result: '已导入: ' + (data.imported || 0) + ' 条' })
            wx.showToast({ title: '导入完成', icon: 'success' })
          } else {
            this.setData({ result: '错误: ' + (data.error || '导入失败') })
            wx.showToast({ title: data.error || '导入失败', icon: 'none' })
          }
        } catch (e) {
          this.setData({ result: '解析响应失败' })
        }
      },
      fail: () => {
        wx.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => { this.setData({ uploading: false }) }
    })
  }
})




