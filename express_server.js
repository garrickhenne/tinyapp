const express = require('express');
const cookieParser = require('cookie-parser');
const { generateRandomString } = require('./util');

const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  console.log('cookies', req.cookies['username']);
  if (req.cookies['username']) {
    res.clearCookie('username');
  }
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const usernameCookie = req.cookies['username'];
  res.render('urls_index', {
    username: usernameCookie,
    urls: urlDatabase
  });
});

app.get('/urls/new', (req, res) => {
  const usernameCookie = req.cookies['username'];
  res.render('urls_new', {
    username: usernameCookie
  });
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  const randomString = generateRandomString();

  if (urlDatabase[randomString]) {
    console.log('Randomly generated string was already in use. Bad luck... (or really good luck).');
    // set res status code to the one corresponding to server error.
    res.statusCode = 500;
    res.send('Internal server error. Please try again.');
  }

  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.post('/urls/:id', (req, res) => {
  const { id } = req.params;
  const newId = req.body.newLongURL;
  urlDatabase[id] = newId;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  const urlId = req.params.id;
  delete urlDatabase[urlId];
  res.redirect('/urls');
});

app.get('/urls/:id', (req, res) => {
  const urlId = req.params.id;
  const usernameCookie = req.cookies['username'];
  res.render('urls_show', {
    username: usernameCookie,
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