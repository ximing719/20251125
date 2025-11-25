// 建立一個物件來管理所有動畫的資訊
const animations = {
  waiting: {
    sheet: null,
    totalFrames: 9,
    width: 1246,
    height: 196,
    speed: 5, // 等待動畫速度
  },
  walk: {
    sheet: null,
    totalFrames: 9,
    width: 1246,
    height: 198,
    speed: 5, // 走路動畫速度
  },
  jump: {
    sheet: null,
    totalFrames: 19,
    width: 6360,
    height: 248,
    speed: 5, // 跳躍動畫速度
  },
  crouch: {
    sheet: null,
    totalFrames: 8,
    width: 2155,
    height: 189,
    speed: 5, // 蹲下動畫速度
  },
  run: {
    sheet: null,
    totalFrames: 13,
    width: 2517,
    height: 168,
    speed: 5, // 向左跑動畫速度
  },
  combo: {
    sheet: null,
    totalFrames: 7,
    width: 1822,
    height: 165, // 修正：combo_all.png 的高度是 165
    speed: 5, // 攻擊動畫速度
    isOneShot: true, // 標記為一次性動畫
  }
};

// 獨立管理光波的動畫資訊
const sonicBoomAnim = {
  sheet: null,
  totalFrames: 5,
  width: 740,
  height: 19, // 修正：sonicboom_all.png 的高度是 19
  speed: 6,
  frameWidth: 0,
  frameHeight: 0,
  projectileSpeed: 15, // 光波自己的移動速度
  projectiles: [] // 用一個陣列來存放所有在畫面上的光波
};

// 角色屬性
let character = {
  x: 0,
  y: 0,
  vx: 0, // 水平速度
  vy: 0, // 垂直速度
  state: 'waiting', // 角色目前的狀態
  animationFrame: 0, // 用於追蹤動畫播放進度
  facing: 1, // 1 表示朝右, -1 表示朝左
  onGround: true,
  speed: 8, // 移動速度
  jumpPower: 25 // 跳躍力量
};

// 環境變數
const groundY = 200; // 地面高度 (從底部算起)
const gravity = 1.2; // 重力

/**
 * p5.js 的 preload 函數，在 setup() 之前執行。
 * 用於預先載入外部檔案，例如圖片、聲音等。
 */
function preload() {
  // **重要提示**：為了讓 loadImage() 正常運作，您需要透過一個本地伺服器來瀏覽您的網頁，
  // 而不是直接打開 HTML 檔案。推薦使用 VS Code 的 "Live Server" 擴充功能。

  // 預先載入所有動畫的圖片精靈
  for (let state in animations) {
    animations[state].sheet = loadImage(`1/${state}/${state}_all.png`);
  }
  sonicBoomAnim.sheet = loadImage('1/sonic boom/sonicboom_all.png');
}

/**
 * p5.js 的 setup 函數，只在程式開始時執行一次。
 * 用於初始化設定，例如畫布大小、顏色模式等。
 */
function setup() {
  createCanvas(windowWidth, windowHeight);

  // 動態計算每個動畫的單一畫格寬高
  for (let state in animations) {
    const anim = animations[state];
    anim.frameWidth = anim.width / anim.totalFrames;
    anim.frameHeight = anim.height;
  }

  // 計算光波的畫格尺寸
  sonicBoomAnim.frameWidth = sonicBoomAnim.width / sonicBoomAnim.totalFrames;
  sonicBoomAnim.frameHeight = sonicBoomAnim.height;

  // 初始化角色位置在畫面中央底部
  character.x = width / 2;
  character.y = height - groundY;
}

/**
 * p5.js 的 draw 函數，會不斷重複執行。
 * 用於繪製每一幀的畫面。
 */
function draw() {
  background('#1B1B3A');

  // 根據按鍵狀態更新 currentState
  handleInput(); // 處理輸入
  updateCharacter(); // 更新角色物理狀態

  // 取得目前狀態對應的動畫資料
  drawCharacter();

  // 更新並繪製所有光波
  drawProjectiles();

  // 繪製操作說明
  drawInstructions();
}

/**
 * 根據按鍵輸入更新角色狀態
 */
function handleInput() {
  // 如果正在播放一次性動畫(如攻擊)，則不接受其他移動輸入
  const currentIsOneShot = animations[character.state] && animations[character.state].isOneShot;
  if (currentIsOneShot) {
    character.vx = 0; // 攻擊時停止移動
    return;
  }

  let newState = 'waiting'; // 預設為等待
  character.vx = 0; // 預設水平速度為 0

  if (keyIsDown(UP_ARROW) && character.onGround) {
    character.vy = -character.jumpPower;
    character.onGround = false;
    newState = 'jump';
  } else if (keyIsDown(RIGHT_ARROW)) {
    newState = 'walk';
    character.vx = character.speed;
    character.facing = 1;
  } else if (keyIsDown(LEFT_ARROW)) {
    newState = 'run';
    character.vx = -character.speed;
    character.facing = -1;
  } else if (keyIsDown(DOWN_ARROW)) {
    newState = 'crouch';
  }

  // 如果狀態改變了，就重置動畫計時器
  if (character.state !== newState && !currentIsOneShot) {
    character.state = newState;
    character.animationFrame = 0;
  }
}

