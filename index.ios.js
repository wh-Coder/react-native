/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  AsyncStorage,
  View,
  TabBarIOS,
} from 'react-native';
import {Navigator} from 'react-native-deprecated-custom-components'
import Icon from 'react-native-vector-icons/Ionicons';

const List = require('./app/creation/index');
const Edit = require('./app/edit/index');
const Account = require('./app/account/index');
const Login = require('./app/account/login');

const imoocApp = React.createClass({

  getInitialState(){
    return {
      times: this.props.times,
      selectedTab: 'account',
      logined: false,
      user: null
    }
  },

  _asyncAppStatus() {
    var that = this
    AsyncStorage.getItem('user')
      .then((data) => {
        let user
        let newState = {}

        if (data) {
          user = JSON.parse(data)
        }
        if (user && user.accessToken) {
          newState.user = user
          newState.logined = true
        } else {
          newState.logined = false
        }
        that.setState(newState)
      })
  },

  _afterLogin(user) {
    let that = this
    user = JSON.stringify(user)
    AsyncStorage.setItem('user', user)
      .then(() => {
        that.setState({
          logined: true,
          user: user
        })
      })
  },

  _logout() {
    AsyncStorage.removeItem('user')
    this.setState({
      logined: false,
      user: null
    })
  },

  componentDidMount() {
    this._asyncAppStatus();
  },

  render: function () {

    if (!this.state.logined) {
      return <Login afterLogin={this._afterLogin}/>
    }

    return (
      <TabBarIOS
        tintColor="#ee735c">
        <Icon.TabBarItem
          iconName='ios-videocam-outline'
          selectedIconName='ios-videocam'
          selected={this.state.selectedTab === 'list'}
          onPress={() => {
            this.setState({
              selectedTab: 'list',
            });
          }}>
          <Navigator
            initialRoute={{
              name: 'list',
              component: List
            }}

            configureScene={(route) => {
              return Navigator.SceneConfigs.FloatFromRight
            }}

            renderScene={(route, navigator) => {
              var Component = route.component

              return <Component {...route.params} navigator={navigator}/>
            }}
          />
        </Icon.TabBarItem>
        <Icon.TabBarItem
          iconName='ios-recording-outline'
          selectedIconName='ios-recording'
          selected={this.state.selectedTab === 'edit'}
          onPress={() => {
            this.setState({
              selectedTab: 'edit',
            });
          }}>
          <Edit/>
        </Icon.TabBarItem>
        <Icon.TabBarItem
          iconName='ios-more-outline'
          selectedIconName='ios-more'
          selected={this.state.selectedTab === 'account'}
          onPress={() => {
            this.setState({
              selectedTab: 'account',
            });
          }}>
          <Account logout={this._logout}/>
        </Icon.TabBarItem>
      </TabBarIOS>
    );
  },
});


AppRegistry.registerComponent('imoocApp', () => imoocApp);
