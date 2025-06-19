const $services = document.querySelector(".services");
let services = [];

fetch("/services").then((s) => s.json())
  .then((response) => {
    services = response;
    render(services);
  });

function render(services) {
  if (!services) {
    return;
  }

  $services.textContent = "";

  for (const service of services) {
    const $li = document.createElement("li");
    const $startStop = document.createElement("button");

    const $text = document.createElement("span");
    $text.textContent = service.name;
    $text.className = "button border text";

    if (service.failed) {
      $text.className += " error";
    }

    $li.appendChild($text);

    const $port = document.createElement("span");
    $port.textContent = service.port;
    $port.className = "button border";
    $li.appendChild($port);

    const action = service.installed
      ? service.active ? "Stop" : "Start"
      : "Install";

    if (action === "Stop") {
      const $restart = document.createElement("button");
      $restart.textContent = "Restart";

      $restart.addEventListener("click", () => {
        fetch("/restart", {
          body: JSON.stringify({ name: service.name }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }).then((res) => res.json()).then((e) => console.log(e));
      });

      $li.appendChild($restart);
    }

    $startStop.textContent = action;

    $startStop.addEventListener("click", () => {
      fetch("/action", {
        body: JSON.stringify({ name: service.name, action }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((res) => res.json()).then((e) => console.log(e));
    });

    $li.appendChild($startStop);

    $services.appendChild($li);
  }
}
