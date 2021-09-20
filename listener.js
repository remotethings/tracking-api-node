const Tracking = require('tracking-api');
const mqtt = require('mqtt');
const userApi = new Tracking.UserApi();
const deviceApi = new Tracking.DeviceApi();

const MQTT_BROKER = 'mqtts://mqtt.remotethings.co.uk';

const USERNAME = '';
const PASSWORD = '';

// Listens for all new locations using MQTT
// Use this to avoid polling for new locations

function processMessage(topic, message){
    let parts = topic.split('/');
    let deviceId = parts[3];
    let messageType = parts[4];

    if (messageType === "datapoints")
    {
        processNewDatapoint(deviceId, message);
    }
    else if (messageType === "readings")
    {
        processNewSensorReading(deviceId, message);
    }
}

function processNewSensorReading(deviceId, message){
    let reading = JSON.parse(message);
    console.log(`Received new reading from device ${deviceId}! ${reading.type}=${reading.value}`);

    //Type can be a number of things, for example:
    /*
    if (reading.type === "temp")
    {
        // for temp, value is a float:
        let temperature = reading.value;
        processTemperature(deviceId, temperature);
    }
    */
}

function processNewDatapoint(deviceId, message){
    let newPoint = JSON.parse(message);
    console.log(`Received new point from device ${deviceId}! ${newPoint.location.lat.toFixed(5)},${newPoint.location.lng.toFixed(5)}`+
                ` alt:${newPoint.altitude || 0 }m, speed:${newPoint.speed || 0} km/h`);
    // Do something here with the point https://cp.remotethings.co.uk/docs/#definition-datapoint
}


userApi.userLogin({username: USERNAME, password: PASSWORD}, {}, (err, res) => {
    if(err) throw new Error('Login Failed');
    const authToken = res.id;
    const userId = res.userId;

    //Authenticate our clients
    userApi.apiClient.defaultHeaders.Authorization = authToken;
    deviceApi.apiClient.defaultHeaders.Authorization = authToken;

    userApi.userPrototypeGetMqttCredentials(userId, (err, credentials) => {
       const client = mqtt.connect(MQTT_BROKER, {
           clientId: credentials.clientId,
           username: credentials.username,
           password: credentials.password,
           clean: true // allow messages to be queued up when we're disconnected
       });

        client.on('connect', function (connack) {
            //,'+/status/#','+/control/#'
            client.subscribe([
                'users/' + userId + '/devices/+/datapoints',
                'users/' + userId + '/devices/+/readings'
            ], {qos:2}, function(err,granted){
                if(err) console.error("Failed to subscribe", {err:err});
            });
            console.log('connected to mqtt - listening for new points');
        });

       client.on('message', processMessage);
    });

});
