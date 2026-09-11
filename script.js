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

const mobileButtons = document.querySelectorAll(".mobileButton");

let score = 0;
let combo = 0;
let maxCombo = 0;
let hp = 100;

let notes = [];
let gameRunning = false;

let lastChartIndex = 0;
let animationFrame = null;

const keys = [
    "ArrowLeft",
    "ArrowDown",
    "ArrowUp",
    "ArrowRight"
];

const symbols = ["←", "↓", "↑", "→"];

const colors = [
    "#ff4c7a",
    "#48a8ff",
    "#5cff87",
    "#d56cff"
];

/*
    Tempo de duração do jogo.

    Coloque 0 para deixar a música decidir
    quando o jogo termina.
*/
const MAX_GAME_TIME = 17;

/*
    Distância vertical onde a nota deve ser acertada.
*/
const HIT_Y = window.innerHeight - 160;

/*
    Velocidade das notas em pixels por segundo.
*/
const NOTE_SPEED = 300;

/*
    Melhor pontuação.
*/
let bestScore = Number(localStorage.getItem("bestScore")) || 0;


/*
========================================
CHART
========================================
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


/*
========================================
INICIAR
========================================
*/

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

function startGame() {

    startScreen.style.display = "none";
    resultScreen.style.display = "none";

    score = 0;
    combo = 0;
    maxCombo = 0;
    hp = 100;

    lastChartIndex = 0;

    /*
        Cancela o loop anterior.
    */
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    /*
        Remove notas antigas.
    */
    notes.forEach(note => {

        if (note.element) {
            note.element.remove();
        }

    });

    notes = [];

    /*
        Reinicia música.
    */
    music.pause();
    music.currentTime = 0;

    const playPromise = music.play();

    if (playPromise !== undefined) {

        playPromise.catch(error => {
            console.log("Não foi possível iniciar a música:", error);
        });

    }

    gameRunning = true;

    player.classList.add("dance");
    enemy.classList.add("dance");

    updateInterface();

    /*
        Guarda o tempo do último frame.
    */
    lastFrameTime = performance.now();

    animationFrame = requestAnimationFrame(gameLoop);
}


/*
========================================
TEMPO DOS FRAMES
========================================
*/

let lastFrameTime = performance.now();


/*
========================================
CRIAR NOTA
========================================
*/

function createNote(lane) {

    const note = document.createElement("div");

    note.className = "note";
    note.textContent = symbols[lane];

    note.style.left = `${lane * 25}%`;

    /*
        Começa acima da tela.
    */
    note.style.top = "-80px";

    note.style.color = colors[lane];

    noteArea.appendChild(note);

    const obj = {
        element: note,
        lane: lane,
        y: -80,
        hit: false
    };

    notes.push(obj);
}


/*
========================================
GAME LOOP
========================================
*/

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    /*
        Calcula exatamente quanto tempo passou.
        Isso evita que a velocidade dependa do FPS.
    */
    const deltaTime = Math.min(
        (timestamp - lastFrameTime) / 1000,
        0.05
    );

    lastFrameTime = timestamp;

    const currentTime = music.currentTime;


    /*
    ----------------------------------------
    CRIAÇÃO DAS NOTAS
    ----------------------------------------
    */

    /*
        A nota precisa nascer antes do momento
        em que deve ser acertada.

        Aqui usamos aproximadamente 1.2 segundos
        de antecipação.
    */

    while (
        lastChartIndex < chart.length &&
        chart[lastChartIndex][0] <= currentTime + 1.2
    ) {

        const [time, lane] = chart[lastChartIndex];

        createNote(lane);

        lastChartIndex++;
    }


    /*
    ----------------------------------------
    MOVIMENTO DAS NOTAS
    ----------------------------------------
    */

    for (let i = notes.length - 1; i >= 0; i--) {

        const note = notes[i];

        if (note.hit) {
            continue;
        }

        /*
            Movimento baseado em tempo,
            não em quantidade de frames.
        */
        note.y += NOTE_SPEED * deltaTime;

        note.element.style.top = `${note.y}px`;


        /*
        ------------------------------------
        NOTA PERDIDA
        ------------------------------------
        */

        if (note.y > window.innerHeight + 50) {

            miss();

            note.element.remove();

            notes.splice(i, 1);
        }
    }


    /*
    ----------------------------------------
    FIM DO JOGO
    ----------------------------------------
    */

    /*
        Se MAX_GAME_TIME for maior que zero,
        usa esse limite.
    */
    if (
        MAX_GAME_TIME > 0 &&
        currentTime >= MAX_GAME_TIME
    ) {

        endGame();
        return;
    }


    /*
        Caso a música tenha terminado.
    */
    if (music.ended) {

        /*
            Espera as últimas notas terminarem.
        */
        if (notes.length === 0) {
            endGame();
            return;
        }
    }


    animationFrame = requestAnimationFrame(gameLoop);
}


/*
========================================
ACERTAR NOTA
========================================
*/

