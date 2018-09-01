const Tracking = require('tracking-api');

const userApi = new Tracking.UserApi();
const deviceApi = new Tracking.DeviceApi();

const USERNAME = 'MYUSERNAME';
const PASSWORD = 'MYPASSWORD';

// Configuration example
// Sets all devices to 5 minute transmit interval with GPS recorded every minute and 12 hour sleep interval

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
        devices.slice(0,1).forEach( device => {
            //get last 10 points for the device between two dates (the last 7 days here)
            deviceApi.devicePrototypeUpdateConfig(device.id, {
                //Configuration data, see https://cp.remotethings.co.uk/docs/#definition-deviceConfig
                data : {
                    //wake mode interval = 5 minutes in seconds
                    interval: 300,

                    // sleep mode interval = 12 hours in seconds
                    sleepInterval: 12*3600,

                    // Send 5 points per transmission
                    // In this case: record a GPS point every 1 minute. You will get a point every 1 minute on the map,
                    // but it will only be updated every 5 minutes
                    packing: 5 //
                }
            }, (err, res) => {
                if(err) console.log("Failed to get points for device", device);
                else console.log("Configuration updated for device", device);
            });
        });

    })

});
