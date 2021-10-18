/*

Functionality
    Input: None
    Output: All Current routes from Border Rotter
   [Route1,Route2, ..., RouteN]

   Definitions:
   Route:=  [NodeID1, NodeID2, ..., NodeIDN]
 
   NodeID := Node's IP address
   NodeID1 = always Border Router




*/

let dbus = require('dbus-next');
const DBUS_BUS_NAME = 'com.nestlabs.WPANTunnelDriver';
const DBUS_INTERFACE = 'com.nestlabs.WPANTunnelDriver';
const DBUS_META_OBJECT_PATH = '/com/nestlabs/WPANTunnelDriver';
const DBUS_WPAN0_OBJECT_PATH = DBUS_META_OBJECT_PATH + '/wpan0';

function parse_connected_devices(text) {
  let ip_addr_list = [];
  let eachLine = text.split('\n');
  console.log('[Connected Devices] Lines found: ' + eachLine.length);

  for (var i = 0, l = eachLine.length; i < l; i++) {
    if (
      !eachLine[i].includes(' ') &&
      !!eachLine[i] &&
      eachLine[i][0] != ':'
    ) {
      // add this ip address to the list
      ip_addr_list.push(eachLine[i]);
    }
  }
  return ip_addr_list;
}

function parse_dodag_route(text) {
  var line_list = text.split('\n');
  return filter(
    line_list,
    (ipv6_candidate) => !ipv6_candidate.includes('Path'),
  );
}

async function get_all_routes() {
  const bus = dbus.systemBus();

  async function gen_wpan_property(property_name) {
    object_path = DBUS_WPAN0_OBJECT_PATH + '/' + property_name;
    prop_obj = await bus.getProxyObject(DBUS_BUS_NAME, object_path);
    prop = prop_obj.getInterface(DBUS_INTERFACE);
  }

  connected_devices = await gen_wpan_property('connecteddevices');
  dodag_route_dest = await gen_wpan_property('dodagroutedest');
  dodag_route = await gen_wpan_property('dodagroute');

  ip_addr_list = parse_connected_devices(connected_devices.Get());
  const routes = [];
  for (ip_addr of ip_addr_list) {
    dodag_route_dest.Set(ip_addr);
    route = parse_dodag_route(dodag_route.Get());
    routes.push(route);
  }
  return routes;
}

module.exports = get_all_routes;
