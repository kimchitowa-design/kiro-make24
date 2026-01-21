// ゲーム状態
let gameState = {
    currentNumbers: [],
    score: 0,
    streak: 0,
    level: 1,
    solutions: [],
    lastButtonType: null // 最後に押したボタンの種類を記録
};

// レベル別の数字生成設定
const levelConfig = {
    1: { min: 1, max: 9 },
    2: { min: 1, max: 12 },
    3: { min: 1, max: 13 },
    4: { min: 1, max: 13 },
    5: { min: 1, max: 13 }
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
    { numbers: [3, 4, 5, 6], solution: '6 * (5 - 4 + 3)' }
];

// DOM要素
const numbersContainer = document.getElementById('numbersContainer');
const answerInput = document.getElementById('answer');
const submitBtn = document.getElementById('submitBtn');
const feedbackDiv = document.getElementById('feedback');
const hintBtn = document.getElementById('hintBtn');
const solutionBtn = document.getElementById('solutionBtn');
const calculatorBtn = document.getElementById('calculatorBtn');
const newGameBtn = document.getElementById('newGameBtn');
const scoreSpan = document.getElementById('score');
const streakSpan = document.getElementById('streak');
const levelSpan = document.getElementById('level');
const hintModal = document.getElementById('hintModal');
const hintText = document.getElementById('hintText');
const closeModal = document.querySelector('.close');

// 初期化
function init() {
    generateNewNumbers();
    attachEventListeners();
}

// イベントリスナー
function attachEventListeners() {
    submitBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    hintBtn.addEventListener('click', showHint);
    solutionBtn.addEventListener('click', showSolution);
    calculatorBtn.addEventListener('click', openCalculator);
    newGameBtn.addEventListener('click', generateNewNumbers);
    closeModal.addEventListener('click', () => {
        hintModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === hintModal) {
            hintModal.style.display = 'none';
        }
    });
    
    // 計算機ボタンのイベントリスナー
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', handleCalculatorButton);
    });
}

// 電卓を開く
function openCalculator() {
    try {
        // デバイスの種類を判定
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = userAgent.indexOf('android') > -1;
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        
        if (isAndroid) {
            // Androidの電卓を開く
            window.location.href = 'intent://calculator/#Intent;scheme=android;package=com.android.calculator2;end';
            showFeedback('電卓アプリを開いています...', 'info');
        } else if (isIOS) {
            // iOSの場合はメッセージを表示（iOSは外部アプリを直接開けない）
            showFeedback('ホーム画面から電卓アプリを開いてください', 'info');
        } else {
            // PCの場合はWindowsの電卓を開く
            window.open('calculator://', '_blank');
            showFeedback('電卓アプリを開いています...', 'info');
        }
        
        // タイムアウト後にメッセージをクリア
        setTimeout(() => {
            if (feedbackDiv.classList.contains('info')) {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'feedback';
            }
        }, 3000);
    } catch (error) {
        showFeedback('電卓を開けませんでした。デバイスの電卓アプリを手動で開いてください。', 'error');
    }
}

// 計算機ボタンの処理
function handleCalculatorButton(e) {
    const button = e.target;
    const value = button.dataset.value;
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
            
            // 削除した文字が数字だった場合、そのボタンを再度有効化
            const deletedChar = currentValue[cursorPosition - 1];
            if (!isNaN(deletedChar) && deletedChar !== ' ') {
                const numberButtons = document.querySelectorAll('.number-btn');
                numberButtons.forEach(btn => {
                    if (btn.dataset.value === deletedChar && btn.disabled) {
                        btn.disabled = false;
                        btn.classList.remove('disabled');
                        return;
                    }
                });
            }
            
            // lastButtonTypeをリセット
            gameState.lastButtonType = null;
        }
    } else if (button.classList.contains('number-btn')) {
        // 数字ボタンの場合
        if (gameState.lastButtonType === 'number') {
            // 前回も数字ボタンだった場合、警告を表示
            showFeedback('演算子または、かっこを選択してください', 'error');
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
    
    answerInput.focus();
}

// 新しい数字を生成
function generateNewNumbers() {
    const config = levelConfig[gameState.level] || levelConfig[1];
    
    // 既知の解答パターンから30%の確率で選択
    if (Math.random() < 0.3 && knownSolutions.length > 0) {
        const pattern = knownSolutions[Math.floor(Math.random() * knownSolutions.length)];
        gameState.currentNumbers = [...pattern.numbers];
        gameState.solutions = [pattern.solution];
    } else {
        // ランダム生成
        gameState.currentNumbers = [];
        for (let i = 0; i < 4; i++) {
            gameState.currentNumbers.push(
                Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
            );
        }
        gameState.solutions = findSolutions(gameState.currentNumbers);
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
}

// 答えをチェック
function checkAnswer() {
    const userAnswer = answerInput.value.trim();
    
    if (!userAnswer) {
        showFeedback('計算式を入力してください', 'error');
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
    const points = gameState.level * 10 + gameState.streak * 5;
    gameState.score += points;
    
    showFeedback(`🎉 正解！ +${points}点獲得！`, 'success');
    
    // レベルアップチェック
    if (gameState.streak % 3 === 0 && gameState.level < 5) {
        gameState.level++;
        setTimeout(() => {
            showFeedback(`🎊 レベルアップ！レベル ${gameState.level} になりました！`, 'success');
        }, 1500);
    }
    
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
    scoreSpan.textContent = gameState.score;
    streakSpan.textContent = gameState.streak;
    levelSpan.textContent = gameState.level;
}

// ヒント表示
function showHint() {
    if (gameState.solutions.length > 0) {
        const solution = gameState.solutions[0];
        const hint = generateHint(solution);
        hintText.textContent = hint;
    } else {
        hintText.textContent = 'この問題は少し難しいです。いろいろな組み合わせを試してみてください！大きな数を作ってから調整するか、分数を使うと解けるかもしれません。';
    }
    hintModal.style.display = 'block';
    
    // ヒントを使うとスコアが少し減る
    if (gameState.score > 5) {
        gameState.score -= 5;
        updateDisplay();
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
        showFeedback('この問題の解答例が見つかりません。いろいろな組み合わせを試してみてください！', 'info');
    }
    
    // 解答例を見るとスコアが減る
    gameState.streak = 0;
    if (gameState.score > 10) {
        gameState.score -= 10;
    }
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
    
    return solutions;
}

// ゲーム開始
init();
