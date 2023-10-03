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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const isUserLoggedIn = (idCookie) => users[idCookie];

app.get('/', (req, res) => {
  // In the future should redirect to login page if not logged in already.
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  // If cookie already exists, meaning there is a user, just redirect to /urls.
  if (isUserLoggedIn(req.cookies[USER_ID_KEY_COOKIE])) {
    res.redirect('/urls');
    return;
  }

  res.render('register', {
    user: null
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
  // If cookie already exists, meaning there is a user, just redirect to /urls.
  console.log('Currently in login page, current available users:', users);
  if (isUserLoggedIn(req.cookies[USER_ID_KEY_COOKIE])) {
    res.redirect('/urls');
    return;
  }

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
  // Only logged in users can enter.
  if (!isUserLoggedIn(req.cookies[USER_ID_KEY_COOKIE])) {
    res.status(400).send('Must be logged in to shorten URLS.');
    return;
  }
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
  // Only logged in users can enter.
  if (!isUserLoggedIn(req.cookies[USER_ID_KEY_COOKIE])) {
    res.redirect('/login');
    return;
  }

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

  // If there is no longURL associated with short ID, send error code.
  if (!longURL) {
    res.status(400).send('Long URL does not exist.');
    return;
  }
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});