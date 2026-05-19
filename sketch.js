let started = false;
let bgImg = null;
let ballImg = null;
let world = null;
let ballBody = null;
let fallbackBall = null;
const BALL_SIZE = 72;
const FLAP_IMPULSE = -12;
const FALLBACK_GRAVITY = 0.8;
let p5Ready = false;
let pendingStart = false;
let p5Started = false;

function preload() {
  ballImg = loadImage('basketball.png');
}

function setup() {
  if (p5Started) return;
  p5Started = true;
  const canvas = createCanvas(800, 450);
  canvas.parent(document.querySelector('main'));
  imageMode(CENTER);
  bgImg = null;
  p5Ready = true;
  if (pendingStart) {
    pendingStart = false;
    startGame();
  }
}

function startGame() {
  if (!p5Ready) {
    pendingStart = true;
    return;
  }

  started = true;
  hideScreen('lose-screen');
  hideScreen('start-screen');

  const w = width || 800;
  const h = height || 450;
  bgImg = makePixelCourt(w, h, 16);

  if (typeof createWorld === 'function') {
    try {
      world = createWorld();
      ballBody = world.createBody({
        type: 'dynamic',
        position: { x: w / 2, y: h / 2 },
        fixtures: [{ shape: 'circle', radius: BALL_SIZE / 2, density: 1, restitution: 0.2, friction: 0.2 }]
      });
    } catch (e) {
      console.warn('q5play world creation failed, falling back to simple physics', e);
      world = null;
      createFallbackBall(w, h);
    }
  } else {
    createFallbackBall(w, h);
  }
}

function loseGame() {
  started = false;
  const loseScreen = document.getElementById('lose-screen');
  if (loseScreen) loseScreen.classList.remove('hidden');
}

function returnToStart() {
  started = false;
  world = null;
  ballBody = null;
  fallbackBall = null;
  bgImg = null;
  showScreen('start-screen');
  hideScreen('lose-screen');
}

function createFallbackBall(w, h) {
  fallbackBall = { x: w / 2, y: h / 2, vy: 0 };
}

function draw() {
  if (bgImg) {
    image(bgImg, width / 2, height / 2, width, height);
  } else {
    background(50);
  }

  if (!started) return;

  if (world && typeof world.step === 'function') {
    world.step();
    if (ballBody && ballBody.position) {
      drawBall(ballBody.position.x, ballBody.position.y);
      if (isOffscreen(ballBody.position.x, ballBody.position.y)) {
        loseGame();
      }
    }
  } else if (fallbackBall) {
    fallbackBall.vy += FALLBACK_GRAVITY;
    fallbackBall.y += fallbackBall.vy;
    drawBall(fallbackBall.x, fallbackBall.y);
    if (isOffscreen(fallbackBall.x, fallbackBall.y)) {
      loseGame();
    }
  }
}

function keyPressed() {
  if (!started) return;
  if (key === ' ' || keyCode === 32) {
    if (world && ballBody) {
      if (typeof ballBody.applyLinearImpulse === 'function') {
        ballBody.applyLinearImpulse({ x: 0, y: FLAP_IMPULSE });
      } else if (typeof ballBody.applyForce === 'function') {
        ballBody.applyForce({ x: 0, y: FLAP_IMPULSE * 0.4 });
      } else if (typeof ballBody.setLinearVelocity === 'function') {
        ballBody.setLinearVelocity({ x: 0, y: FLAP_IMPULSE });
      }
    } else if (fallbackBall) {
      fallbackBall.vy = FLAP_IMPULSE;
    }
  }
}

function drawBall(x, y) {
  if (ballImg) {
    image(ballImg, x, y, BALL_SIZE, BALL_SIZE);
  } else {
    push();
    noStroke();
    fill(255, 140, 0);
    ellipse(x, y, BALL_SIZE, BALL_SIZE);
    pop();
  }
}

function isOffscreen(x, y) {
  return x < -BALL_SIZE || x > width + BALL_SIZE || y < -BALL_SIZE || y > height + BALL_SIZE;
}

function makePixelCourt(w, h, block) {
  const g = createGraphics(w, h);
  g.noSmooth();
  for (let y = 0; y < h; y += block) {
    g.fill(((y / block) % 2) === 0 ? 210 : 190, ((y / block) % 2) === 0 ? 160 : 140, 90);
    g.noStroke();
    g.rect(0, y, w, block);
  }
  const cx = Math.floor(w / 2 / block) * block + block / 2;
  const cy = Math.floor(h / 2 / block) * block + block / 2;
  const r = block * 3;
  g.fill(255);
  for (let x = cx - r; x <= cx + r; x += block) {
    for (let y = cy - r; y <= cy + r; y += block) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        g.rect(x - block / 2, y - block / 2, block, block);
      }
    }
  }
  const keyW = block * 4;
  const keyH = block * 6;
  const keyY = Math.floor(h / 2 / block) * block - keyH / 2;
  const leftX = Math.floor(w * 0.25 / block) * block - keyW / 2;
  const rightX = Math.floor(w * 0.75 / block) * block - keyW / 2;
  g.fill(255, 200);
  g.rect(leftX, keyY, keyW, keyH);
  g.rect(rightX, keyY, keyW, keyH);
  return g;
}

function showScreen(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideScreen(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

globalThis.preload = preload;
globalThis.setup = setup;
globalThis.draw = draw;
globalThis.keyPressed = keyPressed;
globalThis.startGame = startGame;

const __startBtn = document.getElementById('start-button');
if (__startBtn) __startBtn.addEventListener('click', () => {
  if (p5Ready) startGame();
  else pendingStart = true;
});

const __loseBtn = document.getElementById('lose-button');
if (__loseBtn) __loseBtn.addEventListener('click', returnToStart);

(function ensureP5() {
  if (typeof createCanvas === 'function' && typeof createGraphics === 'function') {
    if (!p5Started) setup();
    return;
  }
  setTimeout(ensureP5, 100);
})();