/**
 * 處理一次性的按鍵事件 (例如攻擊)
 */
function keyPressed() {
  // 如果按下空白鍵，且角色不處於一次性動畫中
  if (key === ' ' && !animations[character.state].isOneShot) {
    character.state = 'combo';
    character.animationFrame = 0; // 重置動畫

    // 建立一個新的光波物件
    const newBoom = {
      x: character.x,
      y: character.y - 80, // 調整光波的初始 Y 軸位置
      facing: character.facing, // 光波方向與角色一致
    };
    sonicBoomAnim.projectiles.push(newBoom);
  }
}

/**
 * 更新角色位置與物理狀態
 */
function updateCharacter() {
  // 套用速度
  character.x += character.vx;
  character.y += character.vy;

  // 套用重力 (如果不在地面上)
  if (!character.onGround) {
    character.vy += gravity;
  }

  // 地面碰撞檢測
  if (character.y >= height - groundY) {
    character.y = height - groundY;
    character.vy = 0;
    character.onGround = true;
    if (character.state === 'jump') { // 如果是從跳躍狀態落地
      character.state = 'waiting';
    }
  }

  // 畫布邊界檢測
  const currentWidth = animations[character.state] ? animations[character.state].frameWidth : 50;
  character.x = constrain(character.x, currentWidth / 2, width - currentWidth / 2);
}

/**
 * 繪製角色
 */
function drawCharacter() {
  const currentAnimation = animations[character.state];
  character.animationFrame++; // 更新動畫計時器

  // 計算當前畫格
  let currentFrame = floor(character.animationFrame / currentAnimation.speed);

  // 如果是一次性動畫且已播放完畢
  if (currentAnimation && currentAnimation.isOneShot && currentFrame >= currentAnimation.totalFrames) {
    character.state = 'waiting'; // 回到等待狀態
    character.animationFrame = 0;
    // 重新取得動畫資料
    const waitingAnimation = animations['waiting'];
    currentFrame = floor(character.animationFrame / waitingAnimation.speed) % waitingAnimation.totalFrames;
  } else {
    currentFrame %= currentAnimation.totalFrames;
  }

  // 繪製角色
  push(); // 開始一個新的繪圖狀態
  translate(character.x, character.y); // 將原點移動到角色位置
  scale(character.facing, 1); // 根據角色朝向翻轉 X 軸
  image( // 繪製位置微調，讓角色底部對齊 y 座標
    currentAnimation.sheet,
    -currentAnimation.frameWidth / 2, -currentAnimation.frameHeight, // 繪製位置微調
    currentAnimation.frameWidth, currentAnimation.frameHeight,
    currentFrame * currentAnimation.frameWidth, 0,
    currentAnimation.frameWidth, currentAnimation.frameHeight
  );
  pop(); // 恢復繪圖狀態
}

/**
 * 繪製與更新所有光波
 */
function drawProjectiles() {
  for (let i = sonicBoomAnim.projectiles.length - 1; i >= 0; i--) {
    const boom = sonicBoomAnim.projectiles[i];

    // 更新光波位置
    boom.x += sonicBoomAnim.projectileSpeed * boom.facing;

    // 繪製光波動畫
    const boomFrame = floor(frameCount / sonicBoomAnim.speed) % sonicBoomAnim.totalFrames;
    push();
    translate(boom.x, boom.y);
    scale(boom.facing, 1);
    image(
      sonicBoomAnim.sheet,
      -sonicBoomAnim.frameWidth / 2, -sonicBoomAnim.frameHeight / 2,
      sonicBoomAnim.frameWidth, sonicBoomAnim.frameHeight,
      boomFrame * sonicBoomAnim.frameWidth, 0,
      sonicBoomAnim.frameWidth, sonicBoomAnim.frameHeight
    );
    pop();

    // 如果光波移出畫面，就從陣列中移除它
    if (boom.x > width + 100 || boom.x < -100) {
      sonicBoomAnim.projectiles.splice(i, 1);
    }
  }
}

/**
 * 繪製操作說明
 */
function drawInstructions() {
  push();
  fill(255, 255, 255, 200); // 半透明白色
  stroke(0, 150); // 半透明黑色邊框
  rect(10, 10, 220, 115, 10); // 圓角矩形

  fill(0);
  noStroke();
  textSize(14);
  textFont('Arial');
  textAlign(LEFT, TOP);

  const instructions = [
    '←: 向左跑 (Run)',
    '→: 向右走 (Walk)',
    '↑: 跳躍 (Jump)',
    '↓: 蹲下 (Crouch)',
    '空白鍵: 攻擊 (Combo)'
  ];
  text(instructions.join('\n'), 20, 20);
  pop();
}

/**
 * 當瀏覽器視窗大小改變時，p5.js 會自動呼叫此函數。
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
