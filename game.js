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
    onGround: false,
    groundLevel: canvas.height - 50,
    falling: false
};

// スクロール速度
let scrollSpeed = 5;
const scrollAcceleration = 0.001;

// 背景の設定
let backgroundX = 0;
const backgroundSpeed = 2;

// 障害物と穴
let holes = [];
let holeTimer = 0;
let holeInterval = 3000; // ミリ秒

let birds = [];
let rocks = [];
let birdTimer = 0;
let birdInterval = 2500; // ミリ秒
let rockTimer = 0;
let rockInterval = 3000; // ミリ秒

// スコア
let distance = 0;

// フレームカウント
let frameCount = 0;

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
    player.groundLevel = canvas.height - 50;
    player.falling = false;
    scrollSpeed = 5;
    holes = [];
    holeTimer = 0;
    holeInterval = 3000;
    birds = [];
    rocks = [];
    birdTimer = 0;
    birdInterval = 2500;
    rockTimer = 0;
    rockInterval = 3000;
    distance = 0;
    frameCount = 0;
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

    // 地面に着地または穴に落下
    if (player.y + player.height >= player.groundLevel) {
        if (player.groundLevel === canvas.height) {
            // 穴に落ちた
            gameOver = true;
            player.y = player.groundLevel - player.height;
            player.vy = 0;
            player.falling = true;
        } else {
            player.y = player.groundLevel - player.height;
            player.vy = 0;
            player.onGround = true;
            player.doubleJumped = false;
        }
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

    // 鳥の生成
    birdTimer += scrollSpeed;
    if (birdTimer > birdInterval) {
        birds.push({
            x: canvas.width,
            y: Math.random() * (canvas.height / 2),
            width: 30,
            height: 20,
            vy: 2 + Math.random() * 2 // 縦方向の速度
        });
        birdTimer = 0;
        birdInterval = Math.max(1000, birdInterval - 10);
    }

    // 岩の生成
    rockTimer += scrollSpeed;
    if (rockTimer > rockInterval) {
        rocks.push({
            x: canvas.width,
            y: canvas.height - 50,
            width: 40 + Math.random() * 20,
            height: 30 + Math.random() * 20
        });
        rockTimer = 0;
        rockInterval = Math.max(1500, rockInterval - 10);
    }

    // 鳥の更新
    for (let i = birds.length - 1; i >= 0; i--) {
        birds[i].x -= scrollSpeed;
        birds[i].y += birds[i].vy;
        // 上下のバウンド
        if (birds[i].y > canvas.height / 2 || birds[i].y < 0) {
            birds[i].vy *= -1;
        }
        // 当たり判定
        if (checkCollision(player, birds[i])) {
            gameOver = true;
        }
        // 画面外に出たら削除
        if (birds[i].x + birds[i].width < 0) {
            birds.splice(i, 1);
        }
    }

    // 岩の更新
    for (let i = rocks.length - 1; i >= 0; i--) {
        rocks[i].x -= scrollSpeed;
        // 当たり判定
        if (checkCollision(player, rocks[i])) {
            gameOver = true;
        }
        // 画面外に出たら削除
        if (rocks[i].x + rocks[i].width < 0) {
            rocks.splice(i, 1);
        }
    }

    // 穴の更新
    for (let i = holes.length - 1; i >= 0; i--) {
        holes[i].x -= scrollSpeed;
        // 画面外に出たら削除
        if (holes[i].x + holes[i].width < 0) {
            holes.splice(i, 1);
        }
    }

    // 地面のレベルを更新
    let onHole = false;
    for (let i = 0; i < holes.length; i++) {
        const hole = holes[i];
        if (player.x + player.width > hole.x && player.x < hole.x + hole.width) {
            onHole = true;
            break;
        }
    }
    if (onHole) {
        player.groundLevel = canvas.height; // 地面なし
    } else {
        player.groundLevel = canvas.height - 50; // 通常の地面
    }

    // プレイヤーが穴に落ちた後の処理
    if (gameOver && player.falling) {
        player.vy += player.gravity;
        player.y += player.vy;
        if (player.y > canvas.height) {
            // 画面外に出たら停止
            player.y = canvas.height;
            player.vy = 0;
            player.falling = false;
        }
    }

    // 距離の更新
    distance += scrollSpeed / 10;

    // フレームカウントの更新
    frameCount++;
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

    // 背景の描画
    drawBackground();

    // 地面の描画
    ctx.fillStyle = '#000';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    // 穴の描画
    holes.forEach(function(hole) {
        ctx.clearRect(hole.x, canvas.height - 10, hole.width, 10);
    });

    // プレイヤーの描画
    drawPlayer();

    // 鳥の描画
    birds.forEach(function(bird) {
        drawBird(bird);
    });

    // 岩の描画
    rocks.forEach(function(rock) {
        ctx.fillStyle = '#000';
        ctx.fillRect(
            rock.x,
            rock.y - rock.height,
            rock.width,
            rock.height
        );
    });

    // スコアの描画
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`距離: ${Math.floor(distance)} m`, 10, 30);

    if (gameOver && !player.falling) {
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

// 背景の描画
function drawBackground() {
    ctx.fillStyle = '#ccc';
    for (let i = -50 + (backgroundX % 50); i < canvas.width; i += 50) {
        ctx.fillRect(i, 0, 25, canvas.height);
    }
    backgroundX -= backgroundSpeed;
}

// プレイヤーの描画関数
function drawPlayer() {
    const { x, y, width, height } = player;

    if (player.falling) {
        drawFallingPose(x, y, width, height);
    } else if (player.onGround) {
        // 走るアニメーション
        const pose = Math.floor(frameCount / 5) % 4;
        drawRunningPose(x, y, width, height, pose);
    } else {
        // ジャンプ中のポーズ
        drawJumpingPose(x, y, width, height);
    }
}

// 走るポーズの描画
function drawRunningPose(x, y, width, height, pose) {
    ctx.strokeStyle = '#000';

    // 頭
    ctx.beginPath();
    ctx.arc(x + width / 2, y - 20, 10, 0, Math.PI * 2);
    ctx.stroke();

    // 体
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y - 10);
    ctx.lineTo(x + width / 2, y + height - 10);
    ctx.stroke();

    // 腕
    ctx.beginPath();
    if (pose % 2 === 0) {
        // 左腕前、右腕後ろ
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2 - 10, y + 10);
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2 + 10, y + 10);
    } else {
        // 右腕前、左腕後ろ
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2 + 10, y + 10);
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2 - 10, y + 10);
    }
    ctx.stroke();

    // 脚
    ctx.beginPath();
    if (pose % 2 === 0) {
        // 左脚前、右脚後ろ
        ctx.moveTo(x + width / 2, y + height - 10);
        ctx.lineTo(x + width / 2 - 10, y + height + 10);
        ctx.moveTo(x + width / 2, y + height - 10);
        ctx.lineTo(x + width / 2 + 10, y + height + 10);
    } else {
        // 右脚前、左脚後ろ
        ctx.moveTo(x + width / 2, y + height - 10);
        ctx.lineTo(x + width / 2 + 10, y + height + 10);
        ctx.moveTo(x + width / 2, y + height - 10);
        ctx.lineTo(x + width / 2 - 10, y + height + 10);
    }
    ctx.stroke();
}

