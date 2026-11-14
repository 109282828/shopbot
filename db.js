const devices = new Map();
const commands = new Map();
const reports = [];

module.exports = {
  addDevice(id, model) {
    devices.set(id, { id, model: model || 'android', last_seen: Date.now() });
  },
  listDevices() {
    return Array.from(devices.values()).sort((a, b) => b.last_seen - a.last_seen);
  },
  queueCommand(deviceId, cmd, arg) {
    if (!commands.has(deviceId)) commands.set(deviceId, []);
    commands.get(deviceId).push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      cmd,
      arg: arg || '',
      done: 0
    });
  },
  pullCommands(deviceId) {
    const list = commands.get(deviceId) || [];
    const fresh = list.filter(c => c.done === 0);
    fresh.forEach(c => { c.done = 1; });
    return fresh;
  },
  saveReport(deviceId, kind, body) {
    reports.push({ deviceId, kind, body, created: Date.now() });
  }
};
