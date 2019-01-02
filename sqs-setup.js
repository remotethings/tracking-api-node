const Tracking = require('tracking-api');

const userApi = new Tracking.UserApi();
const deviceApi = new Tracking.DeviceApi();

const USERNAME = 'MYUSERNAME';
const PASSWORD = 'MYPASSWORD';

// Setup forwarding of datapoints to SQS for all devices on account
// You will need to have setup an SQS queue on your account with the following Policy Document:
// NOTE: replace  "arn:aws:sqs:us-east-2:829297355604:test_lb" with your queue ARN
// {
//     "Version": "2012-10-17",
//     "Id": "AllowLightbugPush",
//     "Statement": [
//      {
//         "Sid": "AllowLightbugPush001",
//         "Effect": "Allow",
//         "Principal": "*",
//         "Action": "sqs:SendMessage",
//         "Resource": "arn:aws:sqs:us-east-2:829297355604:test_lb",
//         "Condition": {
//             "ArnEquals": {
//                 "aws:SourceArn": "arn:aws:sns:*:367158939173:*"
//             }
//         }
//      }
//     ]
// }
//
// Based on information available https://docs.aws.amazon.com/sns/latest/dg/SendMessageToSQS.cross.account.html
// Once you have run this script, you will need to wait for "SubscriptionConfirmation" message and
// visit the SubscribeURL to confirm subscription, as detailed int the above link under *To confirm a subscription using the Amazon SQS console*

userApi.userLogin({username: USERNAME, password: PASSWORD}, {}, (err, res) => {
    if(err) throw new Error('Login Failed');
    const authToken = res.id;
    const userId = res.userId;

    //Authenticate our clients
    userApi.apiClient.defaultHeaders.Authorization = authToken;
    deviceApi.apiClient.defaultHeaders.Authorization = authToken;

    //Get all the devices on this account
    userApi.userPrototypeGetDevices(userId, {}, (err, devices)=>{
        if(err) throw new Error('Failed to get devices');
        console.log(devices.length + " devices on this account");
        devices.forEach( device => {
            //get last 10 points for the device between two dates (the last 7 days here)
            deviceApi.devicePrototypeGetNotificationTriggers(device.id, {}, (err, triggers) => {
                if(err) return console.log("Failed to get alert triggers for device", device);

                let found = false;
                triggers.forEach( t => {
                    if(t.name === "PushSQS" || (t.type === "newLoc" && t.delivery.sqs)) found = true;
                });
                if(found) return console.log("Forwarding already set up on device ", device.id);

                deviceApi.devicePrototypeCreateNotificationTriggers(device.id, {
                    data: {
                        name: "PushSQS",
                        type: "newLoc", // push all new locations
                        muteFor: 0, // no rate limit
                        userId: userId,
                        parameters: {
                            sqsArn: "arn:aws:sqs:us-east-2:829297355604:test_lb" // fully qualified ARN for sqs queue
                        },
                        delivery: {sqs: true}
                    }
                }, (err) => {
                    if(err) console.log("Failed to setup push for device", device.id, "with error", err);
                    else console.log("Push setup for device", device.id);
                })

            });
        });

    })

});
