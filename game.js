// ゲーム状慁E
let gameState = {
    currentNumbers: [],
    level: 1,
    solutions: [],
    lastButtonType: null, // 最後に押したボタンの種類を記録
    solutionShown: false, // 現在の問題で解答例を表示したかどぁE��
    feedbackTimer: null, // フィードバチE��表示のタイマ�EID
    inactivityTimer: null,
    isSleeping: false,
    mascotPokeCount: 0,
    pokeResetTimer: null,
    // タイマ�E関連
    startTime: null, // ゲーム開始時刻
    timerInterval: null, // タイマ�E更新用のインターバルID
    timerPaused: true, // タイマ�Eが一時停止中かどぁE��
    // レベルごとの統計情報
    levelStats: {
        1: { totalAttempts: 0, correctAnswers: 0, streak: 0, currentProblemIndex: 0, shownSolutions: new Set(), answerHistory: {} },
        2: { totalAttempts: 0, correctAnswers: 0, streak: 0, currentProblemIndex: 0, shownSolutions: new Set(), answerHistory: {} },
        3: { totalAttempts: 0, correctAnswers: 0, streak: 0, currentProblemIndex: 0, shownSolutions: new Set(), answerHistory: {} }
    }
};

// レベル別の数字生成設宁E
const levelConfig = {
    1: { min: 1, max: 9, operators: ['+', '-', '*', '/', '(', ')'], requiresParentheses: false },
    2: { min: 1, max: 12, operators: ['+', '-', '*', '/', '(', ')'], requiresParentheses: true },
    3: { min: 1, max: 13, operators: ['+', '-', '*', '/', '(', ')'], requiresParentheses: true }
};

// 半角数字を全角数字に変換
function toFullWidth(num) {
    return String(num).replace(/[0-9]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
}

// レベル別の問題リスチE
const levelProblems = {
    1: [], // レベル1の問題（後で設定！E
    2: [], // レベル2の問題（後で設定！E
    3: []  // レベル3の問題（後で設定！E
};

// 既知の解答パターン
const knownSolutions = [
    // レベル1用�E�括弧なしで解ける問題！E すべて手計算で検証済み
    { numbers: [1, 2, 3, 4], solution: '1 * 2 * 3 * 4' },
    { numbers: [1, 5, 5, 6], solution: '6 * 5 - 5 - 1' },
    { numbers: [1, 7, 8, 8], solution: '1 + 7 + 8 + 8' },
    { numbers: [2, 2, 2, 3], solution: '2 * 2 * 2 * 3' },
    { numbers: [2, 2, 4, 8], solution: '2 * 2 * 4 + 8' },
    { numbers: [2, 2, 6, 6], solution: '2 * 6 + 2 * 6' },
    { numbers: [2, 6, 8, 8], solution: '2 + 6 + 8 + 8' },
    { numbers: [3, 3, 3, 3], solution: '3 * 3 * 3 - 3' },
    { numbers: [3, 3, 4, 4], solution: '3 * 4 + 3 * 4' },
    { numbers: [3, 5, 8, 8], solution: '3 + 5 + 8 + 8' },
    { numbers: [3, 6, 7, 8], solution: '3 + 6 + 7 + 8' },
    { numbers: [4, 4, 4, 4], solution: '4 + 4 + 4 * 4' },
    { numbers: [4, 4, 8, 8], solution: '4 + 4 + 8 + 8' },
    { numbers: [4, 5, 7, 8], solution: '4 + 5 + 7 + 8' },
    { numbers: [5, 5, 5, 5], solution: '5 * 5 - 5 / 5' },
    { numbers: [5, 5, 7, 7], solution: '5 * 5 - 7 / 7' },
    { numbers: [5, 6, 6, 7], solution: '5 + 6 + 6 + 7' },
    { numbers: [6, 6, 6, 6], solution: '6 + 6 + 6 + 6' },
    // レベル2用�E�×と括弧を使ぁE��題！E 手計算で検証済み
    { numbers: [1, 2, 3, 4], solution: '(1 + 2 + 3) * 4' },      // 6*4 = 24
    { numbers: [1, 2, 6, 6], solution: '(1 + 2) * 6 + 6' },      // 3*6+6 = 24
    { numbers: [2, 2, 6, 8], solution: '(8 - 2) * (6 - 2)' },    // 6*4 = 24
    { numbers: [2, 3, 4, 5], solution: '4 * (5 + 3 - 2)' },      // 4*6 = 24
    { numbers: [2, 4, 5, 6], solution: '(2 + 4) * 5 - 6' },      // 6*5-6 = 24
    { numbers: [3, 4, 5, 6], solution: '6 * (5 - 4 + 3)' },      // 6*4 = 24
    // レベル3用�E�括弧と÷を使ぁE��題！E
    { numbers: [1, 3, 4, 6], solution: '6 / (1 - 3/4)' },
    { numbers: [8, 8, 3, 3], solution: '8 / (3 - 8/3)' },
    { numbers: [1, 5, 5, 5], solution: '5 * (5 - 1/5)' },
    { numbers: [1, 3, 6, 8], solution: '8 * 6 / (3 - 1)' },
    { numbers: [2, 3, 4, 8], solution: '(2 + 4) * 8 / 2' },
    { numbers: [2, 3, 6, 9], solution: '(2 + 6) * 9 / 3' }
];

// 問題リストを初期匁E
function initializeProblemLists() {
    knownSolutions.forEach(problem => {
        const hasParentheses = problem.solution.includes('(') || problem.solution.includes(')');
        const hasDivision = problem.solution.includes('/');
        const hasMultiplication = problem.solution.includes('*');

        // レベル1: 括弧なし�E問顁E
        if (!hasParentheses) {
            levelProblems[1].push(problem);
        }
        // レベル3: 括弧と÷を両方含む問題（レベル2より優先！E
        else if (hasParentheses && hasDivision) {
            levelProblems[3].push(problem);
        }
        // レベル2: ×と括弧を含む問題（÷を含まなぁE��E
        else if (hasMultiplication && hasParentheses) {
            levelProblems[2].push(problem);
        }
    });

    // 吁E��ベルの問題を数字�E昁E��E��ソーチE
    for (let level = 1; level <= 3; level++) {
        levelProblems[level].sort((a, b) => {
            const sortedA = [...a.numbers].sort((x, y) => x - y);
            const sortedB = [...b.numbers].sort((x, y) => x - y);

            // 数字を1つずつ比輁E
            for (let i = 0; i < 4; i++) {
                if (sortedA[i] !== sortedB[i]) {
                    return sortedA[i] - sortedB[i];
                }
            }
            return 0;
        });
    }
}

// 解答不可能な絁E��合わぁE
const impossibleCombinations = [
    // 1ぁEつ以上含まれる絁E��合わぁE
    [1, 1, 1, 1],
    [1, 1, 1, 2],
    [1, 1, 1, 3],
    [1, 1, 1, 4],
    [1, 1, 1, 5],
    [1, 1, 1, 6],
    [1, 1, 1, 7],
    [1, 1, 1, 8],
    [1, 1, 1, 9],
    [1, 1, 1, 10],
    [1, 1, 1, 11],
    [1, 1, 1, 12],
    [1, 1, 1, 13],
    [1, 1, 2, 2],
    [1, 1, 2, 3],
    [1, 1, 2, 4],
    [1, 1, 2, 5],
    [1, 1, 2, 6],
    [1, 1, 2, 7],
    [1, 1, 2, 8],
    [1, 1, 2, 9],
    [1, 1, 2, 10],
    [1, 1, 2, 11],
    [1, 1, 2, 12],
    [1, 1, 2, 13],
    [1, 1, 3, 3],
    [1, 1, 3, 4],
    [1, 1, 3, 5],
    [1, 1, 3, 6],
    [1, 1, 3, 7],
    [1, 1, 3, 8],
    [1, 1, 3, 9],
    [1, 1, 3, 10],
    [1, 1, 3, 11],
    [1, 1, 3, 12],
    [1, 1, 3, 13],
    [1, 1, 4, 4],
    [1, 1, 4, 5],
    [1, 1, 4, 6],
    [1, 1, 4, 7],
    [1, 1, 4, 8],
    [1, 1, 4, 9],
    [1, 1, 4, 10],
    [1, 1, 4, 11],
    [1, 1, 4, 12],
    [1, 1, 4, 13],
    [1, 1, 5, 5],
    [1, 1, 5, 6],
    [1, 1, 5, 7],
    [1, 1, 5, 8],
    [1, 1, 5, 9],
    [1, 1, 5, 10],
    [1, 1, 5, 11],
    [1, 1, 5, 12],
    [1, 1, 5, 13],
    [1, 1, 6, 6],
    [1, 1, 6, 7],
    [1, 1, 6, 8],
    [1, 1, 6, 9],
    [1, 1, 6, 10],
    [1, 1, 6, 11],
    [1, 1, 6, 12],
    [1, 1, 6, 13],
    [1, 1, 7, 7],
    [1, 1, 7, 8],
    [1, 1, 7, 9],
    [1, 1, 7, 10],
    [1, 1, 7, 11],
    [1, 1, 7, 12],
    [1, 1, 7, 13],
    [1, 1, 8, 8],
    [1, 1, 8, 9],
    [1, 1, 8, 10],
    [1, 1, 8, 11],
    [1, 1, 8, 12],
    [1, 1, 8, 13],
    [1, 1, 9, 9],
    [1, 1, 9, 10],
    [1, 1, 9, 11],
    [1, 1, 9, 12],
    [1, 1, 9, 13],
    [1, 1, 10, 10],
    [1, 1, 10, 11],
    [1, 1, 10, 12],
    [1, 1, 10, 13],
    [1, 1, 11, 11],
    [1, 1, 11, 12],
    [1, 1, 11, 13],
    [1, 1, 12, 12],
    [1, 1, 12, 13],
    [1, 1, 13, 13],

    // 1ぁEつ含まれる主要な不可能パターン
    [1, 2, 2, 2],
    [1, 2, 2, 3],
    [1, 2, 3, 3],
    [1, 2, 4, 4],
    [1, 2, 5, 5],
    [1, 2, 7, 7],
    [1, 2, 8, 8],
    [1, 2, 9, 9],
    [1, 3, 3, 3],
    [1, 3, 5, 5],
    [1, 3, 7, 7],
    [1, 3, 8, 8],
    [1, 3, 9, 9],
    [1, 4, 4, 4],
    [1, 4, 5, 5],
    [1, 4, 7, 7],
    [1, 4, 8, 8],
    [1, 4, 9, 9],
    [1, 5, 5, 5],
    [1, 5, 5, 6],
    [1, 5, 5, 8],
    [1, 5, 7, 7],
    [1, 5, 8, 8],
    [1, 5, 9, 9],
    [1, 6, 6, 6],
    [1, 6, 6, 7],
    [1, 6, 7, 7],
    [1, 6, 7, 8],
    [1, 6, 8, 8],
    [1, 6, 9, 9],
    [1, 7, 7, 7],
    [1, 7, 7, 8],
    [1, 7, 8, 8],
    [1, 7, 9, 9],
    [1, 8, 8, 8],
    [1, 8, 9, 9],
    [1, 9, 9, 9],

    // 2が含まれる主要な不可能パターン
    [2, 2, 2, 2],
    [2, 2, 2, 3],
    [2, 2, 2, 4],
    [2, 2, 2, 5],
    [2, 2, 2, 6],
    [2, 2, 2, 7],
    [2, 2, 2, 8],
    [2, 2, 2, 9],
    [2, 2, 3, 3],
    [2, 2, 5, 5],
    [2, 2, 7, 7],
    [2, 2, 7, 9],
    [2, 2, 8, 8],
    [2, 2, 9, 9],
    [2, 3, 3, 3],
    [2, 3, 3, 4],
    [2, 3, 5, 5],
    [2, 3, 7, 7],
    [2, 3, 7, 9],
    [2, 3, 8, 8],
    [2, 3, 9, 9],
    [2, 4, 4, 4],
    [2, 4, 7, 7],
    [2, 4, 8, 8],
    [2, 4, 9, 9],
    [2, 5, 5, 5],
    [2, 5, 5, 6],
    [2, 5, 7, 7],
    [2, 5, 8, 8],
    [2, 5, 9, 9],
    [2, 6, 6, 6],
    [2, 6, 7, 7],
    [2, 6, 8, 8],
    [2, 6, 9, 9],
    [2, 7, 7, 7],
    [2, 7, 7, 9],
    [2, 7, 8, 8],
    [2, 7, 9, 9],
    [2, 8, 8, 8],
    [2, 8, 9, 9],
    [2, 9, 9, 9],

    // 3が含まれる主要な不可能パターン
    [3, 3, 3, 3],
    [3, 3, 3, 4],
    [3, 3, 3, 5],
    [3, 3, 3, 6],
    [3, 3, 3, 7],
    [3, 3, 3, 8],
    [3, 3, 3, 9],
    [3, 3, 5, 5],
    [3, 3, 5, 8],
    [3, 3, 7, 7],
    [3, 3, 8, 8],
    [3, 3, 9, 9],
    [3, 4, 4, 4],
    [3, 4, 6, 7],
    [3, 4, 7, 7],
    [3, 4, 8, 8],
    [3, 4, 9, 9],
    [3, 5, 5, 5],
    [3, 5, 7, 7],
    [3, 5, 8, 8],
    [3, 5, 9, 9],
    [3, 6, 6, 6],
    [3, 6, 7, 7],
    [3, 6, 8, 8],
    [3, 6, 9, 9],
    [3, 7, 7, 7],
    [3, 7, 8, 8],
    [3, 7, 9, 9],
    [3, 8, 8, 8],
    [3, 8, 9, 9],
    [3, 9, 9, 9],

    // 4以上�E主要な不可能パターン
    [4, 4, 4, 4],
    [4, 4, 5, 5],
    [4, 4, 5, 9],
    [4, 4, 6, 6],
    [4, 4, 6, 7],
    [4, 4, 7, 7],
    [4, 4, 8, 8],
    [4, 4, 9, 9],
    [4, 5, 5, 5],
    [4, 5, 7, 7],
    [4, 5, 8, 8],
    [4, 5, 9, 9],
    [4, 6, 6, 6],
    [4, 6, 7, 7],
    [4, 6, 8, 8],
    [4, 6, 9, 9],
    [4, 7, 7, 7],
    [4, 7, 7, 9],
    [4, 7, 8, 8],
    [4, 7, 9, 9],
    [4, 8, 8, 8],
    [4, 8, 9, 9],
    [4, 9, 9, 9],
    [5, 5, 5, 5],
    [5, 5, 5, 6],
    [5, 5, 5, 7],
    [5, 5, 5, 8],
    [5, 5, 5, 9],
    [5, 5, 6, 6],
    [5, 5, 6, 7],
    [5, 5, 6, 9],
    [5, 5, 7, 7],
    [5, 5, 7, 9],
    [5, 5, 8, 8],
    [5, 5, 9, 9],
    [5, 6, 6, 6],
    [5, 6, 7, 7],
    [5, 6, 8, 8],
    [5, 6, 9, 9],
    [5, 7, 7, 7],
    [5, 7, 8, 8],
    [5, 7, 9, 9],
    [5, 8, 8, 8],
    [5, 8, 9, 9],
    [5, 9, 9, 9],
    [6, 6, 6, 6],
    [6, 6, 6, 7],
    [6, 6, 6, 8],
    [6, 6, 6, 9],
    [6, 6, 7, 7],
    [6, 6, 7, 8],
    [6, 6, 8, 8],
    [6, 6, 9, 9],
    [6, 7, 7, 7],
    [6, 7, 7, 8],
    [6, 7, 7, 9],
    [6, 7, 8, 8],
    [6, 7, 9, 9],
    [6, 8, 8, 8],
    [6, 8, 9, 9],
    [6, 9, 9, 9],
    [7, 7, 7, 7],
    [7, 7, 7, 8],
    [7, 7, 7, 9],
    [7, 7, 8, 8],
    [7, 7, 8, 9],
    [7, 7, 9, 9],
    [7, 8, 8, 8],
    [7, 8, 8, 9],
    [7, 8, 9, 9],
    [7, 9, 9, 9],
    [8, 8, 8, 8],
    [8, 8, 8, 9],
    [8, 8, 9, 9],
    [8, 9, 9, 9],
    [9, 9, 9, 9]
];

// DOM要素
const numbersContainer = document.getElementById('numbersContainer');
const answerInput = document.getElementById('answer');
const submitBtn = document.getElementById('submitBtn');
const feedbackDiv = document.getElementById('feedback');
const resetBtn = document.getElementById('resetBtn');
const prevBtn = document.getElementById('prevBtn');
const solutionBtn = document.getElementById('solutionBtn');
const newGameBtn = document.getElementById('newGameBtn');
const gradeBtn = document.getElementById('gradeBtn');
const bestTimeBtn = document.getElementById('bestTimeBtn');
const accuracySpan = document.getElementById('accuracy');
const bestTimeSpan = document.getElementById('bestTime');
const levelSelect = document.getElementById('levelSelect');
const mascotContainer = document.getElementById('mascotContainer');
const mascotCharacter = document.getElementById('mascotCharacter');
const speechBubble = document.getElementById('speechBubble');
const mascotMessage = document.getElementById('mascotMessage');

// チE��チE��用�E��EスコチE��要素の確誁E
console.log('Mascot elements:', { mascotContainer, mascotCharacter, speechBubble, mascotMessage });

// 初期匁E
function init() {
    initializeProblemLists(); // 問題リストを初期匁E
    resetTimer(); // タイマ�Eを�E期化�E�一時停止状態！E
    loadBestTimes(); // ベストタイムを読み込み
    generateNewNumbers();
    attachEventListeners();
    updatePlaceholder(); // 初期プレースホルダーを設宁E
    resetInactivityTimer(); // 屁E��りタイマ�E開姁E

    // レベルカード�E体をクリチE��可能にする
    const levelCard = document.querySelector('.level-card');
    const dropdownArrow = document.querySelector('.dropdown-arrow');

    if (levelCard && dropdownArrow) {
        // レベルカードをクリチE��したらセレクト�EチE��スを開ぁE
        levelCard.addEventListener('click', (e) => {
            // セレクト�EチE��ス自体�EクリチE��でなぁE��合�Eみ処琁E
            if (e.target !== levelSelect) {
                levelSelect.focus();
                // ブラウザによってはshowPicker()が使える
                if (levelSelect.showPicker) {
                    levelSelect.showPicker();
                } else {
                    // フォールバック�E�クリチE��イベントを発火
                    const clickEvent = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    levelSelect.dispatchEvent(clickEvent);
                }
            }
        });
    }
}

// マスコチE��の更新
function updateMascot(message, mood = '', duration = 3000) {
    if (!mascotMessage || !mascotCharacter || !speechBubble) return;

    mascotCharacter.textContent = '🦁E; // 🦉�E固宁E
    mascotMessage.textContent = message;

    // 既存�E表惁E��ラスを削除
    mascotCharacter.classList.remove('mascot-joy', 'mascot-worried', 'mascot-thinking', 'mascot-sleep');

    speechBubble.classList.add('show');

    // 新しい表惁E��ラスを追加
    if (mood) {
        mascotCharacter.classList.add(mood);
    }

    // 一定時間後に吹き�Eしを消し、アニメーションも停止
    if (duration > 0) {
        if (gameState.mascotTimer) clearTimeout(gameState.mascotTimer);
        gameState.mascotTimer = setTimeout(() => {
            if (!gameState.isSleeping) {
                speechBubble.classList.remove('show');
                mascotCharacter.classList.remove('mascot-joy', 'mascot-worried', 'mascot-thinking', 'mascot-sleep');
            }
        }, duration);
    } else if (duration === 0) {
        // durationぁEの場合�E永続表示なのでタイマ�Eをクリア
        if (gameState.mascotTimer) clearTimeout(gameState.mascotTimer);
        // 強制皁E��表示状態を維持E
        speechBubble.classList.add('show');
    }
}

// 屁E��りタイマ�EのリセチE��
function resetInactivityTimer() {
    if (gameState.inactivityTimer) {
        clearTimeout(gameState.inactivityTimer);
    }

    // 寝てぁE��場合�E起きる
    if (gameState.isSleeping) {
        gameState.isSleeping = false;
        const wakeMessages = ['ハッ�E�寝てへんで�E�E, 'なんや、もぁE��回やるか�E�E, 'シャキチE��したわ！E, 'ちめE��と見てるからな�E�E];
        updateMascot(wakeMessages[Math.floor(Math.random() * wakeMessages.length)], 'mascot-thinking');
    }

    // 30秒操作がなぁE��寝る
    gameState.inactivityTimer = setTimeout(startMascotSleep, 30000);
}

// マスコチE��をつつく反忁E
function handleMascotPoke(e) {
    if (e) {
        if (e.type === 'touchstart') e.preventDefault(); // touchstartの場合�E伝播防止
        e.stopPropagation();
    }

    // 屁E��りタイマ�EをリセチE���E�つつく�Eは操作とみなす！E
    resetInactivityTimer();

    // 屁E��り中につつかれた場吁E
    if (gameState.isSleeping) {
        gameState.isSleeping = false;
        const wakeUpMessages = [
            'ハッ�E��EっくりしためE��か！E,
            'なんや、今�E「アレ」か�E�E��E,
            'ぁE��ぁっ�E��Eチ�Eチ起きるめE..',
            '夢でタイガースが勝ってた�Eに...'
        ];
        updateMascot(wakeUpMessages[Math.floor(Math.random() * wakeUpMessages.length)], 'mascot-worried');
        gameState.mascotPokeCount = 0; // カウンターリセチE��
        return;
    }

    // 連続タチE�Eの処琁E
    gameState.mascotPokeCount++;
    if (gameState.pokeResetTimer) clearTimeout(gameState.pokeResetTimer);

    // 5秒間タチE�EがなぁE��機嫌が直めE
    gameState.pokeResetTimer = setTimeout(() => {
        gameState.mascotPokeCount = 0;
    }, 5000);

    // 10の倍数以外�E首を傾げるだけ（無言�E�E
    if (gameState.mascotPokeCount % 10 !== 0) {
        if (mascotCharacter) {
            mascotCharacter.classList.remove('mascot-joy', 'mascot-worried', 'mascot-thinking', 'mascot-sleep');
            mascotCharacter.classList.add('mascot-thinking');
        }
        return;
    }

    let message = '';
    let style = 'mascot-thinking';

    if (gameState.mascotPokeCount === 10) {
        const msgs = ['なんや？', 'くすぐったいわ！', 'つつきすぎやで！', 'びっくりするやんか'];
        message = msgs[Math.floor(Math.random() * msgs.length)];
    } else if (gameState.mascotPokeCount === 20) {
        const msgs = ['しつこいなあ！', 'わかった、わかったって！', 'ええ加減にせえ！', '堪忍袋の緒が切れるわ！'];
        message = msgs[Math.floor(Math.random() * msgs.length)];
        style = 'mascot-joy';
    } else if (gameState.mascotPokeCount === 30) {
        const msgs = ['もう、怒るで！ホンマに！', 'ボチボチ堪忍してや！', '梟にも三分の理やで！', 'しつこすぎてアレやわ！'];
        message = msgs[Math.floor(Math.random() * msgs.length)];
        style = 'mascot-worried';
    } else if (gameState.mascotPokeCount === 40) {
        const msgs = ['まだやるんか！？', '執念深すぎやろ！', '指、疲れへんの？', 'もうええ加減に切り上げや！'];
        message = msgs[Math.floor(Math.random() * msgs.length)];
        style = 'mascot-worried';
    } else if (gameState.mascotPokeCount === 50) {
        const msgs = ['・・・・・・・', 'もう何も言わへんで。', '（スルー決定）', '……。'];
        message = msgs[Math.floor(Math.random() * msgs.length)];
        style = 'mascot-thinking';
    } else if (gameState.mascotPokeCount > 60) {
        startMascotWandering();
        return;
    } else {
        const msgs = ['堪忍して！', 'もう、ええって！', '勘弁してえな！', 'しつこすぎるわ！'];
        message = msgs[Math.floor(Math.random() * msgs.length)];
        style = 'mascot-worried';
    }

    updateMascot(message, style);
}

// 屁E��り開姁E
function startMascotSleep() {
    gameState.isSleeping = true;
    const sleepTalk = ['💤... スースー...', '阪神タイガース優勝や�E�E, 'アレが決まったわ... 💤', 'たこ焼き、もぁE��べられへめE..', 'ムニャムニャ...'];
    updateMascot(sleepTalk[Math.floor(Math.random() * sleepTalk.length)], 'mascot-sleep', 0); // 0は永綁E
}

// タイマ�E機�E
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerPaused = false;
    updateTimerDisplay();

    // 1秒ごとにタイマ�Eを更新
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    if (!gameState.startTime || gameState.timerPaused) {
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = '00:00';
        }
        return;
    }

    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

function resetTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.startTime = null;
    gameState.timerPaused = true;
    updateTimerDisplay();
}

