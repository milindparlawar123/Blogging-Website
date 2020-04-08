import assert from 'assert';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';

import BlogError from './blog-error.js';
import blog from './blog544.js';

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(port, meta, model) {
  const app = express();
  app.locals.port = port;
  app.locals.meta = meta;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function () {
    console.log(`listening on port ${port}`);
  });
}

function setupRoutes(app) {
  app.use(cors());
  app.use(bodyParser.json());
  //var q = {};
  //users
  app.get('/', async (req, res) => {
    res.status(OK);
    res.json({
      "links": [
        {
          "rel": "self",
          "name": "self",
          "url": "http://localhost:2345"
        },
        {
          "url": "http://localhost:2345/meta",
          "name": "meta",
          "rel": "describedby"
        },
        {
          "rel": "collection",
          "url": "http://localhost:2345/users",
          "name": "users"
        },
        {
          "rel": "collection",
          "name": "articles",
          "url": "http://localhost:2345/articles"
        },
        {
          "rel": "collection",
          "name": "comments",
          "url": "http://localhost:2345/comments"
        }
      ]
    }
    );

  });
  app.get('/meta', async (req, res) => {
    let temp = app.locals.model.meta;
    temp.links = [
      {
        "rel": "self",
        "href": "http://localhost:2345/meta",
        "name": "self"
      }];
      res.status(OK);
    res.json(temp);
  });

  app.get('/users', async (req, res) => {

    callFind("users", req, res, app);
  });
  app.get('/users/:id', async (req, res) => {

    callFindWithId("users", req, res, app);
  });

  app.patch('/users/:id', async (req, res) => {
    callUpdateWithId("users", req, res, app);
  });

  app.put('/users/:id', async (req, res) => {
    callUpdateWithId("users", req, res, app);
  });
  app.delete('/users/:id', async (req, res) => {
    callDeleteWithId("users", req, res, app);
  });
  app.post('/users', async (req, res) => {
    callCreate("users", req, res, app);
  });

  //articles
  app.get('/articles', (req, res) => {
    callFind("articles", req, res, app);
  });
  app.get('/articles/:id', (req, res) => {
    callFindWithId("articles", req, res, app);
  });

  app.patch('/articles/:id', async (req, res) => {
    callUpdateWithId("articles", req, res, app);
  });
  app.put('/articles/:id', async (req, res) => {
    callUpdateWithId("articles", req, res, app);
  });

  app.delete('/articles/:id', async (req, res) => {
    callDeleteWithId("articles", req, res, app);
  });
  app.post('/articles', async (req, res) => {
    callCreate("articles", req, res, app);
  });
  //comments
  app.get('/comments', (req, res) => {
    callFind("comments", req, res, app);
  });
  app.get('/comments/:id', (req, res) => {
    callFindWithId("comments", req, res, app);
  });
  app.patch('/comments/:id', async (req, res) => {
    callUpdateWithId("comments", req, res, app);
  });
  app.put('/comments/:id', async (req, res) => {
    callUpdateWithId("comments", req, res, app);
  });
  app.delete('/comments/:id', async (req, res) => {
    callDeleteWithId("comments", req, res, app);
  });
  app.post('/comments', async (req, res) => {
    callCreate("comments", req, res, app);
  });
  //@TODO
}

