var mqtt = require('mqtt')

var client;

const splitWord = ">?";
const tokenSplitWord = "<>";

var devices = []
var receivers = []

var deviceStatusHandle = () => { console.log("Device status handler not implemented") }


function connect(url, _devices) {

  if (_devices == null) {
    console.log("Devices Cannot Be Empty")
    return
  }
  if (_devices.length == 0) {
    console.log("Devices Cannot Be Empty")
    return
  }
  devices = _devices;

  var tokenString = "";

  devices.forEach((item) => {
    tokenString += item.token + tokenSplitWord;
  });

  tokenString = tokenString.slice(0, tokenString.length - 2)
  var payload = "type>?client>?token>?" + tokenString;
  var clientOptions =
  {
    will: {
      topic: "client",
      payload: payload,
    },
    clientId: 'client-mqttjs-' + Math.random().toString(16).substr(2, 8)
  }

  client = mqtt.connect(url, clientOptions);

  client.subscribe('client/access/' + client.options.clientId, function (err) {
    if (!err) {
      console.log("> Subscribed to " + 'client/access/' + client.options.clientId)
    }
  });

  devices.forEach((item) => {
    client.subscribe('device/sub/' + item.token, function (err) {
      if (!err) {
        console.log("> Subscribed to " + 'device/sub/' + item.token)
      }
    });
  });


  client.on('connect', (e) => { console.log("Connected to " + client.options.host) })
  client.on('error', (e) => { console.log("Error : " + e.message) })
  client.on('close', (e) => { console.log("Closed to " + client.options.host); process.exit() })
  client.on('end', (e) => { console.log("end"); console.log(e) })
  client.on('disconnect', (e) => { console.log("Disconnected to " + client.options.host); console.log(e) })
  //client.on('packetreceive',(e)=> {console.log("packetreceive");console.log(e)})
  client.on('message', (topic, p, packet) => {
    try {
      var payload = JSON.parse(p.toString());
      deviceStatusHandle(payload)
    } catch (e) {

      console.log("Mesaj Geldi", p.toString())
      var payload = p.toString().split(splitWord)
      var topicArr = topic.split("/")

      if (payload.some(x => x == "command")) {
        var commandIndex = payload.findIndex(x => x == "command")
        ExecuteCommand(payload[commandIndex + 1])

      };

      if (payload.some(x => x == "responseid")) {
        if (topicArr[topicArr.length - 1] == "request") {
          var responseIdIndex = payload.findIndex(x => x == "responseid")
          requests.forEach((value) => {
            if (value.tag == tag) {
              var responseData = value.callback(data)
              sendAbsolute(value.tag, responseData, "api/access/" + payload[responseIdIndex + 1])
            }
          })
          return
        }
      }
      if (payload.some(x => x == "tag")) {
        var tagIndex = payload.findIndex(x => x == "tag")
        var dataIndex = payload.findIndex(x => x == "data")

        if(dataIndex == -1) return

        var tag = payload[tagIndex + 1];
        var data = payload[dataIndex + 1];

        receivers.forEach((value) => {
          var device = devices.filter(dev => dev.token ==  topicArr[2]);
          if (value.tag == tag && device.name == value.devicename) {
            value.callback(data)
          }
        })
      };
    }
  })
}

function send(tag, devicename, data) {
  var device = devices.find(element => element.name == devicename);
  var message = createMessage(tag, data);
  console.log("SENDED : " + message)
  client.publish('device/access/' + device.token, message)
}
function receive(tag, name, callback) {
  var receiver = {
    tag: tag,
    callback: callback,
    devicename: name
  }
  receivers.push(receiver);
}

function deviceStatusHandler(callback) {
  if (callback == undefined) { return; }
  deviceStatusHandle = callback
}


module.exports.receive = receive
module.exports.send = send
module.exports.connect = connect
module.exports.deviceStatusHandler = deviceStatusHandler


function createMessage(tag, data, code, command) {
  var message = "";
  if (tag != undefined) {
    message += "tag>?" + tag + ">?";
  }
  if (data != undefined) {
    message += "data>?" + data + ">?";
  }
  if (code != undefined) {
    message += "data>?" + code + ">?";
  }
  if (code != undefined) {
    message += "data>?" + command + ">?";
  }
  return message
}


function ExecuteCommand(command) {
  switch (command) {
    case "SET_SENDABLE":
      sendable = true;
      console.log("Sendable : " + sendable)
      break;
    case "RESET_SENDABLE":
      sendable = false;
      console.log("Sendable : " + sendable)
      break;
    default:
      break;
  }
}

function ExecuteErrorCode(code) {
  switch (code) {
    case "3000":
      break;
    default:
      break;
  }
}
