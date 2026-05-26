
let gameStarted = false; 
let courtBackground = null; 
let ballImage = null;       
let courtImage = null;       
let hoopImage = null;        

// Ball position and movement
let ballX = 0;               
let ballY = 0;              
let ballVelocityY = 0;       

let worldX = 0;              
let ballWorldX = 0;        

// Hoops generation and tracking
let hoops = [];
let lastHoopSpawnWorldX = -Infinity;

const hoopSpacing = 500; // world pixels between hoops
const hoopMin = 0.18;
const hoopMax = 0.78;
// Height of hoop as fraction of screen height. Reduced to make hoops much smaller.
const hoopHeight = 0.12;

// How forgiving the hoop pass check is (fraction of hoop draw height)
const HOOP_PASS_TOLERANCE_FRACTION = 0.6;

// Player strikes (misses)
let strikes = 0;
const threeStrikes = 3;

// Player score (successful passes)
let score = 0;

const ballSize = 72;
const gravity = 0.8;
const jump = -12;

const minHorizontalSpeed = 5;
const maxHorizontalSpeed = 30;
const speedIncreasePerPoint = 0.25;
const ballLocation = 0.3;


function preload() {
  ballImage = loadImage('basketball.png');
  
  courtImage = loadImage('pixelbasketballcourt.png');
  hoopImage = loadImage('basketballHoop.png');
}


function setup() {

  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector('main'));
  imageMode(CENTER);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gameStarted) {
    if (courtImage) courtBackground = courtImage;
    ballX = width * ballLocation;
    ballY = height / 2;
    ballVelocityY = 0;
  }
}


function startGame() {
  gameStarted = true;
 
  hideScreen('lose-screen');
  hideScreen('start-screen');

 
  worldX = 0;
  if (courtImage) courtBackground = courtImage;
  else courtBackground = null;
  ballWorldX = worldX + width * ballLocation;
  ballX = width * ballLocation;
  ballY = height / 2;
  ballVelocityY = 0;
  // reset hoops
  hoops = [];
  lastHoopSpawnWorldX = worldX;
  // reset strikes each game
  strikes = 0;
  // reset score each game
  score = 0;
}


function endGame() {
  gameStarted = false;
  const loseScreen = document.getElementById('lose-screen');
  if (loseScreen) loseScreen.classList.remove('hidden');
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
    
    let xOffset = - (worldX % imgW);
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
  ballWorldX += currentSpeed;

  // spawn a new hoop every hoopSpacing world pixels
  if (worldX - lastHoopSpawnWorldX >= hoopSpacing) {
    spawnHoop();
    lastHoopSpawnWorldX = worldX;
  }

  // draw hoops 
  for (let i = hoops.length - 1; i >= 0; i--) {
    const hoop = hoops[i];
    const screenX = hoop.worldX - worldX;
    if (!hoop.passed && screenX <= ballX) {
      const hH = height * hoopHeight;
      const allowed = hH * 0.35; // allowed vertical distance to count as a pass
      if (Math.abs(ballY - hoop.y) <= allowed) {
        // successful pass
        hoop.passed = true;
        score += 1;
      } else {
        // missed the hoop
        hoop.passed = true;
        strikes += 1;
        if (strikes >= threeStrikes) {
          endGame();
        }
      }
    }
    if (hoopImage) {
      const drawH = height * hoopHeight;
      const drawW = hoopImage.width * (drawH / hoopImage.height);
      // remove when off left side
      if (screenX < -drawW) { hoops.splice(i, 1); continue; }
      push();
      imageMode(CENTER);
      image(hoopImage, screenX, hoop.y, drawW, drawH);
      pop();
    } else {
      const drawH = height * hoopHeight;
      const drawW = drawH * 1.2;
      if (screenX < -drawW) { hoops.splice(i, 1); continue; }
      push();
      noStroke();
      fill(200, 50, 50);
      rectMode(CENTER);
      rect(screenX, hoop.y, drawW, drawH);
      pop();
    }
  }

  ballVelocityY += gravity;
  ballY += ballVelocityY;

  drawBall(ballX, ballY);
  if (isBallOffScreen(ballX, ballY)) endGame();

  // draw strikes counter
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(28);
  textAlign(LEFT, TOP);
  text(`Strikes: ${strikes}/${threeStrikes}`, 12, 12);
  pop();

  // draw score (top-right)
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
    ballVelocityY = jump;
  }
}


function drawBall(x, y) {
  if (ballImage) image(ballImage, x, y, ballSize, ballSize);
  else {
    push();
    noStroke();
    fill(255, 140, 0);
    ellipse(x, y, ballSize, ballSize);
    pop();
  }
}


function isBallOffScreen(x, y) {
  
  if (y < -ballSize) return true;
  if (y > height + ballSize) return true;
  return false;
}


function spawnHoop() {
  // place new hoop just off the right edge in world coordinates
  const worldPos = worldX + width + 120;
  const y = random(hoopMin * height, hoopMax * height);
  hoops.push({ worldX: worldPos, y: y, passed: false });
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
