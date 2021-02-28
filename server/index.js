const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch = require('node-fetch');
const jsdom = require('jsdom');

const app = express();
const port = process.env.PORT || 3100;
const { JSDOM } = jsdom;

app.use(cors());
app.use(morgan('tiny'));

function getResults(body) {
  const dom = new JSDOM(body);
  const rows = dom.window.document.querySelectorAll('.s-item__wrapper');
  const results = [];

  rows.forEach((element) => {
    if (element) {
      const title = element
        .querySelector('h3.s-item__title')
        .textContent.slice(11);
      const price = element.querySelector('.s-item__price').textContent;
      const link = element.querySelector('.s-item__link').href;
      const image = element.querySelector('.s-item__image-img').src;

      results.push({
        title,
        price,
        image,
        link,
      });
    }
  });

  return results;
}

const cache = {
  date: 0,
  body: null,
  results: null,
};

app.get('/', (req, res) => {
  res.json({ message: 'hello world! 👌' });
});

// https://www.ebay.com/sch/i.html?_from=R40&_nkw=humbucker&_sacat=0&LH_TitleDesc=0&_sop=10
app.get('/search/:search_term', (req, res) => {
  const { search_term } = req.params;
  const url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${search_term}&_sacat=0&LH_TitleDesc=0&_sop=10`;

  const date = new Date().getTime();

  if (cache.body && date - 120000 < cache.date) {
    console.log('serving cached data');
    res.json(cache);
  } else {
    console.log('fetching new data');
    fetch(url)
      .then((response) => response.text())
      .then(async (body) => {
        const results = getResults(body);

        cache.date = date;
        cache.body = body;
        cache.results = results;

        res.json({
          results,
          body,
        });
      });
  }
});

app.use((req, res, next) => {
  const error = new Error('Not Found');
  res.status(404);
  next(error);
});

app.use((error, req, res, next) => {
  res.status(res.statusCode || 500);
  res.json({
    message: error.message,
  });
});

app.listen(port, () => console.log(`Listenting on port ${port}...`));