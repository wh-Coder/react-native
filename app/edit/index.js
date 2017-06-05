/**
 * Created by busyrat on 2017/5/10.
 */
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  AlertIOS,
  Image,
  AsyncStorage,
  ProgressViewIOS,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

// local
import config from '../common/config'
import request from '../common/request'

// third
const ImagePicker = require('react-native-image-picker');
import Video from 'react-native-video'

class Edit extends Component {

  constructor(props) {
    super(props)
    var user = this.props.user || {}
    this.state = {
      user: user,
      info: 'hello',
      previewVideo: false,

      // video upload
      video: null,
      videoUploadProgress: 0.01,
      videoUploading: false,
      videoUploaded: false,

      // video loads
      videoLoaded: false,
      videoLoading: false,
      currentTime: 0,
      videoTotal: 0,
      videoProgress: 0.01,
      paused: false,
      playing: false,

      // video player
      repeat: false,
      resizeMode: 'contain',
      muted: true,
      rate: 1
    }
  }

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
  }

  _onLoadStart() {
    console.log('onLoadStart')
  }

  _onLoad() {
    console.log('onLoad')
  }

  _onProgress(data) {
    if (!this.state.videoLoaded) {
      this.setState({
        videoLoaded: true
      })
    }

    var duration = data.playableDuration
    var currentTime = data.currentTime
    var percent = Number((currentTime / duration).toFixed(2))
    // console.log(percent)
    var newState = {
      videoTotal: duration,
      currentTime: Number(data.currentTime.toFixed(2)),
      videoProgress: percent
    }
    if (!this.state.videoLoaded) {
      newState.videoLoaded = true
    }
    if (!this.state.playing) {
      newState.playing = true
    }
    this.setState(newState)
    // console.log(data)
    // console.log('onProgress')
  }

  _onEnd() {
    console.log('onEnd')

    this.setState({
      videoProgress: 1,
      playing: false
    })
  }

  _onError(err) {
    console.log(err)
    console.log('onError')
  }

  _rePlay() {
    this.refs.videoPlayer.seek(0)
  }

  _pause() {
    if (!this.state.paused) {
      this.setState({
        paused: true
      })
    }
  }

  _resume() {
    if (this.state.paused) {
      this.setState({
        paused: false
      })
    }
  }

  _pop() {
    this.props.navigator.pop()
  }


  _pickVideo() {
    let that = this;

    let options = {
      title: '选择视频',
      cancelButtonTitle: '取消',
      takePhotoButtonTitle: '录像',
      chooseFromLibraryButtonTitle: '选择',
      videoQuality: 'low',
      mediaType: 'video',
      durationLimit: 10,
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

      let uri = res.uri

      that.setState({
        previewVideo: uri
      })

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
              type: 'video/mp4',
              uri: uri,
              name: key
            })

            that._upload(body)
          }
        })
    })
  }

  _getQiniuToken() {
    var signatureURL = config.api.base + config.api.signature
    var accessToken = this.state.user.accessToken
    return request.post(signatureURL, {
      accessToken: accessToken,
      type: 'video',
      cloud: 'qiniu'
    })
      .catch((err) => {
        console.log(err)
      })

  }

  _upload(body) {
    console.log(body)
    var that = this
    var xhr = new XMLHttpRequest();
    var url = config.qiniu.upload
    this.setState({
      videoUploadProgress: 0,
      videoUploading: true,
      videoProgress: 0,
      videoLoading: true
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
        that.setState({
          video: response,
          videoUploading: false,
          videoUploadProgress: 1
        })

        let videoURL = config.api.base + config.api.video
        let accessToken = this.state.user.accessToken

        request.post(videoURL, {
          accessToken: accessToken,
          video: response
        })
          .catch((err) => {
            console.log(err)
            AlertIOS.alert('视频同步出错')
          })
          .then((data) => {
            if(!data || !data.success){
              AlertIOS.alert('视频同步出错')
            }
          })
      }
    }
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          var percent = Number((event.loaded / event.total).toFixed(2))
          that.setState({
            videoUploadProgress: percent
          })
        }
      }
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.toolBar}>
          <Text style={styles.toolBarTitle}>
            {
              this.state.previewVideo
                ? '点击按钮'
                : '准备配音'
            }
          </Text>
          {
            this.state.previewVideo && this.state.videoLoaded
              ? <Text style={styles.toolBarExtra} onPress={() => {this._pickVideo()}}>更换视频</Text>
              : null
          }
        </View>

        <View style={styles.page}>
          {
            this.state.previewVideo
              ? <View style={styles.videoContainer}>
                <View style={styles.videoBox}>
                  <Video
                    ref='videoPlayer'
                    source={{uri: this.state.previewVideo}}
                    style={styles.video}
                    volume={5}
                    paused={this.state.paused}
                    rate={this.state.rate}
                    muted={this.state.muted}
                    resizeMode={this.state.resizeMode}
                    repeat={this.state.repeat}

                    onLoadStart={() => {this._onLoadStart()} }
                    onLoad={() => {this._onLoad()} }
                    onProgress={(data) => {this._onProgress(data)} }
                    onEnd={() => {this._onEnd()} }
                    onError={() => {this._onError()} }
                  />
                  {
                    this.state.videoUploading
                      ? <View style={styles.progressTipBox}>
                        <ProgressViewIOS
                          style={styles.progressBar}
                          progressTintColor='#ee735c'
                          progress={this.state.videoUploadProgress}/>
                        <Text style={styles.progressTip}>正在生成静音视频,
                            已经完成{ parseInt(this.state.videoUploadProgress * 100) }%</Text>
                      </View>
                      : <View></View>
                  }
                </View>
              </View>
              : <TouchableOpacity style={styles.uploadContainer} onPress={() => {this._pickVideo()}  }>
                <View style={styles.uploadBox}>
                  <Image source={require('../assets/1.jpg')} style={styles.uploadIcon}/>
                  <Text style={styles.uploadTitle}>点我上传视频</Text>
                  <Text style={styles.uploadDesc}>建议时长不超过10s</Text>
                </View>
              </TouchableOpacity>
          }
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolBar: {
    flexDirection: 'row',
    paddingTop: 26,
    paddingBottom: 10,
    backgroundColor: '#ee7c5c'
  },
  toolBarTitle: {
    flex: 1,
    fontSize: 20,
    textAlign: 'center'
  },
  toolBarExtra: {
    position: 'absolute',
    top: 30,
    right: 20
  },
  page: {
    flex: 1,
    alignItems: 'center'
  },
  uploadContainer: {
    marginTop: 90,
    width: width - 40,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#ee7c5c',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#fff'
  },
  uploadBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    color: '#000'
  },
  uploadDesc: {
    color: '#999',
    textAlign: 'center',
    fontSize: 12
  },
  uploadIcon: {
    margin: 20,
    height: 150,
    resizeMode: 'contain'
  },
  videoContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  videoBox: {
    width: width,
    height: height * 0.6,
  },
  video: {
    width: width,
    height: height * 0.6,
    backgroundColor: '#333'
  },
  progressTipBox: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: width,
    height: 30,
    backgroundColor: 'rgba(244,244,244,0.5)'
  },
  progressTip: {
    color: '#333',
    width: width - 10,
    padding: 3
  },
  progressBar: {
    width: width
  }

});

module.exports = Edit;