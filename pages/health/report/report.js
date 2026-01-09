const BASE_URL = "http://192.144.228.237:8080";

Page({
  data: {
    uploads: []
  },

  onLoad() {
    this.fetchReports();
  },

  fetchReports() {
    const user = wx.getStorageSync('user')
    const userId = user.id

    wx.request({
      url: `${BASE_URL}/api/report/list`,
      data: { userId },
      success: res => {
        this.setData({ uploads: res.data });
      }
    });
  },

  onUpload() {
    const user = wx.getStorageSync('user')
    const userId = user.id


    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: res => {
        const file = res.tempFiles[0];
        wx.uploadFile({
          url: `${BASE_URL}/api/report/upload`,
          filePath: file.path,
          name: 'file',
          formData: { userId },
          success: () => {
            wx.showToast({ title: '上传成功' });
            this.fetchReports();
          }
        });
      }
    });
  },

  onView(e) {
    const file = e.currentTarget.dataset.file;
    wx.downloadFile({
      url: `${BASE_URL}/api/report/file?path=${file}`,
      success(res) {
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'pdf'
        });
      }
    });
  }
});
