// ゲーム状態
let gameState = {
    currentNumbers: [],
    totalAttempts: 0,
    correctAnswers: 0,
    streak: 0,
    level: 1,
    solutions: [],
    lastButtonType: null, // 最後に押したボタンの種類を記録
    usedProblems: new Set() // 出題済みの問題を記録
};

// レベル別の数字生成設定
const levelConfig = {
    1: { min: 1, max: 9, operators: ['+', '-', '*', '(', ')'], requiresParentheses: false },
    2: { min: 1, max: 12, operators: ['+', '-', '*', '(', ')'], requiresParentheses: true },
    3: { min: 1, max: 13, operators: ['+', '-', '*', '/', '(', ')'], requiresParentheses: true }
};

// 既知の解答パターン
const knownSolutions = [
    { numbers: [8, 8, 3, 3], solution: '8 / (3 - 8/3)' },
    { numbers: [1, 2, 3, 4], solution: '(1 + 2 + 3) * 4' },
    { numbers: [2, 3, 4, 5], solution: '4 * (5 + 3 - 2)' },
    { numbers: [6, 6, 6, 6], solution: '6 + 6 + 6 + 6' },
    { numbers: [1, 3, 4, 6], solution: '6 / (1 - 3/4)' },
    { numbers: [3, 3, 8, 8], solution: '8 / (3 - 8/3)' },
    { numbers: [1, 5, 5, 5], solution: '5 * (5 - 1/5)' },
    { numbers: [2, 2, 6, 8], solution: '(8 - 2) * (6 - 2)' },
    { numbers: [3, 4, 5, 6], solution: '6 * (5 - 4 + 3)' },
    // レベル1用（括弧なしで解ける問題）
    { numbers: [1, 3, 4, 5], solution: '1 + 3 + 4 * 5' },
    { numbers: [1, 7, 8, 8], solution: '1 + 7 + 8 + 8' },
    { numbers: [2, 6, 8, 8], solution: '2 + 6 + 8 + 8' },
    { numbers: [3, 5, 8, 8], solution: '3 + 5 + 8 + 8' },
    { numbers: [4, 4, 8, 8], solution: '4 + 4 + 8 + 8' },
    // レベル2用（×と括弧を使う問題）
    { numbers: [1, 2, 6, 6], solution: '(1 + 2) * 6 + 6' },
    { numbers: [2, 4, 5, 6], solution: '(2 + 4) * 5 - 6' }
];

// 解答不可能な組み合わせ
const impossibleCombinations = [
    // 1が2つ以上含まれる組み合わせ
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
    
    // 1が1つ含まれる主要な不可能パターン
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
    
    // 4以上の主要な不可能パターン
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
const hintBtn = document.getElementById('hintBtn');
const solutionBtn = document.getElementById('solutionBtn');
const newGameBtn = document.getElementById('newGameBtn');
const accuracySpan = document.getElementById('accuracy');
const streakSpan = document.getElementById('streak');
const levelSelect = document.getElementById('levelSelect');

// 初期化
function init() {
    generateNewNumbers();
    attachEventListeners();
    
    // レベルカード全体をクリック可能にする
    const levelCard = document.querySelector('.level-card');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    
    console.log('Level card found:', levelCard);
    console.log('Dropdown arrow found:', dropdownArrow);
    
    if (levelCard && dropdownArrow) {
        // レベルカードをクリックしたらセレクトボックスを開く
        levelCard.addEventListener('click', (e) => {
            console.log('Level card clicked');
            // セレクトボックス自体のクリックでない場合のみ処理
            if (e.target !== levelSelect) {
                levelSelect.focus();
                // ブラウザによってはshowPicker()が使える
                if (levelSelect.showPicker) {
                    levelSelect.showPicker();
                } else {
                    // フォールバック：クリックイベントを発火
                    const clickEvent = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    levelSelect.dispatchEvent(clickEvent);
                }
            }
        });
    } else {
        console.error('Level card or dropdown arrow not found!');
    }
}

// イベントリスナー
function attachEventListeners() {
    submitBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    hintBtn.addEventListener('click', showHint);
    solutionBtn.addEventListener('click', showSolution);
    newGameBtn.addEventListener('click', generateNewNumbers);
    levelSelect.addEventListener('change', handleLevelChange);
    
    // 計算機ボタンのイベントリスナー
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', handleCalculatorButton);
    });
}

