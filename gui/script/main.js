const $services = document.querySelector(".services");
const $lastRefresh = document.querySelector(".last-refresh");
let services = [];

refresh();

let lastRefresh;

function refresh() {
  fetch("/services").then((s) => s.json())
    .then((response) => {
      lastRefresh = new Date().toLocaleTimeString();
      services = response;
      render(services);
      setTimeout(() => refresh(), 20000);
    });
}

function render(services) {
  $lastRefresh.textContent = lastRefresh;

  if (!services) {
    return;
  }

  $services.textContent = "";

  for (const service of services) {
    const $li = $("li");
    $services.appendChild($li);

    const $text = $("span", service.name, "button text");

    if (service.failed) {
      $text.className += " error";
    }

    $li.appendChild($text);

    if (service.cpu) {
      $li.appendChild(
        $("span", service.cpu, "button"),
      );
    }

    if (service.memory) {
      $li.appendChild(
        $("span", service.memory, "button"),
      );
    }

    $li.appendChild(
      $("span", service.port, "button"),
    );

    const action = service.installed
      ? service.active ? "Stop" : "Start"
      : "Install";

    if (action === "Stop") {
      const $restart = $("button", "Restart");

      $restart.addEventListener("click", () => {
        fetch("/restart", {
          body: JSON.stringify({ name: service.name }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }).then((res) => res.json());
      });

      $li.appendChild($restart);
    }

    const $startStop = $("button", action);

    $startStop.addEventListener("click", () => {
      fetch("/action", {
        body: JSON.stringify({ name: service.name, action }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((res) => res.json());
    });

    $li.appendChild($startStop);
  }
}

function $(tag, content, className) {
  const $el = document.createElement(tag);

  if (content) {
    $el.textContent = content;
  }

  if (className) {
    $el.className = className;
  }

  return $el;
}
