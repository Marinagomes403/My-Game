const music = document.getElementById("music");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");

const resultScreen = document.getElementById("resultScreen");
const restartButton = document.getElementById("restartButton");

const finalScore = document.getElementById("finalScore");
const finalCombo = document.getElementById("finalCombo");
const bestScoreText = document.getElementById("bestScore");

const noteArea = document.getElementById("noteArea");
const targets = document.querySelectorAll(".target");

const scoreText = document.getElementById("score");
const health = document.getElementById("health");
const message = document.getElementById("message");

const player = document.getElementById("player");
const enemy = document.getElementById("enemy");

let score = 0;
let combo = 0;
let maxCombo = 0;
let hp = 50;

let notes = [];
let gameRunning = false;

let lastChartIndex = 0;

const keys = [
    "ArrowLeft",
    "ArrowDown",
    "ArrowUp",
    "ArrowRight"
];

const symbols = ["←", "↓", "↑", "→"];

const MAX_GAME_TIME = 15;

/*
    Melhor pontuação salva no navegador.
*/

let bestScore = Number(localStorage.getItem("bestScore")) || 0;

/*
    Cada número representa uma nota.

    0 = esquerda
    1 = baixo
    2 = cima
    3 = direita
*/

const chart = [
    [2.0, 0],
    [2.5, 1],
    [3.0, 2],
    [3.5, 3],

    [4.5, 0],
    [5.0, 2],
    [5.5, 1],
    [6.0, 3],

    [7.0, 0],
    [7.5, 1],
    [8.0, 0],
    [8.5, 2],

    [9.5, 3],
    [10.0, 2],
    [10.5, 1],
    [11.0, 0],

    [12.0, 0],
    [12.25, 1],
    [12.5, 2],
    [12.75, 3],

    [14.0, 3],
    [14.5, 2]
];

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

function startGame() {

    startScreen.style.display = "none";
    resultScreen.style.display = "none";

    score = 0;
    combo = 0;
    maxCombo = 0;
    hp = 50;

    notes.forEach(note => {
        if (note.element) {
            note.element.remove();
        }
    });

    notes = [];

    lastChartIndex = 0;

    music.pause();
    music.currentTime = 0;

    music.play();

    gameRunning = true;

    player.classList.add("dance");
    enemy.classList.add("dance");

    updateInterface();

    requestAnimationFrame(gameLoop);
}

function createNote(lane) {

    const note = document.createElement("div");

    note.className = "note";
    note.textContent = symbols[lane];

    note.style.left = `${lane * 25}%`;
    note.style.top = "-80px";

    note.style.color = [
        "#ff4c7a",
        "#48a8ff",
        "#5cff87",
        "#d56cff"
    ][lane];

    noteArea.appendChild(note);

    const obj = {
        element: note,
        lane: lane,
        y: -80,
        hit: false
    };

    notes.push(obj);
}

function gameLoop() {

    if (!gameRunning) return;

    const currentTime = music.currentTime;

    while (
        lastChartIndex < chart.length &&
        chart[lastChartIndex][0] <= currentTime + 1.2
    ) {

        const [time, lane] = chart[lastChartIndex];

        if (time <= currentTime + 1.2) {
            createNote(lane);
            lastChartIndex++;
        }
    }

    for (let i = notes.length - 1; i >= 0; i--) {

        const note = notes[i];

        if (note.hit) continue;

        note.y += 7;

        note.element.style.top = note.y + "px";

        if (note.y > window.innerHeight - 80) {

            miss();

            note.element.remove();
            notes.splice(i, 1);
        }
    }

    /*
        Quando a música terminar,
        mostra a tela de resultado.
    */

    if (currentTime >= MAX_GAME_TIME || music.ended) {
    music.pause();
    endGame();
    return;
}

    requestAnimationFrame(gameLoop);
}

function hitNote(key) {

    const lane = keys.indexOf(key);

    if (lane === -1) return;

    targets[lane].classList.add("active");

    setTimeout(() => {
        targets[lane].classList.remove("active");
    }, 100);

    let closest = null;
    let closestDistance = Infinity;

    notes.forEach(note => {

        if (note.hit || note.lane !== lane) return;

        const targetY = window.innerHeight - 160;

        const distance = Math.abs(note.y - targetY);

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = note;
        }
    });

    if (closest && closestDistance < 100) {

        closest.hit = true;
        closest.element.classList.add("hit");

        combo++;

        /*
            Guarda o maior combo alcançado.
        */

        if (combo > maxCombo) {
            maxCombo = combo;
        }

        const points = 100 + combo * 10;

        score += points;

        hp = Math.min(100, hp + 2);

        showMessage(
            combo >= 10 ? "PERFEITO!" : "ACERTOU!"
        );

        player.classList.remove("dance");

        setTimeout(() => {
            player.classList.add("dance");
        }, 80);

        setTimeout(() => {
            closest.element.remove();
        }, 100);

        updateInterface();

    } else {

        miss();
    }
}

function miss() {

    combo = 0;

    hp -= 8;

    showMessage("MISS!");

    updateInterface();

    if (hp <= 0) {
        gameOver();
    }
}

function showMessage(text) {

    message.textContent = text;

    message.style.color =
        text === "MISS!" ? "#ff3355" : "#fff";

    message.style.transform =
        "translate(-50%, -50%) scale(1.2)";

    setTimeout(() => {
        message.style.transform =
            "translate(-50%, -50%) scale(1)";
    }, 100);

    setTimeout(() => {
        message.textContent = "";
    }, 400);
}

function updateInterface() {

    scoreText.textContent =
        `Score: ${score} | Combo: ${combo}`;

    health.style.width = hp + "%";
}

function gameOver() {

    gameRunning = false;

    music.pause();

    player.classList.remove("dance");
    enemy.classList.remove("dance");

    /*
        Se o jogador perder, mostra o resultado também.
    */

    setTimeout(() => {
        showResults("GAME OVER");
    }, 500);
}

function endGame() {

    if (!gameRunning) return;

    gameRunning = false;

    music.pause();

    player.classList.remove("dance");
    enemy.classList.remove("dance");

    /*
        Atualiza a melhor pontuação.
    */

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "bestScore",
            bestScore
        );
    }

    setTimeout(() => {
        showResults("VOCÊ VENCEU!");
    }, 500);
}

function showResults(title) {

    resultScreen.style.display = "flex";

    const resultTitle =
        resultScreen.querySelector("h1");

    resultTitle.textContent = title;

    finalScore.textContent = score;

    finalCombo.textContent = maxCombo;

    bestScoreText.textContent = bestScore;

    /*
        Pequena animação nos números.
    */

    finalScore.style.transform = "scale(1.2)";
    finalCombo.style.transform = "scale(1.2)";

    setTimeout(() => {
        finalScore.style.transform = "scale(1)";
        finalCombo.style.transform = "scale(1)";
    }, 250);
}

document.addEventListener("keydown", event => {

    if (!gameRunning) return;

    if (keys.includes(event.key)) {

        event.preventDefault();

        hitNote(event.key);
    }
});

document.addEventListener("keyup", event => {

    const lane = keys.indexOf(event.key);

    if (lane !== -1) {
        targets[lane].classList.remove("active");
    }
});

/* Controles para celular */

document.querySelectorAll(".mobileButton").forEach(button => {

    button.addEventListener("touchstart", event => {

        event.preventDefault();

        if (gameRunning) {
            hitNote(button.dataset.key);
        }
    });

    button.addEventListener("mousedown", event => {

        event.preventDefault();

        if (gameRunning) {
            hitNote(button.dataset.key);
        }
    });
});
