# Setup

* Install

```
$ git clone https://github.com/furuya02/NotificationToSlack.git
$ cd NotificationToSlack
$ yarn && cd lambda/slackNotificationFunction && yarn && cd ../..
```

* Setting

**bin/notification_to_slack.ts**

```js
//******************************************************************** */
// 設定
//******************************************************************** */
// エラーを検出する対象のLambda関数
const targetFunction = 'productFunction';
// Slackの通知先
const webhook = '/services/xxxxxxxxx/xxxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxx';
// 検出する文字列
const filterPattern = '?Error ?error'
// ハンドラ関数名
const slackNotificationFunctionName = targetFunction+ '-slack-notification'
//******************************************************************** */
```

* Deploy
```
$ tsc
$ cdk synth
$ cdk deploy
```
