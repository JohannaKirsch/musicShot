var comboPoints = 0; //counter for the combo mulitiplicator
var failDifficulty = 10; //sets number of fails until game over
var failPoints = 0; //counts fails
var gameEnded = false;
var isCombo = false;
let midiInputPort = null;
var neededTime = 0; //how long the element needs to get to the middle of the shoot board
var speed = 3; //sets number of speed muliplicator

var combo = document.getElementById("comboPoints");
var generator = document.getElementById("container");
var motivationText = document.getElementById("motivationText");
var points = document.getElementById("pointsCounter");
var shootBoard = document.getElementById("shoot-board");

var height = document.getElementById("calculator").getBoundingClientRect().top; //height of page minus ball height
var balls = generator.children; //list of all balls

//for midi code
console.log(window.location.search);
requestMidiPort();

/**
 * Calculates the needed time for a ball to get from the bottom to the middle of the shootboard
 */
function calculateTime() {
    neededTime = (height - 145) / speed / 0.1; //0.1 to get to seconds, 145 is middle of shootboard
    console.log("needed seconds: " + neededTime);
}

/**
 * Creates each ball and appends it to a div parent
 */
function createBall() {
    const newBall = document.createElement("div");
    newBall.classList.add('basketball');
    newBall.innerHTML = " "; //important for checking if the ball is removed, important for later
    generator.append(newBall);
    startAnimation(newBall);
}

/**
 * Starts the Animation of each ball and removes them if they reach the top
 * @param {*} ball specific ball
 */
function startAnimation(ball) {
    var start; // start time stamp of animation 
    var stopId; // timestamp where the animation is after every move (used to stop at this time stamp)
    var progress; // time progress since animation start, also speed

    window.requestAnimationFrame(step); // starts the animation cycle

    //animation cycle, where the ball moves to the top depending on the refresh rate
    function step(timestamp) {
        if (!start || progress > height) start = timestamp;
        progress = (timestamp - start) / 10 * speed;
        ball.style.bottom = progress + 'px';
        stopId = window.requestAnimationFrame(step);
        if (progress > (height)) {
            cancelAnimationFrame(stopId);
            ball.remove();
            ball.innerHTML = "1"; //to mark it as removed
            balls = generator.children;
        }
        if (progress > (height - 75) && ball.innerHTML === " ") {
            if (ball.getBoundingClientRect().top < 75) {
                ball.innerHTML = "1";
                fail();
            }
        }
    }
}

/**
 * Checks if the top ball was hit
 */
function checkBallHit() {
    var topBall = balls[0];

    //if the top ball is between a specific area it counts as a hit
    if (topBall.getBoundingClientRect().top < 200 && !(topBall.getBoundingClientRect().top < 75) && !gameEnded) {
        topBall.remove();
        topBall.innerHTML = "1"; //to mark it as removed
        addPoints();
    } else {
        fail();
    }
}

/**
 * Calculates added points
 */
function addPoints() {
    motivationText.style.color = 'rgb(245, 154, 71)';
    shootBoard.style.borderColor = 'rgb(245, 154, 71)';

    if (isCombo) {
        combo.style.color = 'rgb(245, 154, 71)';
        comboPoints += 1;
        combo.innerHTML = comboPoints + "x";
    } else {
        isCombo = true;
    };

    points.innerHTML = Number(points.innerHTML) + (1 * comboPoints);
}

/**
 * Counts fails
 */
function fail() {
    console.log("fail");
    isCombo = false;
    comboPoints = 0;
    combo.innerHTML = comboPoints + "x";
    motivationText.innerHTML = "oh no!";
    motivationText.style.color = 'rgb(71, 209, 245)';
    shootBoard.style.borderColor = 'rgb(71, 209, 245)';
    combo.style.color = 'rgb(71, 209, 245)';
    failPoints += 1;

    if (failPoints == failDifficulty) {
        endGame();
    }
}

function requestMidiPort() {
    navigator.requestMIDIAccess()
        .then(
            (midi) => {
                initMidiInput(midi);

                midi.addEventListener('statechange',
                    (event) => {
                        if (midiInputPort === null) {
                            initMidiInput(event.target)
                        }
                    });
            },
            (err) => console.log('Cannot connect to MIDI input:', err));
}

function initMidiInput(midi) {
    const inputs = midi.inputs.values();
    let input = inputs.next();

    while (input && !input.done) {
        const port = input.value;

        if (port.name === 'SOMI-1') {
            port.addEventListener('midimessage', onMidiMessage);
            midiInputPort = port;
            console.log('MIDI connected');
        }

        input = inputs.next();
    }
}

function onMidiMessage(event) {
    const time = Date.now();
    const NOTE_ON = 9;

    const cmd = event.data[0] >> 4;
    const pitch = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 1;

    if (cmd === NOTE_ON) {
        console.log("midi hit");
        checkBallHit();
    }
}

/**
 * Game over event
 */
function endGame() {
    gameEnded = true;
    music.pause();
    document.getElementById("endText").style.visibility = "visible";
    document.getElementById("endPoints").innerHTML = points.innerHTML;

}

/**
 * When Enter is pressed it starts the music.
 */
document.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        calculateTime();
        music.play();
        var startTime = Date.now() - neededTime;
        var currentTime;
        var i = 0;
        var x = setInterval(function () {
            currentTime = Date.now() - startTime;
            if (currentTime >= musicRhythm[i] && !gameEnded) {
                createBall();
                i += 1;
            }
            if (musicRhythm[i] == null) {
                if (balls.length == 0) { endGame(); }

            }
        }, 10);
    }
    //when midi is not available, then the player can press space
    if (event.key === " ") {
        checkBallHit();
    }
});