// -*- mode: JavaScript; -*-

import mongo from 'mongodb';
import BlogError from './blog-error.js';
import Validator from './validator.js';

//debugger; //uncomment to force loading into chrome debugger

/**
A blog contains users, articles and comments.  Each user can have
multiple Role's from [ 'admin', 'author', 'commenter' ]. An author can
create/update/remove articles.  A commenter can comment on a specific
article.

Errors
======

DB:
  Database error

BAD_CATEGORY:
  Category is not one of 'articles', 'comments', 'users'.

BAD_FIELD:
  An object contains an unknown field name or a forbidden field.

BAD_FIELD_VALUE:
  The value of a field does not meet its specs.

BAD_ID:
  Object not found for specified id for update/remove
  Object being removed is referenced by another category.
  Other category object being referenced does not exist (for example,
  authorId in an article refers to a non-existent user).

EXISTS:
  An object being created already exists with the same id.

MISSING_FIELD:
  The value of a required field is not specified.

*/

export default class Blog544 {

  constructor(meta, options, client, db) {
    //@TODO
    this.client = client;
    this.db = db;
    this.meta = meta;
    this.options = options;
    this.validator = new Validator(meta);
  }

  /** options.dbUrl contains URL for mongo database */
  static async make(meta, options) {
    //@TOD
    const client = await mongo.connect(options.dbUrl, MONGO_CONNECT_OPTIONS);
    const db = client.db(DB_NAME);
    return new Blog544(meta, options, client, db);
  }

  /** Release all resources held by this blog.  Specifically, close
   *  any database connections.
   */
  async close() {
    //@TODO
    this.client.close();
  }

  /** Remove all data for this blog */
  async clear() {
    //@TODO

    await this.db.collection('data.users').deleteMany({});
    await this.db.collection('data.articles').deleteMany({});
    await this.db.collection('data.comments').deleteMany({});

  }

  /** Create a blog object as per createSpecs and 
   * return id of newly created object 
   */
    async create(category, createSpecs) {
    const obj = this.validator.validate(category, 'create', createSpecs);
    //@TODO
    const errors = [];
    if (obj._id) {
      errors.push(new BlogError('BAD_FIELD', ' the internal mongo _id field is forbidden for ' + category + ' create'));
      if (errors.length > 0) throw errors;
    }
    if (category == 'users') {
      var array = await this.find(category, { id: createSpecs.id });
      if (array && array.length > 0) {
        errors.push(new BlogError('BAD_ID', ' users object having id ' + obj.id + ' is  already exists  '));

      } else {

        try {
          await this.db.collection("data.users").insertOne(obj);

          var count = await this.db.collection("data.users").countDocuments();
          if (count == 1) {
            await this.createIndexes(category);
          }
          return obj.id;
        } catch (error) {
          errors.push(new BlogError('', error));
        }
      }
    }
    if (category == 'articles') {
      var array = await this.find(category, { id: createSpecs.id });
      if (array && array.length > 0) {
        errors.push(new BlogError('BAD_ID', 'articles object having id  ' + obj.id + ' is already exists  '));
      } else {
        try {
          var ran = (Math.random() * 1000).toString().substr(0, 9);
          obj.id = ran;
          await this.db.collection("data.articles").insertOne(obj);
          var count = await this.db.collection("data.articles").countDocuments();
          if (count == 1) {
            await this.createIndexes(category);
          }
          return ran;
        } catch (error) {
          errors.push(new BlogError('', error));
        }
      }
    }
    if (category == 'comments') {
      var array = await this.find(category, { id: createSpecs.id });
      if (array && array.length > 0) {
        errors.push(new BlogError('BAD_ID', 'comments object having id  ' + obj.id + ' is already exists  '));
      } else {
        try {
          var ran = (Math.random() * 1000).toString().substr(0, 9);
          obj.id = ran;
          await this.db.collection("data.comments").insertOne(obj);
          var count = await this.db.collection("data.comments").countDocuments();
          if (count == 1) {
            await this.createIndexes(category);
          }
          return ran;
        } catch (error) {
          errors.push(new BlogError('', error));
        }
      }
    }
    if (errors.length > 0) throw errors;
  }