// レベル変更時の処理
function handleLevelChange() {
    const newLevel = parseInt(levelSelect.value);
    // レベルは1-3の範囲に制限
    gameState.level = Math.min(Math.max(newLevel, 1), 3);
    gameState.streak = 0; // 連続正解をリセット
    gameState.usedProblems.clear(); // 使用済み問題をリセット
    console.log('レベル変更：使用済み問題をリセットしました');
    updateDisplay();
    generateNewNumbers();
}

// 電卓を開く
// 計算式の最後の入力タイプを判別
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

// 計算機ボタンの処理
function handleCalculatorButton(e) {
    const button = e.currentTarget; // e.target から e.currentTarget に変更
    const value = button.dataset.value;
    
    // valueが未定義の場合は処理しない
    if (value === undefined) {
        return;
    }
    
    const currentValue = answerInput.value;
    const cursorPosition = answerInput.selectionStart;
    
    if (value === 'clear') {
        answerInput.value = '';
        gameState.lastButtonType = null;
        // 数字ボタンを再度有効化
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
        // 警告メッセージをクリア
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';
    } else if (value === 'backspace') {
        // Backspace処理：カーソル位置の左の文字を削除
        if (cursorPosition > 0) {
            const newValue = currentValue.slice(0, cursorPosition - 1) + currentValue.slice(cursorPosition);
            answerInput.value = newValue;
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
            
            // 削除した文字が数字だった場合、そのボタンを1つだけ再度有効化
            const deletedChar = currentValue[cursorPosition - 1];
            if (!isNaN(deletedChar) && deletedChar !== ' ') {
                const numberButtons = document.querySelectorAll('.number-btn');
                let enabled = false;
                for (let btn of numberButtons) {
                    if (btn.dataset.value === deletedChar && btn.disabled && !enabled) {
                        btn.disabled = false;
                        btn.classList.remove('disabled');
                        enabled = true;
                        break; // 1つだけ有効化したら終了
                    }
                }
            }
            
            // 削除後の計算式の最後の文字に基づいてlastButtonTypeを設定
            gameState.lastButtonType = getLastInputType(newValue);
            // エラーメッセージをクリア
            feedbackDiv.textContent = '';
            feedbackDiv.className = 'feedback';
        }
    } else if (button.classList.contains('number-btn')) {
        // 数字ボタンの場合
        if (gameState.lastButtonType === 'number') {
            // 前回も数字ボタンだった場合、警告を表示
            showFeedback('演算子または、かっこを選択してください', 'error');
            return;
        }
        if (gameState.lastButtonType === 'closeParen') {
            // 閉じ括弧の後は数字を入力できない
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
            // エラーメッセージをクリア
            if (feedbackDiv.classList.contains('error')) {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        }
    } else {
        // 演算子ボタンの場合
        // 最初に演算子を入力できないようにする（括弧は除く）
        if (currentValue === '' && value !== '(' && value !== ')') {
            showFeedback('最初に数字または開き括弧を選択してください', 'error');
            return;
        }
        
        // 括弧の場合
        if (value === '(' || value === ')') {
            // 開き括弧は最初または演算子の後のみ許可
            if (value === '(') {
                if (currentValue !== '' && gameState.lastButtonType !== 'operator') {
                    showFeedback('演算子を選択してください', 'error');
                    return;
                }
            }
            answerInput.value = currentValue.slice(0, cursorPosition) + value + currentValue.slice(cursorPosition);
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition + value.length, cursorPosition + value.length);
            // 開き括弧の後は数字のみ入力可能
            if (value === '(') {
                gameState.lastButtonType = 'openParen'; // 開き括弧専用の状態
            } else {
                // 閉じ括弧の後は演算子が必要
                gameState.lastButtonType = 'closeParen'; // 閉じ括弧専用の状態
            }
            // エラーメッセージをクリア
            if (feedbackDiv.textContent === '演算子または、かっこを選択してください') {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        } else {
            // 通常の演算子（+、−、×、/）の場合
            // 開き括弧の直後は演算子を入力できない
            if (gameState.lastButtonType === 'openParen') {
                showFeedback('数字を選択してください', 'error');
                return;
            }
            if (gameState.lastButtonType === 'operator') {
                // 前回も演算子ボタンだった場合、警告を表示
                showFeedback('数字を選択してください', 'error');
                return;
            }
            answerInput.value = currentValue.slice(0, cursorPosition) + value + currentValue.slice(cursorPosition);
            // カーソル位置を調整
            answerInput.setSelectionRange(cursorPosition + value.length, cursorPosition + value.length);
            gameState.lastButtonType = 'operator';
            // エラーメッセージをクリア（数字連続のエラーのみ）
            if (feedbackDiv.textContent === '演算子または、かっこを選択してください') {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        }
    }
    
    answerInput.focus();
}

// 組み合わせが解答不可能かチェック
function isImpossibleCombination(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return impossibleCombinations.some(impossible => {
        const sortedImpossible = [...impossible].sort((a, b) => a - b);
        return JSON.stringify(sorted) === JSON.stringify(sortedImpossible);
    });
}

// 問題をキーに変換（ソートして重複を避ける）
function getProblemKey(numbers) {
    return [...numbers].sort((a, b) => a - b).join(',');
}

// 新しい数字を生成
function generateNewNumbers() {
    const config = levelConfig[gameState.level] || levelConfig[1];
    
    // 既知の解答パターンから70%の確率で選択（レベルに応じてフィルタリング）
    const allowedOperators = config.operators || ['+', '-', '*', '/', '(', ')'];
    const requiresParentheses = config.requiresParentheses !== undefined ? config.requiresParentheses : true;
    
    const validKnownSolutions = knownSolutions.filter(pattern => {
        const usedOperators = pattern.solution.match(/[\+\-\*\/\(\)]/g) || [];
        const hasAllowedOps = usedOperators.every(op => allowedOperators.includes(op));
        
        // 括弧の有無をチェック
        const hasParentheses = pattern.solution.includes('(') || pattern.solution.includes(')');
        const hasDivision = pattern.solution.includes('/');
        
        // レベル1の場合は、括弧なしの問題のみ
        if (gameState.level === 1 && hasParentheses) {
            return false;
        }
        
        // レベル2の場合は、必ず×と括弧を含む問題のみ
        if (gameState.level === 2) {
            return hasAllowedOps && pattern.solution.includes('*') && hasParentheses;
        }
        
        // レベル3の場合は、必ず括弧と÷を含む問題のみ
        if (gameState.level === 3) {
            return hasAllowedOps && hasParentheses && hasDivision;
        }
        
        return hasAllowedOps;
    });
    
    if (Math.random() < 0.7 && validKnownSolutions.length > 0) {
        // 未使用の既知パターンを探す
        const unusedPatterns = validKnownSolutions.filter(pattern => {
            const key = getProblemKey(pattern.numbers);
            return !gameState.usedProblems.has(key);
        });
        
        if (unusedPatterns.length > 0) {
            const pattern = unusedPatterns[Math.floor(Math.random() * unusedPatterns.length)];
            gameState.currentNumbers = [...pattern.numbers];
            gameState.solutions = [pattern.solution];
            gameState.usedProblems.add(getProblemKey(pattern.numbers));
        } else {
            // すべて使い切った場合はリセット
            gameState.usedProblems.clear();
            const pattern = validKnownSolutions[Math.floor(Math.random() * validKnownSolutions.length)];
            gameState.currentNumbers = [...pattern.numbers];
            gameState.solutions = [pattern.solution];
            gameState.usedProblems.add(getProblemKey(pattern.numbers));
        }
    } else {
        // ランダム生成（複数解答が見つかる問題を優先、かつ未使用の問題）
        let attempts = 0;
        const maxAttempts = 50;
        let bestNumbers = null;
        let bestSolutions = [];
        
        // 複数回試行して、最も解答パターンが多い未使用の問題を選ぶ
        for (let i = 0; i < 20; i++) {
            const testNumbers = [];
            for (let j = 0; j < 4; j++) {
                testNumbers.push(
                    Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
                );
            }
            
            const key = getProblemKey(testNumbers);
            
            // 既に使用済みの問題はスキップ
            if (gameState.usedProblems.has(key)) {
                continue;
            }
            
            const testSolutions = findSolutions(testNumbers);
            
            // レベルに応じて解答をフィルタリング
            let filteredSolutions = testSolutions;
            
            if (gameState.level === 1) {
                // レベル1: 括弧なしの解答のみ
                filteredSolutions = testSolutions.filter(sol => !sol.includes('(') && !sol.includes(')'));
            } else if (gameState.level === 2) {
                // レベル2: ×と括弧を両方含む解答のみ
                filteredSolutions = testSolutions.filter(sol => 
                    sol.includes('*') && (sol.includes('(') || sol.includes(')'))
                );
            } else if (gameState.level === 3) {
                // レベル3: 括弧と÷を両方含む解答のみ
                filteredSolutions = testSolutions.filter(sol => 
                    (sol.includes('(') || sol.includes(')')) && sol.includes('/')
                );
            }
            
            // より多くの解答が見つかった場合、または初回の場合は更新
            if (filteredSolutions.length > bestSolutions.length) {
                bestNumbers = testNumbers;
                bestSolutions = filteredSolutions;
            }
            
            // 3つ以上の解答が見つかったら十分なので終了
            if (bestSolutions.length >= 3) {
                break;
            }
        }
        
        // 解答が見つからなかった、または全て使い切った場合
        if (bestSolutions.length === 0) {
            // 使用済み問題をリセット
            gameState.usedProblems.clear();
            console.log('問題をリセットしました');
            
            if (validKnownSolutions.length > 0) {
                const pattern = validKnownSolutions[Math.floor(Math.random() * validKnownSolutions.length)];
                gameState.currentNumbers = [...pattern.numbers];
                gameState.solutions = [pattern.solution];
                gameState.usedProblems.add(getProblemKey(pattern.numbers));
            } else {
                // それでも見つからない場合は、レベルに応じたフォールバック
                if (gameState.level === 1) {
                    // レベル1用：括弧なしで解ける問題
                    gameState.currentNumbers = [1, 2, 3, 6];
                    gameState.solutions = ['1 + 2 + 3 * 6'];
                } else if (gameState.level === 2) {
                    // レベル2用：×を使う問題
                    gameState.currentNumbers = [1, 2, 3, 4];
                    gameState.solutions = ['(1 + 2 + 3) * 4'];
                } else if (gameState.level === 3) {
                    // レベル3用：括弧と÷を使う問題
                    gameState.currentNumbers = [1, 3, 4, 6];
                    gameState.solutions = ['6 / (1 - 3 / 4)'];
                } else {
                    gameState.currentNumbers = [6, 6, 6, 6];
                    gameState.solutions = ['6 + 6 + 6 + 6'];
                }
                gameState.usedProblems.add(getProblemKey(gameState.currentNumbers));
            }
        } else {
            gameState.currentNumbers = bestNumbers;
            gameState.solutions = bestSolutions;
            gameState.usedProblems.add(getProblemKey(bestNumbers));
        }
        
        console.log('Generated problem with', gameState.solutions.length, 'solutions');
        console.log('Used problems:', gameState.usedProblems.size);
    }
    
    displayNumbers();
    answerInput.value = '';
    feedbackDiv.textContent = '';
    feedbackDiv.className = 'feedback';
    gameState.lastButtonType = null;
}

// 数字を表示
function displayNumbers() {
    // 数字カードの表示は削除されたため、計算機ボタンの更新のみ
    updateCalculatorNumbers();
}

// 計算機ボタンの数字を更新
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
    
    // レベルに応じて演算子ボタンの表示/非表示を制御
    updateOperatorButtons();
}

// レベルに応じて演算子ボタンの表示/非表示を制御
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

// レベルに応じて使用可能な演算子かチェック
function isValidOperatorsForLevel(expression) {
    const config = levelConfig[gameState.level] || levelConfig[1];
    const allowedOperators = config.operators || ['+', '-', '*', '/', '(', ')'];
    
    // 式に含まれる演算子を抽出
    const usedOperators = expression.match(/[\+\-\*\/\(\)]/g) || [];
    
    // すべての演算子が許可されているかチェック
    for (const op of usedOperators) {
        if (!allowedOperators.includes(op)) {
            return false;
        }
    }
    
    return true;
}

// 答えをチェック
function checkAnswer() {
    const userAnswer = answerInput.value.trim();
    
    if (!userAnswer) {
        showFeedback('計算式を入力してください', 'error');
        return;
    }
    
    // レベルに応じた演算子のみを使用しているかチェック
    if (!isValidOperatorsForLevel(userAnswer)) {
        const config = levelConfig[gameState.level] || levelConfig[1];
        const allowedOps = config.operators.join(', ');
        showFeedback(`このレベルでは ${allowedOps} のみ使用できます`, 'error');
        return;
    }
    
    try {
        // 使用されている数字を抽出
        const usedNumbers = userAnswer.match(/\d+/g);
        if (!usedNumbers || usedNumbers.length !== 4) {
            showFeedback('4つの数字すべてを使ってください！', 'error');
            return;
        }
        
        // 数字の使用回数をチェック
        const usedNumsSorted = usedNumbers.map(Number).sort((a, b) => a - b);
        const currentNumsSorted = [...gameState.currentNumbers].sort((a, b) => a - b);
        
        if (JSON.stringify(usedNumsSorted) !== JSON.stringify(currentNumsSorted)) {
            showFeedback('指定された数字だけを使ってください！', 'error');
            return;
        }
        
        // 計算式を評価
        const result = eval(userAnswer);
        
        if (Math.abs(result - 24) < 0.0001) {
            handleCorrectAnswer();
        } else {
            gameState.totalAttempts++;
            showFeedback(`残念！答えは ${result.toFixed(2)} です。24を目指しましょう！`, 'error');
            gameState.streak = 0;
            updateDisplay();
        }
    } catch (error) {
        showFeedback('無効な計算式です。もう一度試してください！', 'error');
    }
}

// 正解時の処理
function handleCorrectAnswer() {
    gameState.streak++;
    gameState.correctAnswers++;
    gameState.totalAttempts++;
    
    showFeedback(`🎉 正解！`, 'success');
    
    updateDisplay();
    
    setTimeout(() => {
        generateNewNumbers();
    }, 2000);
}

// フィードバック表示
function showFeedback(message, type) {
    feedbackDiv.textContent = message;
    feedbackDiv.className = `feedback ${type}`;
}

// 表示を更新
function updateDisplay() {
    // 正解率を計算
    const accuracy = gameState.totalAttempts > 0 
        ? Math.round((gameState.correctAnswers / gameState.totalAttempts) * 100)
        : 0;
    
    accuracySpan.textContent = accuracy + '%';
    streakSpan.textContent = gameState.streak;
    levelSelect.value = gameState.level;
}

// ヒント表示
function showHint() {
    if (gameState.solutions.length > 0) {
        const solution = gameState.solutions[0];
        const hint = generateHint(solution);
        showFeedback(hint, 'info');
    } else {
        showFeedback('この問題は少し難しいです。いろいろな組み合わせを試してみてください！大きな数を作ってから調整するか、分数を使うと解けるかもしれません。', 'info');
    }
}

// ヒント生成
function generateHint(solution) {
    const hints = [
        `まず ${gameState.currentNumbers[0]} と ${gameState.currentNumbers[1]} を組み合わせてみましょう`,
        `掛け算と足し算を組み合わせると良いでしょう`,
        `括弧を使って計算の順序を変えてみてください`,
        `大きな数を作ってから、小さな数で調整するとうまくいきます`,
        `解答例: ${solution}（一つの例です）`
    ];
    
    return hints[Math.floor(Math.random() * (hints.length - 1))];
}

// 解答例を表示
function showSolution() {
    if (gameState.solutions.length > 0) {
        showFeedback(`解答例: ${gameState.solutions[0]}`, 'info');
    } else {
        showFeedback('この問題の解答例が見つかりません。24にならない可能性があります。AIに相談してみましょう', 'info');
    }
    
    // 解答例を見ると連続正解がリセットされる
    gameState.streak = 0;
    updateDisplay();
}

// 問題をスキップ
function skipProblem() {
    if (gameState.solutions.length > 0) {
        showFeedback(`解答例: ${gameState.solutions[0]}`, 'info');
    } else {
        showFeedback('この問題は解くのが難しいため、新しい問題を生成します', 'info');
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

// 解を見つける（簡易版）
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
    
    // 簡単なパターンをチェック
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

// ゲーム開始
init();
