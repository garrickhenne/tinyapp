const express = require('express');
const { generateRandomString } = require('./util');

const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  res.render('urls_index', {
    urls: urlDatabase
  });
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.get('/urls/:id', (req, res) => {
  const urlId = req.params.id;
  console.log(urlId);
  res.render('urls_show', {
    urlId: urlId,
    longURL: urlDatabase[urlId]
  });
});

app.get('/u/:id', (req, res) => {
  // Get short ID from request params.
  const { id } = req.params;

  // Redirect to original URL name.
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});