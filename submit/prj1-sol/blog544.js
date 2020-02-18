// -*- mode: JavaScript; -*-

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
const DEFAULT_COUNT=5;
export default class Blog544 {

  constructor(meta, options) {
    //@TODO
 this.data={users:{},articles:{},comments:{}};
 this.userArticles={};
 this.userComments={};
 this.articlesComments={};
 
    //console.log(this);
    this.meta = meta;
    this.options = options;
    this.validator = new Validator(meta);
  }

  static async make(meta, options) {
    //@TODO
    return new Blog544(meta, options);
  }

  /** Remove all data for this blog */
  async clear() {
    //@TODO
    this.data.users={};
    this.data.articles={};
    this.data.comments={};
    this.userComments={};
    this.articlesComments={};

  }

  /** Create a blog object as per createSpecs and 
   * return id of newly created object 
   */
  async create(category, createSpecs) {
    const obj = this.validator.validate(category, 'create', createSpecs);
    //@TODO
    if(category == 'users'){
    this.data.users[obj.id]=obj;
    //console.log(obj.id);
    return obj.id;
  }else if(category=='comments'){

if(!obj.articleId){
throw [ new BlogError('BAD_FIELD' , ' missing comment article ID fields for comments create ') ];
}
     if(obj.articleId && !this.data.articles[obj.articleId]){
       
            throw [ new BlogError('BAD_ID' , 'invalid id ' + obj.articleId +' for article for create comments ') ];
        

          }
     if(!this.data.users[obj.commenterId]){
            //throw [ new BlogError(`BAD_CATEGORY', 'unknown category ${category}`) ];
            throw [ new BlogError('BAD_ID' , 'invalid id '+ obj.commenterId + ' for users for create comments ') ];
          // errors.push(new BlogError('BAD_ID', 'users ' + obj.id +' referenced by authorId for articles '+ artList));

          }
    var ran=(Math.random() *1000).toString().substr(0,9);
    obj.id=ran;
      this.data.comments[ran]=obj;

      if(this.userComments[obj.commenterId]){
        this.userComments[obj.commenterId].push(ran);
      }else{
        this.userComments[obj.commenterId]=[ran];
      }

      if(this.articlesComments[obj.articleId]){
        this.articlesComments[obj.articleId].push(ran);
      }else{
        this.articlesComments[obj.articleId]=[ran];
      }
      return ran;
    }else if(category=='articles'){
          if(!this.data.users[obj.authorId]){
            //throw [ new BlogError(`BAD_CATEGORY', 'unknown category ${category}`) ];
            throw [ new BlogError(`BAD_ID' , 'invalid id  ${obj.authorId} for users for create articles `) ];
          // errors.push(new BlogError('BAD_ID', 'users ' + obj.id +' referenced by authorId for articles '+ artList));

          }

      var ran=(Math.random() *1000).toString().substr(0,9);
      obj.id=ran;
      this.data.articles[ran]=obj;

      if(this.userArticles[obj.authorId]){
        this.userArticles[obj.authorId].push(ran);
      }else{
        this.userArticles[obj.authorId]=[ran];
      }
      //console.log(ran);
      return ran;
    }
    //return obj;
  }

  /** Find blog objects from category which meets findSpec.  Returns
   *  list containing up to findSpecs._count matching objects (empty
   *  list if no matching objects).  _count defaults to DEFAULT_COUNT.
   */
  async find(category, findSpecs={}) {
    const obj = this.validator.validate(category, 'find', findSpecs);
    //@TODO
    var max=findSpecs._count == undefined ? DEFAULT_COUNT : findSpecs._count;

   var users=[];
   var errors=[];
    
    if(category=='users')
    {
  
    if(findSpecs.id){

    if(!this.data.users[findSpecs.id]){
           errors.push(new BlogError('BAD_ID', 'no users for id  ' + obj.id +' in find '));
      }else
          users.push(this.data.users[findSpecs.id]);

     }else{

  var count=0;
  for(var key in this.data.users){
    if(count==max) break;
  users.push(this.data.users[key]);
  count++;
}
}
    }else if(category=='articles'){
     
     if(findSpecs.id){
      if(!this.data.articles[findSpecs.id]){
           errors.push(new BlogError('BAD_ID', 'no articles for id  ' + obj.id +' in find '));
      }else
          users.push(this.data.articles[findSpecs.id]);

     }
else {
  var count=0;
  for(var key in this.data.articles){
    if(count==max) break;
  users.push(this.data.articles[key]);
  count++;
}
}
}else if(category=='comments'){
 if(findSpecs.id){

    if(!this.data.comments[findSpecs.id]){
           errors.push(new BlogError('BAD_ID', 'no comments for id  ' + obj.id +' in find '));
      }else{
  users.push(this.data.comments[findSpecs.id]);
}

}else if(findSpecs.commenterId){
if(!this.userComments[findSpecs.commenterId]){
 errors.push(new BlogError('BAD_ID', 'no comments for commenter id  ' + obj.id +' in find '));
}else{

 var count=0;
  for(var i=0; i<this.userComments[findSpecs[Object.keys(findSpecs)[0]]].length ;i++){
    users.push(this.data.comments[this.userComments[findSpecs[Object.keys(findSpecs)[0]]][i]]);
    count++;
    if(count==max) break;
  }
  }
   }else{

    var count=0;
    for(var key in this.data.comments){
     if(count==max) break;
     users.push(this.data.comments[key]);
    count++;

}}

    }
    if(errors.length>0){
      throw errors;
    }
    return users;
  }

