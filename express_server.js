const express = require('express');
const cookieSession = require('cookie-session');
const { generateRandomString, getUserByEmail } = require('./helpers');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');

const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));
app.use(methodOverride('_method'));

const urlDatabase = {};

const users = {};

const urlsForUser = (userId) => {
  let usersURLs = {};
  for (const urlIdKey in urlDatabase) {
    if (userId === urlDatabase[urlIdKey].userID) {
      usersURLs[urlIdKey] = {
        longURL: urlDatabase[urlIdKey].longURL
      };
    }
  }

  return usersURLs;
};

const isUserLoggedIn = (idCookie) => users[idCookie];

app.get('/', (req, res) => {
  // /login endpoint will redirect to /urls if user is logged in already.
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  // If cookie already exists, meaning there is a user, just redirect to /urls.
  if (isUserLoggedIn(req.session.user_id)) {
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
    res.status(400).send('Email and/or password was not filled in.');
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  // Return error code if user with email already exists.
  if (getUserByEmail(users, newUser.email)) {
    res.status(400).send('Email already exists in users.');
    return;
  }

  users[id] = newUser;
  // eslint-disable-next-line camelcase
  req.session.user_id = id;

  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  // If cookie already exists, meaning there is a user, just redirect to /urls.
  if (isUserLoggedIn(req.session.user_id)) {
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

  if (!bcrypt.compareSync(password, foundUser.password)) {
    res.status(403).send(`Password associated with ${foundUser.email} was incorrect.`);
    return;
  }

  // eslint-disable-next-line camelcase
  req.session.user_id = foundUser.id;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  if (req.session.user_id) {
    req.session = null;
  }
  res.redirect('/login');
});

app.get('/urls', (req, res) => {
  const userID = req.session.user_id;
  // Return status 400 if currently not logged in.
  if (!isUserLoggedIn(userID)) {
    res.status(400).send('Must be logged in to view shortened URLs.');
    return;
  }

  const usersURLs = urlsForUser(userID);
  res.render('urls_index', {
    urls: usersURLs,
    user: users[userID]
  });
});

app.post('/urls', (req, res) => {
  // Only logged in users can enter.
  if (!isUserLoggedIn(req.session.user_id)) {
    res.status(400).send('Must be logged in to shorten URLS.');
    return;
  }

  const randomString = generateRandomString();

  if (urlDatabase[randomString]) {
    // set res status code to the one corresponding to server error.
    res.statusCode = 500;
    res.send('Internal server error. Please try again. Randomly generated string was already in use. Bad luck... (or really good luck?).');
  }
  const { longURL } = req.body;
  const userID = users[req.session.user_id].id;
  urlDatabase[randomString] = {
    longURL,
    userID
  };
  res.redirect(`/urls/${randomString}`);
});

app.get('/urls/new', (req, res) => {
  const userID = req.session.user_id;
  // Only logged in users can enter.
  if (!isUserLoggedIn(userID)) {
    res.redirect('/login');
    return;
  }

  res.render('urls_new', {
    user: users[userID]
  });
});

app.get('/urls/:id', (req, res) => {
  const userID = req.session.user_id;
  // Send error if user is not logged in.
  if (!isUserLoggedIn(userID)) {
    res.status(400).send('Must be logged in to access short URL.');
    return;
  }

  const urlID = req.params.id;

  if (!urlDatabase[urlID]) {
    res.status(400).send('short url id does not exist.');
    return;
  }

  if (urlDatabase[urlID].userID !== userID) {
    res.status(400).send('Cannot view short ids that do not belong to you.');
    return;
  }

  res.render('urls_show', {
    urlId: urlID,
    longURL: urlDatabase[urlID].longURL,
    count: urlDatabase[urlID].count,
    uniqueVisitorCount: urlDatabase[urlID].uniqueVisitorCount,
    visits: urlDatabase[urlID].visits,
    user: users[userID]
  });
});

app.put('/urls/:id', (req, res) => {
  const userID = req.session.user_id;
  // Send error if user is not logged in.
  if (!isUserLoggedIn(userID)) {
    res.status(400).send('Must be logged in to access short URL.');
    return;
  }

  const urlID = req.params.id;

  // Send error code if short URL does not exist.
  if (!urlDatabase[urlID]) {
    res.status(400).send('Short URL does not exist');
    return;
  }

  // Send error code if short URL does not belong to current logged in user.
  if (urlDatabase[urlID].userID !== userID) {
    res.status(400).send('Cannot access short URL that does not belong to user.');
    return;
  }

  const newId = req.body.newLongURL;
  urlDatabase[urlID].longURL = newId;
  res.redirect('/urls');
});

app.delete('/urls/:id/', (req, res) => {
  const userID = req.session.user_id;
  // Send error if user is not logged in.
  if (!isUserLoggedIn(userID)) {
    res.status(400).send('Must be logged in to access short URL.');
    return;
  }

  const urlID = req.params.id;

  // Send error code if short URL does not exist.
  if (!urlDatabase[urlID]) {
    res.status(400).send('short url id does not exist.');
    return;
  }

  // Send error code if short URL does not belong to current logged in user.
  if (urlDatabase[urlID].userID !== userID) {
    res.status(400).send('Cannot delete urls that do not belong to you.');
    return;
  }

  delete urlDatabase[urlID];
  res.redirect('/urls');
});

app.get('/u/:id', (req, res) => {
  // Get short ID from request params.
  const { id } = req.params;

  const urlObj = urlDatabase[id];
  if (!urlObj) {
    res.status(400).send('Short URL ID does not exist.');
    return;
  }

  // Redirect to original URL name.
  const longURL = urlObj.longURL;
  urlObj.count = urlObj.count ? urlObj.count + 1 : 1;

  // Incoming request is from unique visitor.
  if (!req.session.visitor_id) {
    // eslint-disable-next-line camelcase
    req.session.visitor_id = generateRandomString();
    urlObj.uniqueVisitorCount = urlObj.uniqueVisitorCount ? urlObj.uniqueVisitorCount + 1 : 1;
  }

  // Track each visit with timestamp, and generated visitor_id
  const visitObject = { time: new Date().toLocaleString(), visitorID: req.session.visitor_id };
  if (urlObj.visits) {
    urlObj.visits.push(visitObject);
  } else {
    urlObj.visits = [visitObject];
  }

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