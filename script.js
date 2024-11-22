class HangmanGame {
    constructor() {
        this.wordList = ["apple", "banana", "cherry", "orange", "grape", "lemon"];
        this.maxAttempts = 6;
        this.hangmanStates = [
            "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========",
            "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========",
            "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========",
            "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========",
            "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========",
            "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========",
            "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========="
        ];
        this.resetGame();
        this.onGameEnd = null;
    }

    resetGame() {
        this.currentWord = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        this.maskedWord = "_".repeat(this.currentWord.length).split("");
        this.guessedLetters = [];
        this.attemptsLeft = this.maxAttempts;
        this.gameOver = false;
    }

    guessLetter(letter) {
        if (this.gameOver || this.guessedLetters.includes(letter)) return null;

        this.guessedLetters.push(letter);

        if (this.currentWord.includes(letter)) {
            this.currentWord.split("").forEach((char, index) => {
                if (char === letter) this.maskedWord[index] = letter;
            });

            if (!this.maskedWord.includes("_")) {
                this.gameOver = true;
                if (this.onGameEnd) this.onGameEnd(true);
                return "win";
            }
        } else {
            this.attemptsLeft--;
            if (this.attemptsLeft === 0) {
                this.gameOver = true;
                if (this.onGameEnd) this.onGameEnd(false);
                return "lose";
            }
        }
        return "continue";
    }
    getHangmanState() {
        return this.hangmanStates[this.maxAttempts - this.attemptsLeft];
    }
}

// Основные DOM элементы
const maskedWordElem = document.getElementById("maskedWord");
const guessedLettersElem = document.getElementById("guessedLetters");
const attemptsLeftElem = document.getElementById("attemptsLeft");
const hangmanVisualElem = document.getElementById("hangman-visual");
const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const profile = document.getElementById("name");

// Кнопки секций
const newGameBtn = document.getElementById("newGameBtn");
const statisticsBtn = document.getElementById("statisticsBtn");
const listGamesBtn = document.getElementById("listGamesBtn");
const helpBtn = document.getElementById("helpBtn");
const signOutBtn = document.getElementById("signOutBtn");
const signInBtn = document.getElementById("signInBtn");
const nameInput = document.getElementById("nameInput");

// Секции
const nameInputSection = document.getElementById("nameInputSection");
const gameSection = document.getElementById("gameSection");
const statisticsSection = document.getElementById("statisticsSection");
const gamesListSection = document.getElementById("gamesListSection");
const helpSection = document.getElementById("helpSection");

// Статистика
const userProfiles = {};
let currentUser = null;
let hangmanGame = null;

// Обновить UI игры
function updateGameUI() {
    maskedWordElem.textContent = hangmanGame.maskedWord.join(" ");
    guessedLettersElem.textContent = hangmanGame.guessedLetters.join(", ") || "None";
    attemptsLeftElem.textContent = hangmanGame.attemptsLeft;
    hangmanVisualElem.textContent = hangmanGame.getHangmanState();
}

// Начать новую игру
function startNewGame() {
    hangmanGame.resetGame();
    updateGameUI();
    showSection(gameSection);
}

// Сделать ход
function makeGuess() {
    const guess = guessInput.value.toLowerCase();
    guessInput.value = "";

    if (guess.length !== 1 || hangmanGame.guessedLetters.includes(guess)) {
        alert("Invalid or repeated guess.");
        return;
    }

    const result = hangmanGame.guessLetter(guess);
    updateGameUI();

    if (result === "win") {
        alert("You won!");
        userProfiles[currentUser].wins++;
        saveGame(true);
    } else if (result === "lose") {
        alert(`Game over! The word was: ${hangmanGame.currentWord}`);
        userProfiles[currentUser].losses++;
        saveGame(false);
    }
}

