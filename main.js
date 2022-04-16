// Подключаем библиотеки и присваиваем их одноименным костантам
const express = require('express'); // библиотека для веб-сервера
const mysql2 = require('mysql2/promise'); // бибилотека для общения с БД
const bodyParser = require('body-parser'); //библиотека для принятия данных из post запросов формы

// создаём пул(подключение к базе данных)
const pool = mysql2.createPool({
  host: 'localhost',
  user: 'mysql',
  database: 'phonebook',
  password: ''
});

// создаём наше прложение
const app = express();

// подключаем к нашему приложению body-parser
app.use(bodyParser.urlencoded({extended: true}));

// прослушиваем обращение по главному пути для возврата hrml кода
app.get('/', async function(req, res) {
  
  // выполняем запрос к БД и получаем первый элемент
  const [abonents] = await pool.query('SELECT * FROM abonents',);

  // отправляем клиенту html
  res.send(`<!DOCTYPE html>
    <html>
      <body>
      <h1>Книга абонентов</h1>
      <span>Список абонентов</span> <a href='/search'>Поиск</a>
        <hr>
        <ul>
          ${abonents.map(abonent => `<li><a href='/abonent-telephones/${abonent.id}'>${abonent.name}</a></li>`).join('')}
        </ul>
      </body>
    </html>
  `)
})

// страница с телефонными номерами конкретного абонента

app.get('/abonent-telephones/:abonent_id', async function(req, res) {
  const {abonent_id} = req.params;
  const [telephones] = await pool.query(`SELECT * FROM telephones WHERE abonent_id = ?`, abonent_id);
  const [[abonent]] = await pool.query(`SELECT * FROM abonents WHERE id = ?`, abonent_id)
  res.send(`<!DOCTYPE html>
    <html>
      <body>
        <h1>Телфонные номера абонента: ${abonent.name}</h1>
        <a href='/'>Список абонентов</a> <a href='/search'>Поиск</a>
        <hr>
        <br>
        ${`Найдено: ${telephones.length}`}
        <ul>
          ${telephones.map(telephones => `<li>${telephones.number} ${telephones.type || ''} <a href="/remove-telephone/${telephones.id}">Удалить телефон</a></li>`).join('')}
        </ul>
        <form method='post' action='/add-telephone/${abonent.id}'>
          <input type='text' name='number' placeholder='Номер телефона'/>
          <input type='text' name='type' placeholder='Тип телефона'/>
          <button type='submit'>Добавить</button>
        </form>
      </body>
    </html>
  `);
})

// обработка запроса на удаление номера

app.get('/remove-telephone/:telephone_id', async function(req, res) {
  const {telephone_id} = req.params;
  const [[telephone]] = await pool.query(`SELECT * FROM telephones WHERE id = ?`, telephone_id);
  await pool.query(`DELETE FROM telephones WHERE id = ?`, telephone_id)
  res.redirect(`/abonent-telephones/${telephone.abonent_id}`)
})

// обработка запроса на добавление нового номера

app.post('/add-telephone/:abonent_id', async function(req, res) {
  const {abonent_id} = req.params;
  const {number, type} = req.body;
  await pool.query(`INSERT INTO telephones SET ?`, {
    abonent_id,
    number,
    type
  })
  res.redirect(`/abonent-telephones/${abonent_id}`)
})

// страница поиска

app.get('/search', async function(req, res) {
  const abonent_query = req.query.abonent_query || '';
  const [telephones] = await pool.query(`SELECT abonents.name, telephones.number, abonents.id 
    FROM telephones INNER JOIN abonents ON telephones.abonent_id = abonents.id 
    WHERE abonents.name LIKE ?`,`${abonent_query}%`);
  res.send(`<!DOCTYPE html>
    <html>
      <body>
        <h1>Поиск абонента</h1>
        <a href='/'>Список абонентов</a><span> Поиск</span>
        <hr>
        <form method='get' action='/search'>
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

app.get('/search-dynamic-data', async function(req, res) {
  const abonent_query = req.query.abonent_query || '';
  const [telephones] = await pool.query(`SElECT telephones.number, abonents.name
    FROM abonents
    JOIN telephones ON telephones.abonent_id = abonents.id
    WHERE abonents.name LIKE ?`, `${abonent_query}%`);
  res.json(telephones)
})

app.get('/search-dynamic', async function(req, res) {
  const abonent_query = req.query.abonent_query || '';
  const [telephones] = await pool.query(`SELECT abonents.name, telephones.number, abonents.id 
    FROM telephones INNER JOIN abonents ON telephones.abonent_id = abonents.id 
    WHERE abonents.name LIKE ?`,`${abonent_query}%`);
  res.send(`<!DOCTYPE html>
    <html>
      <body>
        <script>
          async function getNewData(target) {
            const data = await fetch('/search-dynamic-data?abonent_query=' + target.value);
            const telephones = await data.json();
            document.querySelector('ul').innerHTML = telephones.map(telephones => \`<li>\${telephones.name} \${telephones.number}</li>\`).join('')
            document.querySelector('.count').innerHTML = telephones.length;
          }
        </script>
        <h1>Поиск абонента</h1>
        <a href='/'>Список абонентов</a><span> Поиск</span>
        <hr>
        <form method='get' action='/search'>
          <input type='text' name='abonent_query' placeholder='Введите запрос' oninput='getNewData(this)' value='${abonent_query ? abonent_query : ''}'/>
          <button type='submit'>Поиск</button>
        </form>
        ${`Найдено: <span class='count'>${telephones.length}</span>`}
        <ul>
          ${telephones.map(telephones => `<li>${telephones.name} ${telephones.number}</li>`).join('')}
        </ul>
      </body>
    </html>
  `)
})

//открываем прослушивание порта

app.listen(3000, function() {
  console.log('Server started');
});