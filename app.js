const { App } = require('@slack/bolt');
// postgresqlの設定
const { Client } = require('pg');
// express app
const express = require('express');
const expressApp = express()
expressApp.set('view engine', 'ejs');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  // ソケットモードではポートをリッスンしませんが、アプリを OAuth フローに対応させる場合、
  // 何らかのポートをリッスンする必要があります
  port: process.env.PORT || 3000
});

expressApp.get('/', async (req, res) => {
  try {
    const client = await client.connect();
    const result = await client.query('SELECT * FROM points');
    const results = { 'results': (result) ? result.rows : null};
    res.render('results', results );
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

// "hello" を含むメッセージをリッスンします
app.message('++', async ({ message, say }) => {
  // イベントがトリガーされたチャンネルに say() でメッセージを送信します
  // message.textの内容において`@`から`|`までの文字列を取得する
  const regex = /<(.*?)>/g;
  const receivedUser = regex.exec(message.text)[1].replace('@', '');
  const givedUser = message.user;
  let point;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  await client.connect()

  // 現在の値を参照する
  try {
    const results = await client.query('SELECT point FROM points WHERE user_slack_id = $1', [givedUser]);
    point = results.rows[0].point;
    console.log(point);
  } catch (err) {
    console.error(err);
  }

  point += 1;

  // 値を更新する
  try {
    const results = await client.query('UPDATE points SET point = $1 WHERE user_slack_id = $2', [point, givedUser]);
    point = results.rows[0].point;
    console.log(point);
  } catch (err) {
    console.error(err);
  }

  await client.end()

  await say(`<@${receivedUser}> get ${point} points!`);
});

(async () => {
  // アプリを起動します
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();
