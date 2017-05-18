/**
 * Created by busyrat on 2017/5/10.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Detail = React.createClass({

  _backToList(){
    this.props.navigator.pop()
  },

  render: function () {
    var row = this.props.row

    return (
      <View style={styles.container}>
        <Text onPress={this._backToList} >详情页面{row._id}</Text>
      </View>
    )
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

module.exports = Detail;