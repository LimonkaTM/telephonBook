// Подключаем библиотеки и присваиваем их одноименным костантам
const express = require('express'); // библиотека для веб-сервера
const mysql2 = require('mysql2/promise'); // бибилотека для общения с БД

// создаём пул(подключение к базе данных)
const pool = mysql2.createPool({
  host: 'localhost',
  user: 'mysql',
  database: 'phonebook',
  password: ''
});

// создаём наше прложение
const app = express();

// прослушиваем / для возврата hrml кода
app.get('/', async function(req, res) {
  
  // выполняем запрос к БД
  const data = await pool.query('SELECT * FROM abonents',);
  
  // получаем первый элемент с данными нашего ответа от БД 
  const abonents = data[0];
  
  // отправляем клиенту html
  res.send(`<!DOCTYPE html>
    <html>
      <body>
        <a href='/search'>Поиск</a>
        <ul>
          ${abonents.map(abonent => `<li><a href='/search/${abonent.id}'>${abonent.name}</a></li>`).join('')}
        </ul>
      </body>
    </html>
  `)
})

app.get('/search', async function(req, res) {
  const abonent_query = req.query.abonent_query;
  const data = await pool.query(`SELECT abonents.name, telephones.number, abonents.id 
    FROM telephones INNER JOIN abonents ON telephones.abonent_id = abonents.id 
    WHERE abonents.name LIKE ?`,`%${abonent_query}%`);
  const telephones = data[0];
  res.send(`<!DOCTYPE html>
    <html>
      <body>
        <a href='/'>На главную</a>
        <form method='get' action=''>
          <input type='text' name='abonent_query' placeholder='Введите запрос' value='${abonent_query ? abonent_query : ''}'/>
          <button type='submit'>Поиск</button>
        </form>
        ${`Найдено: ${telephones.length}`}
        <ul>
          ${telephones.map(telephones => `<li>${telephones.name} ${telephones.number}</li>`).join('')}
        </ul>
      </body>
    </html>
  `)
})

// моя попытка сделать открытие конкртеной страницы пользователя с номерами

app.get('/search/:abonent_id', async function(req, res) {
  const { abonent_id } = req.params;
  const data = await pool.query(`SELECT abonents.name, telephones.number, telephones.type 
  FROM abonents INNER JOIN telephones 
  ON abonents.id = telephones.abonent_id 
  WHERE abonents.id = ?`,`${abonent_id}`);
  const abonent_telephones = data[0];
  res.send(`<!DOCTYPE html>
    <html>
      <body>
        <a href='/'>На главную</a>
        ${`Найдено: ${abonent_telephones.length}`}
        <ul>
          ${abonent_telephones.map(abonent_telephones => `<li>${abonent_telephones.name} ${abonent_telephones.number}</li>`).join('')}
        </ul>
      </body>
    </html>
  `)
})

//открываем прослушивание порта

app.listen(3000, function() {
  console.log('Server started');
});