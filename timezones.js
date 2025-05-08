const timeZones = [
  { name: "UTC", offset: 0 },
  { name: "America/New_York", offset: -4 },
  { name: "Europe/London", offset: 1 },
  { name: "Asia/Tokyo", offset: 9 },
  { name: "Australia/Sydney", offset: 10 }
];

function updateClocks() {
  const ul = document.getElementById("zone-times");
  ul.innerHTML = "";
  const nowUTC = new Date();
  timeZones.forEach(zone => {
    const localTime = new Date(nowUTC.getTime() + zone.offset * 3600000);
    const li = document.createElement("li");
    li.textContent = `${zone.name}: ${localTime.toUTCString().slice(17, 25)}`;
    ul.appendChild(li);
  });
}
setInterval(updateClocks, 1000);
updateClocks();