function hitNote(key) {

    if (!gameRunning) {
        return;
    }

    const lane = keys.indexOf(key);

    if (lane === -1) {
        return;
    }


    /*
        Anima o alvo.
    */
    targets[lane].classList.add("active");

    setTimeout(() => {
        targets[lane].classList.remove("active");
    }, 100);


    /*
        Procura a nota mais próxima.
    */
    let closest = null;
    let closestDistance = Infinity;


    notes.forEach(note => {

        if (note.hit) {
            return;
        }

        if (note.lane !== lane) {
            return;
        }


        const distance = Math.abs(
            note.y - HIT_Y
        );


        if (distance < closestDistance) {

            closestDistance = distance;
            closest = note;
        }

    });


    /*
        Janela de acerto.
    */
    if (closest && closestDistance < 100) {

        closest.hit = true;

        closest.element.classList.add("hit");

        combo++;

        if (combo > maxCombo) {
            maxCombo = combo;
        }


        /*
            Pontuação.
        */
        const points = 100 + combo * 10;

        score += points;


        /*
            Recupera um pouco de HP.
        */
        hp = Math.min(
            100,
            hp + 2
        );


        /*
            Mensagem.
        */
        showMessage(
            combo >= 10
                ? "PERFEITO!"
                : "ACERTOU!"
        );


        /*
            Animação do jogador.
        */
        player.classList.remove("dance");

        setTimeout(() => {

            if (gameRunning) {
                player.classList.add("dance");
            }

        }, 80);


        /*
            Remove a nota.
        */
        setTimeout(() => {

            if (closest.element) {
                closest.element.remove();
            }

            const index = notes.indexOf(closest);

            if (index !== -1) {
                notes.splice(index, 1);
            }

        }, 100);


        updateInterface();

    } else {

        /*
            Apertou a direção errada
            ou fora do tempo.
        */
        miss();
    }
}


/*
========================================
MISS
========================================
*/

function miss() {

    if (!gameRunning) {
        return;
    }

    combo = 0;

    hp -= 8;

    hp = Math.max(0, hp);

    showMessage("MISS!");

    updateInterface();


    if (hp <= 0) {
        gameOver();
    }
}


/*
========================================
MENSAGEM
========================================
*/

function showMessage(text) {

    message.textContent = text;

    message.style.color =
        text === "MISS!"
            ? "#ff3355"
            : "#fff";


    message.style.transform =
        "translate(-50%, -50%) scale(1.2)";


    setTimeout(() => {

        message.style.transform =
            "translate(-50%, -50%) scale(1)";

    }, 100);


    setTimeout(() => {

        if (message.textContent === text) {
            message.textContent = "";
        }

    }, 400);
}


/*
========================================
INTERFACE
========================================
*/

function updateInterface() {

    scoreText.textContent =
        `Score: ${score} | Combo: ${combo}`;

    health.style.width = `${hp}%`;
}


/*
========================================
GAME OVER
========================================
*/

function gameOver() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    music.pause();

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    player.classList.remove("dance");
    enemy.classList.remove("dance");


    /*
        Salva recorde mesmo no game over.
    */
    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "bestScore",
            bestScore
        );
    }


    setTimeout(() => {

        showResults("GAME OVER");

    }, 500);
}


/*
========================================
FIM NORMAL
========================================
*/

function endGame() {

    if (!gameRunning) {
        return;
    }

    gameRunning = false;

    music.pause();

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    player.classList.remove("dance");
    enemy.classList.remove("dance");


    /*
        Atualiza recorde.
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


/*
========================================
RESULTADO
========================================
*/

function showResults(title) {

    resultScreen.style.display = "flex";


    const resultTitle =
        resultScreen.querySelector("h1");


    resultTitle.textContent = title;

    finalScore.textContent = score;

    finalCombo.textContent = maxCombo;

    bestScoreText.textContent = bestScore;


    /*
        Animação.
    */
    finalScore.style.transform = "scale(1.2)";
    finalCombo.style.transform = "scale(1.2)";


    setTimeout(() => {

        finalScore.style.transform = "scale(1)";
        finalCombo.style.transform = "scale(1)";

    }, 250);
}


/*
========================================
TECLADO
========================================
*/

document.addEventListener("keydown", event => {

    if (!gameRunning) {
        return;
    }

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


/*
========================================
TOUCH / CELULAR
========================================
*/

mobileButtons.forEach(button => {

    const key = button.dataset.key;


    function pressButton(event) {

        event.preventDefault();

        if (!gameRunning) {
            return;
        }

        button.classList.add("active");

        hitNote(key);
    }


    function releaseButton(event) {

        event.preventDefault();

        button.classList.remove("active");

        const lane = keys.indexOf(key);

        if (lane !== -1) {
            targets[lane].classList.remove("active");
        }
    }


    /*
        Touch.
    */
    button.addEventListener(
        "touchstart",
        pressButton,
        { passive: false }
    );

    button.addEventListener(
        "touchend",
        releaseButton,
        { passive: false }
    );

    button.addEventListener(
        "touchcancel",
        releaseButton,
        { passive: false }
    );


    /*
        Mouse.
    */
    button.addEventListener(
        "mousedown",
        pressButton
    );

    button.addEventListener(
        "mouseup",
        releaseButton
    );

    button.addEventListener(
        "mouseleave",
        releaseButton
    );

});


/*
========================================
CLIQUE NOS ALVOS
========================================
*/

targets.forEach((target, index) => {

    target.addEventListener("click", () => {

        if (!gameRunning) {
            return;
        }

        const key = keys[index];

        target.classList.add("active");

        setTimeout(() => {
            target.classList.remove("active");
        }, 100);

        hitNote(key);
    });

});
