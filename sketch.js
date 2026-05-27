let gameStarted = false;
let courtBackground = null;
let ballImage = null;
let courtImage = null;
let hoopImage = null;

let ballSprite = null;
let hoopGroup = null;
let ballVy = 0;
let ballIsSprite = false;

function getSpriteClass() {
  if (typeof Sprite !== 'undefined') return Sprite;
  if (typeof Q5 !== 'undefined' && Q5.Sprite) return Q5.Sprite;
  if (typeof window !== 'undefined' && window.Sprite) return window.Sprite;
  return null;
}

function getGroupClass() {
  if (typeof Group !== 'undefined') return Group;
  if (typeof Q5 !== 'undefined' && Q5.Group) return Q5.Group;
  if (typeof window !== 'undefined' && window.Group) return window.Group;
  return null;
}

// Game layout and physics
const hoopSpacing = 500;
const hoopMin = 0.18;
const hoopMax = 0.78;
const hoopHeight = 0.18;
const hoopHitbox = 0.25;
const HoopHitboxReduction = 0.7;

let strikes = 0;
const maxStrikes = 3;
let score = 0;

const ballSize = 72;
const gravity = 0.8;
const jumpForce = -12;
const minHorizontalSpeed = 5;
const maxHorizontalSpeed = 30;
const speedIncreasePerPoint = 0.15;
const ballLocation = 0.3;

let worldX = 0;
let distanceSinceLastHoop = 0;

function preload() {
  ballImage = loadImage('basketball.png');
  courtImage = loadImage('pixelbasketballcourt.png');
  hoopImage = loadImage('basketballHoop.png');
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector('main'));
  imageMode(CENTER);
  const GroupClass = getGroupClass();
  if (GroupClass) {
    hoopGroup = new GroupClass();
  } else {
    hoopGroup = []; // fallback to plain array when q5play Group missing
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gameStarted && ballSprite) {
    ballSprite.x = width * ballLocation;
    ballSprite.y = height / 2;
    ballVy = 0;
  }
}

function startGame() {
  gameStarted = true;
  hideScreen('lose-screen');
  hideScreen('start-screen');

  worldX = 0;
  distanceSinceLastHoop = 0;
  strikes = 0;
  score = 0;

  if (ballSprite) {
    if (ballIsSprite && typeof ballSprite.delete === 'function') {
      ballSprite.delete();
    }
    ballSprite = null;
  }

  if (!hoopGroup) {
    const GroupClass = getGroupClass();
    if (GroupClass) hoopGroup = new GroupClass();
  }
  clearHoops();

  const SpriteClass = getSpriteClass();
  ballVy = 0;
  if (SpriteClass && ballImage) {
    ballIsSprite = true;
    ballSprite = new SpriteClass(ballImage, width * ballLocation, height / 2);
    ballSprite.scale = ballSize / ballImage.width;
    ballSprite.friction = 0;
    ballSprite.visible = true;
    ballSprite.passed = false;
  } else if (ballImage) {
    // fallback plain object ball
    ballIsSprite = false;
    ballSprite = {
      x: width * ballLocation,
      y: height / 2,
      width: ballSize,
      height: ballSize,
      image: ballImage,
      scale: ballSize / ballImage.width,
      passed: false
    };
  } else {
    console.error('Unable to create ball: missing ball image.');
    gameStarted = false;
    showScreen('start-screen');
    return;
  }

  spawnHoop();
}

function endGame() {
  gameStarted = false;
  showScreen('lose-screen');
}

function returnToStart() {
  gameStarted = false;
  courtBackground = null;
  showScreen('start-screen');
  hideScreen('lose-screen');
}

function draw() {
  if (courtImage) {
    push();
    imageMode(CORNER);
    const scale = height / courtImage.height;
    const imgW = courtImage.width * scale;
    let xOffset = -(worldX % imgW);
    if (xOffset > 0) xOffset -= imgW;
    for (let x = xOffset; x < width; x += imgW) {
      image(courtImage, x, 0, imgW, height);
    }
    pop();
  } else {
    background(50);
  }

  if (!gameStarted) return;

  const currentSpeed = min(maxHorizontalSpeed, minHorizontalSpeed + score * speedIncreasePerPoint);
  worldX += currentSpeed;
  distanceSinceLastHoop += currentSpeed;

  if (distanceSinceLastHoop >= hoopSpacing) {
    spawnHoop();
    distanceSinceLastHoop = 0;
  }

  if (hoopGroup) {
    for (let i = hoopGroup.length - 1; i >= 0; i--) {
      const hoop = hoopGroup[i];
      // move hoop (q5play sprite uses .x or .position.x)
      if (typeof hoop.x === 'number') {
        hoop.x -= currentSpeed;
      } else if (hoop.position && typeof hoop.position.x === 'number') {
        hoop.position.x -= currentSpeed;
      }

      const hoopX = (typeof hoop.x === 'number') ? hoop.x : (hoop.position?.x ?? 0);
      const hoopW = hoop.width ?? (hoop.image ? (hoop.image.width * (hoop.scale ?? 1)) : 0);
      if (hoopX < -hoopW) {
        if (typeof hoop.delete === 'function') {
          hoop.delete();
        } else {
          // remove from plain array
          hoopGroup.splice(i, 1);
        }
      }
    }
  }

  if (ballSprite) {
    ballVy += gravity;
    ballSprite.y += ballVy;
    checkHoopCollisions();

    if (isBallOffScreen(ballSprite.x, ballSprite.y)) {
      endGame();
    }
  }

  // draw fallback plain ball if not a sprite
  if (!ballIsSprite && ballSprite) {
    push();
    imageMode(CENTER);
    image(ballSprite.image, ballSprite.x, ballSprite.y, ballSprite.image.width * ballSprite.scale, ballSprite.image.height * ballSprite.scale);
    pop();
  }

  // draw fallback plain hoops if using plain array
  if (Array.isArray(hoopGroup)) {
    for (let h of hoopGroup) {
      if (h.image) {
        push();
        imageMode(CENTER);
        image(h.image, h.x, h.y, h.image.width * (h.scale ?? 1), h.image.height * (h.scale ?? 1));
        pop();
      }
    }
  }

  drawHud();
}