function resumeTimer() {
    if (gameState.timerPaused) {
        startTimer();
    }
}

// ベストタイム管琁E
function loadBestTimes() {
    const saved = localStorage.getItem('make24BestTimes');
    if (saved) {
        try {
            const bestTimes = JSON.parse(saved);
            // 吁E��ベルのベストタイムを読み込み
            for (let level = 1; level <= 3; level++) {
                const record = bestTimes[level];
                if (record) {
                    // 旧形式（数値のみ�E�と新形式（オブジェクト）�E両方に対忁E
                    if (typeof record === 'number') {
                        gameState.levelStats[level].bestTime = record;
                    } else if (record.time) {
                        gameState.levelStats[level].bestTime = record.time;
                    }
                }
            }
        } catch (e) {
            console.error('ベストタイムの読み込みに失敗しました', e);
        }
    }
    updateBestTimeDisplay();
}

function saveBestTime(level, timeInSeconds) {
    const saved = localStorage.getItem('make24BestTimes');
    let bestTimes = {};

    if (saved) {
        try {
            bestTimes = JSON.parse(saved);
        } catch (e) {
            console.error('ベストタイムの読み込みに失敗しました', e);
        }
    }

    bestTimes[level] = {
        time: timeInSeconds,
        date: new Date().toISOString()
    };
    localStorage.setItem('make24BestTimes', JSON.stringify(bestTimes));
    gameState.levelStats[level].bestTime = timeInSeconds;
    updateBestTimeDisplay();
}

// 新しい記録保存関数�E�正解数とタイムを保存！E
function saveBestRecord(level, correctAnswers, totalProblems, timeInSeconds) {
    const saved = localStorage.getItem('make24BestRecords');
    let bestRecords = {};

    if (saved) {
        try {
            bestRecords = JSON.parse(saved);
        } catch (e) {
            console.error('ベストレコード�E読み込みに失敗しました', e);
        }
    }

    bestRecords[level] = {
        correctAnswers: correctAnswers,
        totalProblems: totalProblems,
        time: timeInSeconds,
        date: new Date().toISOString()
    };
    localStorage.setItem('make24BestRecords', JSON.stringify(bestRecords));
    updateBestTimeDisplay();
}

function getBestRecord(level) {
    const saved = localStorage.getItem('make24BestRecords');
    if (saved) {
        try {
            const bestRecords = JSON.parse(saved);
            return bestRecords[level] || null;
        } catch (e) {
            console.error('ベストレコード�E読み込みに失敗しました', e);
        }
    }
    return null;
}

function getBestTime(level) {
    const saved = localStorage.getItem('make24BestTimes');
    if (saved) {
        try {
            const bestTimes = JSON.parse(saved);
            const record = bestTimes[level];
            // 旧形式（数値のみ�E�と新形式（オブジェクト）�E両方に対忁E
            if (typeof record === 'number') {
                return record;
            } else if (record && record.time) {
                return record.time;
            }
        } catch (e) {
            console.error('ベストタイムの読み込みに失敗しました', e);
        }
    }
    return null;
}

function getBestTimeDate(level) {
    const saved = localStorage.getItem('make24BestTimes');
    if (saved) {
        try {
            const bestTimes = JSON.parse(saved);
            const record = bestTimes[level];
            if (record && record.date) {
                return record.date;
            }
        } catch (e) {
            console.error('ベストタイムの読み込みに失敗しました', e);
        }
    }
    return null;
}

function updateBestTimeDisplay() {
    const record = getBestRecord(gameState.level);
    if (record) {
        bestTimeSpan.textContent = `${record.correctAnswers}問`;
    } else {
        bestTimeSpan.textContent = 'なぁE;
    }
}

function clearBestTime(level) {
    // 旧形式�Eベストタイムをクリア
    const saved = localStorage.getItem('make24BestTimes');
    let bestTimes = {};

    if (saved) {
        try {
            bestTimes = JSON.parse(saved);
        } catch (e) {
            console.error('ベストタイムの読み込みに失敗しました', e);
        }
    }

    delete bestTimes[level];
    localStorage.setItem('make24BestTimes', JSON.stringify(bestTimes));
    delete gameState.levelStats[level].bestTime;

    // 新形式�Eベストレコードをクリア
    const savedRecords = localStorage.getItem('make24BestRecords');
    let bestRecords = {};

    if (savedRecords) {
        try {
            bestRecords = JSON.parse(savedRecords);
        } catch (e) {
            console.error('ベストレコード�E読み込みに失敗しました', e);
        }
    }

    delete bestRecords[level];
    localStorage.setItem('make24BestRecords', JSON.stringify(bestRecords));

    updateBestTimeDisplay();
}

