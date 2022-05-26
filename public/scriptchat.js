var socket = io();
const img = "./img/user-icon.png"
const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

var user = "";
//get username
async function getUser(){
    const token = getCookie('token');
    console.log(token);
    if( token === ""){
        //alert('Session expired!! \n Please login again...');
        window.location = '/login.html';
    }
    
        const response = await fetch('/chat' , {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        token
        })
    }).then((res) => res.json());

    console.log(response);

    if(response.state === 'ok'){
        return response.username;
    }
    if(response.state === 'error'){
        //alert(response.error);
        window.location  = './login.html';
    }
    return '';
  }

getUser().then(function(value) {user = value});
console.log(user);

//join chat
//socket.emit('join',user);

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}


socket.on('message', ({username,msg}) => {
  console.log(username,msg);
  console.log(user);
  if (username != user){
  appendMessage(username, img, "left", msg);
  }
});



msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  const msg = msgerInput.value;
  if (!msg) return;
  
  socket.emit('chatMsg' , {username: user ,msg});
  appendMessage("Me", img, "right", msg);
  msgerInput.value = "";
  msgerInput.focus();
  
});

function appendMessage(name, img, side, text) {
  //   Simple solution for small apps
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}


// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}
function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}