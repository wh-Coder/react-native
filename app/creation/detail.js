/**
 * Created by busyrat on 2017/5/10.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  Dimensions,
  ActivityIndicator,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Video from 'react-native-video'

const width = Dimensions.get('window').width;

const Detail = React.createClass({
  getInitialState(props){

    let data = this.props.data

    return {
      data: data,
      rate: 1,
      muted: false,
      resizeMode: 'contain',
      repeat: false,
      videoLoaded: false,
      videoProgress: 0.01,
      videoTotal: 0,
      playing: false,
      currentTime: 0,
    }
  },

  _backToList(){
    this.props.navigator.pop()
  },

  _onLoadStart() {
    console.log('onLoadStart')
  },
  _onLoad() {
    console.log('onLoad')
  },
  _onProgress(data) {
    if (!this.state.videoLoaded) {
      this.setState({
        videoLoaded: true
      })
    }

    var duration = data.playableDuration
    var currentTime = data.currentTime
    var percent = Number((currentTime / duration).toFixed(2))

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
  },
  _onEnd() {
    console.log('onEnd')

    this.setState({
      videoProgress: 1,
      playing: false
    })
  },
  _onError(err) {
    console.log(err)
    console.log('onError')
  },

  _rePlay() {
    this.refs.videoPlay.seek(0)
  },

  render: function () {
    var data = this.props.data
    return (
      <View style={styles.container}>
        <Text onPress={this._backToList}>详情页面{data._id}</Text>
        <View style={styles.videoBox}>
          <Video
            ref='videoPlayer'
            source={{uri: data.video}}
            style={styles.video}
            volume={5}
            paused={false}
            rate={this.state.rate}
            muted={this.state.muted}
            resizeMode={this.state.resizeMode}
            repeat={this.state.repeat}

            onLoadStart={this._onLoadStart}
            onLoad={this._onLoad}
            onProgress={this._onProgress}
            onEnd={this._onEnd}
            onError={this._onError}
          />
          {
            !this.state.videoLoaded && <ActivityIndicator color="#ee735c" style={styles.loading}/>
          }
          {
            this.state.videoLoaded && !this.state.playing
              ? <Icon onPress={this._rePlay}
                      name="ios-play"
                      size={48}
                      style={styles.playIcon} />
              : null
          }
          <View style={styles.progressBox}>
            <View style={[styles.progressBar, {width: width * this.state.videoProgress}]}></View>
          </View>
        </View>
      </View>
    )
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  videoBox: {
    width: width,
    height: 360,
    backgroundColor: '#000'
  },

  video: {
    width: width,
    height: 360,
    backgroundColor: '#000'
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: 140,
    width: width,
    alignSelf: 'center',
    backgroundColor: 'transparent'
  },
  progressBox: {
    width: width,
    height: 4,
    backgroundColor: '#ccc'
  },
  progressBar: {
    width: 1,
    height: 4,
    backgroundColor: '#ff6600'
  },
  playIcon: {
    position: 'absolute',
    top: 140,
    left: width / 2 - 30,
    width: 60,
    height: 60,
    paddingTop: 8,
    paddingLeft: 22,
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 4,
    borderRadius: 30,
    color: '#ed7b66'
  }
});

module.exports = Detail;