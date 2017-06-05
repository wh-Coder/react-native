/**
 * Created by busyrat on 2017/5/16.
 */
module.exports = {
  header: {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  qiniu: {
    // upload: 'http://oqxd77t4c.bkt.clouddn.com/'
    upload: 'http://upload.qiniu.com/'
  },
  CLOUDINARY: {
    cloud_name: 'busyrat',
    api_key: '385948557283994',
    api_secret: 'Wqo_JxZki9OQTnQklQjgJ0IPIbw',
    base: 'http://res.cloudinary.com/busyrat',
    secure: 'https://res.cloudinary.com/busyrat',
    image: 'https://api.cloudinary.com/v1_1/busyrat/image/upload',
    video: 'https://api.cloudinary.com/v1_1/busyrat/video/upload',
    audio: 'https://api.cloudinary.com/v1_1/busyrat/audio/upload',
  },
  api: {
    base: 'http://localhost:3000/',
    // base: 'http://rapapi.org/mockjs/18987/',
    creation: 'api/creation',
    up: 'api/up',
    comments: 'api/comments',
    signup: 'api/u/signup',
    verify: 'api/u/verify',
    signature: 'api/signature',
    update: 'api/u/update',
    video: 'api/creations/video'
  },

}