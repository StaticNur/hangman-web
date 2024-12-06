import { saveGame as saveToDB, getAllGames, getGameById, updateGame, deleteGame, getGamesByUser } from './db.js';

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

        if (letter.length > 1) {
            if (letter === this.currentWord) {
                this.maskedWord = this.currentWord.split("");
                this.gameOver = true;
                if (this.onGameEnd) this.onGameEnd(true);
                return "win";
            } else {
                this.attemptsLeft--;
                if (this.attemptsLeft === 0) {
                    this.gameOver = true;
                    if (this.onGameEnd) this.onGameEnd(false);
                    return "lose";
                }
                return "wrongWord";
            }
        }

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
async function makeGuess() {
    const guess = guessInput.value.toLowerCase();
    guessInput.value = "";

    if (hangmanGame.guessedLetters.includes(guess)) {
        alert("Invalid or repeated guess.");
        return;
    }

    const result = hangmanGame.guessLetter(guess);
    updateGameUI();

    if (result === "win") {
        alert("You won!");
        await saveGame(true);
    } else if (result === "lose") {
        alert(`Game over! The word was: ${hangmanGame.currentWord}`);
        await saveGame(false);
    }
}

// Сохранить игру в IndexedDB
async function saveGame(won) {
    const gameData = {
        user: currentUser,
        word: hangmanGame.currentWord,
        attemptsLeft: hangmanGame.attemptsLeft,
        guessedLetters: [...hangmanGame.guessedLetters],
        won,
        timestamp: new Date().toISOString()
    };

    await saveToDB(gameData);
    await loadUserGames();
}

// Загрузка всех игр пользователя из IndexedDB
async function loadUserGames() {
    const games = await getGamesByUser(currentUser);
    userProfiles[currentUser] = {
        games,
        wins: games.filter((game) => game.won).length,
        losses: games.filter((game) => !game.won).length
    };
}

// Показать список игр
async function showGamesList() {
    await loadUserGames();

    const gamesListElem = document.getElementById("gamesList");
    gamesListElem.innerHTML = "";

    userProfiles[currentUser].games.forEach((game, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            Game ${index + 1}: Word: ${game.word}, Won: ${game.won ? "Yes" : "No"}
            <button class="replay-btn" data-game-id="${game.id}">🔄 Replay</button>
            <button class="delete-btn" data-game-id="${game.id}">❌ Delete</button>
        `;
        gamesListElem.appendChild(li);
    });

    document.querySelectorAll(".replay-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const gameId = parseInt(e.target.dataset.gameId);
            const game = await getGameById(gameId);
            replayGame(game);
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const gameId = parseInt(e.target.dataset.gameId);
            await deleteGame(gameId);
            await showGamesList();
        });
    });

    showSection(gamesListSection);
}

// Повтор игры
function replayGame(savedGame) {
    hangmanGame.currentWord = savedGame.word;
    hangmanGame.maskedWord = savedGame.word.split("").map((char) =>
        savedGame.guessedLetters.includes(char) ? char : "_"
    );
    hangmanGame.guessedLetters = [...savedGame.guessedLetters];
    hangmanGame.attemptsLeft = savedGame.attemptsLeft;
    hangmanGame.gameOver = false;

    updateGameUI();
    showSection(gameSection);

    hangmanGame.onGameEnd = async (won) => {
        await updateGame(savedGame.id, {
            won,
            attemptsLeft: hangmanGame.attemptsLeft,
            guessedLetters: [...hangmanGame.guessedLetters],
        });
        await showGamesList();
    };
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
async function signIn() {
    const name = nameInput.value.trim();
    if (!name) {
        alert("Please enter a valid name.");
        return;
    }

    currentUser = name;
    profile.textContent = "👤 " + name;

    await loadUserGames();
    startNewGame();
}

// События
guessBtn.addEventListener("click", makeGuess);
newGameBtn.addEventListener("click", startNewGame);
listGamesBtn.addEventListener("click", showGamesList);
signOutBtn.addEventListener("click", () => showSection(nameInputSection));
signInBtn.addEventListener("click", signIn);

// Инициализация
hangmanGame = new HangmanGame();
showSection(nameInputSection);
