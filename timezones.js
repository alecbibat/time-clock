const timeZones = [
  { name: "UTC", label: "UTC (Coordinated Time)", color: "#ffadad" },
  { name: "America/New_York", label: "Eastern Time (New York)", color: "#ffd6a5" },
  { name: "America/Chicago", label: "Central Time (Chicago)", color: "#fdffb6" },
  { name: "America/Denver", label: "Mountain Time (Denver)", color: "#caffbf" },
  { name: "America/Denver", label: "Rocky Mountain National Park Time", color: "#caffbf" },
  { name: "America/Los_Angeles", label: "Pacific Time (LA)", color: "#9bf6ff" },
  { name: "America/Anchorage", label: "Alaska Time", color: "#bdb2ff" },
  { name: "Pacific/Honolulu", label: "Hawaii Time", color: "#ffc6ff" },
  { name: "Europe/London", label: "GMT / UK Time (London)", color: "#fffffc" },
  { name: "Asia/Tokyo", label: "Japan Time (Tokyo)", color: "#d0f4de" },
  { name: "Australia/Sydney", label: "Australian Eastern Time", color: "#a0c4ff" }
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
      div.style.backgroundColor = zone.color || "white";
      div.innerHTML = `<strong>${zone.label}</strong><br>${time}`;
      container.appendChild(div);
    } catch (e) {
      const div = document.createElement("div");
      div.className = "timezone-box";
      div.setAttribute("data-zone", zone.name);
      div.style.backgroundColor = zone.color || "white";
      div.innerHTML = `<strong>${zone.label}</strong><br>unsupported`;
      container.appendChild(div);
    }
  });
}
setInterval(updateClocks, 1000);
updateClocks();
