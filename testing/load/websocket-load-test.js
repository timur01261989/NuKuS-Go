import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const WS_URL = __ENV.WS_URL || "ws://localhost:3010";
const msgReceived = new Counter("ws_messages_received");

export const options = {
  stages: [
    { duration: "30s", target: 100  },
    { duration: "1m",  target: 500  },
    { duration: "30s", target: 1000 },
    { duration: "30s", target: 0    },
  ],
  thresholds: {
    ws_connecting:       ["p(99)<1000"],
    ws_msgs_received:    ["count>0"],
  },
};

export default function () {
  const url  = `${WS_URL}/rides?EIO=4&transport=websocket`;
  const res  = ws.connect(url, { headers: { "Authorization": `Bearer test-token` } }, function (socket) {
    socket.on("open", () => {
      socket.send(JSON.stringify({ event: "order:subscribe", data: { order_id: "test-order" } }));
    });
    socket.on("message", (msg) => {
      msgReceived.add(1);
    });
    socket.on("error", (e) => {
      console.error("WS Error:", e.message());
    });
    socket.setTimeout(() => socket.close(), 5000);
  });
  check(res, { "WS connected": r => r && r.status === 101 });
  sleep(1);
}
