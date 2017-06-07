/**
 * Created by busyrat on 2017/5/10.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  AlertIOS,
} from 'react-native';
import Button from 'react-native-button'
// import CountDownAll from 'react-native-sk-countdown'
// const CountDown = require('react-native-sk-countdown').CountDown
import {CountDownText} from 'react-native-sk-countdown'

import request from '../common/request'
import config from '../common/config'

const Login = React.createClass({
  getInitialState(){
    return {
      phoneNumber: '',
      verifyCode: '',
      codeSent: false,
      content: '',
      countingDone: false
    }
  },

  _submit() {
    let that = this
    let phoneNumber = this.state.phoneNumber
    let verifyCode = this.state.verifyCode

    // TODO:判断是否是手机号
    if (!phoneNumber || !verifyCode) {
      return AlertIOS.alert('手机或验证码不能为空')
    }

    let body = {
      phoneNumber: phoneNumber,
      verifyCode: verifyCode
    }

    let verifyURL = config.api.base + config.api.verify
    request.post(verifyURL, body)
      .then((data) => {
        if (data && data.success) {
          // console.log(data)
          this.props.afterLogin(data.data)
        } else {
          AlertIOS.alert('登录失败!!!')
        }
      })
      .catch((err) => {
        console.log(err);
        AlertIOS.alert('获取验证码失败, 请检查网络')
      })
  },

  _sendVerifyCode() {
    let that = this
    let phoneNumber = this.state.phoneNumber

    // TODO:判断是否是手机号
    if (!phoneNumber) {
      return AlertIOS.alert('手机不能为空')
    }

    let body = {
      phoneNumber: phoneNumber
    }

    let signupURL = config.api.base + config.api.signup
    request.post(signupURL, body)
      .then((data) => {
        if (data && data.success) {
          that._showVerifyCode()
        } else {
          AlertIOS.alert('获取验证码失败!!!')
        }
      })
      .catch((err) => {
        console.log(err);
        AlertIOS.alert('获取验证码失败, 请检查网络')
      })
  },

  _showVerifyCode() {
    this.setState({

      codeSent: true
    })
  },

  _countingDone() {
    this.setState({
      countingDone: true
    })
  },

  render: function () {
    return (
      <View style={styles.container}>
        <View style={styles.signupBox}>
          <Text style={styles.title}>快速登录</Text>
          <View style={styles.phoneNumberBox}>
            <TextInput
              style={styles.inputField}
              placeholder='输入手机号'
              autoCapitalize={'none'}
              autoCorrect={false}
              keyboardType={'number-pad'}
              onChangeText={(text) => {
              this.setState({
                phoneNumber: text
              })
            }}
            />
          </View>
          {
            this.state.codeSent
              ? <View style={styles.sendVerifyCodeBox}>
                <TextInput
                  style={styles.inputField}
                  placeholder='验证码'
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  keyboardType={'number-pad'}
                  onChangeText={(text) => {
                    this.setState({
                      verifyCode: text
                    })
                  }}
                />

                {
                  this.state.countingDone
                    ? <Button
                      style={styles.countBtn}
                      onPress={this._sendVerifyCode()}>获取验证码</Button>
                    : <CountDownText
                      style={styles.countBtn}
                      countType='seconds' // 计时类型：seconds / date
                      auto={true} // 自动开始
                      afterEnd={this._countingDone} // 结束回调
                      timeLeft={10} // 正向计时 时间起点为0秒
                      step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                      startText='获取验证码' // 开始的文本
                      endText='获取验证码' // 结束的文本
                      intervalText={(sec) => '剩余秒数: ' + sec} // 定时的文本回调
                    />
                }
              </View>
              : null

          }
          {
            this.state.codeSent
              ? <Button
                style={styles.btn}
                onPress={this._submit}>登录</Button>
              : <Button
                style={styles.btn}
                onPress={this._sendVerifyCode}>获取验证码</Button>
          }
        </View>
      </View>
    )
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  signupBox: {
    marginTop: 30
  },
  title: {
    marginBottom: 20,
    color: '#333',
    fontSize: 20,
    textAlign: 'center'
  },
  phoneNumberBox: {
    flexDirection: 'row',
  },
  inputField: {
    flex: 1,
    height: 40,
    padding: 5,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 4
  },
  btn: {
    padding: 10,
    marginTop: 10,
    backgroundColor: 'transparent',
    borderColor: '#ee735c',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ee735c'
  },
  sendVerifyCodeBox: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  countBtn: {
    width: 110,
    height: 40,
    paddingLeft: 10,
    marginLeft: 8,
    color: '#fff',
    backgroundColor: '#ee735c',
    borderColor: '#ee735c',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 40,
    borderRadius: 20
  }

});

module.exports = Login;