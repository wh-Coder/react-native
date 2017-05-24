/**
 * Created by busyrat on 2017/5/10.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Image,
  ListView,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Video from 'react-native-video'
import config from '../common/config'
import request from '../common/request'


const width = Dimensions.get('window').width;

const Detail = React.createClass({
  getInitialState(props){

    let data = this.props.data

    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });

    return {
      data: data,
      dataSource: ds.cloneWithRows([]),
      comments: [],
      rate: 1,
      muted: false,
      resizeMode: 'contain',
      repeat: false,
      videoLoaded: false,
      videoProgress: 0.01,
      videoTotal: 0,
      playing: false,
      currentTime: 0,
      paused: false
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
    this.refs.videoPlayer.seek(0)
  },

  _pause() {
    if (!this.state.paused) {
      this.setState({
        paused: true
      })
    }
  },
  _resume() {
    if (this.state.paused) {
      this.setState({
        paused: false
      })
    }
  },
  _pop() {
    this.props.navigator.pop()
  },


  componentDidMount() {
    this._fetchData()
  },

  _fetchData() {
    var that = this
    var url = config.api.base + config.api.comments

    request.get(url, {
      creation: 124,
      accessToken: '123a'
    })
      .then(function (data) {
        if (data && data.success) {
          var comments = data.data
          if (comments && comments.length > 0) {
            that.setState({
              comments: comments,
              dataSource: that.state.dataSource.cloneWithRows(comments)
            })
          }
        }
      })
      .catch((err) => {
        console.log(error)
      })
  },
  _renderRow(row) {
    return (
      <View key={row._id} style={styles.replyBox}>
        <Image style={styles.replyAvatar} source={{uri: row.replyBy.avatar}}/>
        <View style={styles.reply}>
          <Text style={styles.replyNickname}>{row.replyBy.nickname}</Text>
          <Text style={styles.replyContent}>{row.content}</Text>
        </View>
      </View>
    )
  },

  render: function () {
    var data = this.props.data
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBox} onPress={this._pop}>
            <Icon name="ios-arrow-back" style={styles.backIcon}/>
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>详情页面页</Text>
        </View>
        <View style={styles.videoBox}>
          <Video
            ref='videoPlayer'
            source={{uri: data.video}}
            style={styles.video}
            volume={5}
            paused={this.state.paused}
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
                      style={styles.playIcon}/>
              : null
          }
          {
            this.state.videoLoaded && this.state.playing
              ? <TouchableOpacity onPress={this._pause} style={styles.pauseBtn}>
                {
                  this.state.paused
                    ? <Icon size={48} onPress={this._resume} name='ios-play' style={styles.resumeIcon}/>
                    : <Text></Text>
                }
              </TouchableOpacity>
              : null
          }
          <View style={styles.progressBox}>
            <View style={[styles.progressBar, {width: width * this.state.videoProgress}]}></View>
          </View>
        </View>
        <ScrollView
          enableEmptySections={true}
          showsHorizontalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          style={styles.scrollView}>
          <View style={styles.infoBox}>
            <Image style={styles.avatar} source={{uri: data.author.avatar}}/>
            <View style={styles.descBox}>
              <Text style={styles.nickname}>{data.author.nickname}</Text>
              <Text style={styles.title}>{data.title}</Text>
            </View>
          </View>

          <ListView
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            enableEmptySections={true}
            showsHorizontalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
          />

        </ScrollView>
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
    height: width * 0.56,
    backgroundColor: '#000'
  },

  video: {
    width: width,
    height: width * 0.56,
    backgroundColor: '#000'
  },
  loading: {
    position: 'absolute',
    left: 0,
    top: 80,
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
    top: 90,
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
  },
  pauseBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: 360,
  },
  resumeIcon: {
    position: 'absolute',
    top: 80,
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
  },
  header: {
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backBox: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 48,
    height: 48
  },
  backIcon: {
    textAlign: 'center',
  },
  backText: {
    textAlign: 'center',
  },
  headerTitle: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    width: width,
  },
  infoBox: {
    width: width,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    marginRight: 10,
    marginLeft: 10,
    borderRadius: 30
  },
  descBox: {
    flex: 1
  },
  nickname: {
    fontSize: 18
  },
  title: {
    marginTop: 8,
    fontSize: 16,
    color: '#666'
  },

  replyBox: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10
  },

  replyAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    marginLeft: 10,
    borderRadius: 20
  },

  replyNickname: {
    color: '#666',
    fontSize: 18
  },
  replyContent: {
    marginTop: 4,
    color: '#666'
  },
  reply: {
    flex: 1
  }


});

module.exports = Detail;