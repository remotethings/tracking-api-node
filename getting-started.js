const Tracking = require('tracking-api');

const userApi = new Tracking.UserApi();
const deviceApi = new Tracking.DeviceApi();

const USERNAME = 'MYUSERNAME';
const PASSWORD = 'MYPASSWORD';

// Basic Getting Started Example
// Retrieves all devices for an account and lists the last 10 points in the last week

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
           deviceApi.devicePrototypeGetPoints(device.id, {
               filter: JSON.stringify({// filter needs to be a JSON encoded string
                   //Optional query filters
                   where: {
                       timestamp: {between: [+new Date() - 7 * 24 * 3600 * 1000, new Date()]},
                       //alternatively using greater than operator (gt):
                       //timestamp: {gt: +new Date() - 7 * 24 * 3600 * 1000},
                       locationType: {neq: 'invalid'}
                   },
                   order: 'timestamp DESC', // get the newest points first
                   limit: 10 //only get the 10 newest points
               })
           }, (err, points) => {
               if(err) console.log("Failed to get points for device", device);
               else if(!points.length) console.log("No points in range for device "+ device.name);
               else {
                   console.log(`### Points for ${device.name} ###`)
                   points.forEach(point => {
                       console.log(`${point.timestamp}: ${point.location.lat.toFixed(5)},${point.location.lng.toFixed(5)}` +
                       ` address: ${point.address}, speed: ${point.speed} kmh, bearing: ${point.course}, battery: ${point.batteryVoltage}V`);
                   });
                   console.log(`### END ###`)
               }
           } )
        });

    })

});
