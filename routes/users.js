var express = require('express');
var router = express.Router();
var { check, validationResult } = require('express-validator');

var mysql = require('mysql');
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'my-nodeapp-db',
    charset: 'utf8'
  }
});
var Bookshelf = require('bookshelf')(knex);

var User = Bookshelf.Model.extend({
  tableName: 'users'
});

/* GET users listing. */
router.get('/add', function (req, res, next) {
  var data = {
    title: 'Users/Add',
    form: { name: '', password: '', comment: '' },
    content: '登録する名前・パスワード・コメントを入力ください。'
  }
  res.render('users/add', data);
});

router.post('/add', [
  check('name', 'NAMEは必ず入力してください。').notEmpty(),
  check('password', 'PASSWORDは必ず入力してください。').notEmpty(),
], (req, res, next) => {
  var request = req;
  var response = res;
  const result = validationResult(req);
  if (!result.isEmpty()) {
    var content = '<ul class="error">';
    var result_arr = result.array();
    for (var i in result_arr) {
      content += `<li>${result_arr[n].msg}</li>`
    }
    content += '</ul>';
    var data = {
      title: 'Users/Add',
      content: content,
      form: req.body
    }
    response.render('users/add', data);
  } else {
    request.session.login = null;
    new User(req.body).save().then((model) => {
      response.redirect('/');
    });
  }
});

router.get('/', (req, res, next) => {
  var data = {
    title: 'Users/Login',
    form: { name: '', password: '' },
    content: '名前とパスワードを入力ください。'
  }
  res.render('users/login', data);
});

router.post('/', [
  check('name', 'NAMEは必ず入力してください。').notEmpty(),
  check('password', 'PASSWORDは必ず入力してください。').notEmpty(),
], (req, res, next) => {
  const result = validationResult(req);
  var request = req;
  var response = res;
  // エラーがある場合
  if (!result.isEmpty()) {
    var content = '<ul class="error">';
    var result_arr = result.array();
    for (var i in result_arr) {
      content += `<li>${result_arr[i].msg}</li>`
    }
    content += '</ul>';
    var data = {
      title: 'Users/Login',
      content: content,
      form: req.body
    }
    response.render('users/login', data);
  } else {
    var nm = req.body.name;
    var ps = req.body.password;
    // 登録情報の確認
    User.query({ where: { name: nm }, andWhere: { password: ps } })
      .fetch({ require: false })
      .then((model) => {
        console.log(model);
        if (model == null) {
          var data = {
            title: '再入力',
            content: '<p class="error">名前またはパスワードが違います。</p>',
            form: req.body
          };
          response.render('users/login', data);
        } else {
          request.session.login = model.attributes;
          var data = {
            title: 'Users/Login',
            content: '<p>ログインしました。<br>トップページに戻ってメッセージを送信ください</p>',
            form: req.body
          };
          response.render('users/login', data);
        }
      }).catch((err) => {
        console.log(err);
        response.status(500).json({ error: true, data: { message: err.message } })
      })
  }
});

module.exports = router;
