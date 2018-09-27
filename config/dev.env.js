'use strict'
var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

// prodEnv.BASE_HUB_URL = '"http://192.168.1.36:59471/"'
prodEnv.BASE_HUB_URL = '"http://10.0.2.2:59471/"'

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"'
})
