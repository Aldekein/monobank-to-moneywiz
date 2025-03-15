const { stringify } = require('csv-stringify/sync')
const fs = require('fs')
require('dotenv').config()
const bestGuess = require('./best-guess')
const { ClientFactory } = require('monobank-api-client')

// Встановіть потрібні дати для експорту
const fromDate = new Date('2025-03-02')
const toDate = new Date('2025-03-20')  

// Перевірка, чи встановлені обов'язкові змінні середовища
if (!process.env.API_TOKEN) {
  console.error('Error: API_TOKEN environment variable is not set. Please check your .env file.')
  process.exit(1)
}

if (!process.env.ACCOUNT) {
  console.error('Error: ACCOUNT environment variable is not set. Please check your .env file.')
  process.exit(1)
}

const api = ClientFactory.createPersonal(process.env.API_TOKEN)
var exportRecords = []

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const getDateRanges = (startDate, endDate) => {
  const ranges = []
  let currentStart = new Date(startDate)
  
  while (currentStart < endDate) {
    let currentEnd = addDays(currentStart, 30) // 31 days including start date
    if (currentEnd > endDate) {
      currentEnd = endDate
    }
    ranges.push({ from: currentStart, to: currentEnd })
    currentStart = addDays(currentEnd, 1)
  }
  
  return ranges
}

const run = async () => {
  // const userInfo = await api.getUserInfo()
  // console.log('User info:\n', userInfo)

  const dateRanges = getDateRanges(fromDate, toDate)
  
  console.log(`Processing ${dateRanges.length} date ranges...\n`)
  
  for (let i = 0; i < dateRanges.length; i++) {
    const range = dateRanges[i]
    console.log(`Fetching transactions for range ${i + 1}/${dateRanges.length}: ${range.from.toISOString().split('T')[0]} to ${range.to.toISOString().split('T')[0]}`)
    
    const statement = await api.getStatement({
      account: process.env.ACCOUNT,
      from: range.from,
      to: range.to
    })

    console.log(`Processing ${statement.length} transactions...\n`)

    try {
      statement.forEach(transaction => {
        var transactionDay = ('0' + transaction.time.getDate()).slice(-2)
        var transactionMonth = ('0' + (transaction.time.getMonth() + 1)).slice(-2)
        var transactionYear = transaction.time.getFullYear()
       
        var description = transaction.description.replace(/[\r\n]+/g, ' ').replace(/ +/g, ' ').trim()
        var comment = transaction.comment ? transaction.comment.replace(/[\r\n]+/g, ' ').replace(/ +/g, ' ').trim() : null
        var [category, confidence] = bestGuess(description)
        var transactionDate = transactionDay + '.' + transactionMonth + '.' + transactionYear

        if (comment) console.log('Comment:', comment)
        if (comment && comment != 'Поповнення рахунку банки') description += ' (' + comment + ')'
        exportRecords.push([transactionDate, description, transaction.amount / 100, category, confidence])
      })
    } catch (e) {
      console.log(e)
      throw e
    }

    // Wait 61 seconds before next API call if there are more ranges to process
    if (i < dateRanges.length - 1) {
      console.log('Waiting 61 seconds before next API call...')
      await sleep(61000)
    }
  }

  // Sort records by date in ascending order
  exportRecords.sort((a, b) => {
    const [dayA, monthA, yearA] = a[0].split('.')
    const [dayB, monthB, yearB] = b[0].split('.')
    const dateA = new Date(yearA, parseInt(monthA) - 1, dayA)
    const dateB = new Date(yearB, parseInt(monthB) - 1, dayB)
    return dateA - dateB
  })

  var dateToday = new Date()
  var dateTimeToday = dateToday.getFullYear() + '-' + ('0' + (dateToday.getMonth() + 1)).slice(-2) + '-' + ('0' + dateToday.getDate()).slice(-2) + '-' + ('0' + dateToday.getHours()).slice(-2) + ('0' + dateToday.getMinutes()).slice(-2)
  fs.writeFileSync(`data/${dateTimeToday}-export.csv`, stringify(exportRecords, { header: true, columns: ['Дата', 'Деталі', 'Сума', 'Категорія', 'confidence'] }))
  console.log(`Done: ./data/${dateTimeToday}-export.csv`)
}

run().catch(console.log) // .then(process.exit(0))