import express from "express";
import net from "net";

const app = express();

function checkPort(ip, port, timeout = 200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    socket.setTimeout(timeout);

    socket
      .connect(port, ip, () => {
        done = true;
        socket.destroy();
        resolve(port);
      })
      .on("error", () => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(null);
        }
      })
      .on("timeout", () => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(null);
        }
      });
  });
}

async function scanAll(ip) {
  const open = [];
  const batchSize = 200;

  for (let start = 1; start <= 65535; start += batchSize) {
    const batch = [];
    for (let p = start; p < start + batchSize && p <= 65535; p++) {
      batch.push(p);
    }

    const results = await Promise.all(batch.map((p) => checkPort(ip, p)));
    open.push(...results.filter((p) => p !== null));
  }

  return open;
}

app.get("/scan", async (req, res) => {
  const ip = req.query.ip;
  if (!ip) return res.json({ error: "Missing IP" });

  const openPorts = await scanAll(ip);
  res.json({ openPorts });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Scanner API running"));