// ジャンプポーズの描画
function drawJumpingPose(x, y, width, height) {
    ctx.strokeStyle = '#000';

    // 頭
    ctx.beginPath();
    ctx.arc(x + width / 2, y - 20, 10, 0, Math.PI * 2);
    ctx.stroke();

    // 体
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y - 10);
    ctx.lineTo(x + width / 2, y + height - 10);
    ctx.stroke();

    // 腕（上に上げる）
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2 - 10, y - 20);
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2 + 10, y - 20);
    ctx.stroke();

    // 脚（後ろに曲げる）
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + height - 10);
    ctx.lineTo(x + width / 2 - 10, y + height);
    ctx.moveTo(x + width / 2, y + height - 10);
    ctx.lineTo(x + width / 2 + 10, y + height);
    ctx.stroke();
}

// 落下ポーズの描画
function drawFallingPose(x, y, width, height) {
    ctx.strokeStyle = '#000';

    // 頭
    ctx.beginPath();
    ctx.arc(x + width / 2, y - 10, 10, 0, Math.PI * 2);
    ctx.stroke();

    // 体
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height - 10);
    ctx.stroke();

    // 腕（バタバタ）
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + 10);
    ctx.lineTo(x + width / 2 - 15, y + 20);
    ctx.moveTo(x + width / 2, y + 10);
    ctx.lineTo(x + width / 2 + 15, y + 20);
    ctx.stroke();

    // 脚（バタバタ）
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + height - 10);
    ctx.lineTo(x + width / 2 - 15, y + height + 10);
    ctx.moveTo(x + width / 2, y + height - 10);
    ctx.lineTo(x + width / 2 + 15, y + height + 10);
    ctx.stroke();
}

// 鳥の描画関数
function drawBird(bird) {
    ctx.fillStyle = '#000';
    const x = bird.x;
    const y = bird.y;
    const width = bird.width;
    const height = bird.height;

    // シンプルな鳥の形（三角形）
    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width / 2, y + height);
    ctx.closePath();
    ctx.fill();
}

// ゲームループの開始
requestAnimationFrame(gameLoop);
