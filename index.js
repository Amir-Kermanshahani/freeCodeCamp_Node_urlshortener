require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { default: mongoose, connection } = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const app = express();
const dns = require('dns');

// Connecting to database
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewURLParser: true,
  useUnifiedTopology: true, 
  serverSelectionTimeoutMS: 5000
})
connection.on('error', console.error.bind(console, 'connection error: '));
connection.once('open', () => {
  console.log('MongoDB database connection stablished successfully.');
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema);;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', async function(req, res) {
  const url = req.body.url_input
  const urlCode = shortid.generate()
  dns.lookup(url, function(err, data) {
    if (err) {res.status(401).json({error: 'invalid URL'})}
    async () => {
      try {
        let findOne = await URL.findOne({
          original_url: url
        })
        if (findOne) {
          res.json({
            original_url: url,
            short_url: urlCode
          })
          await findOne.save()
          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url
          })
        }
      } catch (err) {
        console.error(err)
        res.status(500).json("Server error ...")
      }
    }
  })
})

app.get('/api/shorturl/:short_url?', async function(req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json("No URL found")
    }
  } catch (err) {
    console.log(err)
    res.status(500).json("Server error")
  } 
  
})
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