// イベントリスナ�E
function attachEventListeners() {
    // ユーザー操作（�E体的なクリチE��めE��ー入力）でタイマ�EリセチE��
    // ただし�EスコチE��自身のクリチE��等でリセチE��されなぁE��ぁE��御
    const interactionHandler = (e) => {
        // マスコチE��コンチE��冁E�E操作�E無視して屁E��りを継続させる
        if (e.target.closest('#mascotContainer')) return;
        resetInactivityTimer();
    };

    window.addEventListener('mousedown', interactionHandler);
    window.addEventListener('keydown', resetInactivityTimer); // キー入力�E常にリセチE��
    window.addEventListener('touchstart', interactionHandler);

    // マスコチE��自身のクリチE��イベンチE
    if (mascotCharacter) {
        mascotCharacter.addEventListener('click', handleMascotPoke);
        // タチE��チE��イス用に追加
        mascotCharacter.addEventListener('touchstart', (e) => {
            // clickイベントと重褁E��なぁE��ぁE��制御
            handleMascotPoke(e);
        }, { passive: false });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkAnswer();
        });
    }
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    resetBtn.addEventListener('click', resetGame);
    prevBtn.addEventListener('click', goToPreviousProblem);
    solutionBtn.addEventListener('click', showSolution);
    newGameBtn.addEventListener('click', skipToNextProblem);
    gradeBtn.addEventListener('click', showGrading);
    bestTimeBtn.addEventListener('click', showBestTimeDetails);
    levelSelect.addEventListener('change', handleLevelChange);

    // 計算機�Eタンのイベントリスナ�E�E�Eボタンは除外！E
    document.querySelectorAll('.calc-btn:not(#submitBtn)').forEach(btn => {
        btn.addEventListener('click', handleCalculatorButton);
    });
}

// 前�E問題に戻めE
function goToPreviousProblem() {
    const stats = getCurrentStats();
    const problems = levelProblems[gameState.level];

    if (stats.currentProblemIndex > 0) {
        stats.currentProblemIndex--;
    } else {
        // 最初�E問題�E場合、最後�E問題に移勁E
        stats.currentProblemIndex = problems.length - 1;
    }
    generateNewNumbers();
}

// リセチE��機�E
function resetGame() {
    // 確認ダイアログを表示
    const dialog = document.getElementById('customConfirmDialog');
    const message = document.getElementById('customConfirmMessage');
    const recordClearOption = document.getElementById('recordClearOption');
    const clearRecordCheckbox = document.getElementById('clearRecordCheckbox');

    message.textContent = 'リセチE��しますか�E�\n�E�第�E�問からめE��直します！E;
    recordClearOption.style.display = 'block'; // チェチE��ボックスを表示
    clearRecordCheckbox.checked = false; // チェチE��を外す
    dialog.classList.add('show');

    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    const handleYes = () => {
        dialog.classList.remove('show');
        recordClearOption.style.display = 'none'; // チェチE��ボックスを非表示

        // ベストタイムのクリアをチェチE��
        if (clearRecordCheckbox.checked) {
            clearBestTime(gameState.level);
        }

        // 現在のレベルを保持
        const currentLevel = gameState.level;

        // 全レベルの統計情報をリセチE��
        for (let level = 1; level <= 3; level++) {
            gameState.levelStats[level] = {
                totalAttempts: 0,
                correctAnswers: 0,
                streak: 0,
                currentProblemIndex: 0,
                shownSolutions: new Set(),
                answerHistory: {}
            };
        }

        // レベルを�Eに戻ぁE
        gameState.level = currentLevel;
        gameState.solutionShown = false;
        gameState.lastButtonType = null;

        // 入力フィールドをクリア
        answerInput.value = '';

        // 数字�Eタンを�E度有効匁E
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });

        // フィードバチE��をクリア
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';

        // タイマ�EをリセチE��
        resetTimer();

        // 表示を更新
        updateDisplay();
        generateNewNumbers();

        showFeedback('リセチE��しました', 'success');

        // 2秒後にメチE��ージを消す
        setTimeout(() => {
            feedbackDiv.textContent = '';
            feedbackDiv.className = 'feedback';
        }, 2000);

        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
    };

    const handleNo = () => {
        dialog.classList.remove('show');
        recordClearOption.style.display = 'none'; // チェチE��ボックスを非表示
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);

    // 背景クリチE��で閉じめE
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            handleNo();
        }
    });
}

// 次の問題にスキチE�E
function skipToNextProblem() {
    const stats = getCurrentStats();
    stats.currentProblemIndex++;
    generateNewNumbers();
}

// レベル変更時�E処琁E
function handleLevelChange() {
    const newLevel = parseInt(levelSelect.value);
    // レベルは1-3の篁E��に制陁E
    gameState.level = Math.min(Math.max(newLevel, 1), 3);
    updatePlaceholder(); // プレースホルダーを更新
    updateDisplay(); // 新しいレベルの統計を表示
    updateBestTimeDisplay(); // ベストタイムを更新
    generateNewNumbers();
}

// プレースホルダーをレベルに応じて更新
function updatePlaceholder() {
    const placeholders = {
        1: '侁E 1 + 3 + 4 * 5',
        2: '侁E (1 + 2) * 6 + 6',
        3: '侁E 6 / (1 - 3/4)'
    };
    answerInput.placeholder = placeholders[gameState.level] || '侁E 8 / (3 - 8/3)';
}

// 電卓を開く
// 計算式�E最後�E入力タイプを判別
function getLastInputType(inputValue) {
    if (!inputValue) return null;

    const lastChar = inputValue.trim().slice(-1);

    if (!isNaN(lastChar) && lastChar !== ' ') {
        return 'number';
    } else if (lastChar === '(') {
        return 'openParen';
    } else if (lastChar === ')') {
        return 'closeParen';
    } else if (['+', '-', '*', '/'].includes(lastChar)) {
        return 'operator';
    }

    return null;
}

