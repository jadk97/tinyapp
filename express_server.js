const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080; // default port 8080


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  let result = "";
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};



app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
})

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  if (req.body.longURL.includes("http") || req.body.longURL.includes("https")) {
    urlDatabase[shortURL] = req.body.longURL;
  }
  else {
    urlDatabase[shortURL] = `https\://${req.body.longURL}`;
  }

  res.redirect(`/urls/${shortURL}`);
});


app.get("/urls/:shortURL", (req, res) => {
  // console.log(urlDatabase);
  let templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  // console.log(longURL);

  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  // delete urlDatabase[req.params.id];
  res.redirect(`/urls/${req.params.shortURL}`);
});
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("url_login", templateVars);
});

app.post("/login", (req, res) => {
  // console.log(req.body.email);
  // console.log(req.body.password);  
  let userFound;
  for (let user in users){
    if(users[user]["email"] === req.body.email){
      if(users[user]["password"] === req.body.password){
        userFound = users[user];
        break;
      }
    }
  }
  if (userFound === undefined){
    res.status(403).send("403 Bad Request");
  }
  else{
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
  for(let user in users){
    if(users[user]["email"] === req.body.email){
      loginError = true;
    }
    else{
      loginError = false;
    }
  }
  
  // if(Object.values(users).indexOf(req.body.email) > - 1){
  //   res.status(400).send("400 Bad Request Error");
  // }
  if (!loginError){
  let userID = generateRandomString();
  users[userID] = { id: userID, email: req.body.email, password: req.body.password };
  // console.log(users);
  res.cookie("user_id", userID);
  console.log(users);
  res.redirect("/urls");
  }
  else{
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

