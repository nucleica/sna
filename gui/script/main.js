const $services = document.querySelector(".services");

fetch("/services").then((s) => s.json()).then((services) => {
  for (const service of services) {
    const li = document.createElement("li");

    li.textContent = service.name;
    li.className = "button border";
    $services.appendChild(li);
  }
});