function checkHoopCollisions() {
  if (!ballSprite || !hoopGroup) return;

  for (let i = hoopGroup.length - 1; i >= 0; i--) {
    const hoop = hoopGroup[i];
    if (hoop.passed) continue;

    const hoopX = (typeof hoop.x === 'number') ? hoop.x : (hoop.position?.x ?? 0);
    const hoopY = (typeof hoop.y === 'number') ? hoop.y : (hoop.position?.y ?? 0);
    const hoopW = hoop.width ?? (hoop.image ? (hoop.image.width * (hoop.scale ?? 1)) : 0);
    const hoopH = hoop.height ?? (hoop.image ? (hoop.image.height * (hoop.scale ?? 1)) : 0);

    const ballX = ballSprite.x ?? ballSprite.position?.x ?? ballSprite.x;
    const ballY = ballSprite.y ?? ballSprite.position?.y ?? ballSprite.y;
    const ballW = ballSprite.width ?? (ballSprite.image ? (ballSprite.image.width * (ballSprite.scale ?? 1)) : ballSize);
    const ballH = ballSprite.height ?? (ballSprite.image ? (ballSprite.image.height * (ballSprite.scale ?? 1)) : ballSize);

    const overlapX = Math.abs(ballX - hoopX) < (ballW * 0.5 + hoopW * 0.4);
    const overlapY = Math.abs(ballY - hoopY) < (hoopH * 0.35 + ballH * 0.5);

    if (overlapX && overlapY) {
      handleHoopCollision(ballSprite, hoop);
    }
  }
}

function handleHoopCollision(ball, hoop) {
  if (hoop.passed) return;
  hoop.passed = true;

  const scoreZone = hoopHeight * height * hoopHitbox;
  const verticalDistance = Math.abs(ball.y - hoop.y);
  if (verticalDistance <= scoreZone) {
    score += 1;
  } else {
    strikes += 1;
    if (strikes >= maxStrikes) {
      endGame();
    }
  }

  // remove hoop from world (q5play or plain array)
  if (typeof hoop.delete === 'function') {
    hoop.delete();
  } else if (Array.isArray(hoopGroup)) {
    const idx = hoopGroup.indexOf(hoop);
    if (idx >= 0) hoopGroup.splice(idx, 1);
  }
}

function drawHud() {
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(28);
  textAlign(LEFT, TOP);
  text(`Strikes: ${strikes}/${maxStrikes}`, 12, 12);
  pop();

  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(28);
  textAlign(RIGHT, TOP);
  text(`Score: ${score}`, width - 12, 12);
  pop();
}

function keyPressed() {
  if (!gameStarted) return;
  if (key === ' ') {
    ballVy = jumpForce;
  }
}

function spawnHoop() {
  const SpriteClass = getSpriteClass();
  const hoopY = random(hoopMin * height, hoopMax * height);
  const targetX = width + 120;
  const targetHeight = height * hoopHeight;

  if (SpriteClass && hoopImage) {
    const hoop = new SpriteClass(hoopImage, targetX, hoopY);
    hoop.scale = targetHeight / hoopImage.height * 1.1;
    hoop.passed = false;
    if (hoopGroup) {
      if (typeof hoopGroup.push === 'function') hoopGroup.push(hoop);
      else if (typeof hoopGroup.add === 'function') hoopGroup.add(hoop);
    }
    return;
  }

  // Fallback: create plain hoop object and add to plain array
  if (!hoopImage) return;
  const plainHoop = {
    x: targetX,
    y: hoopY,
    image: hoopImage,
    scale: targetHeight / hoopImage.height * 1.1,
    passed: false,
    width: hoopImage.width * (targetHeight / hoopImage.height * 1.1),
    height: hoopImage.height * (targetHeight / hoopImage.height * 1.1)
  };
  if (Array.isArray(hoopGroup)) {
    hoopGroup.push(plainHoop);
  }
}

function clearHoops() {
  if (!hoopGroup) return;
  if (typeof hoopGroup.removeAll === 'function') {
    hoopGroup.removeAll();
  } else if (typeof hoopGroup.deleteAll === 'function') {
    hoopGroup.deleteAll();
  } else {
    hoopGroup.length = 0;
  }
}

function isBallOffScreen(x, y) {
  if (y < -ballSize) return true;
  if (y > height + ballSize) return true;
  return false;
}
function showScreen(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideScreen(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

const startButton = document.getElementById('start-button');
if (startButton) startButton.addEventListener('click', startGame);
const loseButton = document.getElementById('lose-button');
if (loseButton) loseButton.addEventListener('click', returnToStart);
const instructionsButton = document.getElementById('instructions-button');
const closeInstructionsButton = document.getElementById('close-instructions');
const instructionsPopup = document.getElementById('instructions-popup');

function showInstructions() {
  if (instructionsPopup) instructionsPopup.classList.remove('hidden');
}

function hideInstructions() {
  if (instructionsPopup) instructionsPopup.classList.add('hidden');
}

if (instructionsButton) instructionsButton.addEventListener('click', showInstructions);
if (closeInstructionsButton) closeInstructionsButton.addEventListener('click', hideInstructions);
