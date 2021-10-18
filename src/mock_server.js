let express = require('express');
let cors = require('cors');

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
function get_mock_ping_result() {
  random_num = Math.random() - 0.25;
  let duration = 0;
  let was_success = true;
  if (random_num < 0) {
    duration = -1;
    was_success = false;
  } else {
    duration = Math.floor(random_num * 100);
    was_success = true;
  }
  return { duration, was_success };
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
  repeat_n_times(
    n,
    interval,
    (destination, size, records) => {
      ({ duration, was_success } = get_mock_ping_result());
      (start = timestamp()),
        (ping_record = {
          source: '2020::A',
          destination,
          start,
          duration,
          packet_size: size,
          was_success,
        });
      records.push(ping_record);
    },
    pingburst_request.destination,
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
