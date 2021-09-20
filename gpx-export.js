const Tracking = require('tracking-api');
const { buildGPX, BaseBuilder } = require('gpx-builder');
const { Point } = BaseBuilder.MODELS;
const fs = require('fs');
const userApi = new Tracking.UserApi();
const deviceApi = new Tracking.DeviceApi();

const USERNAME = '';
const PASSWORD = '';

const DEVICE_ID = 1234; // ID of device. NOT SERIAL NUMBER
const START_DATE = new Date("2020-10-01 00:00:00");
const END_DATE = new Date("2020-10-31 00:00:00");


// Basic Getting Started Example
// Retrieves all devices for an account and lists the last 10 points in the last week

userApi.userLogin({username: USERNAME, password: PASSWORD}, {}, (err, res) => {
    if(err) throw new Error('Login Failed');
    const authToken = res.id;
    const userId = res.userId;

    //Authenticate our clients
    userApi.apiClient.defaultHeaders.Authorization = authToken;
    deviceApi.apiClient.defaultHeaders.Authorization = authToken;

    // OPTIONAL - iterate over all the devices on this account
    // userApi.userPrototypeGetDevices(userId, {}, (err, devices)=>{
    //     if(err) throw new Error('Failed to get devices');
    //     console.log(devices.length + " devices on this account");
    //
    //     devices.forEach( device => {
            deviceApi.devicePrototypeGetPoints(DEVICE_ID, {
                filter: JSON.stringify({// filter needs to be a JSON encoded string
                    //Optional query filters
                    where: {
                        timestamp: {between: [+START_DATE, +END_DATE]},
                        locationType: {neq: 'invalid'},
                        accuracy: {lt: 100}
                    },
                    order: 'timestamp DESC', // get the newest points first
                    //limit:10 //only get the 10 newest points
                })
            }, (err, points) => {
                if(err) console.log("Failed to get points for device");
                else if(!points.length) console.log("No points in range for device");
                else {
                    console.log(`### ${points.length} points to export ###`)
                    const exportPoints = [];

                    points.forEach(point => {
                        exportPoints.push(new Point(point.location.lat, point.location.lng, {
                            ele: point.altitude,
                            time: new Date(point.timestamp)
                        }));
                    });
                    const gpx = new BaseBuilder();
                    gpx.setSegmentPoints(exportPoints);

                    // console.log(buildGPX(gpx.toObject()));
                    fs.writeFileSync(`./export device ${DEVICE_ID} from ${START_DATE.toDateString()} to ${END_DATE.toDateString()}.gpx`, buildGPX(gpx.toObject()));
                }
            } )
    //     });
    //
    // })

});
