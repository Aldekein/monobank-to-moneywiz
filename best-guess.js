'use strict'
const parse = require('csv-parse/lib/sync')
const fs = require('fs')
const d2c = parse(fs.readFileSync('data/descriptions2categories.csv', 'utf8'), { columns: true, delimiter: ',' })
const stringSimilarity = require('string-similarity')
// TODO: allow to configure it in a better place
const minimalSimilarity = 0.420

// TODO: also detect transfers and additionally return a correct counterparty
function bestGuess (description) {
  var maxSimilarity = 0
  var bestGuessCategory = ''
  var thisSimilarity = 0

  d2c.forEach(item => {
    thisSimilarity = stringSimilarity.compareTwoStrings(description, item.description)

    if (thisSimilarity >= maxSimilarity) {
      maxSimilarity = thisSimilarity
      bestGuessCategory = item.category
    }
  })

  if (maxSimilarity < minimalSimilarity) bestGuessCategory = ''

  return [bestGuessCategory, Math.round(maxSimilarity * 100)]
}

module.exports = bestGuess
