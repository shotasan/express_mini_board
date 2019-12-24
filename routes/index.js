var express = require('express');
var router = express.Router();
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

// テーブルにアクセスするモデルの作成
var Message = Bookshelf.Model.extend({
  tableName: 'messages',
  // タイムスタンプをレコードに追加するための設定
  hasTimestamps: true,
  // アソシエーションの設定
  user: function () {
    return this.belongsTo(User);
  }
});

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.session.login == null) {
    res.redirect('/users');
  } else {
    res.redirect('/1');
  }
});

router.get('/:page', (req, res, next) => {
  if (req.session.login == null) {
    res.redirect('/users');
    return;
  }
  var pg = req.params.page;
  pg *= 1;
  if (pg < 1) { pg = 1; }
  // アソシエーションを使ったレコードの取得
  new Message().orderBy('created_at', 'DESC')
    .fetchPage({ page: pg, pageSize: 10, withRelated: ['user'] })
    // 取得したリレーションのレコードはcollectionのrelationsプロパティに保管される
    .then((collection) => {
      var data = {
        title: 'miniBoard',
        login: req.session.login,
        collection: collection.toArray(),
        pagination: collection.pagination
      };
      console.log(data);
      res.render('index', data);
    }).catch((err) => {
      res.status(500).json({ error: true, data: { message: err.message } });
    });
});

router.post('/', (req, res, next) => {
  var rec = {
    message: req.body.msg,
    user_id: req.session.login.id
  }
  new Message(rec).save().then((model) => {
    res.redirect('/');
  });
})

module.exports = router;
