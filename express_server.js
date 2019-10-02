const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080; // default port 8080


app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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






app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls", (req, res) => {
  // console.log(urlsForUser(req.cookies["user_id"]);
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"]),
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"])
  };
  if (templateVars.user === undefined) {
    res.redirect("/login");
  }
  else {
    res.render("urls_new", templateVars);
  }
})

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  if (req.body.longURL.includes("http") || req.body.longURL.includes("https")) {
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };

  }
  else {
    urlDatabase[shortURL] = { longURL: `https\://${req.body.longURL}`, userID: req.cookies["user_id"] };
  }
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});


app.get("/urls/:shortURL", (req, res) => {
  // console.log(urlDatabase);
  let userCookie = users[req.cookies["user_id"]];
  if (userCookie !== undefined) {
    let templateVars = {
      user: userCookie,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    // console.log(templateVars.longURLs);
    res.render("urls_show", templateVars);
  }
  else {
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  // console.log(longURL);

  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  if (users[req.cookies["user_id"]] !== undefined) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (users[req.cookies["user_id"]] !== undefined) {
    urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };

    // delete urlDatabase[req.params.id];
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("url_login", templateVars);
});

app.post("/login", (req, res) => { 
  let userFound;
  for (let user in users) {
    if (users[user]["email"] === req.body.email) {
      // if (users[user]["password"] === req.body.password) {
        if(bcrypt.compareSync(req.body.password, users[user]["password"])){
        userFound = users[user];
        break;
      }
    }
  }
  if (userFound === undefined) {
    res.status(403).send("403 Bad Request");
  }
  else {
    res.cookie("user_id", userFound.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("url_registration", templateVars);
});

app.post("/register", (req, res) => {
  let loginError = false;
  for (let user in users) {
    if (users[user]["email"] === req.body.email) {
      loginError = true;
    }
    else {
      loginError = false;
    }
  }
  if (!loginError) {
    let userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[userID] = { id: userID, email: req.body.email, password: hashedPassword };
    // console.log(users);
    res.cookie("user_id", userID);
    console.log(users);
    res.redirect("/urls");
  }
  else {
    res.status(400).send("400 Bad Request");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body> Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