// 計算機�Eタンの処琁E
function handleCalculatorButton(e) {
    const button = e.currentTarget; // e.target から e.currentTarget に変更
    const value = button.dataset.value;
    const stats = getCurrentStats();

    // valueが未定義の場合�E処琁E��なぁE
    if (value === undefined) {
        return;
    }

    // 最初�Eボタン押下でタイマ�Eを開姁E
    resumeTimer();

    // 回答済みの問題�E入力できなぁE
    if (stats.answerHistory.hasOwnProperty(stats.currentProblemIndex)) {
        showFeedback('採点するまで再挑戦できません', 'error');

        // 既存�Eタイマ�Eをクリア
        if (gameState.feedbackTimer) {
            clearTimeout(gameState.feedbackTimer);
        }

        // 3秒後に允E�E結果を�E表示�E�アニメーションなし！E
        gameState.feedbackTimer = setTimeout(() => {
            const answer = stats.answerHistory[stats.currentProblemIndex];
            if (answer.isCorrect) {
                showFeedback(`✁E正解済み: ${answer.formula}`, 'success', true);
            } else if (answer.showedSolution) {
                showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info', true);
            } else {
                showFeedback(`❁E不正解: ${answer.formula} = ${answer.result.toFixed(2)}`, 'error', true);
            }
            gameState.feedbackTimer = null;
        }, 3000);

        return;
    }

    // 解答例を表示した問題�E計算式�E力�Eタンを無効匁E
    if (gameState.solutionShown) {
        showFeedback('解答例を表示した問題�E回答できません', 'error');

        // 既存�Eタイマ�Eをクリア
        if (gameState.feedbackTimer) {
            clearTimeout(gameState.feedbackTimer);
        }

        // 3秒後に解答例を表示
        gameState.feedbackTimer = setTimeout(() => {
            if (gameState.solutions.length > 0) {
                showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info');
            }
            gameState.feedbackTimer = null;
        }, 3000);

        return;
    }

    const currentValue = answerInput.value;
    const cursorPosition = answerInput.selectionStart;

    if (value === 'clear') {
        answerInput.value = '';
        gameState.lastButtonType = null;
        // 数字�Eタンを�E度有効匁E
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
        // 警告メチE��ージをクリア
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';
    } else if (value === 'backspace') {
        // Backspace処琁E��カーソル位置の左の斁E��を削除
        if (cursorPosition > 0) {
            const newValue = currentValue.slice(0, cursorPosition - 1) + currentValue.slice(cursorPosition);
            answerInput.value = newValue;
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition - 1, cursorPosition - 1);

            // 削除した斁E��が数字だった場合、そのボタンめEつだけ�E度有効匁E
            const deletedChar = currentValue[cursorPosition - 1];
            if (!isNaN(deletedChar) && deletedChar !== ' ') {
                const numberButtons = document.querySelectorAll('.number-btn');
                let enabled = false;
                for (let btn of numberButtons) {
                    if (btn.dataset.value === deletedChar && btn.disabled && !enabled) {
                        btn.disabled = false;
                        btn.classList.remove('disabled');
                        enabled = true;
                        break; // 1つだけ有効化したら終亁E
                    }
                }
            }

            // 削除後�E計算式�E最後�E斁E��に基づぁE��lastButtonTypeを設宁E
            gameState.lastButtonType = getLastInputType(newValue);
            // エラーメチE��ージをクリア
            feedbackDiv.textContent = '';
            feedbackDiv.className = 'feedback';
        }
    } else if (button.classList.contains('number-btn')) {
        // 数字�Eタンの場吁E
        if (gameState.lastButtonType === 'number') {
            // 前回も数字�Eタンだった場合、警告を表示
            // 開きかっこ�E中かどぁE��をチェチE��
            const openCount = (currentValue.match(/\(/g) || []).length;
            const closeCount = (currentValue.match(/\)/g) || []).length;

            if (openCount > closeCount) {
                // 開きかっこ�E中
                showFeedback('演算子また�E、E��じかっこを選択してください', 'error');
            } else {
                // 開きかっこ�E夁E
                showFeedback('演算子を選択してください', 'error');
            }
            return;
        }
        if (gameState.lastButtonType === 'closeParen') {
            // 閉じ括弧の後�E数字を入力できなぁE
            showFeedback('演算子を選択してください', 'error');
            return;
        }
        if (!button.disabled) {
            answerInput.value = currentValue.slice(0, cursorPosition) + value + currentValue.slice(cursorPosition);
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition + value.length, cursorPosition + value.length);
            button.disabled = true;
            button.classList.add('disabled');
            gameState.lastButtonType = 'number';
            // エラーメチE��ージをクリア
            if (feedbackDiv.classList.contains('error')) {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        }
    } else {
        // 演算子�Eタンの場吁E
        // 最初に演算子を入力できなぁE��ぁE��する�E�括弧は除く！E
        if (currentValue === '' && value !== '(' && value !== ')') {
            showFeedback('最初に数字また�E開き括弧を選択してください', 'error');
            return;
        }

        // 括弧の場吁E
        if (value === '(' || value === ')') {
            // 開き括弧は最初また�E演算子�E後�Eみ許可
            if (value === '(') {
                // 4つの数字を全て使ぁE�Eった後�E開き括弧を�E力できなぁE
                const usedNumbers = (currentValue.match(/[0-9]/g) || []).length;
                if (usedNumbers >= 4) {
                    showFeedback('4つの数字を全て使用済みでぁE, 'error');
                    return;
                }

                // 開き括弧の後に開き括弧は入力できなぁE
                if (gameState.lastButtonType === 'openParen') {
                    showFeedback('数字を選択してください', 'error');
                    return;
                }

                // 開き括弧は最初また�E演算子�E後�Eみ許可
                if (currentValue !== '' && gameState.lastButtonType !== 'operator') {
                    showFeedback('演算子を選択してください', 'error');
                    return;
                }
            }

            // 閉じ括弧の場合、E��き括弧が存在するかチェチE��
            if (value === ')') {
                const openCount = (currentValue.match(/\(/g) || []).length;
                const closeCount = (currentValue.match(/\)/g) || []).length;

                if (openCount <= closeCount) {
                    showFeedback('開き括弧が�E力されてぁE��せん', 'error');
                    return;
                }

                // 開き括弧の直後�E閉じ括弧を�E力できなぁE
                if (gameState.lastButtonType === 'openParen') {
                    showFeedback('開き括弧の後に閉じ括弧は入力できません', 'error');
                    return;
                }

                // 演算子�E直後�E閉じ括弧を�E力できなぁE
                if (gameState.lastButtonType === 'operator') {
                    showFeedback('演算子�E後に閉じ括弧は入力できません', 'error');
                    return;
                }
            }

            answerInput.value = currentValue.slice(0, cursorPosition) + value + currentValue.slice(cursorPosition);
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition + value.length, cursorPosition + value.length);
            // 開き括弧の後�E数字�Eみ入力可能
            if (value === '(') {
                gameState.lastButtonType = 'openParen'; // 開き括弧専用の状慁E
            } else {
                // 閉じ括弧の後�E演算子が忁E��E
                gameState.lastButtonType = 'closeParen'; // 閉じ括弧専用の状慁E
            }
            // エラーメチE��ージをクリア
            const errorMsg = feedbackDiv.textContent;
            if (errorMsg === '演算子を選択してください' || errorMsg === '演算子また�E、E��じかっこを選択してください') {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        } else {
            // 通常の演算子！E、�E、E�、E�E��E場吁E
            // 4つの数字を全て使ぁE�Eった後�E演算子を入力できなぁE
            const usedNumbers = (currentValue.match(/[0-9]/g) || []).length;
            if (usedNumbers >= 4) {
                showFeedback('4つの数字を全て使用済みでぁE, 'error');
                return;
            }

            // 開き括弧の直後�E演算子を入力できなぁE
            if (gameState.lastButtonType === 'openParen') {
                showFeedback('数字を選択してください', 'error');
                return;
            }
            if (gameState.lastButtonType === 'operator') {
                // 前回も演算子�Eタンだった場合、警告を表示
                showFeedback('数字を選択してください', 'error');
                return;
            }
            answerInput.value = currentValue.slice(0, cursorPosition) + value + currentValue.slice(cursorPosition);
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition + value.length, cursorPosition + value.length);
            gameState.lastButtonType = 'operator';
            // エラーメチE��ージをクリア�E�数字連続�Eエラーのみ�E�E
            const errorMsg = feedbackDiv.textContent;
            if (errorMsg === '演算子を選択してください' || errorMsg === '演算子また�E、E��じかっこを選択してください') {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        }
    }

    answerInput.focus();
}

// 絁E��合わせが解答不可能かチェチE��
function isImpossibleCombination(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return impossibleCombinations.some(impossible => {
        const sortedImpossible = [...impossible].sort((a, b) => a - b);
        return JSON.stringify(sorted) === JSON.stringify(sortedImpossible);
    });
}

// 問題をキーに変換�E�ソートして重褁E��避ける�E�E
function getProblemKey(numbers) {
    return [...numbers].sort((a, b) => a - b).join(',');
}

// 新しい数字を生�E
function generateNewNumbers() {
    // 既存�Eタイマ�Eをクリア
    if (gameState.feedbackTimer) {
        clearTimeout(gameState.feedbackTimer);
        gameState.feedbackTimer = null;
    }

    const stats = getCurrentStats();
    const problems = levelProblems[gameState.level];

    // 問題リストが空の場吁E
    if (!problems || problems.length === 0) {
        console.error('こ�Eレベルには問題がありません');
        showFeedback('こ�Eレベルには問題がありません', 'error');
        return;
    }

    // すべての問題をクリアした場合、最初に戻めE
    if (stats.currentProblemIndex >= problems.length) {
        stats.currentProblemIndex = 0;
        showFeedback('🎉 すべての問題をクリアしました�E�最初から�E開しまぁE, 'success');
    }

    // 現在の問題を取征E
    const currentProblem = problems[stats.currentProblemIndex];
    // 数字を昁E��E��ソーチE
    gameState.currentNumbers = [...currentProblem.numbers].sort((a, b) => a - b);
    gameState.solutions = [currentProblem.solution];

    // こ�E問題が解答例を表示済みかどぁE��をチェチE��
    gameState.solutionShown = stats.shownSolutions.has(stats.currentProblemIndex);

    // こ�E問題が回答済みかどぁE��をチェチE��
    const hasAnswered = stats.answerHistory.hasOwnProperty(stats.currentProblemIndex);

    // 問題番号を更新
    updateProblemNumber();

    // マスコチE��の挨拶
    const greetings = ['こんちは�E�E, 'き�EってぁE��ぁE���E�E��E, '24作ったろか！E, 'ボチボチぁE��ぁE];
    updateMascot(greetings[Math.floor(Math.random() * greetings.length)], 'mascot-thinking');

    displayNumbers();
    answerInput.value = '';

    // 回答済みの問題�E場合、回答結果を表示�E�アニメーションなし！E
    if (hasAnswered) {
        const answer = stats.answerHistory[stats.currentProblemIndex];
        if (answer.isCorrect) {
            showFeedback(`✁E正解済み: ${answer.formula}`, 'success', true);
        } else if (answer.showedSolution) {
            showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info', true);
        } else {
            showFeedback(`❁E不正解: ${answer.formula} = ${answer.result.toFixed(2)}`, 'error', true);
        }
    } else if (gameState.solutionShown) {
        // 解答例を表示済みの問題�E場合、解答例を表示
        showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info', true);
    } else {
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';
    }

    gameState.lastButtonType = null;
}

// 問題番号を更新
function updateProblemNumber() {
    const stats = getCurrentStats();
    const problems = levelProblems[gameState.level];
    const problemNumberSpan = document.getElementById('problemNumber');

    if (problemNumberSpan && problems) {
        const currentNum = toFullWidth(stats.currentProblemIndex + 1);
        const answeredCount = toFullWidth(Object.keys(stats.answerHistory).length);
        const totalCount = toFullWidth(problems.length);

        problemNumberSpan.textContent = `問顁E{currentNum}�E�回答済み${answeredCount}/${totalCount}�E�`;
    }
}

// 数字を表示
function displayNumbers() {
    // 数字カード�E表示は削除されたため、計算機�Eタンの更新のみ
    updateCalculatorNumbers();
}

// 計算機�Eタンの数字を更新
function updateCalculatorNumbers() {
    const numberButtons = document.querySelectorAll('.number-btn');
    gameState.currentNumbers.forEach((num, index) => {
        if (numberButtons[index]) {
            numberButtons[index].textContent = num;
            numberButtons[index].dataset.value = num;
            numberButtons[index].disabled = false;
            numberButtons[index].classList.remove('disabled');
        }
    });

    // レベルに応じて演算子�Eタンの表示/非表示を制御
    updateOperatorButtons();
}

// レベルに応じて演算子�Eタンの表示/非表示を制御
function updateOperatorButtons() {
    const config = levelConfig[gameState.level] || levelConfig[1];
    const allowedOperators = config.operators || ['+', '-', '*', '/', '(', ')'];

    const operatorButtons = document.querySelectorAll('.operator-btn');
    operatorButtons.forEach(btn => {
        const value = btn.dataset.value;
        if (allowedOperators.includes(value)) {
            btn.style.display = '';
            btn.disabled = false;
        } else {
            btn.style.display = 'none';
        }
    });
}

// レベルに応じて使用可能な演算子かチェチE��
function isValidOperatorsForLevel(expression) {
    const config = levelConfig[gameState.level] || levelConfig[1];
    const allowedOperators = config.operators || ['+', '-', '*', '/', '(', ')'];

    // 式に含まれる演算子を抽出
    const usedOperators = expression.match(/[\+\-\*\/\(\)]/g) || [];

    // すべての演算子が許可されてぁE��かチェチE��
    for (const op of usedOperators) {
        if (!allowedOperators.includes(op)) {
            return false;
        }
    }

    return true;
}

// 答えをチェチE��
function checkAnswer() {
    const userAnswer = answerInput.value.trim();

    // 空の入力�E無視（早期リターン�E�E
    if (!userAnswer) {
        return;
    }

    const stats = getCurrentStats();

    // 回答済みの問題�E回答できなぁE
    if (stats.answerHistory.hasOwnProperty(stats.currentProblemIndex)) {
        showFeedback('採点するまで再挑戦できません', 'error');

        // 既存�Eタイマ�Eをクリア
        if (gameState.feedbackTimer) {
            clearTimeout(gameState.feedbackTimer);
        }

        // 3秒後に允E�E結果を�E表示�E�アニメーションなし！E
        gameState.feedbackTimer = setTimeout(() => {
            const answer = stats.answerHistory[stats.currentProblemIndex];
            if (answer.isCorrect) {
                showFeedback(`✁E正解済み: ${answer.formula}`, 'success', true);
            } else if (answer.showedSolution) {
                showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info', true);
            } else {
                showFeedback(`❁E不正解: ${answer.formula} = ${answer.result.toFixed(2)}`, 'error', true);
            }
            gameState.feedbackTimer = null;
        }, 3000);

        return;
    }

    // 解答例を表示した問題�E回答できなぁE
    if (gameState.solutionShown) {
        showFeedback('解答例を表示した問題�E回答できません', 'error');

        // 既存�Eタイマ�Eをクリア
        if (gameState.feedbackTimer) {
            clearTimeout(gameState.feedbackTimer);
        }

        // 3秒後に解答例を表示
        gameState.feedbackTimer = setTimeout(() => {
            if (gameState.solutions.length > 0) {
                showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info');
            }
            gameState.feedbackTimer = null;
        }, 3000);

        return;
    }

    if (!userAnswer) {
        showFeedback('計算式を入力してください', 'error');
        return;
    }

    // レベルに応じた演算子�Eみを使用してぁE��かチェチE��
    if (!isValidOperatorsForLevel(userAnswer)) {
        const config = levelConfig[gameState.level] || levelConfig[1];
        const allowedOps = config.operators.join(', ');
        showFeedback(`こ�Eレベルでは ${allowedOps} のみ使用できます`, 'error');
        return;
    }

    try {
        // 使用されてぁE��数字を抽出
        const usedNumbers = userAnswer.match(/\d+/g);
        if (!usedNumbers || usedNumbers.length !== 4) {
            showFeedback('4つの数字すべてを使ってください�E�E, 'error');
            return;
        }

        // 数字�E使用回数をチェチE��
        const usedNumsSorted = usedNumbers.map(Number).sort((a, b) => a - b);
        const currentNumsSorted = [...gameState.currentNumbers].sort((a, b) => a - b);

        if (JSON.stringify(usedNumsSorted) !== JSON.stringify(currentNumsSorted)) {
            showFeedback('持E��された数字だけを使ってください�E�E, 'error');
            return;
        }

        // 計算式を評価
        const result = eval(userAnswer);

        if (Math.abs(result - 24) < 0.0001) {
            handleCorrectAnswer();
        } else {
            const stats = getCurrentStats();

            // 回答履歴を保存（不正解�E�E
            stats.answerHistory[stats.currentProblemIndex] = {
                formula: userAnswer,
                isCorrect: false,
                result: result,
                timestamp: new Date().toISOString()
            };

            stats.totalAttempts++;
            // 整数の場合�E小数点以下を表示しなぁE
            const resultText = Number.isInteger(result) ? result : result.toFixed(2);
            updateMascot('おっと�E��Eしいなあ。もぁE��回計算してみーめE��E, 'mascot-worried', 4000);
            showFeedback(`残念�E�計算結果は ${resultText} です、E4を作ろぁE��`, 'error');
            stats.streak = 0;
            updateDisplay();
        }
    } catch (error) {
        showFeedback('無効な計算式です。もぁE��度試してください�E�E, 'error');
    }
}

// 正解時�E処琁E
function handleCorrectAnswer() {
    const stats = getCurrentStats();
    const userAnswer = answerInput.value.trim();

    // 回答履歴を保孁E
    stats.answerHistory[stats.currentProblemIndex] = {
        formula: userAnswer,
        isCorrect: true,
        timestamp: new Date().toISOString()
    };

    stats.streak++;
    stats.correctAnswers++;
    stats.totalAttempts++;

    updateMascot('めE��めE��か！正解めE���E�E, 'mascot-joy', 5000);
    showFeedback(`🎉 正解�E�次の問題に進もう�E�`, 'success');

    updateDisplay();
}

// フィードバチE��表示
function showFeedback(message, type, noAnimation = false) {
    // 既存�Eタイマ�Eをクリア
    if (gameState.feedbackTimer) {
        clearTimeout(gameState.feedbackTimer);
        gameState.feedbackTimer = null;
    }

    // アニメーションをリセチE��するために一旦クラスを削除し、リフローを強制
    feedbackDiv.className = 'feedback';
    void feedbackDiv.offsetWidth; // リフロー�E��E描画�E�を強制

    feedbackDiv.textContent = message;
    if (noAnimation) {
        // アニメーションなしで表示
        feedbackDiv.className = `feedback ${type} no-animation`;
    } else {
        // 通常のアニメーション付き表示
        feedbackDiv.className = `feedback ${type}`;
    }

    // 入力制限�EエラーメチE��ージのみ3秒後に自動消去
    // 計算結果のエラー�E�不正解�E��E残す
    const autoHideErrors = [
        '演算子を選択してください',
        '演算子また�E、E��じかっこを選択してください',
        '最初に数字また�E開き括弧を選択してください',
        '開き括弧が�E力されてぁE��せん',
        '開き括弧の後に閉じ括弧は入力できません',
        '演算子�E後に閉じ括弧は入力できません',
        '数字を選択してください',
        '4つの数字を全て使用済みでぁE,
        '採点するまで再挑戦できません',
        '解答例を表示した問題�E回答できません',
        '無効な計算式です。もぁE��度試してください�E�E
    ];

    if (type === 'error' && autoHideErrors.includes(message)) {
        gameState.feedbackTimer = setTimeout(() => {
            feedbackDiv.textContent = '';
            feedbackDiv.className = 'feedback';
            gameState.feedbackTimer = null;
        }, 3000);
    }
}

// 表示を更新
// 現在のレベルの統計情報を取征E
function getCurrentStats() {
    return gameState.levelStats[gameState.level];
}

function updateDisplay() {
    const stats = getCurrentStats();

    // 正解玁E��計箁E
    const accuracy = stats.totalAttempts > 0
        ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100)
        : 0;

    accuracySpan.textContent = accuracy + '%';
    levelSelect.value = gameState.level;
    updateProblemNumber();
}

// 解答例を表示
function showSolution() {
    // 最初�Eボタン押下でタイマ�Eを開姁E
    resumeTimer();

    // 現在のレベルと問題インチE��クスを取征E
    const stats = getCurrentStats();

    // 回答済みの問題�E場合、解答例を表示して数秒後に允E�E結果に戻ぁE
    if (stats.answerHistory.hasOwnProperty(stats.currentProblemIndex)) {
        const answer = stats.answerHistory[stats.currentProblemIndex];

        // 解答例を表示
        if (gameState.solutions.length > 0) {
            showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info', true);
        } else {
            showFeedback('こ�E問題�E解答例が見つかりません、E4にならなぁE��能性があります、EIに相諁E��てみましょぁE, 'info', true);
        }

        // 既存�Eタイマ�Eをクリア
        if (gameState.feedbackTimer) {
            clearTimeout(gameState.feedbackTimer);
        }

        // 3秒後に允E�E回答結果に戻ぁE
        gameState.feedbackTimer = setTimeout(() => {
            if (answer.isCorrect) {
                showFeedback(`✁E正解済み: ${answer.formula}`, 'success', true);
            } else if (answer.showedSolution) {
                showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info', true);
            } else {
                showFeedback(`❁E不正解: ${answer.formula} = ${answer.result.toFixed(2)}`, 'error', true);
            }
            gameState.feedbackTimer = null;
        }, 3000);

        return;
    }

    // まだ解答例を表示してぁE��ぁE��題�E場合�Eみ試行回数を増やぁE
    if (!gameState.solutionShown) {
        stats.totalAttempts++;

        // 回答履歴を保存（解答例表示�E�E
        stats.answerHistory[stats.currentProblemIndex] = {
            formula: '解答例を表示',
            isCorrect: false,
            showedSolution: true,
            timestamp: new Date().toISOString()
        };
    }

    // 解答例を表示したフラグを立てめE
    gameState.solutionShown = true;
    stats.shownSolutions.add(stats.currentProblemIndex);

    updateMascot('次はイケるって�E�応援してるからな�E�E, 'mascot-thinking', 5000);

    // 解答例を表示
    if (gameState.solutions.length > 0) {
        showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info');
    } else {
        showFeedback('こ�E問題�E解答例が見つかりません、E4にならなぁE��能性があります、EIに相諁E��てみましょぁE, 'info');
    }

    // 解答例を見ると連続正解がリセチE��されめE
    stats.streak = 0;
    updateDisplay();
}

// 採点を表示
function showGrading() {
    // カスタム確認ダイアログを表示
    const dialog = document.getElementById('customConfirmDialog');
    const message = document.getElementById('customConfirmMessage');
    message.textContent = '採点しますか�E�E;
    dialog.classList.add('show');

    // はぁE�Eタンのイベントリスナ�E�E�一度だけ実行！E
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    const handleYes = () => {
        dialog.classList.remove('show');
        executeGrading();
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
    };

    const handleNo = () => {
        dialog.classList.remove('show');
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);

    // 背景クリチE��で閉じめE
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            handleNo();
        }
    });
}

// 採点を実衁E
function executeGrading() {
    const stats = getCurrentStats();
    const problems = levelProblems[gameState.level];
    const totalProblems = problems.length;
    const correctAnswers = stats.correctAnswers;
    const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;

    const levelNames = { 1: 'ふつぁE, 2: '難しい', 3: '鬼' };
    const levelName = levelNames[gameState.level];



    // 経過時間を計箁E
    let timeText = '�E�０：０！E;
    let elapsedTimeInSeconds = 0;
    let isNewRecord = false;

    if (gameState.startTime && !gameState.timerPaused) {
        elapsedTimeInSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsedTimeInSeconds / 60);
        const seconds = elapsedTimeInSeconds % 60;
        timeText = `${toFullWidth(String(minutes).padStart(2, '0'))}�E�E{toFullWidth(String(seconds).padStart(2, '0'))}`;

        // ベストレコードをチェチE���E�正解数が多い、また�E同じ正解数でタイムが早ぁE��E
        const currentRecord = getBestRecord(gameState.level);
        if (!currentRecord ||
            correctAnswers > currentRecord.correctAnswers ||
            (correctAnswers === currentRecord.correctAnswers && elapsedTimeInSeconds < currentRecord.time)) {
            saveBestRecord(gameState.level, correctAnswers, totalProblems, elapsedTimeInSeconds);
            isNewRecord = true;
        }
    }

    // 統計情報をリセチE���E�現在のレベルのみ�E�E
    stats.totalAttempts = 0;
    stats.correctAnswers = 0;
    stats.streak = 0;
    stats.currentProblemIndex = 0;
    stats.shownSolutions.clear();
    stats.answerHistory = {}; // 回答履歴もリセチE��

    // タイマ�EをリセチE��
    resetTimer();

    updateDisplay();
    generateNewNumbers();

    // 正解玁E��応じたメチE��ージ
    let resultMessage = '';

    // 鬼レベルの場合�E正解数に応じた専用メチE��ージ
    if (gameState.level === 3) {
        const messages = {
            0: '👹 お前も鬼にならなぁE���E�E,
            1: '💪 送E��ちめE��メだ　送E��ちめE��メだ\n送E��ちめE��メだ',
            2: '🔥 自刁E��限界を決めなぁE,
            3: '⚔︁E戦わなければ勝てなぁE�E・・',
            4: '✨ 悔いが残らなぁE��を�E刁E��選べ',
            5: '🏀 諦めたら、そこで試合終亁E��すよ',
            6: '🌟 わが生涯に一牁E�E悔いなぁE
        };
        resultMessage = messages[correctAnswers] || messages[6];
    } else if (gameState.level === 2) {
        // 難しいレベルの場合�E正解数に応じた専用メチE��ージ
        const messages = {
            0: '💭 世�E中って\nオレより頭のぁE��人のほぁE��多いんだ、E,
            1: '🛤�E�E「ゴールは遠ぁE��ぁ」と、\nがっかりするのも道のりです、E,
            2: '📅 常に今日は明日の準備ですから�E、En今日めE��たことは忁E��明日に返ってくるんです、E,
            3: '🪁E小さぁE��とを積み重�Eる�Eが、\nとんでもなぁE��ころへ行くただひとつの道だと思ってぁE��す、E,
            4: '🚀 成功の反対は失敗ではなく\n「やらなぁE��と、E,
            5: '🧠 自刁E��わかってぁE��ぁE��とが\nわかるとぁE��ことが一番賢ぁE��です、E,
            6: '🏆 強ぁE��E��勝つのではなぁE��En勝った老E��強ぁE�Eだ、E
        };
        resultMessage = messages[correctAnswers] || messages[6];
    } else {
        // 通常レベル�E��EつぁE���EメチE��ージ
        if (accuracy === 100) {
            resultMessage = '🎉 完璧です！素晴らしぁE��E;
        } else if (accuracy >= 90) {
            resultMessage = '🌟 すごぁE��ほぼ完璧です！E;
        } else if (accuracy >= 80) {
            resultMessage = '👏 素晴らしぁE�E績です！E;
        } else if (accuracy >= 70) {
            resultMessage = '�E よくできました�E�E;
        } else if (accuracy >= 60) {
            resultMessage = '💪 もう少しです！E��張りましょぁE��E;
        } else if (accuracy >= 50) {
            resultMessage = '📚 練習を続けましょぁE��E;
        } else if (accuracy > 0) {
            resultMessage = '🔥 次は忁E��できます！E;
        } else {
            resultMessage = '🏁 ここからがスタートだ�E�E;
        }
    }

    // 採点結果をダイアログで表示
    let recordMessage = isNewRecord ? '\n🏆 記録更新�E�E : '';

    const message = `【採点結果　レベル�E�E{levelName}】\n正解数　${toFullWidth(correctAnswers)}問（�E${toFullWidth(totalProblems)}問）\n正解玁E��${toFullWidth(accuracy)}�E�Enタイム　${timeText}${recordMessage}\n\n${resultMessage}`;

    // ダイアログを表示
    const dialog = document.getElementById('gradingResultDialog');
    const messageP = document.getElementById('gradingResultMessage');
    const closeBtn = document.getElementById('gradingResultClose');

    messageP.innerText = message;
    dialog.classList.add('show');

    // 記録更新時�E紙吹雪演�E�E�ダイアログ表示後に呼び出す！E
    if (isNewRecord) {
        // レイアウト確定�Eために少しだけ征E��
        setTimeout(() => {
            triggerConfetti();
        }, 100);
    }

    // 閉じる�Eタンのイベントリスナ�E
    const handleClose = () => {
        dialog.classList.remove('show');
        closeBtn.removeEventListener('click', handleClose);
    };

    closeBtn.addEventListener('click', handleClose);

    // 背景クリチE��で閉じめE
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            handleClose();
        }
    });
}

// ベストタイム詳細を表示
function showBestTimeDetails() {
    const dialog = document.getElementById('bestTimeDialog');
    const detailsDiv = document.getElementById('bestTimeDetails');
    const closeBtn = document.getElementById('bestTimeClose');

    const levelNames = { 1: 'ふつぁE, 2: '難しい', 3: '鬼' };



    // 吁E��ベルのベストレコードを表示
    let html = '';
    for (let level = 1; level <= 3; level++) {
        const levelName = levelNames[level];
        const record = getBestRecord(level);

        html += `<div class="best-time-level">`;
        html += `<h3>レベル ${toFullWidth(level)}�E�E{levelName}</h3>`;

        if (record) {
            // スマ�E表示かどぁE��を判宁E
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // スマ�E表示�E�縦並び
                html += `<p>✁E正解数�E�E{toFullWidth(record.correctAnswers)}啁E/ ${toFullWidth(record.totalProblems)}啁E/p>`;

                const minutes = Math.floor(record.time / 60);
                const seconds = record.time % 60;
                const timeText = `${toFullWidth(String(minutes).padStart(2, '0'))}�E�E{toFullWidth(String(seconds).padStart(2, '0'))}`;
                html += `<p>⏱�E�Eタイム�E�E{timeText}</p>`;
            } else {
                // PC表示�E�横並び
                html += `<p>✁E正解数�E�E{toFullWidth(record.correctAnswers)}啁E/ ${toFullWidth(record.totalProblems)}問　⏱�E�Eタイム�E�`;

                const minutes = Math.floor(record.time / 60);
                const seconds = record.time % 60;
                const timeText = `${toFullWidth(String(minutes).padStart(2, '0'))}�E�E{toFullWidth(String(seconds).padStart(2, '0'))}`;
                html += `${timeText}</p>`;
            }

            if (record.date) {
                const date = new Date(record.date);
                const dateText = `${toFullWidth(date.getFullYear())}年${toFullWidth(date.getMonth() + 1)}朁E{toFullWidth(date.getDate())}日`;
                html += `<p>📅 達�E日�E�E{dateText}</p>`;
            }
        } else {
            html += `<p class="no-record">記録なぁE/p>`;
        }

        html += `</div>`;
    }

    detailsDiv.innerHTML = html;
    dialog.classList.add('show');

    // 閉じる�Eタンのイベントリスナ�E
    const handleClose = () => {
        dialog.classList.remove('show');
        closeBtn.removeEventListener('click', handleClose);
    };

    closeBtn.addEventListener('click', handleClose);

    // 背景クリチE��で閉じめE
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            handleClose();
        }
    });
}

