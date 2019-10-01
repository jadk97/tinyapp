const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
const PORT = 8080; // default port 8080


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
    let result = "";
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 6; i++){
      result +=charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
};



app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls", (req, res) => {  
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  if(req.body.longURL.includes("http") || req.body.longURL.includes("https") ){
    urlDatabase[shortURL] = req.body.longURL;
  }
  else{
    urlDatabase[shortURL] = `https\://${req.body.longURL}`;
  }
  
  res.redirect(`/urls/${shortURL}`);
});


app.get("/urls/:shortURL", (req, res) => {
 // console.log(urlDatabase);
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) =>{
  res.send("<html><body> Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

