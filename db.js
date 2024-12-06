import { openDB } from './libs/idb.js';

// Открытие базы данных
export async function openDatabase() {
    return await openDB('hangman', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('games')) {
                const store = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        }
    });
}

// Сохранение игры
export async function saveGame(gameData) {
    const db = await openDatabase();
    return await db.add('games', gameData);
}

// Получение всех сохранённых игр
export async function getAllGames() {
    const db = await openDatabase();
    return await db.getAll('games');
}

// Возвращает игру по идентификатору
export async function getGameById(id) {
    const db = await openDB('hangman', 1);
    return await db.get('games', id);
}





// Очистка базы данных
export async function clearDatabase() {
    const db = await openDatabase();
    await db.clear('games');
}

// Получение всех игр текущего пользователя
export async function getGamesByUser(user) {
    const db = await openDatabase();
    const allGames = await db.getAll('games');
    return allGames.filter(game => game.user === user);
}

// Обновление существующей игры
export async function updateGame(gameId, updatedData) {
    const db = await openDatabase();
    const game = await db.get('games', gameId);

    if (game) {
        const updatedGame = { ...game, ...updatedData };
        await db.put('games', updatedGame);
    }
}

// Удаление игры по идентификатору
export async function deleteGame(gameId) {
    const db = await openDatabase();
    await db.delete('games', gameId);
}
