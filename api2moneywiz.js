'use strict'
const stringify = require('csv-stringify/lib/sync')
const fs = require('fs')
const db = require('./database')
const bestGuess = require('./best-guess')
const { ClientFactory } = require('monobank-api-client')
const api = ClientFactory.createPersonal(db.get('api_token').value())

var lastOperation = db.get('last_operation').value()
var willBecomeLastOperation = null
var exportRecords = []

const run = async () => {
  // const userInfo = await api.getUserInfo()
  // console.log('User info:\n', userInfo)

  const statement = await api.getStatement({
    account: '',
    from: new Date('2022-08-31'), // lastOperation
    to: new Date('2022-09-01')
  })

  console.log('Parsing account statement...\n')

  try {
    statement.forEach(transaction => {
      var transactionDay = ('0' + transaction.time.getDate()).slice(-2)
      var transactionMonth = ('0' + (transaction.time.getMonth() + 1)).slice(-2)
      var transactionYear = transaction.time.getFullYear()

      // operations are always ordered descending by date of transaction, so this is valid:
      if (willBecomeLastOperation === null) willBecomeLastOperation = transactionYear + '-' + transactionMonth + '-' + transactionDay

      var [category, confidence] = bestGuess(transaction.description)
      var transactionDate = transactionDay + '.' + transactionMonth + '.' + transactionYear

      exportRecords.push([transactionDate, transaction.description, transaction.amount / 100, category, confidence])
    })
  } catch (e) {
    console.log(e)
    throw e
  }
  if (willBecomeLastOperation) db.set('last_operation', willBecomeLastOperation).write()

  fs.writeFileSync('data/outgoing_data.csv', stringify(exportRecords, { header: true, columns: ['Дата', 'Деталі', 'Сума', 'Категорія', 'confidence'] }))
  console.log('Done')
}

run().catch(console.log) // .then(process.exit(0))