  /** Find blog objects from category which meets findSpec.  
   *
   *  First returned result will be at offset findSpec._index (default
   *  0) within all the results which meet findSpec.  Returns list
   *  containing up to findSpecs._count (default DEFAULT_COUNT)
   *  matching objects (empty list if no matching objects).  _count .
   *  
   *  The _index and _count specs allow paging through results:  For
   *  example, to page through results 10 at a time:
   *    find() 1: _index 0, _count 10
   *    find() 2: _index 10, _count 10
   *    find() 3: _index 20, _count 10
   *    ...
   *  
   */
  async find(category, findSpecs = {}) {
    const obj = this.validator.validate(category, 'find', findSpecs);
    //@TODO
    const errors = [];
    if (obj._id) {
      errors.push(new BlogError('BAD_FIELD', ' the internal mongo _id field is forbidden for ' + category + ' find'));
      if (errors.length > 0) throw errors;
    }
    if (findSpecs.creationTime) {
      findSpecs.creationTime = { $lte: new Date(findSpecs.creationTime) };
    }
    if (findSpecs._index) {
      delete findSpecs._index;
    }
    if (findSpecs._count) {
      delete findSpecs._count;
    }
    var objectsArr = [];

      try {

        const ret = await this.db.collection("data." + category).find(findSpecs, { projection: { _id: 0 } }).skip(obj._index ? parseInt(obj._index) : 0).limit(obj._count ? parseInt(obj._count) : DEFAULT_COUNT).sort([['creationTime', -1]]);
        objectsArr = await ret.toArray();

      } catch (error) {
        errors.push(new BlogError('', error));
      }

    if (errors.length > 0) throw errors;
    return objectsArr;
  }

  /** Remove up to one blog object from category with id == rmSpecs.id. */
  async remove(category, rmSpecs) {
    const obj = this.validator.validate(category, 'remove', rmSpecs);
    const errors = [];
    if (obj._id) {
      errors.push(new BlogError('BAD_FIELD', ' the internal mongo _id field is forbidden for ' + category + ' remove'));
      if (errors.length > 0) throw errors;
    }
    if (category == 'users') {
      var array = await this.find(category, rmSpecs);
      if (!array || array.length == 0) {
        errors.push(new BlogError('BAD_ID', 'no users for id ' + obj.id + ' in remove  '));
      }
      else {

        var articlesaArray = await this.getUsersIdOfArticles('articles', { authorId: rmSpecs.id });
        var commentsaArray = await this.getUsersIdOfComments('comments', { commenterId: rmSpecs.id });
        if (articlesaArray)
          errors.push(new BlogError('BAD_ID', 'users ' + obj.id + ' referenced by authorId for articles ' + articlesaArray));
        if (commentsaArray)
          errors.push(new BlogError('BAD_ID', 'users ' + obj.id + ' referenced by commenterId for comments ' + commentsaArray));

        if (errors.length == 0) {
          await this.db.collection('data.users').deleteOne({ id: rmSpecs.id });
        }
      }

    }
    if (category == 'articles') {
      var array = await this.find(category, rmSpecs);
      if (!array || array.length == 0) {
        errors.push(new BlogError('BAD_ID', 'no articles for id ' + obj.id + ' in remove  '));
      }
      else {
        var commentsaArray = await this.getUsersIdOfComments('comments', { articleId: rmSpecs.id });
        if (commentsaArray) {
          errors.push(new BlogError('BAD_ID', 'articles ' + obj.id + ' referenced by articleId for comments ' + commentsaArray));
        }
        else {
          await this.db.collection('data.articles').deleteOne({ id: rmSpecs.id });
        }
      }
    }
    if (category == 'comments') {
      var array = await this.find(category, rmSpecs);
      if (!array || array.length == 0) {
        errors.push(new BlogError('BAD_ID', 'no comments for id ' + obj.id + ' in remove  '));
      } else {
        await this.db.collection('data.comments').deleteOne({ id: rmSpecs.id });
      }
    }
    //@TODO
    console.log(errors);
    if (errors.length > 0) throw errors;
  }

