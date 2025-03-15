const fs = require('fs');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Read the input file
const input = fs.readFileSync('data/moneywiz-export-description-category.csv', 'utf-8');

// Parse CSV with semicolon delimiter
const records = csv.parse(input, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true
});

// Create a map to count category occurrences for each description
const descriptionCategories = new Map();

// Process records
records.forEach(record => {
    const description = record.description.trim();
    const category = record.category.trim();
    
    if (!description || !category) return;
    
    if (!descriptionCategories.has(description)) {
        descriptionCategories.set(description, new Map());
    }
    
    const categoryCount = descriptionCategories.get(description);
    categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
});

// Create final mapping choosing most frequent category for each description
const finalMapping = [];

descriptionCategories.forEach((categoryCount, description) => {
    let maxCount = 0;
    let selectedCategory = '';
    
    categoryCount.forEach((count, category) => {
        if (count > maxCount) {
            maxCount = count;
            selectedCategory = category;
        }
    });
    
    finalMapping.push({
        description,
        category: selectedCategory
    });
});

// Ensure data directory exists
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Write the output CSV
const output = stringify(finalMapping, {
    header: true,
    delimiter: ';',
    columns: ['description', 'category']
});

fs.writeFileSync('data/categories.csv', output);

console.log(`Processed ${finalMapping.length} unique descriptions into data/categories.csv`); 