// 問題をスキチE�E
function skipProblem() {
    if (gameState.solutions.length > 0) {
        showFeedback(`解答侁E ${gameState.solutions[0]}`, 'info');
    } else {
        showFeedback('こ�E問題�E解く�Eが難しいため、新しい問題を生�EしまぁE, 'info');
    }

    gameState.streak = 0;
    if (gameState.score > 10) {
        gameState.score -= 10;
    }
    updateDisplay();

    setTimeout(() => {
        generateNewNumbers();
    }, 3000);
}

// 解を見つける�E�簡易版�E�E
function findSolutions(numbers) {
    const solutions = [];

    // 既知のパターンから検索
    const sortedNums = [...numbers].sort((a, b) => a - b).join(',');
    for (const pattern of knownSolutions) {
        const patternNums = [...pattern.numbers].sort((a, b) => a - b).join(',');
        if (sortedNums === patternNums) {
            solutions.push(pattern.solution);
        }
    }

    // 簡単なパターンをチェチE��
    const [a, b, c, d] = numbers;

    // パターン0: a + b + c + d = 24
    if (a + b + c + d === 24) solutions.push(`${a} + ${b} + ${c} + ${d}`);

    // パターン1: (a + b) * (c + d) = 24
    if ((a + b) * (c + d) === 24) solutions.push(`(${a} + ${b}) * (${c} + ${d})`);
    if ((a + c) * (b + d) === 24) solutions.push(`(${a} + ${c}) * (${b} + ${d})`);
    if ((a + d) * (b + c) === 24) solutions.push(`(${a} + ${d}) * (${b} + ${c})`);

    // パターン1-2: (a + b) * (c - d) = 24
    if ((a + b) * (c - d) === 24) solutions.push(`(${a} + ${b}) * (${c} - ${d})`);
    if ((a + b) * (d - c) === 24) solutions.push(`(${a} + ${b}) * (${d} - ${c})`);
    if ((a + c) * (b - d) === 24) solutions.push(`(${a} + ${c}) * (${b} - ${d})`);
    if ((a + c) * (d - b) === 24) solutions.push(`(${a} + ${c}) * (${d} - ${b})`);
    if ((a + d) * (b - c) === 24) solutions.push(`(${a} + ${d}) * (${b} - ${c})`);
    if ((a + d) * (c - b) === 24) solutions.push(`(${a} + ${d}) * (${c} - ${b})`);
    if ((b + c) * (a - d) === 24) solutions.push(`(${b} + ${c}) * (${a} - ${d})`);
    if ((b + c) * (d - a) === 24) solutions.push(`(${b} + ${c}) * (${d} - ${a})`);
    if ((b + d) * (a - c) === 24) solutions.push(`(${b} + ${d}) * (${a} - ${c})`);
    if ((b + d) * (c - a) === 24) solutions.push(`(${b} + ${d}) * (${c} - ${a})`);
    if ((c + d) * (a - b) === 24) solutions.push(`(${c} + ${d}) * (${a} - ${b})`);
    if ((c + d) * (b - a) === 24) solutions.push(`(${c} + ${d}) * (${b} - ${a})`);

    // パターン2: (a - b) * (c + d) = 24
    if ((a - b) * (c + d) === 24) solutions.push(`(${a} - ${b}) * (${c} + ${d})`);

    // パターン2-1: (a - b) * (c - d) = 24
    if ((a - b) * (c - d) === 24) solutions.push(`(${a} - ${b}) * (${c} - ${d})`);
    if ((a - b) * (d - c) === 24) solutions.push(`(${a} - ${b}) * (${d} - ${c})`);
    if ((b - a) * (c - d) === 24) solutions.push(`(${b} - ${a}) * (${c} - ${d})`);
    if ((b - a) * (d - c) === 24) solutions.push(`(${b} - ${a}) * (${d} - ${c})`);
    if ((a - c) * (b - d) === 24) solutions.push(`(${a} - ${c}) * (${b} - ${d})`);
    if ((a - c) * (d - b) === 24) solutions.push(`(${a} - ${c}) * (${d} - ${b})`);
    if ((c - a) * (b - d) === 24) solutions.push(`(${c} - ${a}) * (${b} - ${d})`);
    if ((c - a) * (d - b) === 24) solutions.push(`(${c} - ${a}) * (${d} - ${b})`);
    if ((a - d) * (b - c) === 24) solutions.push(`(${a} - ${d}) * (${b} - ${c})`);
    if ((a - d) * (c - b) === 24) solutions.push(`(${a} - ${d}) * (${c} - ${b})`);
    if ((d - a) * (b - c) === 24) solutions.push(`(${d} - ${a}) * (${b} - ${c})`);
    if ((d - a) * (c - b) === 24) solutions.push(`(${d} - ${a}) * (${c} - ${b})`);

    // パターン2-2: (a * b) - (c + d) = 24
    if (a * b - (c + d) === 24) solutions.push(`(${a} * ${b}) - (${c} + ${d})`);
    if (a * c - (b + d) === 24) solutions.push(`(${a} * ${c}) - (${b} + ${d})`);
    if (a * d - (b + c) === 24) solutions.push(`(${a} * ${d}) - (${b} + ${c})`);
    if (b * c - (a + d) === 24) solutions.push(`(${b} * ${c}) - (${a} + ${d})`);
    if (b * d - (a + c) === 24) solutions.push(`(${b} * ${d}) - (${a} + ${c})`);
    if (c * d - (a + b) === 24) solutions.push(`(${c} * ${d}) - (${a} + ${b})`);

    // パターン3: a * b + c * d = 24
    if (a * b + c * d === 24) solutions.push(`${a} * ${b} + ${c} * ${d}`);
    if (a * c + b * d === 24) solutions.push(`${a} * ${c} + ${b} * ${d}`);
    if (a * d + b * c === 24) solutions.push(`${a} * ${d} + ${b} * ${c}`);

    // パターン3-1: a * b - c * d = 24
    if (a * b - c * d === 24) solutions.push(`${a} * ${b} - ${c} * ${d}`);
    if (a * c - b * d === 24) solutions.push(`${a} * ${c} - ${b} * ${d}`);
    if (a * d - b * c === 24) solutions.push(`${a} * ${d} - ${b} * ${c}`);
    if (b * c - a * d === 24) solutions.push(`${b} * ${c} - ${a} * ${d}`);
    if (b * d - a * c === 24) solutions.push(`${b} * ${d} - ${a} * ${c}`);
    if (c * d - a * b === 24) solutions.push(`${c} * ${d} - ${a} * ${b}`);

    // パターン3-2: a * b + c - d = 24
    if (a * b + c - d === 24) solutions.push(`${a} * ${b} + ${c} - ${d}`);
    if (a * b + d - c === 24) solutions.push(`${a} * ${b} + ${d} - ${c}`);
    if (a * c + b - d === 24) solutions.push(`${a} * ${c} + ${b} - ${d}`);
    if (a * c + d - b === 24) solutions.push(`${a} * ${c} + ${d} - ${b}`);
    if (a * d + b - c === 24) solutions.push(`${a} * ${d} + ${b} - ${c}`);
    if (a * d + c - b === 24) solutions.push(`${a} * ${d} + ${c} - ${b}`);
    if (b * c + a - d === 24) solutions.push(`${b} * ${c} + ${a} - ${d}`);
    if (b * c + d - a === 24) solutions.push(`${b} * ${c} + ${d} - ${a}`);
    if (b * d + a - c === 24) solutions.push(`${b} * ${d} + ${a} - ${c}`);
    if (b * d + c - a === 24) solutions.push(`${b} * ${d} + ${c} - ${a}`);
    if (c * d + a - b === 24) solutions.push(`${c} * ${d} + ${a} - ${b}`);
    if (c * d + b - a === 24) solutions.push(`${c} * ${d} + ${b} - ${a}`);

    // パターン4: a * b * c - d = 24
    if (a * b * c - d === 24) solutions.push(`${a} * ${b} * ${c} - ${d}`);
    if (a * b * d - c === 24) solutions.push(`${a} * ${b} * ${d} - ${c}`);
    if (a * c * d - b === 24) solutions.push(`${a} * ${c} * ${d} - ${b}`);
    if (b * c * d - a === 24) solutions.push(`${b} * ${c} * ${d} - ${a}`);

    // パターン4-2: (a - b) * c * d = 24
    if ((a - b) * c * d === 24) solutions.push(`(${a} - ${b}) * ${c} * ${d}`);
    if ((b - a) * c * d === 24) solutions.push(`(${b} - ${a}) * ${c} * ${d}`);
    if ((a - c) * b * d === 24) solutions.push(`(${a} - ${c}) * ${b} * ${d}`);
    if ((c - a) * b * d === 24) solutions.push(`(${c} - ${a}) * ${b} * ${d}`);
    if ((a - d) * b * c === 24) solutions.push(`(${a} - ${d}) * ${b} * ${c}`);
    if ((d - a) * b * c === 24) solutions.push(`(${d} - ${a}) * ${b} * ${c}`);
    if ((b - c) * a * d === 24) solutions.push(`(${b} - ${c}) * ${a} * ${d}`);
    if ((c - b) * a * d === 24) solutions.push(`(${c} - ${b}) * ${a} * ${d}`);
    if ((b - d) * a * c === 24) solutions.push(`(${b} - ${d}) * ${a} * ${c}`);
    if ((d - b) * a * c === 24) solutions.push(`(${d} - ${b}) * ${a} * ${c}`);
    if ((c - d) * a * b === 24) solutions.push(`(${c} - ${d}) * ${a} * ${b}`);
    if ((d - c) * a * b === 24) solutions.push(`(${d} - ${c}) * ${a} * ${b}`);

    // パターン5: (a + b + c) * d = 24
    if ((a + b + c) * d === 24) solutions.push(`(${a} + ${b} + ${c}) * ${d}`);
    if ((a + b + d) * c === 24) solutions.push(`(${a} + ${b} + ${d}) * ${c}`);
    if ((a + c + d) * b === 24) solutions.push(`(${a} + ${c} + ${d}) * ${b}`);
    if ((b + c + d) * a === 24) solutions.push(`(${b} + ${c} + ${d}) * ${a}`);

    // パターン5-2: (a - b + c) * d = 24
    if ((a - b + c) * d === 24) solutions.push(`(${a} - ${b} + ${c}) * ${d}`);
    if ((a - b + d) * c === 24) solutions.push(`(${a} - ${b} + ${d}) * ${c}`);
    if ((a - c + b) * d === 24) solutions.push(`(${a} - ${c} + ${b}) * ${d}`);
    if ((a - c + d) * b === 24) solutions.push(`(${a} - ${c} + ${d}) * ${b}`);
    if ((a - d + b) * c === 24) solutions.push(`(${a} - ${d} + ${b}) * ${c}`);
    if ((a - d + c) * b === 24) solutions.push(`(${a} - ${d} + ${c}) * ${b}`);
    if ((b - a + c) * d === 24) solutions.push(`(${b} - ${a} + ${c}) * ${d}`);
    if ((b - a + d) * c === 24) solutions.push(`(${b} - ${a} + ${d}) * ${c}`);
    if ((b - c + a) * d === 24) solutions.push(`(${b} - ${c} + ${a}) * ${d}`);
    if ((b - c + d) * a === 24) solutions.push(`(${b} - ${c} + ${d}) * ${a}`);
    if ((b - d + a) * c === 24) solutions.push(`(${b} - ${d} + ${a}) * ${c}`);
    if ((b - d + c) * a === 24) solutions.push(`(${b} - ${d} + ${c}) * ${a}`);
    if ((c - a + b) * d === 24) solutions.push(`(${c} - ${a} + ${b}) * ${d}`);
    if ((c - a + d) * b === 24) solutions.push(`(${c} - ${a} + ${d}) * ${b}`);
    if ((c - b + a) * d === 24) solutions.push(`(${c} - ${b} + ${a}) * ${d}`);
    if ((c - b + d) * a === 24) solutions.push(`(${c} - ${b} + ${d}) * ${a}`);
    if ((c - d + a) * b === 24) solutions.push(`(${c} - ${d} + ${a}) * ${b}`);
    if ((c - d + b) * a === 24) solutions.push(`(${c} - ${d} + ${b}) * ${a}`);
    if ((d - a + b) * c === 24) solutions.push(`(${d} - ${a} + ${b}) * ${c}`);
    if ((d - a + c) * b === 24) solutions.push(`(${d} - ${a} + ${c}) * ${b}`);
    if ((d - b + a) * c === 24) solutions.push(`(${d} - ${b} + ${a}) * ${c}`);
    if ((d - b + c) * a === 24) solutions.push(`(${d} - ${b} + ${c}) * ${a}`);
    if ((d - c + a) * b === 24) solutions.push(`(${d} - ${c} + ${a}) * ${b}`);
    if ((d - c + b) * a === 24) solutions.push(`(${d} - ${c} + ${b}) * ${a}`);

    // パターン6: a + b + c - d = 24
    if (a + b + c - d === 24) solutions.push(`${a} + ${b} + ${c} - ${d}`);
    if (a + b + d - c === 24) solutions.push(`${a} + ${b} + ${d} - ${c}`);
    if (a + c + d - b === 24) solutions.push(`${a} + ${c} + ${d} - ${b}`);
    if (b + c + d - a === 24) solutions.push(`${b} + ${c} + ${d} - ${a}`);

    // パターン7: (a + b) / c * d = 24
    if (c !== 0 && (a + b) / c * d === 24) solutions.push(`(${a} + ${b}) / ${c} * ${d}`);
    if (c !== 0 && (a + d) / c * b === 24) solutions.push(`(${a} + ${d}) / ${c} * ${b}`);
    if (c !== 0 && (b + d) / c * a === 24) solutions.push(`(${b} + ${d}) / ${c} * ${a}`);
    if (d !== 0 && (a + b) / d * c === 24) solutions.push(`(${a} + ${b}) / ${d} * ${c}`);
    if (d !== 0 && (a + c) / d * b === 24) solutions.push(`(${a} + ${c}) / ${d} * ${b}`);
    if (d !== 0 && (b + c) / d * a === 24) solutions.push(`(${b} + ${c}) / ${d} * ${a}`);
    if (b !== 0 && (a + c) / b * d === 24) solutions.push(`(${a} + ${c}) / ${b} * ${d}`);
    if (b !== 0 && (a + d) / b * c === 24) solutions.push(`(${a} + ${d}) / ${b} * ${c}`);
    if (b !== 0 && (c + d) / b * a === 24) solutions.push(`(${c} + ${d}) / ${b} * ${a}`);
    if (a !== 0 && (b + c) / a * d === 24) solutions.push(`(${b} + ${c}) / ${a} * ${d}`);
    if (a !== 0 && (b + d) / a * c === 24) solutions.push(`(${b} + ${d}) / ${a} * ${c}`);
    if (a !== 0 && (c + d) / a * b === 24) solutions.push(`(${c} + ${d}) / ${a} * ${b}`);

    // パターン8: a * b / c * d = 24
    if (c !== 0 && a * b / c * d === 24) solutions.push(`${a} * ${b} / ${c} * ${d}`);
    if (c !== 0 && a * d / c * b === 24) solutions.push(`${a} * ${d} / ${c} * ${b}`);
    if (c !== 0 && b * d / c * a === 24) solutions.push(`${b} * ${d} / ${c} * ${a}`);
    if (d !== 0 && a * b / d * c === 24) solutions.push(`${a} * ${b} / ${d} * ${c}`);
    if (d !== 0 && a * c / d * b === 24) solutions.push(`${a} * ${c} / ${d} * ${b}`);
    if (d !== 0 && b * c / d * a === 24) solutions.push(`${b} * ${c} / ${d} * ${a}`);
    if (b !== 0 && a * c / b * d === 24) solutions.push(`${a} * ${c} / ${b} * ${d}`);
    if (b !== 0 && a * d / b * c === 24) solutions.push(`${a} * ${d} / ${b} * ${c}`);
    if (b !== 0 && c * d / b * a === 24) solutions.push(`${c} * ${d} / ${b} * ${a}`);
    if (a !== 0 && b * c / a * d === 24) solutions.push(`${b} * ${c} / ${a} * ${d}`);
    if (a !== 0 && b * d / a * c === 24) solutions.push(`${b} * ${d} / ${a} * ${c}`);
    if (a !== 0 && c * d / a * b === 24) solutions.push(`${c} * ${d} / ${a} * ${b}`);

    // パターン9: (a * b - c) * d = 24
    if ((a * b - c) * d === 24) solutions.push(`(${a} * ${b} - ${c}) * ${d}`);
    if ((a * b - d) * c === 24) solutions.push(`(${a} * ${b} - ${d}) * ${c}`);
    if ((a * c - b) * d === 24) solutions.push(`(${a} * ${c} - ${b}) * ${d}`);
    if ((a * c - d) * b === 24) solutions.push(`(${a} * ${c} - ${d}) * ${b}`);
    if ((a * d - b) * c === 24) solutions.push(`(${a} * ${d} - ${b}) * ${c}`);
    if ((a * d - c) * b === 24) solutions.push(`(${a} * ${d} - ${c}) * ${b}`);
    if ((b * c - a) * d === 24) solutions.push(`(${b} * ${c} - ${a}) * ${d}`);
    if ((b * c - d) * a === 24) solutions.push(`(${b} * ${c} - ${d}) * ${a}`);
    if ((b * d - a) * c === 24) solutions.push(`(${b} * ${d} - ${a}) * ${c}`);
    if ((b * d - c) * a === 24) solutions.push(`(${b} * ${d} - ${c}) * ${a}`);
    if ((c * d - a) * b === 24) solutions.push(`(${c} * ${d} - ${a}) * ${b}`);
    if ((c * d - b) * a === 24) solutions.push(`(${c} * ${d} - ${b}) * ${a}`);

    // パターン10: (a + b) * c * d = 24
    if ((a + b) * c * d === 24) solutions.push(`(${a} + ${b}) * ${c} * ${d}`);
    if ((a + c) * b * d === 24) solutions.push(`(${a} + ${c}) * ${b} * ${d}`);
    if ((a + d) * b * c === 24) solutions.push(`(${a} + ${d}) * ${b} * ${c}`);
    if ((b + c) * a * d === 24) solutions.push(`(${b} + ${c}) * ${a} * ${d}`);
    if ((b + d) * a * c === 24) solutions.push(`(${b} + ${d}) * ${a} * ${c}`);
    if ((c + d) * a * b === 24) solutions.push(`(${c} + ${d}) * ${a} * ${b}`);

    // パターン11: a + b * c / d = 24
    if (d !== 0 && a + b * c / d === 24) solutions.push(`${a} + ${b} * ${c} / ${d}`);
    if (d !== 0 && b + a * c / d === 24) solutions.push(`${b} + ${a} * ${c} / ${d}`);
    if (d !== 0 && c + a * b / d === 24) solutions.push(`${c} + ${a} * ${b} / ${d}`);
    if (c !== 0 && a + b * d / c === 24) solutions.push(`${a} + ${b} * ${d} / ${c}`);
    if (c !== 0 && b + a * d / c === 24) solutions.push(`${b} + ${a} * ${d} / ${c}`);
    if (c !== 0 && d + a * b / c === 24) solutions.push(`${d} + ${a} * ${b} / ${c}`);
    if (b !== 0 && a + c * d / b === 24) solutions.push(`${a} + ${c} * ${d} / ${b}`);
    if (b !== 0 && c + a * d / b === 24) solutions.push(`${c} + ${a} * ${d} / ${b}`);
    if (b !== 0 && d + a * c / b === 24) solutions.push(`${d} + ${a} * ${c} / ${b}`);
    if (a !== 0 && b + c * d / a === 24) solutions.push(`${b} + ${c} * ${d} / ${a}`);
    if (a !== 0 && c + b * d / a === 24) solutions.push(`${c} + ${b} * ${d} / ${a}`);
    if (a !== 0 && d + b * c / a === 24) solutions.push(`${d} + ${b} * ${c} / ${a}`);

    // パターン12: (a - b) * c + d = 24
    if ((a - b) * c + d === 24) solutions.push(`(${a} - ${b}) * ${c} + ${d}`);
    if ((a - b) * d + c === 24) solutions.push(`(${a} - ${b}) * ${d} + ${c}`);
    if ((a - c) * b + d === 24) solutions.push(`(${a} - ${c}) * ${b} + ${d}`);
    if ((a - c) * d + b === 24) solutions.push(`(${a} - ${c}) * ${d} + ${b}`);
    if ((a - d) * b + c === 24) solutions.push(`(${a} - ${d}) * ${b} + ${c}`);
    if ((a - d) * c + b === 24) solutions.push(`(${a} - ${d}) * ${c} + ${b}`);
    if ((b - a) * c + d === 24) solutions.push(`(${b} - ${a}) * ${c} + ${d}`);
    if ((b - a) * d + c === 24) solutions.push(`(${b} - ${a}) * ${d} + ${c}`);
    if ((b - c) * a + d === 24) solutions.push(`(${b} - ${c}) * ${a} + ${d}`);
    if ((b - c) * d + a === 24) solutions.push(`(${b} - ${c}) * ${d} + ${a}`);
    if ((b - d) * a + c === 24) solutions.push(`(${b} - ${d}) * ${a} + ${c}`);
    if ((b - d) * c + a === 24) solutions.push(`(${b} - ${d}) * ${c} + ${a}`);
    if ((c - a) * b + d === 24) solutions.push(`(${c} - ${a}) * ${b} + ${d}`);
    if ((c - a) * d + b === 24) solutions.push(`(${c} - ${a}) * ${d} + ${b}`);
    if ((c - b) * a + d === 24) solutions.push(`(${c} - ${b}) * ${a} + ${d}`);
    if ((c - b) * d + a === 24) solutions.push(`(${c} - ${b}) * ${d} + ${a}`);
    if ((c - d) * a + b === 24) solutions.push(`(${c} - ${d}) * ${a} + ${b}`);
    if ((c - d) * b + a === 24) solutions.push(`(${c} - ${d}) * ${b} + ${a}`);
    if ((d - a) * b + c === 24) solutions.push(`(${d} - ${a}) * ${b} + ${c}`);
    if ((d - a) * c + b === 24) solutions.push(`(${d} - ${a}) * ${c} + ${b}`);
    if ((d - b) * a + c === 24) solutions.push(`(${d} - ${b}) * ${a} + ${c}`);
    if ((d - b) * c + a === 24) solutions.push(`(${d} - ${b}) * ${c} + ${a}`);
    if ((d - c) * a + b === 24) solutions.push(`(${d} - ${c}) * ${a} + ${b}`);
    if ((d - c) * b + a === 24) solutions.push(`(${d} - ${c}) * ${b} + ${a}`);

    // パターン13: a / (b / c - d) = 24
    if (c !== 0 && b / c - d !== 0 && a / (b / c - d) === 24) solutions.push(`${a} / (${b} / ${c} - ${d})`);
    if (c !== 0 && b / c - a !== 0 && d / (b / c - a) === 24) solutions.push(`${d} / (${b} / ${c} - ${a})`);
    if (c !== 0 && d / c - b !== 0 && a / (d / c - b) === 24) solutions.push(`${a} / (${d} / ${c} - ${b})`);
    if (c !== 0 && d / c - a !== 0 && b / (d / c - a) === 24) solutions.push(`${b} / (${d} / ${c} - ${a})`);
    if (c !== 0 && a / c - d !== 0 && b / (a / c - d) === 24) solutions.push(`${b} / (${a} / ${c} - ${d})`);
    if (c !== 0 && a / c - b !== 0 && d / (a / c - b) === 24) solutions.push(`${d} / (${a} / ${c} - ${b})`);
    if (d !== 0 && b / d - c !== 0 && a / (b / d - c) === 24) solutions.push(`${a} / (${b} / ${d} - ${c})`);
    if (d !== 0 && b / d - a !== 0 && c / (b / d - a) === 24) solutions.push(`${c} / (${b} / ${d} - ${a})`);
    if (d !== 0 && c / d - b !== 0 && a / (c / d - b) === 24) solutions.push(`${a} / (${c} / ${d} - ${b})`);
    if (d !== 0 && c / d - a !== 0 && b / (c / d - a) === 24) solutions.push(`${b} / (${c} / ${d} - ${a})`);
    if (d !== 0 && a / d - c !== 0 && b / (a / d - c) === 24) solutions.push(`${b} / (${a} / ${d} - ${c})`);
    if (d !== 0 && a / d - b !== 0 && c / (a / d - b) === 24) solutions.push(`${c} / (${a} / ${d} - ${b})`);
    if (b !== 0 && c / b - d !== 0 && a / (c / b - d) === 24) solutions.push(`${a} / (${c} / ${b} - ${d})`);
    if (b !== 0 && c / b - a !== 0 && d / (c / b - a) === 24) solutions.push(`${d} / (${c} / ${b} - ${a})`);
    if (b !== 0 && d / b - c !== 0 && a / (d / b - c) === 24) solutions.push(`${a} / (${d} / ${b} - ${c})`);
    if (b !== 0 && d / b - a !== 0 && c / (d / b - a) === 24) solutions.push(`${c} / (${d} / ${b} - ${a})`);
    if (b !== 0 && a / b - d !== 0 && c / (a / b - d) === 24) solutions.push(`${c} / (${a} / ${b} - ${d})`);
    if (b !== 0 && a / b - c !== 0 && d / (a / b - c) === 24) solutions.push(`${d} / (${a} / ${b} - ${c})`);
    if (a !== 0 && c / a - d !== 0 && b / (c / a - d) === 24) solutions.push(`${b} / (${c} / ${a} - ${d})`);
    if (a !== 0 && c / a - b !== 0 && d / (c / a - b) === 24) solutions.push(`${d} / (${c} / ${a} - ${b})`);
    if (a !== 0 && d / a - c !== 0 && b / (d / a - c) === 24) solutions.push(`${b} / (${d} / ${a} - ${c})`);
    if (a !== 0 && d / a - b !== 0 && c / (d / a - b) === 24) solutions.push(`${c} / (${d} / ${a} - ${b})`);
    if (a !== 0 && b / a - d !== 0 && c / (b / a - d) === 24) solutions.push(`${c} / (${b} / ${a} - ${d})`);
    if (a !== 0 && b / a - c !== 0 && d / (b / a - c) === 24) solutions.push(`${d} / (${b} / ${a} - ${c})`);

    // パターン14: a * (b + c - d) = 24
    if (a * (b + c - d) === 24) solutions.push(`${a} * (${b} + ${c} - ${d})`);
    if (a * (b + d - c) === 24) solutions.push(`${a} * (${b} + ${d} - ${c})`);
    if (a * (c + d - b) === 24) solutions.push(`${a} * (${c} + ${d} - ${b})`);
    if (b * (a + c - d) === 24) solutions.push(`${b} * (${a} + ${c} - ${d})`);
    if (b * (a + d - c) === 24) solutions.push(`${b} * (${a} + ${d} - ${c})`);
    if (b * (c + d - a) === 24) solutions.push(`${b} * (${c} + ${d} - ${a})`);
    if (c * (a + b - d) === 24) solutions.push(`${c} * (${a} + ${b} - ${d})`);
    if (c * (a + d - b) === 24) solutions.push(`${c} * (${a} + ${d} - ${b})`);
    if (c * (b + d - a) === 24) solutions.push(`${c} * (${b} + ${d} - ${a})`);
    if (d * (a + b - c) === 24) solutions.push(`${d} * (${a} + ${b} - ${c})`);
    if (d * (a + c - b) === 24) solutions.push(`${d} * (${a} + ${c} - ${b})`);
    if (d * (b + c - a) === 24) solutions.push(`${d} * (${b} + ${c} - ${a})`);

    // パターン15: a * (b + c + d) = 24
    if (a * (b + c + d) === 24) solutions.push(`${a} * (${b} + ${c} + ${d})`);
    if (b * (a + c + d) === 24) solutions.push(`${b} * (${a} + ${c} + ${d})`);
    if (c * (a + b + d) === 24) solutions.push(`${c} * (${a} + ${b} + ${d})`);
    if (d * (a + b + c) === 24) solutions.push(`${d} * (${a} + ${b} + ${c})`);

    // パターン16: a * (b - c / d) = 24
    if (d !== 0 && a * (b - c / d) === 24) solutions.push(`${a} * (${b} - ${c} / ${d})`);
    if (d !== 0 && a * (c - b / d) === 24) solutions.push(`${a} * (${c} - ${b} / ${d})`);
    if (d !== 0 && b * (a - c / d) === 24) solutions.push(`${b} * (${a} - ${c} / ${d})`);
    if (d !== 0 && b * (c - a / d) === 24) solutions.push(`${b} * (${c} - ${a} / ${d})`);
    if (d !== 0 && c * (a - b / d) === 24) solutions.push(`${c} * (${a} - ${b} / ${d})`);
    if (d !== 0 && c * (b - a / d) === 24) solutions.push(`${c} * (${b} - ${a} / ${d})`);
    if (c !== 0 && a * (b - d / c) === 24) solutions.push(`${a} * (${b} - ${d} / ${c})`);
    if (c !== 0 && a * (d - b / c) === 24) solutions.push(`${a} * (${d} - ${b} / ${c})`);
    if (c !== 0 && b * (a - d / c) === 24) solutions.push(`${b} * (${a} - ${d} / ${c})`);
    if (c !== 0 && b * (d - a / c) === 24) solutions.push(`${b} * (${d} - ${a} / ${c})`);
    if (c !== 0 && d * (a - b / c) === 24) solutions.push(`${d} * (${a} - ${b} / ${c})`);
    if (c !== 0 && d * (b - a / c) === 24) solutions.push(`${d} * (${b} - ${a} / ${c})`);
    if (b !== 0 && a * (c - d / b) === 24) solutions.push(`${a} * (${c} - ${d} / ${b})`);
    if (b !== 0 && a * (d - c / b) === 24) solutions.push(`${a} * (${d} - ${c} / ${b})`);
    if (b !== 0 && c * (a - d / b) === 24) solutions.push(`${c} * (${a} - ${d} / ${b})`);
    if (b !== 0 && c * (d - a / b) === 24) solutions.push(`${c} * (${d} - ${a} / ${b})`);
    if (b !== 0 && d * (a - c / b) === 24) solutions.push(`${d} * (${a} - ${c} / ${b})`);
    if (b !== 0 && d * (c - a / b) === 24) solutions.push(`${d} * (${c} - ${a} / ${b})`);
    if (a !== 0 && b * (c - d / a) === 24) solutions.push(`${b} * (${c} - ${d} / ${a})`);
    if (a !== 0 && b * (d - c / a) === 24) solutions.push(`${b} * (${d} - ${c} / ${a})`);
    if (a !== 0 && c * (b - d / a) === 24) solutions.push(`${c} * (${b} - ${d} / ${a})`);
    if (a !== 0 && c * (d - b / a) === 24) solutions.push(`${c} * (${d} - ${b} / ${a})`);
    if (a !== 0 && d * (b - c / a) === 24) solutions.push(`${d} * (${b} - ${c} / ${a})`);
    if (a !== 0 && d * (c - b / a) === 24) solutions.push(`${d} * (${c} - ${b} / ${a})`);

    // パターン16-2: a * (b - c - d) = 24
    if (a * (b - c - d) === 24) solutions.push(`${a} * (${b} - ${c} - ${d})`);
    if (a * (b - d - c) === 24) solutions.push(`${a} * (${b} - ${d} - ${c})`);
    if (a * (c - b - d) === 24) solutions.push(`${a} * (${c} - ${b} - ${d})`);
    if (a * (c - d - b) === 24) solutions.push(`${a} * (${c} - ${d} - ${b})`);
    if (a * (d - b - c) === 24) solutions.push(`${a} * (${d} - ${b} - ${c})`);
    if (a * (d - c - b) === 24) solutions.push(`${a} * (${d} - ${c} - ${b})`);
    if (b * (a - c - d) === 24) solutions.push(`${b} * (${a} - ${c} - ${d})`);
    if (b * (a - d - c) === 24) solutions.push(`${b} * (${a} - ${d} - ${c})`);
    if (b * (c - a - d) === 24) solutions.push(`${b} * (${c} - ${a} - ${d})`);
    if (b * (c - d - a) === 24) solutions.push(`${b} * (${c} - ${d} - ${a})`);
    if (b * (d - a - c) === 24) solutions.push(`${b} * (${d} - ${a} - ${c})`);
    if (b * (d - c - a) === 24) solutions.push(`${b} * (${d} - ${c} - ${a})`);
    if (c * (a - b - d) === 24) solutions.push(`${c} * (${a} - ${b} - ${d})`);
    if (c * (a - d - b) === 24) solutions.push(`${c} * (${a} - ${d} - ${b})`);
    if (c * (b - a - d) === 24) solutions.push(`${c} * (${b} - ${a} - ${d})`);
    if (c * (b - d - a) === 24) solutions.push(`${c} * (${b} - ${d} - ${a})`);
    if (c * (d - a - b) === 24) solutions.push(`${c} * (${d} - ${a} - ${b})`);
    if (c * (d - b - a) === 24) solutions.push(`${c} * (${d} - ${b} - ${a})`);
    if (d * (a - b - c) === 24) solutions.push(`${d} * (${a} - ${b} - ${c})`);
    if (d * (a - c - b) === 24) solutions.push(`${d} * (${a} - ${c} - ${b})`);
    if (d * (b - a - c) === 24) solutions.push(`${d} * (${b} - ${a} - ${c})`);
    if (d * (b - c - a) === 24) solutions.push(`${d} * (${b} - ${c} - ${a})`);
    if (d * (c - a - b) === 24) solutions.push(`${d} * (${c} - ${a} - ${b})`);
    if (d * (c - b - a) === 24) solutions.push(`${d} * (${c} - ${b} - ${a})`);

    // パターン17: a * (b + c) - d = 24
    if (a * (b + c) - d === 24) solutions.push(`${a} * (${b} + ${c}) - ${d}`);
    if (a * (b + d) - c === 24) solutions.push(`${a} * (${b} + ${d}) - ${c}`);
    if (a * (c + d) - b === 24) solutions.push(`${a} * (${c} + ${d}) - ${b}`);
    if (b * (a + c) - d === 24) solutions.push(`${b} * (${a} + ${c}) - ${d}`);
    if (b * (a + d) - c === 24) solutions.push(`${b} * (${a} + ${d}) - ${c}`);
    if (b * (c + d) - a === 24) solutions.push(`${b} * (${c} + ${d}) - ${a}`);
    if (c * (a + b) - d === 24) solutions.push(`${c} * (${a} + ${b}) - ${d}`);
    if (c * (a + d) - b === 24) solutions.push(`${c} * (${a} + ${d}) - ${b}`);
    if (c * (b + d) - a === 24) solutions.push(`${c} * (${b} + ${d}) - ${a}`);
    if (d * (a + b) - c === 24) solutions.push(`${d} * (${a} + ${b}) - ${c}`);
    if (d * (a + c) - b === 24) solutions.push(`${d} * (${a} + ${c}) - ${b}`);
    if (d * (b + c) - a === 24) solutions.push(`${d} * (${b} + ${c}) - ${a}`);

    // パターン18: a / (b - c / d) = 24
    if (d !== 0 && b - c / d !== 0 && a / (b - c / d) === 24) solutions.push(`${a} / (${b} - ${c} / ${d})`);
    if (d !== 0 && c - b / d !== 0 && a / (c - b / d) === 24) solutions.push(`${a} / (${c} - ${b} / ${d})`);
    if (d !== 0 && a - c / d !== 0 && b / (a - c / d) === 24) solutions.push(`${b} / (${a} - ${c} / ${d})`);
    if (d !== 0 && c - a / d !== 0 && b / (c - a / d) === 24) solutions.push(`${b} / (${c} - ${a} / ${d})`);
    if (d !== 0 && a - b / d !== 0 && c / (a - b / d) === 24) solutions.push(`${c} / (${a} - ${b} / ${d})`);
    if (d !== 0 && b - a / d !== 0 && c / (b - a / d) === 24) solutions.push(`${c} / (${b} - ${a} / ${d})`);
    if (c !== 0 && b - d / c !== 0 && a / (b - d / c) === 24) solutions.push(`${a} / (${b} - ${d} / ${c})`);
    if (c !== 0 && d - b / c !== 0 && a / (d - b / c) === 24) solutions.push(`${a} / (${d} - ${b} / ${c})`);
    if (c !== 0 && a - d / c !== 0 && b / (a - d / c) === 24) solutions.push(`${b} / (${a} - ${d} / ${c})`);
    if (c !== 0 && d - a / c !== 0 && b / (d - a / c) === 24) solutions.push(`${b} / (${d} - ${a} / ${c})`);
    if (c !== 0 && a - b / c !== 0 && d / (a - b / c) === 24) solutions.push(`${d} / (${a} - ${b} / ${c})`);
    if (c !== 0 && b - a / c !== 0 && d / (b - a / c) === 24) solutions.push(`${d} / (${b} - ${a} / ${c})`);
    if (b !== 0 && c - d / b !== 0 && a / (c - d / b) === 24) solutions.push(`${a} / (${c} - ${d} / ${b})`);
    if (b !== 0 && d - c / b !== 0 && a / (d - c / b) === 24) solutions.push(`${a} / (${d} - ${c} / ${b})`);
    if (b !== 0 && a - d / b !== 0 && c / (a - d / b) === 24) solutions.push(`${c} / (${a} - ${d} / ${b})`);
    if (b !== 0 && d - a / b !== 0 && c / (d - a / b) === 24) solutions.push(`${c} / (${d} - ${a} / ${b})`);
    if (b !== 0 && a - c / b !== 0 && d / (a - c / b) === 24) solutions.push(`${d} / (${a} - ${c} / ${b})`);
    if (b !== 0 && c - a / b !== 0 && d / (c - a / b) === 24) solutions.push(`${d} / (${c} - ${a} / ${b})`);
    if (a !== 0 && c - d / a !== 0 && b / (c - d / a) === 24) solutions.push(`${b} / (${c} - ${d} / ${a})`);
    if (a !== 0 && d - c / a !== 0 && b / (d - c / a) === 24) solutions.push(`${b} / (${d} - ${c} / ${a})`);
    if (a !== 0 && b - d / a !== 0 && c / (b - d / a) === 24) solutions.push(`${c} / (${b} - ${d} / ${a})`);
    if (a !== 0 && d - b / a !== 0 && c / (d - b / a) === 24) solutions.push(`${c} / (${d} - ${b} / ${a})`);
    if (a !== 0 && b - c / a !== 0 && d / (b - c / a) === 24) solutions.push(`${d} / (${b} - ${c} / ${a})`);
    if (a !== 0 && c - b / a !== 0 && d / (c - b / a) === 24) solutions.push(`${d} / (${c} - ${b} / ${a})`);

    // パターン19: a * b + c + d = 24
    if (a * b + c + d === 24) solutions.push(`${a} * ${b} + ${c} + ${d}`);
    if (a * c + b + d === 24) solutions.push(`${a} * ${c} + ${b} + ${d}`);
    if (a * d + b + c === 24) solutions.push(`${a} * ${d} + ${b} + ${c}`);
    if (b * c + a + d === 24) solutions.push(`${b} * ${c} + ${a} + ${d}`);
    if (b * d + a + c === 24) solutions.push(`${b} * ${d} + ${a} + ${c}`);
    if (c * d + a + b === 24) solutions.push(`${c} * ${d} + ${a} + ${b}`);

    // パターン20: (a - b) * (c / d) = 24
    if (d !== 0 && (a - b) * (c / d) === 24) solutions.push(`(${a} - ${b}) * (${c} / ${d})`);
    if (d !== 0 && (b - a) * (c / d) === 24) solutions.push(`(${b} - ${a}) * (${c} / ${d})`);
    if (d !== 0 && (a - c) * (b / d) === 24) solutions.push(`(${a} - ${c}) * (${b} / ${d})`);
    if (d !== 0 && (c - a) * (b / d) === 24) solutions.push(`(${c} - ${a}) * (${b} / ${d})`);
    if (d !== 0 && (b - c) * (a / d) === 24) solutions.push(`(${b} - ${c}) * (${a} / ${d})`);
    if (d !== 0 && (c - b) * (a / d) === 24) solutions.push(`(${c} - ${b}) * (${a} / ${d})`);
    if (c !== 0 && (a - b) * (d / c) === 24) solutions.push(`(${a} - ${b}) * (${d} / ${c})`);
    if (c !== 0 && (b - a) * (d / c) === 24) solutions.push(`(${b} - ${a}) * (${d} / ${c})`);
    if (c !== 0 && (a - d) * (b / c) === 24) solutions.push(`(${a} - ${d}) * (${b} / ${c})`);
    if (c !== 0 && (d - a) * (b / c) === 24) solutions.push(`(${d} - ${a}) * (${b} / ${c})`);
    if (c !== 0 && (b - d) * (a / c) === 24) solutions.push(`(${b} - ${d}) * (${a} / ${c})`);
    if (c !== 0 && (d - b) * (a / c) === 24) solutions.push(`(${d} - ${b}) * (${a} / ${c})`);
    if (b !== 0 && (a - c) * (d / b) === 24) solutions.push(`(${a} - ${c}) * (${d} / ${b})`);
    if (b !== 0 && (c - a) * (d / b) === 24) solutions.push(`(${c} - ${a}) * (${d} / ${b})`);
    if (b !== 0 && (a - d) * (c / b) === 24) solutions.push(`(${a} - ${d}) * (${c} / ${b})`);
    if (b !== 0 && (d - a) * (c / b) === 24) solutions.push(`(${d} - ${a}) * (${c} / ${b})`);
    if (b !== 0 && (c - d) * (a / b) === 24) solutions.push(`(${c} - ${d}) * (${a} / ${b})`);
    if (b !== 0 && (d - c) * (a / b) === 24) solutions.push(`(${d} - ${c}) * (${a} / ${b})`);
    if (a !== 0 && (b - c) * (d / a) === 24) solutions.push(`(${b} - ${c}) * (${d} / ${a})`);
    if (a !== 0 && (c - b) * (d / a) === 24) solutions.push(`(${c} - ${b}) * (${d} / ${a})`);
    if (a !== 0 && (b - d) * (c / a) === 24) solutions.push(`(${b} - ${d}) * (${c} / ${a})`);
    if (a !== 0 && (d - b) * (c / a) === 24) solutions.push(`(${d} - ${b}) * (${c} / ${a})`);
    if (a !== 0 && (c - d) * (b / a) === 24) solutions.push(`(${c} - ${d}) * (${b} / ${a})`);
    if (a !== 0 && (d - c) * (b / a) === 24) solutions.push(`(${d} - ${c}) * (${b} / ${a})`);

    // パターン21: (a + b) * c + d = 24
    if ((a + b) * c + d === 24) solutions.push(`(${a} + ${b}) * ${c} + ${d}`);
    if ((a + b) * d + c === 24) solutions.push(`(${a} + ${b}) * ${d} + ${c}`);
    if ((a + c) * b + d === 24) solutions.push(`(${a} + ${c}) * ${b} + ${d}`);
    if ((a + c) * d + b === 24) solutions.push(`(${a} + ${c}) * ${d} + ${b}`);
    if ((a + d) * b + c === 24) solutions.push(`(${a} + ${d}) * ${b} + ${c}`);
    if ((a + d) * c + b === 24) solutions.push(`(${a} + ${d}) * ${c} + ${b}`);
    if ((b + c) * a + d === 24) solutions.push(`(${b} + ${c}) * ${a} + ${d}`);
    if ((b + c) * d + a === 24) solutions.push(`(${b} + ${c}) * ${d} + ${a}`);
    if ((b + d) * a + c === 24) solutions.push(`(${b} + ${d}) * ${a} + ${c}`);
    if ((b + d) * c + a === 24) solutions.push(`(${b} + ${d}) * ${c} + ${a}`);
    if ((c + d) * a + b === 24) solutions.push(`(${c} + ${d}) * ${a} + ${b}`);
    if ((c + d) * b + a === 24) solutions.push(`(${c} + ${d}) * ${b} + ${a}`);

    // パターン22: (a * b) / (c - d) = 24
    if (c - d !== 0 && (a * b) / (c - d) === 24) solutions.push(`(${a} * ${b}) / (${c} - ${d})`);
    if (d - c !== 0 && (a * b) / (d - c) === 24) solutions.push(`(${a} * ${b}) / (${d} - ${c})`);
    if (c - d !== 0 && (a * c) / (b - d) === 24) solutions.push(`(${a} * ${c}) / (${b} - ${d})`);
    if (d - b !== 0 && (a * c) / (d - b) === 24) solutions.push(`(${a} * ${c}) / (${d} - ${b})`);
    if (c - d !== 0 && (a * d) / (b - c) === 24) solutions.push(`(${a} * ${d}) / (${b} - ${c})`);
    if (c - b !== 0 && (a * d) / (c - b) === 24) solutions.push(`(${a} * ${d}) / (${c} - ${b})`);
    if (c - d !== 0 && (b * c) / (a - d) === 24) solutions.push(`(${b} * ${c}) / (${a} - ${d})`);
    if (d - a !== 0 && (b * c) / (d - a) === 24) solutions.push(`(${b} * ${c}) / (${d} - ${a})`);
    if (c - d !== 0 && (b * d) / (a - c) === 24) solutions.push(`(${b} * ${d}) / (${a} - ${c})`);
    if (c - a !== 0 && (b * d) / (c - a) === 24) solutions.push(`(${b} * ${d}) / (${c} - ${a})`);
    if (b - d !== 0 && (c * d) / (a - b) === 24) solutions.push(`(${c} * ${d}) / (${a} - ${b})`);
    if (b - a !== 0 && (c * d) / (b - a) === 24) solutions.push(`(${c} * ${d}) / (${b} - ${a})`);
    if (b - d !== 0 && (a * b) / (c - d) === 24) solutions.push(`(${a} * ${b}) / (${c} - ${d})`);
    if (b - c !== 0 && (a * c) / (b - d) === 24) solutions.push(`(${a} * ${c}) / (${b} - ${d})`);
    if (b - c !== 0 && (a * d) / (b - c) === 24) solutions.push(`(${a} * ${d}) / (${b} - ${c})`);
    if (a - d !== 0 && (b * c) / (a - d) === 24) solutions.push(`(${b} * ${c}) / (${a} - ${d})`);
    if (a - c !== 0 && (b * d) / (a - c) === 24) solutions.push(`(${b} * ${d}) / (${a} - ${c})`);
    if (a - b !== 0 && (c * d) / (a - b) === 24) solutions.push(`(${c} * ${d}) / (${a} - ${b})`);

    // パターン23: (a - b) * c - d = 24
    if ((a - b) * c - d === 24) solutions.push(`(${a} - ${b}) * ${c} - ${d}`);
    if ((a - b) * d - c === 24) solutions.push(`(${a} - ${b}) * ${d} - ${c}`);
    if ((a - c) * b - d === 24) solutions.push(`(${a} - ${c}) * ${b} - ${d}`);
    if ((a - c) * d - b === 24) solutions.push(`(${a} - ${c}) * ${d} - ${b}`);
    if ((a - d) * b - c === 24) solutions.push(`(${a} - ${d}) * ${b} - ${c}`);
    if ((a - d) * c - b === 24) solutions.push(`(${a} - ${d}) * ${c} - ${b}`);
    if ((b - a) * c - d === 24) solutions.push(`(${b} - ${a}) * ${c} - ${d}`);
    if ((b - a) * d - c === 24) solutions.push(`(${b} - ${a}) * ${d} - ${c}`);
    if ((b - c) * a - d === 24) solutions.push(`(${b} - ${c}) * ${a} - ${d}`);
    if ((b - c) * d - a === 24) solutions.push(`(${b} - ${c}) * ${d} - ${a}`);
    if ((b - d) * a - c === 24) solutions.push(`(${b} - ${d}) * ${a} - ${c}`);
    if ((b - d) * c - a === 24) solutions.push(`(${b} - ${d}) * ${c} - ${a}`);
    if ((c - a) * b - d === 24) solutions.push(`(${c} - ${a}) * ${b} - ${d}`);
    if ((c - a) * d - b === 24) solutions.push(`(${c} - ${a}) * ${d} - ${b}`);
    if ((c - b) * a - d === 24) solutions.push(`(${c} - ${b}) * ${a} - ${d}`);
    if ((c - b) * d - a === 24) solutions.push(`(${c} - ${b}) * ${d} - ${a}`);
    if ((c - d) * a - b === 24) solutions.push(`(${c} - ${d}) * ${a} - ${b}`);
    if ((c - d) * b - a === 24) solutions.push(`(${c} - ${d}) * ${b} - ${a}`);
    if ((d - a) * b - c === 24) solutions.push(`(${d} - ${a}) * ${b} - ${c}`);
    if ((d - a) * c - b === 24) solutions.push(`(${d} - ${a}) * ${c} - ${b}`);
    if ((d - b) * a - c === 24) solutions.push(`(${d} - ${b}) * ${a} - ${c}`);
    if ((d - b) * c - a === 24) solutions.push(`(${d} - ${b}) * ${c} - ${a}`);
    if ((d - c) * a - b === 24) solutions.push(`(${d} - ${c}) * ${a} - ${b}`);
    if ((d - c) * b - a === 24) solutions.push(`(${d} - ${c}) * ${b} - ${a}`);

    // レベルに応じて使用可能な演算子でフィルタリング
    const config = levelConfig[gameState.level] || levelConfig[1];
    const allowedOperators = config.operators || ['+', '-', '*', '/', '(', ')'];

    const filteredSolutions = solutions.filter(solution => {
        const usedOperators = solution.match(/[\+\-\*\/\(\)]/g) || [];
        return usedOperators.every(op => allowedOperators.includes(op));
    });

    return filteredSolutions;
}

// ゲーム開姁E
init();


// 紙吹雪演�E
function triggerConfetti() {
    // canvas-confettiが読み込まれてぁE��かチェチE��
    if (typeof confetti === 'function') {
        const canvas = document.getElementById('confettiCanvas');
        if (!canvas) return;

        // キャンバスのサイズを親要素に合わせる�E�念のため�E�E
        // CSSで100%に設定してぁE��が、描画解像度を合わせる忁E��があるかも知れなぁE
        // canvas-confetti.createを使用すると、�E動的にリサイズ処琁E��どもしてくれる場合があるが、E
        // ここでは親要素のサイズを取得して設定すめE
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // キャンバス専用のインスタンスを作�E
        const myConfetti = confetti.create(canvas, {
            resize: true,
            useWorker: true
        });

        // チE��ォルト�E紙吹雪
        myConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // 左側からの発封E
        setTimeout(() => {
            myConfetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
        }, 200);

        // 右側からの発封E
        setTimeout(() => {
            myConfetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 400);

        // 最後に大量�E紙吹雪
        setTimeout(() => {
            const end = Date.now() + 1000;

            (function frame() {
                myConfetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                myConfetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }, 1000);
    }
}

// マスコットが動き回る演出の開始
function startMascotWandering() {
    if (!mascotCharacter || !speechBubble || gameState.isWandering) return;
    
    gameState.isWandering = true;
    speechBubble.classList.remove('show'); // メッセージを隠す
    mascotCharacter.classList.add('wandering');
    
    let moveCount = 0;
    const maxMoves = 6; // 6回ランダム移動
    
    const moveMascot = () => {
        if (moveCount >= maxMoves) {
            stopMascotWandering();
            return;
        }
        
        // 画面内のランダムな位置を計算（端によりすぎないように20%-80%範囲）
        const randomX = Math.random() * 60 + 20; // 20vw to 80vw
        const randomY = Math.random() * 60 + 20; // 20vh to 80vh
        
        mascotCharacter.style.left = randomX + 'vw';
        mascotCharacter.style.top = randomY + 'vh';
        mascotCharacter.style.position = 'fixed';
        
        moveCount++;
        setTimeout(moveMascot, 1500); // 1.5秒ごとに移動
    };
    
    moveMascot();
}

// マスコットが動き回る演出の終了
function stopMascotWandering() {
    if (!mascotCharacter) return;
    
    // 元の位置に戻すための座標。CSSのデフォルトに戻す。
    mascotCharacter.style.left = '';
    mascotCharacter.style.top = '';
    mascotCharacter.style.position = '';
    
    setTimeout(() => {
        mascotCharacter.classList.remove('wandering');
        gameState.isWandering = false;
        gameState.mascotPokeCount = 0; // カウントリセット
        
        // 戻った時のメッセージ
        updateMascot('はぁ、疲れたわ... もう勘弁してや！', 'mascot-thinking');
    }, 1500); // 最後の移動が終わるのを待ってからクラスを削除
}