  /** Update blog object updateSpecs.id from category as per
   *  updateSpecs.
   */
  async update(category, updateSpecs) {
    const obj = this.validator.validate(category, 'update', updateSpecs);
    //@TODO
    const errors = [];
    if (obj._id) {
      errors.push(new BlogError('BAD_FIELD', ' the internal mongo _id field is forbidden for ' + category + ' update'));
      if (errors.length > 0) throw errors;
    }
   
   
      var array = await this.findForUpdate(category, { id: updateSpecs.id });
      if (array && array.length > 0) {
        var updateObj = array[0];

        for (let [key, value] of Object.entries(updateSpecs)) {
          if (key != 'id') {
            updateObj[key] = value;
          }
        }
        updateObj.updateTime = new Date();

        try {
          await this.db.collection("data." + category).updateOne({ _id: updateObj._id }, { $set: updateObj });
        } catch (error) {
          errors.push(new BlogError('', error));
        }

      } else {

        errors.push(new BlogError('BAD_ID', ' ' + category + ' object having id ' + obj.id + ' is  not exists  '));

      }
  
    if (errors.length > 0) throw errors;
  }

  async getUsersIdOfArticles(category, rmSpecs) {
    const obj = this.validator.validate(category, 'find', rmSpecs);
    //@TODO
    var errors = [];
    var objectsArr = [];
    try {
      const ret = await this.db.collection("data." + category).find(rmSpecs, { projection: { id: 1, _id: 0 } });
      objectsArr = await ret.toArray();
      return objectsArr.map(d => d.id).toString();
    } catch (error) {
      errors.push(new BlogError('', error));
    }
    if (errors.length > 0) throw errors;
  }
  async getUsersIdOfComments(category, rmSpecs) {
    const obj = this.validator.validate(category, 'find', rmSpecs);
    //@TODO
    var errors = [];
    var objectsArr = [];
    try {
      const ret = await this.db.collection("data." + category).find(rmSpecs, { projection: { id: 1, _id: 0 } });
      objectsArr = await ret.toArray();
      return objectsArr.map(d => d.id).toString();
    } catch (error) {
      errors.push(new BlogError('', error));
    }
    if (errors.length > 0) throw errors;
  }

  async createIndexes(categoryInput) {
    for (const [category, infos] of Object.entries(this.meta)) {

      if (category == categoryInput) {
        const temp = [];
        infos.filter(info => info.doIndex == true).map(info => temp[info.name] = 1);

        for (const t in temp) {
          var tObj = {};
          tObj[t] = temp[t];
          if (tObj.creationTime) {
            tObj.creationTime = -1;
          }
          await this.db.collection("data." + category).createIndex(tObj);

        }
      }
    }
  }

  async findForUpdate(category, findSpecs = {}) {
    const obj = this.validator.validate(category, 'find', findSpecs);
    //@TODO
    const errors = [];
    if (findSpecs.creationTime) {
      findSpecs.creationTime = { $lte: new Date(findSpecs.creationTime) };
    }
    if (findSpecs._index) {
      delete findSpecs._index;
    }
    if (findSpecs._count) {
      delete findSpecs._count;
    }
    var objectsArr = [];

      try {
        const ret = await this.db.collection("data." + category).find(findSpecs).skip(obj._index ? parseInt(obj._index) : 0).limit(obj._count ? parseInt(obj._count) : DEFAULT_COUNT).sort([['creationTime', -1]]);
        objectsArr = await ret.toArray();

      } catch (error) {
        errors.push(new BlogError('', error));
      }

    if (errors.length > 0) throw errors;

    return objectsArr;
  }

}

const DEFAULT_COUNT = 5;
const DB_NAME = 'blog544';
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

