const express = require("express");
const bodyParser = require("body-parser");
const { getUserByEmail } = require("./helpers.js");
const bcrypt = require("bcrypt");
const cookieSession = require('cookie-session');
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'user_id',
  keys: ['id'],
}));
const PORT = 8080; // default port 8080


app.set("view engine", "ejs");

const urlDatabase = {

};

const users = {

};

function generateRandomString() {
  let result = "";
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

function urlsForUser(id) {
  let filteredURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]["userID"] === id) {
      filteredURLs[url] = urlDatabase[url];
    }
  }
  return filteredURLs;
};


//HOME PAGE
//redirects to the url index page by default
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//INDEX PAGE
//displays a given user's URLs
//if they aren't logged in, then naturally nothing will show
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id)
  };

  res.render("urls_index", templateVars);
});

//NEW URL, GET
//if the user isn't logged in, they're redirected to the login page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id)
  };
  if (templateVars.user === undefined) {
    res.redirect("/login");
  }
  else {
    res.render("urls_new", templateVars);
  }
})

//ADDING A LINK
//pushes the generated short URL and long URL and attaches the ID of the user that submitted it
//if the user forgets to include http or https while inputting the website they'd like to generate a link for, https:// is concatenated onto the beginning of the long URL they entered
//this is to prevent any broken redirect links from happening
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  if (req.body.longURL.includes("http") || req.body.longURL.includes("https")) {
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };

  }
  else {
    urlDatabase[shortURL] = { longURL: `https\://${req.body.longURL}`, userID: req.session.user_id };
  }
  res.redirect(`/urls/${shortURL}`);
});

//EDIT PAGE, GET
//if the user attempts to access the submission/edit page without being logged in, they're redirected to the index page
app.get("/urls/:shortURL", (req, res) => {
  let userCookie = users[req.session.user_id];
  if (userCookie !== undefined && urlDatabase[req.params.shortURL] !== undefined) {
    let templateVars = {
      user: userCookie,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  }
  else {
    res.redirect("/urls");
  }
});

//SHORT LINK HANDLER
//handles redirecting short links to their corresponding website
//if the link doesn't exist, the user is sent an error message
//otherwise it's business as usual
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send("No link found");
  }
  else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

//DELETING LINKS
//Checks if the user is logged in, and then deletes the link of their choosing
app.post("/urls/:shortURL/delete", (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

//EDITING LINKS
//Checks if the user is logged in, and then allows them to edit the link of their choosing
app.post("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect("/urls");
  }
});

//LOGIN PAGE, GET
//Renders the login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render("url_login", templateVars);
});

//LOGIN PAGE, POST
//Checks if the email entered already exists in the users object
//if it doesn't, then they're sent an error page
//otherwise, the password is checked and they're allowed access provided that it matches the password in the users object
app.post("/login", (req, res) => {
  let userFound = getUserByEmail(req.body.email, users);
  if (userFound === undefined) {
    res.status(403).send("403 Bad Request. No user found under that email.");
  }
  else {
    if (bcrypt.compareSync(req.body.password, userFound.password)) {
      req.session.user_id = userFound.id;
      res.redirect("/urls");
    }
    else {
      res.status(403).send("403 Bad Request. Incorrect password.");
    }
  }
});

//LOGOUT 
//Clears the user's cookies and logs them out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//REGISTER, GET
//Renders the registration page
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render("url_registration", templateVars);
});

//REGISTER, POST
//Makes sure that there isn't a user already registered under the inputted email, and then adds them to the users object
app.post("/register", (req, res) => {
  let userFound = getUserByEmail(req.body.email, users);
  if (userFound === undefined) {
    let userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[userID] = { id: userID, email: req.body.email, password: hashedPassword };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
  else {
    res.status(400).send("400 Bad Request. There's already a user registered under that email.");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

