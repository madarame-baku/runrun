// Canvasの設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲームの状態
let gameOver = false;
let gameStarted = false;

// プレイヤーキャラクターの設定
const player = {
    x: 100,
    y: canvas.height - 50,
    width: 20,
    height: 40,
    vy: 0,
    gravity: 1,
    jumpStrength: 15,
    doubleJumped: false,
    onGround: false
};

// スクロール速度
let scrollSpeed = 5;
const scrollAcceleration = 0.001;

// 障害物と穴
let obstacles = [];
let holes = [];
let obstacleTimer = 0;
let holeTimer = 0;
let obstacleInterval = 2000; // ミリ秒
let holeInterval = 3000; // ミリ秒

// スコア
let distance = 0;

// キーボード入力
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
        } else if (!gameOver) {
            if (player.onGround) {
                player.vy = -player.jumpStrength;
                player.onGround = false;
            } else if (!player.doubleJumped) {
                player.vy = -player.jumpStrength;
                player.doubleJumped = true;
            }
        } else {
            // リスタート
            resetGame();
        }
    }
});

// ゲームのリセット
function resetGame() {
    gameOver = false;
    player.y = canvas.height - 50;
    player.vy = 0;
    player.doubleJumped = false;
    player.onGround = false;
    scrollSpeed = 5;
    obstacles = [];
    holes = [];
    obstacleTimer = 0;
    holeTimer = 0;
    obstacleInterval = 2000;
    holeInterval = 3000;
    distance = 0;
}

// ゲームのメインループ
function gameLoop() {
    if (!gameOver && gameStarted) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// ゲームの更新
function update() {
    // スクロール速度の更新
    scrollSpeed += scrollAcceleration;

    // プレイヤーの位置更新
    player.vy += player.gravity;
    player.y += player.vy;

    // 地面に着地
    if (player.y >= canvas.height - 50) {
        player.y = canvas.height - 50;
        player.vy = 0;
        player.onGround = true;
        player.doubleJumped = false;
    }

    // 障害物の生成
    obstacleTimer += scrollSpeed;
    if (obstacleTimer > obstacleInterval) {
        obstacles.push({
            x: canvas.width,
            y: canvas.height - 50,
            width: 20,
            height: 30
        });
        obstacleTimer = 0;
        // ゲームが進むにつれて間隔を短く
        obstacleInterval = Math.max(500, obstacleInterval - 10);
    }

    // 穴の生成
    holeTimer += scrollSpeed;
    if (holeTimer > holeInterval) {
        const holeWidth = Math.min(300, 50 + distance / 100);
        holes.push({
            x: canvas.width,
            width: holeWidth
        });
        holeTimer = 0;
        // ゲームが進むにつれて間隔を短く
        holeInterval = Math.max(1000, holeInterval - 10);
    }

    // 障害物の更新
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= scrollSpeed;
        // 当たり判定
        if (checkCollision(player, obstacles[i])) {
            gameOver = true;
        }
        // 画面外に出たら削除
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // 穴の更新
    for (let i = holes.length - 1; i >= 0; i--) {
        holes[i].x -= scrollSpeed;
        // 穴に落ちたかの判定
        if (
            player.x + player.width > holes[i].x &&
            player.x < holes[i].x + holes[i].width &&
            player.y + player.height >= canvas.height - 50
        ) {
            gameOver = true;
        }
        // 画面外に出たら削除
        if (holes[i].x + holes[i].width < 0) {
            holes.splice(i, 1);
        }
    }

    // 距離の更新
    distance += scrollSpeed / 10;
}

// 衝突判定
function checkCollision(player, obj) {
    return (
        player.x < obj.x + obj.width &&
        player.x + player.width > obj.x &&
        player.y < obj.y + obj.height &&
        player.y + player.height > obj.y
    );
}

// ゲームの描画
function draw() {
    // 画面をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地面の描画
    ctx.fillStyle = '#000';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // 穴の描画
    ctx.fillStyle = '#555';
    holes.forEach(function(hole) {
        ctx.clearRect(hole.x, canvas.height - 10, hole.width, 10);
    });

    // プレイヤーの描画（チャリに乗った棒人間）
    drawPlayer();

    // 障害物の描画
    obstacles.forEach(function(obstacle) {
        ctx.fillStyle = '#000';
        ctx.fillRect(
            obstacle.x,
            obstacle.y - obstacle.height,
            obstacle.width,
            obstacle.height
        );
    });

    // スコアの描画
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`距離: ${Math.floor(distance)} m`, 10, 30);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.fillText('ゲームオーバー', canvas.width / 2 - 100, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText(
            'スペースキーでリスタート',
            canvas.width / 2 - 100,
            canvas.height / 2 + 20
        );
    } else if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.fillText(
            'スペースキーでスタート',
            canvas.width / 2 - 150,
            canvas.height / 2
        );
    }
}

// プレイヤーの描画関数
function drawPlayer() {
    ctx.fillStyle = '#000';
    const { x, y, width, height } = player;

    // 自転車の車輪
    ctx.beginPath();
    ctx.arc(x + 5, y + height, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + width - 5, y + height, 10, 0, Math.PI * 2);
    ctx.stroke();

    // 自転車のフレーム
    ctx.beginPath();
    ctx.moveTo(x + 5, y + height);
    ctx.lineTo(x + width / 2, y + height - 15);
    ctx.lineTo(x + width - 5, y + height);
    ctx.stroke();

    // 棒人間の体
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + height - 15);
    ctx.lineTo(x + width / 2, y + height - 35);
    ctx.stroke();

    // 棒人間の頭
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height - 45, 5, 0, Math.PI * 2);
    ctx.stroke();
}

// ゲームループの開始
requestAnimationFrame(gameLoop);
