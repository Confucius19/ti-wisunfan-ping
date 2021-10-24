let express = require('express');
let cors = require('cors');
let ping = require('net-ping');
let os = require('os');

const interfaces = os.networkInterfaces(); //gets all the network interfaces connected to the device

// const source_ip = interfaces['lo'][0]['address']; //prints the ip address used to ping
const source_ip =
  interfaces['Loopback Pseudo-Interface 1'][0]['address']; //prints the ip address used to ping

const app = express();
const PORT = 8000;
app.use(cors());
app.use(express.json());
app.use(express.static('./demo'));

app.get('/topology', (req, res) => {
  const topology = {
    nodes: [],
    edges: [],
  };
  res.json(topology);
});

const pingbursts = [];

function timestamp(date) {
  date_to_format = date ? date : new Date();
  return (
    date_to_format.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
    }) +
    ' ' +
    date_to_format.getUTCMilliseconds() +
    'ms'
  );
}

function repeat_n_times(n, interval, func, ...args) {
  for (let i = 0; i < n; i++) {
    setTimeout(func, interval * (i + 1), ...args);
  }
}

app.post('/pingbursts', (req, res) => {
  const pingburst_request = req.body;
  const id = pingbursts.length;
  const pingburst = {
    id,
    num_packets_requested: pingburst_request.num_packets,
    records: [],
  };
  const n = pingburst_request.num_packets;
  const interval = pingburst_request.interval;
  const timeout = pingburst_request.timeout;
  repeat_n_times(
    n,
    interval,
    (dest_ip, size, records) => {
      var was_success;
      var ms;
      var session = ping.createSession({
        networkProtocol: ping.NetworkProtocol.IPv4,
        packetSize: size,
        sessionId: process.pid % 65535,
        timeout: timeout,
        ttl: 128,
      });
      session.pingHost(
        dest_ip,
        function (error, dest_ip, sent, rcvd) {
          ms = rcvd - sent;
          if (error) {
            //console.log("source: " + sourceIP + " target: " + target + " error:" + error.toString() + " start time: " + sent + " duration: " + ms + "ms packet size: " + size + "bytes pass/fail: fail");
            was_success = false;
            ping_record = {
              source_ip,
              dest_ip,
              start: timestamp(sent),
              duration: -1,
              packet_size: size,
              was_success,
            };
            records.push(ping_record);
          } else {
            //console.log("source: " + sourceIP + " target: " + target + " start time: " + sent + " duration: " + ms + "ms packet size: " + size + "bytes pass/fail: pass");
            was_success = true;
            ping_record = {
              source_ip,
              dest_ip,
              start: timestamp(sent),
              duration: ms,
              packet_size: size,
              was_success,
            };
            records.push(ping_record);
          }
        },
      );
    },
    pingburst_request.dest_ip,
    pingburst_request.packet_size,
    pingburst.records,
  );
  pingbursts.push(pingburst);
  res.json({ id });
});

app.get('/pingbursts/:id', (req, res) => {
  pingburst_id = req.params.id;
  res.json(pingbursts[pingburst_id]);
});
app.get('/pingbursts', (req, res) => {
  res.json(pingbursts);
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
