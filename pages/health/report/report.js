const BASE_URL = "http://localhost:8080";

Page({
  data: {
    uploads: []
  },

  onLoad() {
    this.fetchReports();
  },

  fetchReports() {
    const userId = wx.getStorageSync("userId") || 1;
    wx.request({
      url: `${BASE_URL}/api/report/list`,
      data: { userId },
      success: res => {
        this.setData({ uploads: res.data });
      }
    });
  },

  onUpload() {
    const userId = wx.getStorageSync("userId") || 1;

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
