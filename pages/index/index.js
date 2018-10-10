//index.js

//获取应用实例
const app = getApp();
// 计时器
let timeOut = null;

Page({
  data: {
    isFirst: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    token: null,
    reloadState: false,
    getPageIndex: 0,
    getUpcomingIndex: 0,
    getPageTotal: 10,
    UpcomingPageTotal: 10,
    currentTab: 0, //顶部导航tab
    curEventTab: 0, //热门活动tab
    curLiveTab: 0, //直播分类tab
    curLiveCode: '', //直播分类code
    fixedState: 0, // 悬浮层状态
    srcollLeftHot: '0', //热门活动恢复
    srcollLeftLive: '0', //直播恢复
    temporaryClose: false, //直播排序暂时隐藏
    imgInfo: {
      mode: 'aspectFill',
      load: true
    },
    swipeInfo: {
      indicatorDots: false,
      autoplay: true,
      circular: true, //循环
      interval: 3000,
      duration: 500,
      currentItem: 0,
      nextMargin: '60rpx',
    },
    todayData: [], //今日投图
    hotListData: [], // 热门分类
    hotItemData: [], // 热门分类数据
    curHotTitle: '', // 当前热门分类标题
    liveListData: [], // 直播分类
    curliveTitle: '', // 当前直播分类标题
    albumList: [], //直播相册data    
    historyData: '', // 历史记录-扫码
    localSrc: {
      noList: '/assets/img/no-pic.png',
      noUser: '/assets/img/no-user.png'
    }
  },
  // 跳转扫码记录相册
  goHistoryAlbum: function () {
    let albumID = this.data.historyData.wechatMd5;
    this.setData({ historyData: '' });
    wx.navigateTo({
      url: '../album/album?albumID=' + albumID + '&source=2002'
    });
  },
  // 跳转当前相册
  goCurrentAlbum: function (e) {
    let albumID = e.currentTarget.dataset.wechatid;
    wx.navigateTo({
      url: '../album/album?albumID=' + albumID + '&source=2005'
    })
  },
  // 跳转浏览记录
  goMyLook: function () {
    wx.navigateTo({
      url: '../myLook/myLook'
    })
  },
  // 跳转投图列表
  goChoicenessList: function () {
    wx.navigateTo({
      url: '../choiceness/index'
    })
  },
  // 跳转投图详情页
  goChoicenessDetails: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../choiceness/details?id=' + id + "&source=swiper"
    })
  },
  // 跳转热门活动列表
  goActivitiesList: function () {
    let code = this.data.hotListData[this.data.curEventTab].code
    let title = this.data.curHotTitle;
    wx.navigateTo({
      url: '../activities/index?code=' + code + '&title=' + title
    })
  },
  // 跳转热门活动详情页 
  goActivitiesDetails: function (e) {
    var id = e.currentTarget.dataset.id;
    let code = this.data.hotListData[this.data.curEventTab].code;
    wx.navigateTo({
      url: '../activities/details?id=' + id + '&code=' + code
    });
  },
  // 切换顶部nav
  swichNav: function (e) {
    let index = e.currentTarget.dataset.current;
    if (index == this.data.currentTab) {
      return false;
    } else {
      this.setData({
        currentTab: index
      });
    }
  },
  // 热门活动 tab切换
  swichEvent: function (e) {
    let index = e.currentTarget.dataset.current;
    let curTab = this.data.hotListData[index];
    if (index == this.data.curEventTab) {
      return false;
    } else {
      this.setData({
        curEventTab: index,
        curHotTitle: curTab.name
      });
      this.getWonderPic(curTab.code);
    }
  },
  // 直播分类 tab 切换
  swichLiveType: function (e) {
    let index = e.currentTarget.dataset.current;
    let curCode = this.data.liveListData[index].remark;
    if (index == this.data.curLiveTab) {
      return false;
    } else {
      this.setData({
        curLiveTab: index,
        curLiveCode: curCode,
        getPageIndex: 0,
        getPageTotal: 10
      });
      this.getCurrentDayList(true);
    }
  },
  // 直播排序 切换
  swichGallerySort: function (e) {
    let index = e.currentTarget.dataset.current;
    if (index == this.data.fixedState) {
      return false;
    } else {
      this.setData({
        fixedState: index
      });
    }
  },
  // 轮播事件
  bindChange: function (e) {
    // "touch" 表示用户滑动引起的变化
    // console.log(e);
    if (e.detail.source == "touch") {
      this.setData({
        'swipeInfo.currentItem': e.detail.current
      });
    }
    if (e.detail.current == 0) {
      this.setData({
        isFirst: true
      })
    } else {
      this.setData({
        isFirst: false
      })
    }
  },
  // 处理数据内开始拍摄时间
  addTimeList: function (arr) {
    arr.map(function (item) {
      item.showTime = app.dates.FormatTimeShort(item.shootingStartTime);
    });
    return arr;
  },
  // 请求今日直播相册
  getCurrentDayList: function (switchState) {
    const arr = app.dates.formatBeforeArray(0);
    let url = "findPublicAlbumPageModel";
    let params = {
      packageId: this.data.curLiveCode,
      startTime: arr[0],
      endTime: arr[1],
      isStarted: 1,
      pageIndex: 0,
      pageSize: 10
    };
    if (this.data.reloadState || switchState) {
      params.pageIndex = 0;
      app.request.requestPostApi(url, params, "ALBUM_LIST", this.successFun, this.failFun);
    } else {
      if (this.data.albumList.length < this.data.getPageTotal) {
        params.pageIndex = this.data.getPageIndex++;
        app.request.requestPostApi(url, params, "ALBUM_LIST_MORE", this.successFun, this.failFun);
      }
    }
  },
  //请求热门活动类型列表
  getHotList: function () {
    let url = "findSubColumnListModel";
    let params = {
      moduleName: 'hots',
      columnCode: 'hots'
    };
    app.request.requestPostApi(url, params, "HOT_LIST", this.successFun, this.failFun);
  },
  //请求直播类型列表
  getLiveList: function () {
    let url = "findSubColumnListModel";
    let params = {
      moduleName: 'living',
      columnCode: 'hots'
    };
    app.request.requestPostApi(url, params, "LIVE_LIST", this.successFun, this.failFun);
  },
  //请求今日投图 || 热门活动内容
  getWonderPic: function (code) {
    let url = 'getAllColumnContentsModel';
    let params = {
      pageIndex: 0,
      pageSize: 5
    }
    if (code) {
      params.columnCode = code;
      app.request.requestPostApi(url, params, "HOT_ITEM_LIST", this.successFun, this.failFun);
    } else {
      params.columnCode = 'weapp';
      app.request.requestPostApi(url, params, "PIC_LIST", this.successFun, this.failFun);
    }
  },
  // 获取扫码记录
  findVisitHistory: function () {
    let url = "findVisitHistoryModel";
    let params = {
      sourceFromType: "QR_CODE",
      pageIndex: 0,
      pageSize: 1
    };
    app.request.requestPostApi(url, params, "VISIT_HISTORY", this.successFun, this.failFun);
  },
  // 接口成功返回数据
  successFun: function (res, code) {
    var that = this;
    switch (code) {
      case "ALBUM_LIST":
        let ListArr = [];
        if (res.code == 0){
          // let data = that.addTimeList(res.data.records);
          let data = res.data.records;
          ListArr = app.utils.clearHeadString(data);
          that.setData({
            albumList: ListArr,
            reloadState: false,
            getPageIndex: 1,
            getPageTotal: res.data.totalCount
          });
        }
        console.log("ALBUM_LIST", ListArr);
        wx.stopPullDownRefresh();
        break;
      case "ALBUM_LIST_MORE":
        let moreArr = [];
        if (res.code == 0) {
          let data = res.data.records;
          moreArr = that.data.albumList.concat(data);
          moreArr = app.utils.clearHeadString(moreArr);
          that.setData({
            albumList: moreArr,
            getPageTotal: res.data.totalCount
          });
        }
        console.log("ALBUM_LIST_MORE", moreArr);
        wx.stopPullDownRefresh();
        break;
      case "PIC_LIST":
        if (res.data.pageData) {
          let imgData = res.data.pageData;
          that.setData({
            todayData: imgData
          });
          console.log("PIC_LIST", imgData);
        }
        break;
      case "HOT_LIST":
        if (res.code == 0) {
          let hotData = res.data.subColumnList;
          if (hotData.length > 0) {
            that.setData({
              hotListData: hotData,
              curEventTab: 0,
              srcollLeftHot: 0,
              curHotTitle: hotData[0].name
            });
            that.getWonderPic(hotData[0].code);
          }
          console.log("HOT_LIST", hotData);
        };
        break;
      case "LIVE_LIST":
        if (res.code == 0) {
          let liveData = res.data.subColumnList;
          if (liveData.length > 0) {
            for (let item of liveData) {
              if (Math.abs(item.remark) > 0) {
                item.isRemark = true;
              } else {
                item.isRemark = false;
              }
            };            
            that.setData({
              liveListData: liveData
              // curLiveTab: 0,
              // srcollLeftLive: 0,
              // curliveTitle: liveData[0].name,
              // curLiveCode: liveData[0].remark  
            })
            that.getCurrentDayList(true);
          }
          console.log("LIVE_LIST", liveData);
        };
        break;        
      case "HOT_ITEM_LIST":
        let itemData = res.data.pageData;
        that.setData({
          hotItemData: itemData
        });
        wx.stopPullDownRefresh();
        console.log("HOT_ITEM_LIST", itemData);
        break;
      case "VISIT_HISTORY":
        if (res.code == 0){
          if (res.data.records) {
            let visitData = app.utils.clearHeadString(res.data.records);
            if (visitData) {
              that.setData({
                historyData: visitData[0]
              });
            };
            console.log("VISIT_HISTORY", visitData);
          }
        }
        break;
    }
  },
  // 页面数据初始化
  init: function () {
    this.getHotList();
    this.getWonderPic();
    this.getLiveList();
    if(this.data.token){
      this.findVisitHistory();
    }
  },
  // 刷新当前tab
  refreshCueTab: function () {
    if (this.data.currentTab == 0) {
      this.getWonderPic();
      this.getHotList();
    } 
    if (this.data.currentTab == 1){
      this.getLiveList();
    }
  },
  // 登录授权
  getUserInfoStatus: function () {
    let that = this;
    app.getLoginFun().then(function (info) {
      console.log("回调：", info)
      if (info) {
        app.getUserToken();
        that.getAuthCallBack();
      }
    })
  },
  // 获取授权接口返回状态
  getAuthCallBack: function () {
    let that = this;
    app.utils.loading("授权中");
    timeOut = setInterval(function () {
      let token = wx.getStorageSync('token');
      let uid = wx.getStorageSync('uid');
      if (token && uid) {
        wx.hideLoading();
        that.setData({ token: token });
        clearInterval(timeOut);
      }
    }, 500);
  },
  // 获取token
  getToken: function () {
    let token = wx.getStorageSync('token');
    if (token) {
      this.setData({ token: token });
    } else {
      this.setData({ token: null });
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getToken();
    this.init();
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getToken();
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      reloadState: true
    });
    this.refreshCueTab();
  },
  /**
   * 页面相关事件处理函数--用户滑动
   */
  onPageScroll: function (res) {

  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.currentTab == 1) {
      this.getCurrentDayList();
    }
  },

  /**
   * 用户点击右上角分享 
   */
  onShareAppMessage: function () {
    return {
      success: function (res) {
        // 转发成功
        app.sensors.track('SharePage', { share_page: '首页' });
        console.log("转发属性：", res)
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
})
