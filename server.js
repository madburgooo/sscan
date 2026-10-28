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

app.get("/scan", async (req, res) => {
  const ip = req.query.ip;
  const start = parseInt(req.query.start);
  const end = parseInt(req.query.end);

  if (!ip || isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const ports = [];
  for (let p = start; p <= end; p++) ports.push(p);

  const results = await Promise.all(
    ports.map((port) => checkPort(ip, port))
  );

  const openPorts = results.filter((p) => p !== null);

  res.json({ openPorts });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Scanner API running"));