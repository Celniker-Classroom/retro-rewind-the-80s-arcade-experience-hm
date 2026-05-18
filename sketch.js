await Canvas();
world.gravity.y = 10;

let ballImage;
let ball;
let gameStarted = false;
const jumpForce = -8;
const gravityAcceleration = 0.5;
const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');
const startText = document.querySelector('#start-screen p');
const startMessages = [
	"Press the START button to begin!",
	"Ready for some pixel hoops? Click START!",
	"Tap the screen to see a new message.",
	"Pressing the spacebar has the same function as a click.",
	"Get set, then press START to launch into play!"
];

let currentMessageIndex = 0;
startText.textContent = startMessages[currentMessageIndex];

startScreen.addEventListener('click', (event) => {
	if (event.target.closest('#start-button')) {
		return;
	}

	let nextIndex = Math.floor(Math.random() * startMessages.length);
	while (nextIndex === currentMessageIndex) {
		nextIndex = Math.floor(Math.random() * startMessages.length);
	}
	currentMessageIndex = nextIndex;
	startText.textContent = startMessages[currentMessageIndex];
});

startButton.addEventListener('click', () => {
	gameStarted = true;
	document.getElementById('start-screen').classList.add('hidden');
	document.querySelector('main').classList.add('court');
});

ballImage = await loadImage('basketball .png');

ball = {
	x: width / 3,
	y: height / 2,
	w: 64,
	h: 64,
	vel: { x: 0, y: 0 },

	update() {
		this.vel.y += gravityAcceleration;
		this.y += this.vel.y;

		if (this.y > height - this.h / 2) {
			this.y = height - this.h / 2;
			this.vel.y = 0;
		}

		if (this.y < this.h / 2) {
			this.y = this.h / 2;
			this.vel.y = 0;
		}
	},

	draw() {
		image(ballImage, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
	}
};

q5.update = function () {
	background('transparent');

	if (!gameStarted) {
		ball.draw();
		return;
	}

	fill('white');
	textSize(24);
	textAlign(CENTER, CENTER);
	text('click to jump!', width / 2, 40);

	if (mouse.presses()) {
		ball.vel.y = jumpForce;
	}

	ball.update();
	ball.draw();
};
