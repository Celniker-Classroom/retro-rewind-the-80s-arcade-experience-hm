
let gameStarted = false; 
let courtBackground = null; 
let ballImage = null;       
let courtImage = null;       

// Ball position and movement
let ballX = 0;               
let ballY = 0;              
let ballVelocityY = 0;       

let worldX = 0;              
let ballWorldX = 0;        


const ballSize = 72;
const gravity = 0.8;
const jump = -12;

const horizontalSpeed = 4;
const ballLocation = 0.3;


function preload() {
  ballImage = loadImage('basketball.png');
  
  courtImage = loadImage('pixelbasketballcourt.png');
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

  
  worldX += horizontalSpeed;
  ballWorldX += horizontalSpeed;

  ballVelocityY += gravity;
  ballY += ballVelocityY;

  drawBall(ballX, ballY);

  if (isBallOffScreen(ballX, ballY)) endGame();
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
