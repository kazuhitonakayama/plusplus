const { App } = require('@slack/bolt');
// postgresqlの設定
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

.get('/db', async (req, res) => {
  try {
    const client = await client.connect();
    const result = await client.query('SELECT * FROM points');
    const results = { 'results': (result) ? result.rows : null};
    res.render('pages/db', results );
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  // ソケットモードではポートをリッスンしませんが、アプリを OAuth フローに対応させる場合、
  // 何らかのポートをリッスンする必要があります
  port: process.env.PORT || 3000
});

// "hello" を含むメッセージをリッスンします
app.message('++', async ({ message, say }) => {
  // イベントがトリガーされたチャンネルに say() でメッセージを送信します
  // message.textの内容において`@`から`|`までの文字列を取得する
  const regex = /<(.*?)>/g;
  const receivedUser = regex.exec(message.text)[1].replace('@', '');
  const givedUser = message.user;

  await say(`<@${receivedUser}> get 56 points! thanks from <@${message.user}>!`);
});

(async () => {
  // アプリを起動します
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();