  /** Remove up to one blog object from category with id == rmSpecs.id. */
  async remove(category, rmSpecs) {
    const obj = this.validator.validate(category, 'remove', rmSpecs);
    //@TODO
    const errors = [];
    if(category=='users')
    {
      if(obj.id && !this.data.users[obj.id]){
        errors.push(new BlogError('BAD_ID', 'no users for id ' + rmSpecs.id+' in remove  '));
      }
     var artList=this.userArticles[obj.id];
     var commList = this.userComments[obj.id];
     if((artList && artList.length>0) || ( commList && commList.length)){

//const msg1='bb ${category}';
if(artList)
errors.push(new BlogError('BAD_ID', 'users ' + obj.id +' referenced by authorId for articles '+ artList));
if(commList)
errors.push(new BlogError('BAD_ID', 'users ' + obj.id +' referenced by commenterId for comments ' + commList));


     }else{

      delete this.data.users[obj.id];
     }
    if(errors.length>0) throw errors;
    }else if(category=='articles'){
      if(!this.data.articles[rmSpecs.id]){

      errors.push(new BlogError('BAD_ID', 'no articles for id ' + rmSpecs.id+' in remove  '));
      }
       else
      {
     var artCommList=this.articlesComments[rmSpecs.id];
      if(artCommList && artCommList.length>0){
        errors.push(new BlogError('BAD_ID', ' articles ' + rmSpecs.id+' referenced  by articleId for comments '+  artCommList));
      }
      }
      if(errors.length>0)throw errors;

    if(this.data.articles[rmSpecs.id]){
        var ar= this.userArticles[this.data.articles[obj.id].authorId];     
         ar.splice(ar.indexOf(obj.id),1);
         this.userArticles[this.data.articles[obj.id].authorId]=ar;
         delete this.data.articles[rmSpecs.id];

      }
    }else if(category=='comments'){

      if(obj.id && !this.data.comments[obj.id]){
        errors.push(new BlogError('BAD_ID', 'no comments for id ' + obj.id+' in remove  '));
      }
      else if( obj.id && this.data.comments[obj.id]){
        
         this.articlesComments[obj.articleId];
         
         var ar= this.articlesComments[this.data.comments[obj.id].articleId];
        //console.log(ar);
        //console.log(ar.indexOf(obj.id));
         ar.splice(ar.indexOf(obj.id),1);
         this.articlesComments[this.data.comments[obj.id].articleId]=ar;


         var ar1= this.userComments[this.data.comments[obj.id].commenterId];
        //console.log(ar);
        //console.log(ar.indexOf(obj.id));
         ar1.splice(ar1.indexOf(obj.id),1);
         this.userComments[this.data.comments[obj.id].commenterId]=ar;

         
         delete this.data.comments[obj.id];       
      }
      if(errors.length>0)throw errors;

    }
  }

  /** Update blog object updateSpecs.id from category as per
   *  updateSpecs.
   */
  async update(category, updateSpecs) {
    const obj = this.validator.validate(category, 'update', updateSpecs);
    //@TODO
    const errors = [];
    if(category=='users')
    {
      
     if(obj.id && !this.data.users[obj.id]){
        errors.push(new BlogError('BAD_ID', 'no users for id ' + obj.id+' in update  '));
      }else{
      var objUsr=this.data.users[obj.id];
      for(let [key,value] of Object.entries(obj)){
               if(key!='id'){
                objUsr[key]=value;
               }

      }
      objUsr.updateTime = new Date();
      this.data.users[obj.id]=objUsr;
    }

    }else if(category=='articles'){


      if(obj.id && !this.data.articles[obj.id]){
        errors.push(new BlogError('BAD_ID', 'no articles for id ' + obj.id+' in update  '));
      }else{
      var objUsr=this.data.articles[obj.id];
      for(let [key,value] of Object.entries(obj)){
               if(key=='title' || key=='content'){
                objUsr[key]=value;
               }

      }
      objUsr.updateTime = new Date();
      this.data.articles[obj.id]=objUsr;
    }

    }else if(category=='comments'){

      if(obj.id && !this.data.comments[obj.id]){
        errors.push(new BlogError('BAD_ID', 'no comments for id ' + obj.id+' in update  '));
      }else{
      var objUsr=this.data.comments[obj.id];
      for(let [key,value] of Object.entries(obj)){
               if(key=='content'){
                objUsr[key]=value;
               }

      }
      objUsr.updateTime = new Date();
      this.data.comments[obj.id]=objUsr;
    }
    }
    if(errors.length>0)throw errors;
  }
  
}

//You can add code here and refer to it from any methods in Blog544.
