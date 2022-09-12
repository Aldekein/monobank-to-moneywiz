'use strict'
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/db.json')
const db = low(adapter)

db.defaults({ last_operation: '', last_operation_time: 0, api_token: '' }).write()

module.exports = db
