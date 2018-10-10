//app.js
import request from './models/request.js';
import utils from './utils/util.js';
import dates from '/utils/dates';
import sources from '/utils/source';
import packages from '/utils/package';
import base64 from '/utils/base64';
import english from '/i18n/en.js';
import chinese from '/i18n/zh.js';

var sensors = require('/sensors/sensorsdata.js');
sensors.init();

App({
  // 自定义api
  request: request,
  utils: utils,
  dates: dates,
  sources: sources,
  packages: packages,
  Base64: base64,
  english: english,
  chinese: chinese,
  // 全局参数
  globalData: {
    token: '',
    handLoginState: false,
    loginData: null,
    langInfo: null,
    systemInfo: null,
    userInfo: null,
    encryptInfo: null,
    authInfo: null,
    curScene: ''
  },
  // 页面间数据传递
  pageBetweenData: {
    currentMergeInfo: '',
    FindFaceInfo: '',
    mergeMakeInfo: '',
    currentAlbumInfo: ''
  },
  // 应用启动
  onLaunch: function(options) {
    this.setLangInfo();
    // 获取设备信息,网络类型
    this.getUserSystemInfo();
    this.getNetworkType();
    this.checkIsToken();
  },
  // 监听小程序显示
  onShow: function (options) {
    this.globalData.curScene = options.scene;
    console.log('onShow: ', options);
  },
  //获取中英文数据
  setLangInfo: function() {
    let lang = wx.getStorageSync("lang");
    if (!!lang && lang == "en") {
      this.globalData.langInfo = english;
    } else {
      this.globalData.langInfo = chinese;
    }
  },
  // 静默授权，不获取userinfo
  loginSilent: function () {
    let that = this;
    wx.login({
      success: res => {
        if (res.code) {
          that.globalData.loginData = res;
          that.getUserToken();
          console.log("静默授权信息", res);
        } else {
          console.log('静默授权失败！' + res.errMsg);
        }
      },
      fail: function () {
        //登录失败处理
        console.log('login失败！' + res.errMsg);
      }
    });
  },
  // 授权登录，必须获取userinfo
  getLoginFun: function () {
    let that = this;
    return new Promise(function (resolve, reject) {
      wx.login({
        success: res => {
          if (res.code) {
            that.globalData.handLoginState = true;
            that.globalData.loginData = res;
            // 获取基础信息
            wx.getUserInfo({
              withCredentials: true,
              success: res => {
                wx.setStorageSync("userInfo", res.userInfo);
                that.globalData.userInfo = res.userInfo;
                that.globalData.encryptInfo = res;
                that.getUserToken();
                resolve(res);
                console.log("用户信息", res.userInfo);
              },
              fail: res => {
                resolve(false);
                // utils.openAlbumAuth("拒绝授权会导致无法访问，去打开？", "scope.userInfo");       
              }
            })
          } else {
            console.log('登录失败！' + res.errMsg);
            reject(false);
          }
        },
        fail: function () {
          //登录失败处理
          console.log('login失败！' + res.errMsg);
        }
      });
    });
  },
  // 获取用户系统信息
  getUserSystemInfo: function () {
    wx.getSystemInfo({
      success: res => {
        wx.setStorageSync("systemInfo", res);
        this.globalData.systemInfo = res;
        console.log("系统信息", res);
      }
    })
  },
  // 获取用户网络类型
  getNetworkType: function () {
    wx.getNetworkType({
      success: function (res) {
        // 返回网络类型, 有效值：
        // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
        wx.setStorageSync("network", res.networkType);
        console.log("NetworkType：", res.networkType);
      }
    });
  },
  // 判断token是否过期
  checkIsToken: function () {
    let token = wx.getStorageSync('token');
    if (!!token) {
      this.globalData.token = token;
      let url = "healthCheckModel";
      let params = {};
      request.requestPostApi(url, params, "CHECK_TOKEN", this.successFun, this.failFun);
    } else {
      this.loginSilent();
    }
  },
  // 获取基础授权
  getUserToken: function () {
    let login = this.globalData.loginData;
    let url = "authByJsCodeModel";
    let params = {
      code: login.code
    };
    request.requestPostApi(url, params, "AUTH_CODE", this.successFun, this.failFun);
  },
  // 用户信息授权
  getUserTication: function () {
    let encrypt = this.globalData.encryptInfo;
    let authInfo = this.globalData.authInfo;
    let url = "authenticationModel";
    let params = {
      sessionKey: authInfo.sessionKey,
      encryptedData: encrypt.encryptedData,
      ivStr: encrypt.iv
    };
    request.requestPostApi(url, params, "AUTH_TICATION", this.successFun, this.failFun);
  },
  // 获取uId
  getUid: function () {
    let url = "getuIdModel";
    let params = {};
    request.requestPostApi(url, params, "GET_UID", this.successFun, this.failFun);
  },
  // 接口调用成功数据集合
  successFun: function (res, code) {
    var that = this;
    switch (code) {
      case "AUTH_CODE":
        if (res.code == 0) {
          that.globalData.authInfo = res.data;
          if (res.data.token) {
            that.globalData.token = res.data.token;
            wx.setStorageSync("token", res.data.token);
            wx.setStorageSync("authInfo", res.data);
            // 如果能获取到 userid 不使用openid
            let unionId = res.data.unionId;
            sensors.login(unionId);
            that.getUid();
            console.log("AUTH_CODE:", res.data);
          }else{
            if (that.globalData.handLoginState) {
              // authByJsCode没有获取到token情况下
              that.globalData.handLoginState = false;
              that.getUserTication(); 
            };            
          };
        } else {
          console.log("AUTH_CODE:", res.code, res.message);
        }
        break;
      case "AUTH_TICATION":
        if (res.code == 0) {
          that.setStorageFun(res.data);
        } else {
          console.log("AUTH_TICATION:", res.code, res.message);
        };
        break;
      case "GET_UID":
        if (res.code == 0) {
          wx.setStorageSync("uid", res.data.uId);
        } else {
          console.log("GET_UID:", res.code, res.message);
        };
        break; 
      case "CHECK_TOKEN":
        if (res.code == 0) {
          let authInfoSt = wx.getStorageSync('authInfo');
          let unionIdCheck = authInfoSt.unionId;
          sensors.login(unionIdCheck);
        };
        break;        
    }
  },
  // setStorage and check
  setStorageFun: function (data) {
    wx.setStorageSync("token", data.token);
    wx.setStorageSync("uid", data.id);
  }

})