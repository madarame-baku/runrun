const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameSpeed = 1.2;
let isJumping = false;
let playerY = canvas.height - 150;
let playerVelY = 0;
let gravity = 1.5;

let obstacles = [];
let clouds = [];
let holes = [];

const player = {
  x: 50,
  y: playerY,
  width: 50,
  height: 100,
  speed: 5,
  jumpPower: 25,
  draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  },
  jump() {
    if (!isJumping) {
      playerVelY = -this.jumpPower;
      isJumping = true;
    }
  },
  update() {
    playerVelY += gravity;
    this.y += playerVelY;

    if (this.y > playerY) {
      this.y = playerY;
      playerVelY = 0;
      isJumping = false;
    }
  },
};

function createObstacle(type) {
  let size = Math.random() * 30 + 30;
  let obstacle = { x: canvas.width, y: canvas.height - size, width: size, height: size };
  obstacles.push(obstacle);
}

function createHole() {
  let hole = { x: canvas.width, width: 50, y: canvas.height - 10 };
  holes.push(hole);
}

function updateObstacles() {
  obstacles.forEach((obstacle, index) => {
    obstacle.x -= gameSpeed;
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(index, 1);
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

function updateHoles() {
  holes.forEach((hole, index) => {
    hole.x -= gameSpeed;
    if (hole.x + hole.width < 0) {
      holes.splice(index, 1);
    }
    ctx.clearRect(hole.x, hole.y, hole.width, hole.height);
  });
}

function detectCollision() {
  obstacles.forEach(obstacle => {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      alert('Game Over!');
      resetGame();
    }
  });

  holes.forEach(hole => {
    if (player.x + player.width > hole.x && player.x < hole.x + hole.width) {
      if (player.y + player.height >= canvas.height - 10) {
        alert('Game Over!');
        resetGame();
      }
    }
  });
}

function resetGame() {
  player.y = playerY;
  obstacles = [];
  holes = [];
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.update();
  player.draw();

  if (Math.random() < 0.01) {
    createObstacle();
  }

  if (Math.random() < 0.01) {
    createHole();
  }

  updateObstacles();
  updateHoles();
  detectCollision();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    player.jump();
  }
});

gameLoop();
