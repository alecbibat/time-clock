const timeZones = [
  { name: "UTC", label: "UTC (Coordinated Time)" },
  { name: "America/New_York", label: "Eastern Time (New York)" },
  { name: "America/Chicago", label: "Central Time (Chicago)" },
  { name: "America/Denver", label: "Mountain Time (Denver)" },
  { name: "America/Los_Angeles", label: "Pacific Time (LA)" },
  { name: "America/Anchorage", label: "Alaska Time" },
  { name: "Pacific/Honolulu", label: "Hawaii Time" },
  { name: "Europe/London", label: "GMT / UK Time (London)" },
  { name: "Asia/Tokyo", label: "Japan Time (Tokyo)" },
  { name: "Australia/Sydney", label: "Australian Eastern Time" }
];


function updateClocks() {
  const container = document.getElementById("zone-times");
  container.innerHTML = "";
  timeZones.forEach(zone => {
    try {
      const time = new Date().toLocaleTimeString("en-US", { timeZone: zone.name });
      const div = document.createElement("div");
      div.className = "timezone-box";
      div.setAttribute("data-zone", zone.name);
      div.innerHTML = `<strong>${zone.label}</strong><br>${time}`;
      container.appendChild(div);
    } catch (e) {
      const div = document.createElement("div");
      div.className = "timezone-box";
      div.setAttribute("data-zone", zone.name);
      div.innerHTML = `<strong>${zone.label}</strong><br>unsupported`;
      container.appendChild(div);
    }
  });
}
setInterval(updateClocks, 1000);
updateClocks();
