var rp = require('request-promise');
// import * as AWS from 'aws-sdk';
// if(process.env.IsLocal=='Yes') {
//   AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'developer'});
//   AWS.config.update({region:'ap-northeast-1'});
// }

import * as zlib from 'zlib';
const url = process.env.INCOMING_WEBHOOK!

export async function handler(event: any) {
  
  console.log(JSON.stringify(event));

  var data = new Buffer(event.awslogs.data, 'base64');
  const result = await unzip(data);
  const json = JSON.parse(result.toString('utf-8'));
  const logs = json['logEvents'];
      
  await Promise.all(logs.map( async (log:any) => {
    const d = {
      text: log.message
    }
    const options = {
        method: 'POST',
        uri: 'https://hooks.slack.com' + url,
        header: {
            'Content-Type': 'application/json'
        },
        json: true,
        body: d
      };
  
      try {
        await rp(options);
        console.log(log.message);  
      } catch(error) {
        console.log(error);
      }
  }))
};

function unzip(data: any): Promise<any> {
  return new Promise( (resolve, reject)=> {
    zlib.gunzip(data, async (err, result) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(result);
      }
    })
  })
}

