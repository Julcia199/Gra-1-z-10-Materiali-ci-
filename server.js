const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

const ADMIN_PASSWORD = "admin123";

let players = {};

// ===== TIMER =====
let timer = 0;
let timerInterval = null;
let timerRunning = false;
// =================

io.on("connection", socket => {
  console.log("Połączono:", socket.id);

  // ===== GRACZ =====
  socket.on("joinGame", data => {
    players[socket.id] = {
      nick: data.nick,
      avatar: data.avatar,
      lives: 3,
      alive: true
    };

    io.emit("playersUpdate", players);
    socket.emit("timerUpdate", timer);
  });

  // ===== ADMIN: -1 ŻYCIE =====
  socket.on("adminLoseLife", ({ playerId, password }) => {
    if (password !== ADMIN_PASSWORD) return;

    const player = players[playerId];
    if (!player) return;

    player.lives--;

    if (player.lives <= 0) {
      player.lives = 0;
      player.alive = false;
    }

    io.emit("playersUpdate", players);
  });

  // ===== ADMIN: +1 ŻYCIE =====
  socket.on("adminAddLife", ({ playerId, password }) => {
    if (password !== ADMIN_PASSWORD) return;

    const player = players[playerId];
    if (!player) return;

    if (player.lives < 3) {
      player.lives++;
      player.alive = true;
    }

    io.emit("playersUpdate", players);
  });

  // ===== ADMIN: START TIMERA =====
  socket.on("startTimer", ({ seconds, password }) => {
    if (password !== ADMIN_PASSWORD) return;
    if (timerRunning) return;

    timer = Number(seconds);
    if (isNaN(timer) || timer <= 0) return;

    timerRunning = true;
    io.emit("timerUpdate", timer);

    timerInterval = setInterval(() => {
      timer--;
      io.emit("timerUpdate", timer);

      if (timer <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;

        io.emit("timeEnded"); // 🔔 KONIEC CZASU
      }
    }, 1000);
  });

  // ===== ADMIN: STOP TIMERA =====
  socket.on("stopTimer", password => {
    if (password !== ADMIN_PASSWORD) return;

    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
  });

  // ===== ROZŁĄCZENIE =====
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", players);
  });
});

// ✅ WAŻNE DLA RENDERA
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Serwer działa na porcie", PORT);
});
