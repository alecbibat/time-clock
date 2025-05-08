const timeZones = [
  { name: "UTC", offset: 0 },
  { name: "Europe/London", offset: 0 },
  { name: "Asia/Tokyo", offset: 0 },
  { name: "Australia/Sydney", offset: 0 },
  { name: "America/New_York", offset: 0 },
  { name: "America/Chicago", offset: 0 },
  { name: "America/Denver", offset: 0 },
  { name: "America/Los_Angeles", offset: 0 },
  { name: "America/Anchorage", offset: 0 },
  { name: "Pacific/Honolulu", offset: 0 }
];

function updateClocks() {
  const ul = document.getElementById("zone-times");
  ul.innerHTML = "";
  const nowUTC = new Date();
  timeZones.forEach(zone => {
    try {
      const localTime = new Date().toLocaleTimeString("en-US", { timeZone: zone.name });
      const li = document.createElement("li");
      li.textContent = `${zone.name}: ${localTime}`;
      ul.appendChild(li);
    } catch (e) {
      const li = document.createElement("li");
      li.textContent = `${zone.name}: unsupported`;
      ul.appendChild(li);
    }
  });
}
setInterval(updateClocks, 1000);
updateClocks();