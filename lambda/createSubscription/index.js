"use strict";
const AWS = require('aws-sdk');
const cfnresponse = require('cfn-response');

exports.handler = (event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));
 
    const requestType = event['RequestType']; // Create, Delete, Update

    const resourcePropertie = event['ResourceProperties']; // Papameters from CDK
    const account = resourcePropertie.ACCOUNT;
    const slackNotificationFunctionName = resourcePropertie.SLACK_NOTIFICATION_FUNCTION_NAME;
    const targetFunctionName = resourcePropertie.TARGET_FUNCTION_NAME;
    const filterPattern = resourcePropertie.FILTER_PATTERN;
    const region = resourcePropertie.REGION;

    const logs = new AWS.CloudWatchLogs();

    let params = {
        logGroupName: '/aws/lambda/' + targetFunctionName,
        filterName: 'notification filter',
    }
    
    if (requestType == 'Create') {

        params.filterPattern = filterPattern;
        params.destinationArn = `arn:aws:lambda:${region}:${account}:function:${slackNotificationFunctionName}`;

        logs.putSubscriptionFilter(params, (err, data) => {
            send(event, context, err, data);
        });
    } else {
        logs.deleteSubscriptionFilter(params, (err, data) => {
            send(event, context, err, data);
        });
    }
};

function send(event, context, err, data) {
    if(err){
        console.log(err);
        cfnresponse.send(event, context, cfnresponse.FAILED, {});
    } else {
        cfnresponse.send(event, context, cfnresponse.SUCCESS, data);
    }
}

