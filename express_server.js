const express = require('express');
const cookieParser = require('cookie-parser');
const { generateRandomString, getUserByEmail } = require('./util');

const app = express();
const PORT = 8080;
const USER_ID_KEY_COOKIE = 'user_id';
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get('/', (req, res) => {
  // In the future should redirect to login page if not logged in already.
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const userId = req.cookies[USER_ID_KEY_COOKIE];
  res.render('register', {
    user: users[userId]
  });
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Client sent missing email and/or password.');
    res.status(400).send('Email and/or password was not filled in.');
    return;
  }

  const id = generateRandomString();
  const newUser = {
    id,
    email,
    password
  };

  if (getUserByEmail(users, newUser.email)) {
    res.status(400).send('Email already exists in users.');
    console.log('Client tried to register user that already exists. Email: ', newUser.email);
    return;
  }

  users[id] = newUser;

  console.log(`New user: ${newUser.email} created!`);
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  console.log('Currently in login page, current available users:', users);
  const templateVars = {
    user: null
  };
  // user is always null when we go to login endpoint.
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const foundUser = getUserByEmail(users, email);
  if (!foundUser) {
    res.status(403).send(`Could not find user with email: ${email}`);
    return;
  }

  if (foundUser.password !== password) {
    res.status(403).send(`Password associated with ${foundUser.email} was incorrect.`);
    return;
  }

  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  if (req.cookies[USER_ID_KEY_COOKIE]) {
    res.clearCookie(USER_ID_KEY_COOKIE);
  }
  res.redirect('/login');
});

app.get('/urls', (req, res) => {
  const userId = req.cookies[USER_ID_KEY_COOKIE];
  res.render('urls_index', {
    urls: urlDatabase,
    user: users[userId]
  });
});

app.post('/urls', (req, res) => {
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

app.get('/urls/new', (req, res) => {
  const userId = req.cookies[USER_ID_KEY_COOKIE];
  res.render('urls_new', {
    user: users[userId]
  });
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
  const userId = req.cookies[USER_ID_KEY_COOKIE];
  res.render('urls_show', {
    urlId: urlId,
    longURL: urlDatabase[urlId],
    user: users[userId]
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