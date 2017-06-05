/**
 * Created by busyrat on 2017/5/10.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  AlertIOS,
  AsyncStorage,
  View,
} from 'react-native';
import Button from 'react-native-button'

import Icon from 'react-native-vector-icons/Ionicons';
import sha1 from 'sha1';
// import uuid from 'uuid';
// import {ImagePickerManager} from 'NativeModules';

// import ImagePicker from 'react-native-image-picker'
var ImagePicker = require('react-native-image-picker');
import * as Progress from 'react-native-progress';

import config from '../common/config'
import request from '../common/request'

const width = Dimensions.get('window').width

const Account = React.createClass({

  getInitialState() {
    var user = this.props.user || {}

    return {
      user: user,
      avatarProgress: 0,
      avatarUploading: false,
      modalVisible: false
    }
  },

  _edit(){
    this.setState({
      modalVisible: true
    })
  },

  _closeModal() {
    this.setState({
      modalVisible: false
    })
  },

  componentDidMount() {
    let that = this
    AsyncStorage.getItem('user')
      .then((data) => {
        console.log(data)
        let user = {}
        if (data) {
          user = JSON.parse(data)
        }

        // user.avatar = ''
        // AsyncStorage.setItem('user',JSON.stringify(user))

        if (user && user.accessToken) {
          that.setState({
            user: user
          })
        }
      })
  },


  _getQiniuToken() {
    var signatureURL = config.api.base + config.api.signature
    var accessToken = this.state.user.accessToken
    return request.post(signatureURL, {
      accessToken: accessToken,
      type: 'avatar',
      cloud: 'qiniu'
    })
      .catch((err) => {
        console.log(err)
      })

  },

  _pickPhoto() {
    console.log('123')
    let that = this;

    let options = {
      title: '选择头像',
      cancelButtonTitle: '取消',
      takePhotoButtonTitle: '拍照',
      chooseFromLibraryButtonTitle: '选择',
      quality: 0.75,
      allowsEditing: true,
      noData: false,
      storageOptions: {
        skipBackup: true,
        path: 'images'
      }
    }

    ImagePicker.showImagePicker(options, (res) => {
      console.log(res);
      if (res.didCancel) {
        return
      }
      let avatarData = 'data:image/jpeg;base64,' + res.data

      var uri = res.uri
      // var key = uuid.v4() + '.jpeg';

      that._getQiniuToken()
        .then((data) => {
          console.log(data);
          if (data && data.success) {
            console.log(data)
            var token = data.data.token
            var key = data.data.key
            var body = new FormData()
            body.append('token', token)
            body.append('key', key)
            body.append('file', {
              type: 'image/jpeg',
              uri: uri,
              name: key
            })

            that._upload(body)
          }
        })
      //
      // request.post(signatureURL, {
      //   accessToken: accessToken,
      //   key: key,
      //   timestamp: timestamp,
      //   type: 'avatar'
      // })
      //   .catch((err) => {
      //     console.log(err)
      //   })
      //   .then((data) => {
      //     console.log(data);
      //     if (data && data.success) {
      //       // var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.CLOUDINARY.api_secret;
      //       // signature = sha1(signature);
      //       signature = data.data
      //
      //       var body = new FormData()
      //       body.append('folder', folder)
      //       body.append('signature', signature)
      //       body.append('tags', tags)
      //       body.append('timestamp', timestamp)
      //       body.append('api_key', config.CLOUDINARY.api_key)
      //       body.append('resource_type', 'image')
      //       body.append('file', avatarData)
      //
      //       that._upload(body)
      //     }
      //   })

    })
  },

  _upload(body) {
    console.log(body)
    var that = this
    var xhr = new XMLHttpRequest();
    // var url = config.CLOUDINARY.image;
    var url = config.qiniu.upload
    this.setState({
      avatarUploading: true,
      avatarProgress: 0
    })

    xhr.open('POST', url)
    xhr.send(body)
    xhr.onload = () => {
      if (xhr.status !== 200) {
        AlertIOS.alert('请求失败')
        console.log(xhr.responseText)

        return
      }
      if (!xhr.responseText) {
        AlertIOS.alert('请求失败')

        return
      }

      var response

      try {
        response = JSON.parse(xhr.response)
      } catch (err) {
        console.log(err)
      }

      console.log(response)
      if (response) {
        var user = that.state.user
        if(response.public_id) {
          user.avatar = response.public_id
        }

        if(response.key){
          user.avatar = response.key
        }

        that.setState({
          user: user,
          avatarUploading: false,
          avatarProgress: 0
        })

        that._asyncUser(true);
      }
    }
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          var percent = Number((event.loaded / event.total).toFixed(2))
          that.setState({
            avatarProgress: percent
          })
        }
      }
    }
  },

  _changeUserState(key, value) {
    var user = this.state.user

    user[key] = value

    this.setState({
      user: user
    })
  },

  _asyncUser(isAvatar) {
    var that = this;
    var user = this.state.user
    if (user && user.accessToken) {
      var url = config.api.base + config.api.update

      // if (public_id) {
      //   user.avatar = user
      // }

      request.post(url, user)
        .then((data) => {
          if (data && data.success) {
            var user = data.data
            console.log(user)
            if (isAvatar) {
              AlertIOS.alert('头像更新成功')
            }
            that.setState({
              user: user
            }, function () {
              that._closeModal()
              AsyncStorage.setItem('user', JSON.stringify(user))
            })
          }
        })
    }
  },

  _submit() {
    var user = this.state.user

    this._asyncUser()
  },

  _logout() {
    this.props.logout()
  },

  avatar(id, type) {
    // console.log(id)
    if (id.indexOf('http') > -1) {
      return id
    }

    if (id.indexOf('data:image') > -1) {
      return id
    }

    if (id.indexOf('avatar/') > -1) {
      return config.CLOUDINARY.base + '/' + type + '/upload/' + id
    }
    var avatarURL = 'http://or0af90q9.bkt.clouddn.com/' + id
    return avatarURL
  },

  render: function () {
    var user = this.state.user

    return (
      <View style={styles.container}>
        <View style={styles.toolBar}>
          <Text style={styles.toolBarTitle}>我的账户</Text>
          <Text style={styles.toolBarExtra} onPress={this._edit}>编辑</Text>
        </View>

        {
          user.avatar
            ? <TouchableOpacity style={styles.avatarContainer} onPress={this._pickPhoto}>
              <Image source={{uri: this.avatar(user.avatar, 'image')}} style={styles.avatarContainer}>
                <View style={styles.avatarBox}>
                  {
                    this.state.avatarUploading
                      ? <Progress.Circle
                        size={75}
                        showsText={true}
                        color={'#ee735c'}
                        progress={this.state.avatarProgress}/>
                      : <Image
                        source={{uri: this.avatar(user.avatar, 'image')}}
                        style={styles.avatar}/>
                  }

                </View>
                <Text style={styles.avatarTip}>点击换头像</Text>
              </Image>
            </TouchableOpacity>
            : <View style={styles.avatarContainer}>
              <Text style={styles.avatarTip}>添加头像</Text>
              <TouchableOpacity style={styles.avatarBox} onPress={this._pickPhoto}>
                {
                  this.state.avatarUploading
                    ? <Progress.Circle
                      size={75}
                      showsText={true}
                      color={'#ee735c'}
                      progress={this.state.avatarProgress}/>
                    : <Icon
                      name="ios-cloud-upload-outline"
                      style={styles.plusIcon}/>

                }

              </TouchableOpacity>
            </View>
        }

        <Modal
          animationType={'fade'}
          visible={this.state.modalVisible}>
          <View style={styles.modalContainer}>
            <Icon
              onPress={this._closeModal}
              name='ios-close-outline'
              style={styles.closeButton}/>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>昵称</Text>
              <TextInput
                placeholder={'输入你的昵称'}
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.nickname}
                onChangeText={(text) => {
                    this._changeUserState('nickname', text)
                  }}
              />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>品种</Text>
              <TextInput
                placeholder={'品种'}
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.breed}
                onChangeText={(text) => {
                    this._changeUserState('breed', text)
                  }}
              />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>年龄</Text>
              <TextInput
                placeholder={'输入你的年龄'}
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.age}
                onChangeText={(text) => {
                    this._changeUserState('', text)
                  }}
              />
            </View>

            <View style={styles.fieldItem}>
              <Text style={styles.label}>性别</Text>
              <Icon.Button
                onPress={() => {
                  this._changeUserState('gender','male')
                }}
                style={[styles.gender,user.gender === 'male' && styles.genderChecked]}
                name="ios-flower-outline">男</Icon.Button>
              <Icon.Button
                onPress={() => {
                  this._changeUserState('gender','female')
                }}
                style={[styles.gender,user.gender === 'female' && styles.genderChecked]}
                name="ios-flower">女</Icon.Button>
            </View>
            <Button
              style={styles.btn}
              onPress={this._submit}>保存资料</Button>
          </View>
        </Modal>
        <Button
          style={styles.btn}
          onPress={this._logout}>退出登录</Button>

      </View>
    )
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  toolBar: {
    flexDirection: 'row',
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#ee735c',
  },

  toolBarTitle: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600'
  },
  toolBarExtra: {
    position: 'absolute',
    right: 10,
    top: 26,
    color: '#fff',
    textAlign: 'right',
    fontWeight: '600',
    fontSize: 14
  },
  avatarContainer: {
    width: width,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee'
  },
  avatarBox: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  plusIcon: {
    padding: 20,
    paddingLeft: 25,
    paddingRight: 25,
    color: '#999',
    fontSize: 20,
    backgroundColor: '#fff',
    borderRadius: 8
  },
  avatarTip: {
    color: '#fff',
    backgroundColor: 'transparent',
    fontSize: 14
  },
  avatar: {
    marginBottom: 15,
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: 'cover',
    // borderWidth: 1,
    // borderColor: '#ccc',
    borderRadius: width * 0.1
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff'
  },
  fieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingLeft: 15,
    paddingRight: 15,
    borderColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    color: '#ccc',
    marginRight: 10
  },
  inputField: {
    flex: 1,
    height: 50,
    color: '#666',
    fontSize: 14
  },
  closeButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    fontSize: 32,
    right: 20,
    top: 30,
    color: '#ee735c'
  },
  gender: {
    backgroundColor: '#ccc'
  },
  genderChecked: {
    backgroundColor: '#ee735c'
  },
  btn: {
    padding: 10,
    margin: 30,
    backgroundColor: 'transparent',
    borderColor: '#ee735c',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ee735c'
  },
});

module.exports = Account;