// Сохранить игру
function saveGame(won) {
    userProfiles[currentUser].games.push({
        word: hangmanGame.currentWord,
        attemptsLeft: hangmanGame.attemptsLeft,
        guessedLetters: [...hangmanGame.guessedLetters],
        won,
    });
}

// Показать статистику
function showStatistics() {
    const userStats = userProfiles[currentUser];
    document.getElementById("totalGames").textContent = userStats.games.length;
    document.getElementById("totalWins").textContent = userStats.wins;
    document.getElementById("totalLosses").textContent = userStats.losses;
    showSection(statisticsSection);
}

// Показать список игр
function showGamesList() {
    const gamesListElem = document.getElementById("gamesList");
    gamesListElem.innerHTML = "";

    userProfiles[currentUser].games.forEach((game, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            Game ${index + 1}: Word: ${game.word}, Won: ${game.won ? "Yes" : "No"}
            <button class="replay-btn" data-game-index="${index}">🔄 Replay</button>
        `;
        gamesListElem.appendChild(li);
    });

    // Добавляем обработчики на кнопки "Replay"
    const replayButtons = document.querySelectorAll(".replay-btn");
    replayButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const gameIndex = e.target.dataset.gameIndex;
            replayGame(gameIndex);
        });
    });

    showSection(gamesListSection);
}
// Повтор игры
function replayGame(gameIndex) {
    const savedGame = userProfiles[currentUser].games[gameIndex];

    // Восстанавливаем состояние игры
    hangmanGame.currentWord = savedGame.word;
    hangmanGame.maskedWord = "_".repeat(savedGame.word.length).split(""); // savedGame.word.split("").map((char) => 
    //     savedGame.guessedLetters.includes(char) ? char : "_"
    // );
    hangmanGame.guessedLetters = []; // [...savedGame.guessedLetters];
    hangmanGame.attemptsLeft = 6; // hangmanGame.maxAttempts - (savedGame.guessedLetters.length - savedGame.word.split("").filter(char => savedGame.guessedLetters.includes(char)).length);
    hangmanGame.gameOver = false;

    // Обновляем UI
    updateGameUI();
    showSection(gameSection);

    // Устанавливаем обработчик завершения игры для обновления результата
    hangmanGame.onGameEnd = (result) => updateSavedGame(gameIndex, result);
}

// Обновление сохранённой игры
function updateSavedGame(gameIndex, won) {
    const savedGame = userProfiles[currentUser].games[gameIndex];
    savedGame.won = won;
    savedGame.attemptsLeft = hangmanGame.attemptsLeft;
    savedGame.guessedLetters = [...hangmanGame.guessedLetters];
    showGamesList(); // Обновляем список игр
}


// Показать секцию
function showSection(section) {
    nameInputSection.classList.add("hidden");
    gameSection.classList.add("hidden");
    statisticsSection.classList.add("hidden");
    gamesListSection.classList.add("hidden");
    helpSection.classList.add("hidden");
    section.classList.remove("hidden");
}

// Вход пользователя
function signIn() {
    const name = nameInput.value.trim();
    if (!name) {
        alert("Please enter a valid name.");
        return;
    }

    if (!userProfiles[name]) {
        userProfiles[name] = { games: [], wins: 0, losses: 0 };
    }

    currentUser = name;
    profile.textContent = "👤" + name;
    hangmanGame = new HangmanGame();
    startNewGame();
}

// Выход пользователя
function signOut() {
    currentUser = null;
    hangmanGame = null;
    profile.textContent = "👤";
    showSection(nameInputSection);
}

// Слушатели событий
signInBtn.addEventListener("click", signIn);
nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        signIn();
    }
});
signOutBtn.addEventListener("click", signOut);
newGameBtn.addEventListener("click", startNewGame);
statisticsBtn.addEventListener("click", showStatistics);
listGamesBtn.addEventListener("click", showGamesList);
helpBtn.addEventListener("click", () => showSection(helpSection));
guessBtn.addEventListener("click", makeGuess);
guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        makeGuess();
    }
});