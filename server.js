import express from "express";
import net from "net";

const app = express();

app.get("/scan", async (req, res) => {
  const ip = req.query.ip;
  const start = parseInt(req.query.start);
  const end = parseInt(req.query.end);

  if (!ip || isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const openPorts = [];

  const checkPort = (port) =>
    new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;

      socket.setTimeout(200);

      socket
        .connect(port, ip, () => {
          done = true;
          openPorts.push(port);
          socket.destroy();
          resolve();
        })
        .on("error", () => {
          if (!done) {
            done = true;
            socket.destroy();
            resolve();
          }
        })
        .on("timeout", () => {
          if (!done) {
            done = true;
            socket.destroy();
            resolve();
          }
        });
    });

  for (let port = start; port <= end; port++) {
    await checkPort(port);
  }

  res.json({ openPorts });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Scanner API on port " + PORT));