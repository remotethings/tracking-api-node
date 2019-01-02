# TrackingAPI Example Node (ES6) Client

API for retrieving tracking data and changing settings on LightBug & RemoteThings tracking devices

## Getting Started

Clone locally and run

```
npm install
```

to integrate into your own project, run
```
npm i -S tracking-api mqtt
```

## Running examples

Open the relevant .js file and add your username and password, change parameters where required

```
node getting-started.js
```

```
node configuration.js
```

```
node listener.js
```

## Documentation

Documentation is available here https://cp.remotethings.co.uk/docs/
and here https://www.npmjs.com/package/tracking-api

And after npm install, in node_modules/tracking-api/docs

## Setup SQS

See 
```
sqs-setup.js
```

You will need to have setup an SQS queue on your account with the following Policy Document:
NOTE: replace  
```
arn:aws:sqs:us-east-2:829297355604:test_lb
```
with your queue ARN
```
{
    "Version": "2012-10-17",
    "Id": "AllowLightbugPush",
    "Statement": [
     {
        "Sid": "AllowLightbugPush001",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "sqs:SendMessage",
        "Resource": "arn:aws:sqs:us-east-2:829297355604:test_lb",
        "Condition": {
            "ArnEquals": {
                "aws:SourceArn": "arn:aws:sns:*:367158939173:*"
            }
        }
     }
    ]
}
```
Based on information available https://docs.aws.amazon.com/sns/latest/dg/SendMessageToSQS.cross.account.html
Once you have run this script, you will need to wait for "SubscriptionConfirmation" message and
visit the SubscribeURL to confirm subscription, as detailed int the above link under *To confirm a subscription using the Amazon SQS console*