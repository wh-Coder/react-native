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
  Modal,
  AlertIOS,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Video from 'react-native-video'
import config from '../common/config'
import request from '../common/request'
import Button from 'react-native-button'

var cachedResult = {
  nextPage: 1,
  items: [],
  total: 0
}

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
      paused: false,

      animationType: 'none',
      modalVisible: false,
      isSending: false,
      content: ''
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


  _fetchData(page) {
    var that = this;

    this.setState({
      isLoadingTail: true
    })


    request.get(config.api.base + config.api.comments, {
      creation: 124,
      accessToken: '123a',
      page: page
    })
      .then((data) => {
        console.log(config.api.base + config.api.creation)
        if (data.success) {
          let items = cachedResult.items.slice(); // copy

          items = items.concat(data.data);
          cachedResult.nextPage += 1

          cachedResult.items = items;
          cachedResult.total = data.total

          setTimeout(function () {
            that.setState({
              isLoadingTail: false,
              dataSource: that.state.dataSource.cloneWithRows(cachedResult.items)
            })

          }, 0)
        }
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isLoadingTail: false,
        })
      })
  },

  _hasMore(){
    return cachedResult.items.length !== cachedResult.total
  },

  _fetchMoreData() {
    if (!this._hasMore() || this.state.isLoadingTail) {
      return
    }

    let page = cachedResult.nextPage

    this._fetchData(page)

  },

  _rendFooter() {
    if (!this._hasMore() && cachedResult.total !== 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>没有更多了</Text>
        </View>
      )
    }

    if (!this.state.isLoadingTail) {
      return <View style={styles.loadingMore}/>
    }

    return <ActivityIndicator style={styles.loadingMore}/>
  },
  _focus() {
    this._setModalVisible(true);
  },

  _blur() {
    //
  },

  _closeModal() {

    this._setModalVisible(false);
  },

  _setModalVisible(visible) {
    this.setState({
      modalVisible: visible
    })
  },

  _renderHeader() {
    var data = this.state.data;

    return (
      <View style={styles.listHeader}>
        <View style={styles.infoBox}>
          <Image style={styles.avatar} source={{uri: data.author.avatar}}/>
          <View style={styles.descBox}>
            <Text style={styles.nickname}>{data.author.nickname}</Text>
            <Text style={styles.title}>{data.title}</Text>
          </View>
        </View>
        <View style={styles.commentBox}>
          <View style={styles.comment}>
            <TextInput
              placeholder="敢不敢评论"
              placeholderTextColor='#ccc'
              style={styles.content}
              multiline={true}
              onFocus={this._focus}
            />
          </View>
        </View>
        <View style={styles.commentArea}>
          <Text style={styles.commentTitle}>精彩评论</Text>
        </View>
      </View>
    )
  },

  _submit() {
    var that = this;
    // this._setModalVisible(false)
    // this.state.content
    if(!this.state.content){
      return AlertIOS.alert('留言不能为空')
    }
    if(this.state.isSending){
      return AlertIOS.alert('正在发送中')
    }
    this.setState({
      isSending: true
    },function () {
      var body = {
        accessToken: 'abc',
        comment: this.state.content,
        creation: '1234'
      }
      var url = config.api.base + config.api.comments

      request.post(url,body)
        .then(function (data) {
          if(data && data.success){
            var items = cachedResult.items.slice()
            items = [{
              content: that.state.content,
              replyBy: {
                nickname: '狗狗说',
                avatar: 'http://dummyimage.com/640x640/1d6730'
              }
            }].concat(items)

            cachedResult.items = items
            cachedResult.total++
            that.setState({
              isSending: false,
              dataSource: that.state.dataSource.cloneWithRows(cachedResult.items)
            })

            that._setModalVisible(false)
          }
        })
        .catch((err) => {
          console.log(err)
          that.setState({
            isSending: false
          })
          that._setModalVisible(false)
          AlertIOS.alert('留言失败')
        })
    })
  },

  render: function () {
    var data = this.props.data
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>详情页面页</Text>
          <TouchableOpacity style={styles.backBox} onPress={this._pop}>
            <Icon name="ios-arrow-back" style={styles.backIcon}/>
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
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


        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}

          renderHeader={this._renderHeader}
          renderFooter={this._rendFooter}
          onEndReached={this._fetchMoreData}

          onEndReachedThreshold={20}

          enableEmptySections={true}
          showsHorizontalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
        />
        <Modal
          animationType={'fade'}
          visible={this.state.modalVisible}
          onRequestClose={() => {this._setModalVisible(false)}}>
          <View style={styles.modalContainer}>
            <Icon
              onPress={this._closeModal}
              name="ios-close-outline"
              style={styles.closeIcon}/>
            <View style={styles.commentBox}>
              <View style={styles.comment}>
                <TextInput
                  placeholder="敢不敢评论"
                  placeholderTextColor='#ccc'
                  style={styles.content}
                  multiline={true}
                  onFocus={this._focus}
                  onBlur={this._blur}
                  defaultValue={this.state.content}
                  onChangeText={(text) => {
                  this.setState({
                    content: text
                  })
                }}
                />
              </View>
            </View>
            <Button style={styles.submitBtn} onPress={this._submit}>评论</Button>
          </View>
        </Modal>
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
  modalContainer: {
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#fff'
  },
  closeIcon: {
    alignSelf: 'center',
    fontSize: 30,
    color: '#ee753c'
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
    flexDirection: 'row',
    left: 20,
    top: 20,
    width: 48,
    height: 48
  },
  backIcon: {
    flex: 1,
    textAlign: 'center',
  },
  backText: {
    flex: 3,
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
  },
  loadingMore: {
    marginVertical: 20
  },
  loadingText: {
    color: '#777',
    textAlign: 'center'
  },
  commentBox: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    width: width
  },
  content: {
    paddingLeft: 2,
    color: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    fontSize: 14,
    height: 80
  },
  listHeader: {
    width: width,
    marginTop: 10
  },
  commentArea: {
    width: width,
    paddingBottom: 6,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  commentTitle: {
    width: width,
    marginTop: 10
  },
  submitBtn: {
    paddingTop: 10,
    paddingBottom: 10,
    width: width-40,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: '#ee753c'
  }
});

module.exports = Detail;