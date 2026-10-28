import express from "express";
import net from "net";
import cors from "cors";

const app = express();

app.use(cors());

function checkPort(ip, port, timeout = 200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    socket.setTimeout(timeout);

    socket
      .connect(port, ip, () => {
        done = true;
        socket.destroy();
        resolve(port); // porta aperta
      })
      .on("error", () => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(null); // porta chiusa
        }
      })
      .on("timeout", () => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(null); // timeout → considerata chiusa
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

  if (!ip) {
    return res.status(400).json({ error: "Missing IP" });
  }

  try {
    const openPorts = await scanAll(ip);
    res.json({ openPorts });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Scanner API running"));