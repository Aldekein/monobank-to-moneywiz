'use strict'
const parse = require('csv-parse/lib/sync')
const stringify = require('csv-stringify/lib/sync')
const fs = require('fs')
const data = parse(fs.readFileSync('data/incoming_data.csv', 'utf8'), { columns: ['datetime', 'details', 'mcc', 'amount_card', 'amount', 'currency', 'rate', 'commission', 'cashback', 'remaining_amount', 'mono_category'] })
const db = require('./database')
const bestGuess = require('./best-guess')

var LastOperationReached = {}
var lastOperation = db.get('last_operation')
var willBecomeLastOperation = null
var exportRecords = []

try {
  data.forEach(record => {
    // operations are always ordered descending by date of transaction, so this is valid:
    if (record.datetime === lastOperation) throw LastOperationReached
    if (willBecomeLastOperation === null) willBecomeLastOperation = record.datetime

    var [category, confidence] = bestGuess(record.details)

    exportRecords.push([record.datetime.split(' ', 1)[0], record.details, record.amount_card, category, confidence])
  })
} catch (e) {
  if (e !== LastOperationReached) throw e
}
if (willBecomeLastOperation) db.set('last_operation', willBecomeLastOperation)//.write()

fs.writeFileSync('data/outgoing_data.csv', stringify(exportRecords, { header: true, columns: ['Дата', 'Деталі', 'Сума', 'Категорія', 'confidence'] }))
console.log('Done')
