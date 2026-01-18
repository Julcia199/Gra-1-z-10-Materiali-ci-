const socket = io();

function join() {
  const nick = document.getElementById("nick").value;
  const file = document.getElementById("avatar").files[0];

  const reader = new FileReader();
  reader.onload = () => {
    socket.emit("joinGame", {
      nick: nick,
      avatar: reader.result
    });
  };
  reader.readAsDataURL(file);
}
socket.on("playersUpdate", players => {
  const div = document.getElementById("players");
  div.innerHTML = "";

  Object.values(players).forEach(p => {
    div.innerHTML += `
      <div>
        <img src="${p.avatar}" width="40">
        <b>${p.nick}</b> ❤️ ${p.lives}
      </div>
    `;
  });
});
socket.on("timerUpdate", time => {
  document.getElementById("timer").innerText = time;
});

socket.on("timeEnded", () => {
  
});
socket.on("timeEnded", () => {
  document.getElementById("timeMessage").innerText = "⏰ KONIEC CZASU";
  document.getElementById("endSound").play();
});