/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
  return async function (err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

const ERROR_MAP = {
  BAD_CATEGORY: NOT_FOUND,
  EXISTS: CONFLICT,
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  console.error(err);
  return (err instanceof Array && err.length > 0 && err[0] instanceof BlogError)
    ? {
      status: (ERROR_MAP[err[0].code] || BAD_REQUEST),
      code: err[0].code,
      message: err.map(e => e.message).join('; '),
    }
    : {
      status: SERVER_ERROR,
      code: 'INTERNAL',
      message: err.toString()
    };
}

/****************************** Utilities ******************************/

/** Return original URL for req (excluding query params)
 *  Ensures that url does not end with a /
 */
function requestUrl(req) {
  const port = req.app.locals.port;
  const url = req.originalUrl.replace(/\/?(\?.*)?$/, '');
  return `${req.protocol}://${req.hostname}:${port}${url}`;
}
async function callFind(cat, req, res, app) {
  var q = {};
  try {
    q = req.query;
    var param = {};
    Object.assign(param, q);
    var rs = await app.locals.model.find(cat, param);
    for (let i = 0; i < rs.length; i++) {
      rs[i].links = [{ "href": requestUrl(req) + '/' + rs[i].id, "name": "self", "rel": "self" }];
    }
    let re = {};
    re[cat] = rs;
    if (Object.keys(req.query).length !== 0) {
      if (req.query._count && req.query._index) {
        let next = parseInt(req.query._index) + parseInt(req.query._count);
        let prev = parseInt(req.query._index) - parseInt(req.query._count);
        re.prev = prev;
        re.next = next;

        let Z= (req.query._index).length * -1;
      
        re.links = [{ "rel": "self", "name": "self", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1] },
        { "rel": "next", "name": "next", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1].slice(0,Z) + next },
        { "rel": "prev", "name": "prev", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1].slice(0, Z) + prev }];

      } else if (req.query._index) {
        let Z= (req.query._index).length * -1;
        re.links = [{ "rel": "self", "name": "self", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1] },
        { "rel": "next", "name": "next", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1].slice(0,Z) + (parseInt(req.query._index) + parseInt(DEFAULT_COUNT)) }];
        re.next = DEFAULT_COUNT;

      } else if (req.query._count) {

        re.links = [{ "rel": "self", "name": "self", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1] },
        { "rel": "next", "name": "next", "href": requestUrl(req) + '?' + req.originalUrl.split("?")[1] + "&_index=" + req.query._count }];
        re.next = parseInt(req.query._count);
      }
      res.json(re);
    } else {
      re.links = [{ "rel": "self", "name": "self", "href": requestUrl(req) },
      { "rel": "next", "name": "next", "href": requestUrl(req) + '?' + "_index=" + DEFAULT_COUNT }];
      re.next = DEFAULT_COUNT;
      res.json(re);
    }
  }
  catch (err) {
    let re = {};
    re.err = err;
    res.json(re);
  }
}

async function callFindWithId(cat, req, res, app) {
  try {
    const id = req.params.id;
    var temp = {};
    temp.id = id;
    var rs = await app.locals.model.find(cat, temp);
    //console.log("obj "+rs);
    if (rs.length !== 0) {
      rs[0].links = [{ "href": requestUrl(req), "name": "self", "rel": "self" }];
    }
    let re = {};
    re[cat] = rs;
    res.json(re);
  }
  catch (err) {
    let re = {};
    re.err = err;
    res.json(re);
  }

}


async function callUpdateWithId(cat, req, res, app) {
  try {
    const id = req.params.id;
    var temp = req.body;
    temp.id = id;
    var rs = await app.locals.model.update(cat, temp);

    let re = {};
    //re[cat] = rs;
    
    res.json(re);
  }
  catch (err) {
   
    let re = {};
    re.err = err;
    res.json(re);
  }

}


async function callDeleteWithId(cat, req, res, app) {
  try {
    const id = req.params.id;
    var temp = req.body;
    temp.id = id;
    var rs = await app.locals.model.remove(cat, temp);

    let re = {};
  
    //re[cat] = rs;
    res.json(re);
  }
  catch (err) {
    let re = {};
    re.err = err;
    res.json(re);
  }

}

async function callCreate(cat, req, res, app) {
  try {
    var temp = req.body;
    var rs = await app.locals.model.create(cat, temp);

    let re = {};
    //re[cat] = rs;    
    res.json(re);
  }
  catch (err) {
   
    let re = {};
    re.err = err;
    res.json(re);
  }

}
const DEFAULT_COUNT = 5;

//@TODO
