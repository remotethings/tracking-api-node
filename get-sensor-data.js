const Tracking = require('tracking-api');

const userApi = new Tracking.UserApi();
const deviceApi = new Tracking.DeviceApi();

const USERNAME = 'MYUSERNAME';
const PASSWORD = 'MYPASSWORD';


async function login(){
    return new Promise((resolve,reject) => {
        userApi.userLogin({username: USERNAME, password: PASSWORD}, {}, (err, res) => {
            if (err) return reject(new Error('Login Failed'));
            const authToken = res.id;
            const userId = res.userId;

            //Authenticate our clients
            userApi.apiClient.defaultHeaders.Authorization = authToken;
            deviceApi.apiClient.defaultHeaders.Authorization = authToken;
            resolve(userId);
        });
    })
}

async function getDevices(userId){
    return new Promise((resolve,reject) => {
        userApi.userPrototypeGetDevices(userId, {}, (err, devices)=>{
            if(err) reject(err);
            else resolve(devices);
        });
    })
}

async function getRecentReadingsForDevice(deviceId, sensorType){
    return new Promise((resolve,reject) => {
        deviceApi.devicePrototypeGetReadings(deviceId, {
            filter: JSON.stringify({// filter needs to be a JSON encoded string
                //Optional query filters
                where: {
                    timestamp: {between: [+new Date() - 7 * 24 * 3600 * 1000, new Date()]}, // last 7 days
                    type: sensorType
                },
                order: 'timestamp DESC', // get the newest readings first
                limit: 100 //only get the 100 newest points
            })
        }, (err, data) => {
            if(err) reject(err);
            else resolve(data)
        })
    })

}

async function getRecentUwbReadingsForDevice(deviceId){
    return new Promise((resolve,reject) => {
        deviceApi.devicePrototypeGetGatewayReadings(deviceId, {
            filter: JSON.stringify({// filter needs to be a JSON encoded string
                //Optional query filters
                where: {
                    timestamp: {between: [+new Date() - 7 * 24 * 3600 * 1000, new Date()]}, // last 7 days
                    type: 'uwb_seen'
                },
                order: 'timestamp DESC', // get the newest readings first
                limit: 100 //only get the 100 newest points
            })
        }, (err, data) => {
            if(err) reject(err);
            else resolve(data)
        })
    })

}

async function main() {
    const userId = await login();
    const devices = await getDevices(userId);

    //Create map of devices by id for easy access
    const deviceDict = {};
    for(const device of devices){
        deviceDict[device.id] = device;
    }

    for(const device of devices) {
        // Temperature Example
        // const readings = await getRecentReadingsForDevice(device.id, 'temp'); // to get temperature data
        // readings.forEach( reading => {
        //     console.log(`${device.name}: Temp = ${reading.value}C @ ${reading.timestamp}`);
        // });

        // UWB ranging Example
        const readings = await getRecentUwbReadingsForDevice(device.id);
        readings.forEach( reading => {
            const relatedDeviceName = (deviceDict[reading.deviceId] && deviceDict[reading.deviceId].name) || reading.deviceId;
            console.log(`Device ${device.name} was ${reading.value}cm away from ${relatedDeviceName} @ ${reading.timestamp}`)
        });
    }
}


main();
