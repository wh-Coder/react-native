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
import {CountDownText} from 'react-native-sk-countdown'
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import Sound from 'react-native-sound';
import _ from 'lodash'

let defaultState = {
  previewVideo: false,

  // video upload
  video: null,
  videoUploaded: false,
  videoUploading: false,
  videoUploadProgress: 0.01,

  // video loads
  currentTime: 0,
  videoTotal: 0,
  videoProgress: 0.01,

  // count down
  counting: false,
  recording: false,

  // video player
  rate: 1,
  muted: true,
  resizeMode: 'contain',
  repeat: false,

  // audio
  audioCurrentTime: 0,
  audioName: 'gougou.aac',
  audioPlaying: false,
  recordDone: false,
  audioPath: AudioUtils.DocumentDirectoryPath + '/' + this.audioName
}


class Edit extends Component {

  constructor(props) {
    super(props)
    let user = this.props.user || {}

    let state = _.clone(defaultState)
    state.user = user
    this.state = state
  }

  _preview() {
    if(this.state.audioPlaying){
      // AudioRecorder.stopPlaying()
      return
    }

    this.setState({
      videoProgress: 0,
      audioPlaying: true
    })

    // AudioRecorder.playing()
    var sound = new Sound(this.state.audioPath, '', (error) => {
      if (error) {
        console.log('failed to load the sound', error);
      }
    });

    setTimeout(() => {
      sound.play((success) => {
        if (success) {
          console.log('successfully finished playing');
        } else {
          console.log('playback failed due to audio decoding errors');
        }
      });
    }, 100);
    AudioRecorder.stopRecording()
    this.refs.videoPlayer.seek(0)
  }

  _initAudio() {

    AudioRecorder.prepareRecordingAtPath(this.state.audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: "High",
      AudioEncoding: "aac",
      // AudioEncodingBitRate: 32000
    });

    AudioRecorder.onProgress = (data) => {
      // this.setState({currentTime: Math.floor(data.audioCurrentTime)});
    };

    AudioRecorder.onFinished = (data) => {
      // Android callback comes in the form of a promise instead.
      // if (Platform.OS === 'ios') {
      //   this._finishRecording(data.status === "OK", data.audioFileURL);
      // }
    };
  }

  componentDidMount() {
    let that = this
    AsyncStorage.getItem('user')
      .then((data) => {
        let user = {}
        if (data) {
          user = JSON.parse(data)
        }

        if (user && user.accessToken) {
          that.setState({
            user: user
          })
        }
      })

    this._initAudio()
  }

  _onLoadStart() {
    // console.log('onLoadStart')
  }

  _onLoad() {
    // console.log('onLoad')
  }

  _onProgress(data) {
    let duration = data.playableDuration
    let currentTime = data.currentTime
    let percent = Number((currentTime / duration).toFixed(2))
    this.setState({
      videoTotal: duration,
      currentTime: Number(data.currentTime.toFixed(2)),
      videoProgress: percent
    })
  }

  _onEnd() {
    if (this.state.recording) {
      console.log('end')

      AudioRecorder.stopRecording()

      this.setState({
        videoProgress: 1,
        recording: false,
        recordDone: true
      })
    }
  }

  static _onError(err) {
    console.log('onError')
    console.log(err)
  }

  _counting() {
    if (!this.state.counting && !this.state.recording) {
      this.setState({
        counting: true
      })
      // this.refs.videoPlayer.seek(this.state.videoTotal - 0.01)
      this._record()
    }
  }

  _record() {
    console.log('hello')
    this.setState({
      videoProgress: 0,
      counting: false,
      recordDone: false,
      recording: true
    })

    AudioRecorder.startRecording()
    this.refs.videoPlayer.seek(0)
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

      let state = _.clone(defaultState)

      let uri = res.uri
      state.previewVideo = uri
      state.user = this.state.user
      that.setState(state)

      that._getQiniuToken()
        .then((data) => {
          console.log(data);
          if (data && data.success) {
            console.log(data)
            let token = data.data.token
            let key = data.data.key
            let body = new FormData()
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
    let signatureURL = config.api.base + config.api.signature
    let accessToken = this.state.user.accessToken
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
    let that = this
    let xhr = new XMLHttpRequest();
    let url = config.qiniu.upload
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

      let response

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
          videoUploaded: true,
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
            if (!data || !data.success) {
              AlertIOS.alert('视频同步出错')
            }
          })
      }
    }
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          let percent = Number((event.loaded / event.total).toFixed(2))
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
            this.state.previewVideo && this.state.videoUploaded
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
                      : null
                  }
                  {
                    this.state.recording || this.state.audioPlaying
                      ? <View style={styles.progressTipBox}>
                        <ProgressViewIOS
                          style={styles.progressBar}
                          progressTintColor='#ee735c'
                          progress={this.state.videoProgress}/>
                        {
                          this.state.recording
                            ? <Text style={styles.progressTip}>正在录制声音中</Text>
                            : null
                        }

                      </View>
                      : null
                  }

                  {
                    this.state.recordDone
                      ? <View style={styles.previewBox}>
                        <Icon name='ios-play' style={styles.previewIcon}/>
                        <Text style={styles.previewText}
                          onPress={this._preview.bind(this)}
                        >预览</Text>
                      </View>
                      : null
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

          {
            this.state.videoUploaded && this.state.previewVideo ?
              <View style={styles.recordBox}>
                <View style={[styles.recordIconBox, (this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
                  {
                    /*
                     this.state.counting && !this.state.recording
                     ? <CountDownText
                     style={styles.countBtn}
                     countType='seconds' // 计时类型：seconds / date
                     auto={false} // 自动开始
                     afterEnd={this._record.bind(this)} // 结束回调
                     timeLeft={5} // 正向计时 时间起点为0秒
                     step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                     startText='准备录制'// 开始的文本
                     endText='结束' // 结束的文本
                     intervalText={(sec) => sec === 1 ? 'GO' : sec}/>// 定时的文本回调
                     */
                    <TouchableOpacity onPress={this._counting.bind(this)}>
                      <Icon name="ios-mic" style={styles.recordIcon}/>
                    </TouchableOpacity>
                  }
                </View>
              </View>
              : null
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
  },
  recordBox: {
    width: width,
    height: 60,
    alignItems: 'center'
  },
  recordIconBox: {
    marginTop: -30,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ee735c',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordIcon: {
    fontSize: 58,
    backgroundColor: 'transparent',
    color: '#fff'
  },
  countBtn: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff'
  },
  recordOn: {
    backgroundColor: '#ccc'
  },
  previewBox: {
    width: 80,
    height: 30,
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderColor: '#ee735c',
    borderWidth: 1,
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewIcon: {
    marginRight: 5,
    fontSize: 20,
    color: '#ee735c',
  },
  previewText: {
    fontSize: 20,
    color: '#ee735c'
  }
});

module.exports = Edit;