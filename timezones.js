const timeZones = [
  { name: "UTC" },
  { name: "America/New_York" },
  { name: "America/Chicago" },
  { name: "America/Denver" },
  { name: "America/Los_Angeles" },
  { name: "America/Anchorage" },
  { name: "Pacific/Honolulu" },
  { name: "Europe/London" },
  { name: "Asia/Tokyo" },
  { name: "Australia/Sydney" }
];

function updateClocks() {
  const container = document.getElementById("zone-times");
  container.innerHTML = "";
  timeZones.forEach(zone => {
    try {
      const time = new Date().toLocaleTimeString("en-US", {{ timeZone: zone.name }});
      const div = document.createElement("div");
      div.className = "timezone-box";
      div.innerHTML = `<strong>${{zone.name}}</strong><br>${{time}}`;
      container.appendChild(div);
    } catch (e) {
      const div = document.createElement("div");
      div.className = "timezone-box";
      div.innerHTML = `<strong>${{zone.name}}</strong><br>unsupported`;
      container.appendChild(div);
    }
  });
}

setInterval(updateClocks, 1000);
updateClocks();
