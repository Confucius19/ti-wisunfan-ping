let express = require('express');
let cors = require('cors');
let ping = require('net-ping');
let os = require('os');

const interfaces = os.networkInterfaces();//gets all the network interfaces connected to the device

sourceIP = interfaces["lo"][0]["address"];//prints the ip address used to ping

const app = express();
const PORT = 8000;
app.use(cors());
app.use(express.json());
app.use(express.static('./demo'));

app.get('/topology', (req, res) => {
    const dummy_topology = {
        nodes: [
            { id: '2020::A' },
            { id: '2020::C' },
            { id: '2020::B' },
            { id: '2020::D' },
            { id: '2020::E' },
            { id: '2020::F' },
            { id: '2020::10' },
        ],
        edges: [
            {
                source: '2020::A',
                target: '2020::C',
                id: '2020::A->2020::C',
            },
            {
                source: '2020::A',
                target: '2020::B',
                id: '2020::A->2020::B',
            },
            {
                source: '2020::B',
                target: '2020::D',
                id: '2020::B->2020::D',
            },
            {
                source: '2020::B',
                target: '2020::E',
                id: '2020::B->2020::E',
            },
            {
                source: '2020::E',
                target: '2020::F',
                id: '2020::E->2020::F',
            },
            {
                source: '2020::E',
                target: '2020::10',
                id: '2020::E->2020::10',
            },
        ],
    };
    res.json(dummy_topology);
});

const pingbursts = [];

function timestamp() {
    now = new Date();
    return (
        now.toLocaleString('en-US', { timeZone: 'America/Chicago' }) +
        ' ' +
        now.getUTCMilliseconds() +
        'ms'
    );
}

function repeat_n_times(n, interval, func, ...args) {
    for (let i = 0; i < n; i++) {
        setTimeout(func, interval * (i + 1), ...args);
    }
}


app.post('/pingbursts', (req, res) => {
    pingburst_request = req.body;
    id = pingbursts.length;
    pingburst = {
        id,
        num_packets_requested: pingburst_request.num_packets,
        records: [],
    };
    n = pingburst_request.num_packets;
    interval = pingburst_request.interval;
    timeout = pingburst_request.timeout;
    repeat_n_times(
        n,
        interval,
        (dest_ip, size, records) => {
            var dur;
            var was_suc;
	    var ms;
            var session = ping.createSession({
                networkProtocol: ping.NetworkProtocol.IPv4,
                packetSize: size,
                sessionId: (process.pid % 65535),
                timeout: timeout,
                ttl: 128
            });
            session.pingHost(dest_ip, function (error, target, sent, rcvd) {
                ms = rcvd - sent;
                if (error) {
                    //console.log("source: " + sourceIP + " target: " + target + " error:" + error.toString() + " start time: " + sent + " duration: " + ms + "ms packet size: " + size + "bytes pass/fail: fail");
                    dur = ms;
                    was_suc = false;
                    (ping_record = {
                        source: sourceIP,
                        dest_ip,
                        start : sent,
                        duration: ms,
                        packet_size: size,
                        was_success: was_suc,
                    });
                    records.push(ping_record);
                } else {
                    //console.log("source: " + sourceIP + " target: " + target + " start time: " + sent + " duration: " + ms + "ms packet size: " + size + "bytes pass/fail: pass");
                    dur = ms;
                    was_suc = true;
                    (ping_record = {
                        source: sourceIP,
                        dest_ip,
                        start : sent,
                        duration: ms,
                        packet_size: size,
                        was_success: was_suc,
                    });
                    records.push(ping_record);
                }
            });
            
                
            
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
