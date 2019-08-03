#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import cfn = require('@aws-cdk/aws-cloudformation');

import fs = require('fs');

//******************************************************************** */
// 設定
//******************************************************************** */
// エラーを検出する対象のLambda関数
const targetFunction = 'productFunction';
// Slackの通知先
const webhook = '/services/xxxxxxxx/xxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxx';
// 検出する文字列
const filterPattern = '?Error ?error'
// ハンドラ関数名
const slackNotificationFunctionName = targetFunction+ '-slack-notification'
//******************************************************************** */

export class NotificationToSlackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Slackへ通知するLambda関数
    const  slackNotificationFunction = new lambda.Function(this, 'slackNotification-function', {
      functionName:  slackNotificationFunctionName,
      code: lambda.Code.asset('lambda/slackNotificationFunction'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment : {
        "TZ": "Asia/Tokyo",
        "INCOMING_WEBHOOK": webhook,
      }
    });
    // Logsからのパーミッションを追加
    slackNotificationFunction.addPermission("primition-from-logs", {
      principal: new iam.ServicePrincipal("logs.amazonaws.com"),
      sourceArn: 'arn:aws:logs:'+ this.region + ':' + this.account + ':log-group:/aws/lambda/' + targetFunction + ':*',
    })

    //サブスクリプションを追加するLambda関数
    const singletomFunction = new lambda.SingletonFunction(this, 'singleton-function', {
        uuid: '9ea82db1-be7e-f174-fbba-90c55957fd5b',
        code: new lambda.InlineCode(fs.readFileSync('lambda/createSubscription/index.js', { encoding: 'utf-8' })),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(300),
        runtime: lambda.Runtime.NODEJS_8_10,
    });
    // サブスクリプションの追加削除の権限付与
    singletomFunction.addToRolePolicy(new iam.PolicyStatement({
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${targetFunction}:*`],
        actions: ['logs:PutSubscriptionFilter',
                  'logs:DeleteSubscriptionFilter'] }
    ));
    // カスタムリソース
    new cfn.CustomResource(this, 'custom-resource', {
        provider: cfn.CustomResourceProvider.lambda(singletomFunction),
        properties: {
            "FILTER_PATTERN": filterPattern,
            "TARGET_FUNCTION_NAME": targetFunction,
            "SLACK_NOTIFICATION_FUNCTION_NAME": slackNotificationFunctionName,
            "REGION": this.region,
            "ACCOUNT": this.account
        }
    });
  }
}

const app = new cdk.App();
new NotificationToSlackStack(app, 'NotificationToSlackStack');

