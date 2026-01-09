const BASE_URL = "http://192.144.228.237:8080";

function formatDateTime(date) {
  const pad = n => n < 10 ? '0' + n : n;
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} `
       + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

Page({
  data: {
    members: [],
    selectedMemberId: null,
    selectedMemberName: "",

    begin: "",
    end: "",
    rangeText: "最近30天",

    sleepAvg: 0,
    sportCount: 0,
    diets: [],
    indexCompare: [],

    tips: ""
  },

  onLoad() {
    this.initRange();
    this.loadMembers();
  },

  initRange() {
    const now = new Date();
    const begin = new Date(now.getTime() - 30 * 86400000);
    this.setData({
      begin: formatDateTime(begin),
      end: formatDateTime(now)
    });
  },

  loadMembers() {
    const user = wx.getStorageSync('user')
    const userId = user.id


    wx.request({
      url: `${BASE_URL}/api/family/getmembers`,
      data: { userId },
      success: res => {
        const members = res.data || [];
        if (!members.length) return;

        this.setData({
          members,
          selectedMemberId: members[0].id,
          selectedMemberName: members[0].name
        });
        this.fetchData();
      }
    });
  },

  onMemberChange(e) {
    const m = this.data.members[e.detail.value];
    this.setData({
      selectedMemberId: m.id,
      selectedMemberName: m.name
    });
    this.fetchData();
  },

  onRangeChange(e) {
    const daysArr = [7, 30, 90];
    const days = daysArr[e.detail.value];
    const now = new Date();
    const begin = new Date(now.getTime() - days * 86400000);

    this.setData({
      begin: formatDateTime(begin),
      end: formatDateTime(now),
      rangeText: `最近${days}天`
    });

    this.fetchData();
  },

  fetchData() {
    const { selectedMemberId, begin, end } = this.data;
    if (!selectedMemberId) return;

    wx.request({
      url: `${BASE_URL}/api/statistics/data`,
      data: {
        userId: selectedMemberId,
        begin,
        end
      },
      success: res => {
        const d = res.data || {};
        this.setData({
          sleepAvg: (d.sleepAvg || 0).toFixed(1),
          sportCount: d.sportCount || 0,
          diets: d.diets || [],
          indexCompare: d.indexCompare || []
        });
      }
    });
  },

  onGenerate() {
    const { selectedMemberId, begin, end } = this.data;

    wx.request({
      url: `${BASE_URL}/api/statistics/ai-report`,
      method: "POST",
      data: {
        userId: selectedMemberId,
        begin,
        end
      },
      success: res => {
        this.setData({
          tips: res.data.report
        });
      }
    });
  }
});
