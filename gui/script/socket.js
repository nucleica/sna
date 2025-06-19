const ws = new WebSocket("ws://127.0.0.1:9420");

const $connection = document.querySelector(".connection");

ws.onopen = () => {
  $connection.classList.add("open");
};

ws.onclose = (er) => {
  $connection.classList.remove("open");
};

ws.onmessage = (res) => {
  const event = JSON.parse(res.data).message;
  console.log(services);
  const index = services.findIndex((s) => s.name === event.name);
  console.log(event, index);
  if (index !== -1) {
    services[index] = { ...services[index], ...event.update };
    render(services);
  }

  // event.name event.update
};
