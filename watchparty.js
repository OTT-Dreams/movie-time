const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Watch Party</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 20px; }
        iframe { width: 720px; height: 405px; margin-top: 20px; }
        input { margin: 5px; padding: 5px; width: 300px; }
      </style>
    </head>
    <body>
      <h1>🎬 Watch Party + Video Sync</h1>
      <input id="room" placeholder="Room ID" />
      <input id="url" placeholder="YouTube Embed URL (embed link)" />
      <button onclick="joinRoom()">Join</button>
      <br><br>
      <iframe id="player" src="" allow="autoplay; encrypted-media" allowfullscreen></iframe>

      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        let room = "";
        let player = document.getElementById("player");

        function joinRoom() {
          room = document.getElementById("room").value;
          const url = document.getElementById("url").value;
          player.src = url;
          socket.emit("join-room", room);
        }

        // Sync play/pause
        window.addEventListener("message", (event) => {
          if (event.origin.includes("youtube")) {
            const data = event.data;
            if (data && data.event === "onStateChange") {
              if (data.info === 1) socket.emit("video", { room, action: "play" });
              if (data.info === 2) socket.emit("video", { room, action: "pause" });
            }
          }
        });

        socket.on("video", ({ action }) => {
          const playerWindow = player.contentWindow;
          if (action === "play") {
            playerWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          } else if (action === "pause") {
            playerWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          }
        });
      </script>
    </body>
    </html>
  `);
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("video", ({ room, action }) => {
    socket.to(room).emit("video", { action });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("✅ Server running on http://localhost:" + PORT);
});
