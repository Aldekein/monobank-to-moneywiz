# monobank to MoneyWiz converter

Цей скріпт дозволить вивантажити дані з monobank, та автоматично розставити категорії транзакцій для MoneyWiz 
на основі історичних даних в файлі `descriptions2categories.csv`. Ці дані вам треба експортувати з MoneyWiz з
рахунку вашої картки та підготувати за допомогою `import_categories.js`.

## Запуск

1. Створіть файл `.env` на основі `.env.example`:
   ```
   cp .env.example .env
   ```

2. Відредагуйте файл `.env` та додайте ваш API токен Monobank та ID рахунку:
   ```
   API_TOKEN=your_monobank_api_token_here
   ACCOUNT=your_monobank_account_id_here
   ```

3. В `api2csv.js` задайте початкову та кінцеву дату.

4. Виконайте `npm run import`