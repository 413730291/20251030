// 核心變數

let quizTable;       // 儲存從 CSV 讀取的 p5.Table 物件

let questions = [];    // 處理後的題庫陣列

let currentQuestion = 0; // 目前的題號 (從 0 開始)

let quizState = 'quiz';  // 狀態: 'quiz', 'result', 'final'

let score = 0;         // 總得分

let selectedOption = -1; // 使用者選擇的選項 (0, 1, 2, 3)

let mouseTrail = [];   // 用於游標特效

let particleSystem = []; // 用於結果動畫的粒子系統



// 狀態管理：讀取資料

function preload() {

  // 載入 CSV 檔案

  // 'csv' 格式，包含 'header'

  quizTable = loadTable('quiz.csv', 'csv', 'header');

}



function setup() {

  // *** 核心修改 1: 將畫布設定為全螢幕大小 ***

  createCanvas(windowWidth, windowHeight);

  cursor('pointer'); // 預設使用指標游標



  // 將 p5.Table 轉換為易於操作的陣列

  for (let r = 0; r < quizTable.getRowCount(); r++) {

    questions.push({

      question: quizTable.getString(r, 'question'),

      options: [

        quizTable.getString(r, 'optionA'),

        quizTable.getString(r, 'optionB'),

        quizTable.getString(r, 'optionC'),

        quizTable.getString(r, 'optionD')

      ],

      correct: quizTable.getNum(r, 'correctAnswer')

    });

  }

}



// *** 核心修改 2: 處理視窗大小改變事件 (保持全螢幕) ***

function windowResized() {

  resizeCanvas(windowWidth, windowHeight);

}





function draw() {

  background(240);

  

  // 游標殘影特效

  drawMouseTrail();



  if (quizState === 'quiz') {

    drawQuizScreen();

  } else if (quizState === 'result') {

    drawResultAnimation();

  } else if (quizState === 'final') {

    drawFinalScoreScreen();

  }

}



// 繪製測驗畫面

function drawQuizScreen() {
  let q = questions[currentQuestion];

  // 置中與寬度
  let contentWidth = width * 0.8;
  let contentX = width / 2;

  // 字級設定
  let headerSize = map(width, 400, 1200, 18, 28);    // 題號字級
  let questionSize = map(width, 400, 1200, 24, 36);  // 題目字級

  // --- 1. 顯示題目（在上方，但往下移） ---
  textSize(questionSize);
  textAlign(CENTER, TOP);
  fill(50);
  // 將題目往下移：提高 multiplier（例如 0.18）
  let questionTopMultiplier = 0.18; // <-- 調整此值微調題目垂直位置
  let questionY = height * questionTopMultiplier;
  let questionH = height * 0.18;
  // 設定行高，避免多行貼在一起
  textLeading(questionSize * 1.5);
  text(q.question, contentX, questionY, contentWidth, questionH);
  // 恢復預設行高（避免影響其他文字）
  textLeading(questionSize);

  // --- 2. 顯示題號（在題目下方） ---
  textSize(headerSize);
  textAlign(CENTER, TOP);
  fill(100);
  // headerY 緊跟題目下方，並保留更大間距
  let headerY = questionY + questionH + height * 0.04; // 增加間距
  text(`第 ${currentQuestion + 1} 題 / 共 ${questions.length} 題`, contentX, headerY);

  // --- 3. 選項區（在題號下方） ---
  textSize(map(width, 400, 1200, 16, 22));
  let optionsStartY = headerY + headerSize * 2.0 + height * 0.04; // 與題號間距也放大
  let optionSpacing = height * 0.10;
  let optionH = height * 0.08;

  for (let i = 0; i < q.options.length; i++) {
    let x = contentX - contentWidth / 2;
    let y = optionsStartY + i * optionSpacing;
    let w = contentWidth;
    let h = optionH;

    // hover 判斷
    let isHover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;

    rectMode(CORNER);
    if (selectedOption === i) {
      fill(255, 200, 200);
      stroke(200, 50, 50);
      strokeWeight(4);
    } else if (isHover) {
      fill(220, 240, 255);
      stroke(150, 200, 255);
      strokeWeight(3);
    } else {
      fill(255);
      stroke(180);
      strokeWeight(1);
    }

    rect(x, y, w, h, 10);

    fill(50);
    textAlign(LEFT, CENTER);
    text(`${['A','B','C','D'][i]}. ${q.options[i]}`, x + 20, y + h / 2);
  }

  // --- 4. 繪製送出按鈕 ---
  drawSubmitButton();
}



// 處理滑鼠點擊

function mousePressed() {

  if (quizState === 'quiz') {

    handleOptionSelection();

    handleButtonClick();

  } else if (quizState === 'result') {

    // 點擊後繼續下一題或進入總結

    if (currentQuestion < questions.length - 1) {

      currentQuestion++;

      selectedOption = -1;

      quizState = 'quiz';

      particleSystem = []; // 清除粒子

    } else {

      // 所有題目結束，進入最終分數結算畫面

      quizState = 'final';

      particleSystem = []; 

    }

  } else if (quizState === 'final') {

    // 最終畫面，點擊重置

    score = 0;

    currentQuestion = 0;

    selectedOption = -1;

    quizState = 'quiz';

  }

}



// 處理選項點擊 (使用相對座標計算)

function handleOptionSelection() {
  // 與 drawQuizScreen 使用相同的計算方式以對齊點擊區域
  let contentWidth = width * 0.8;
  let contentX = width / 2;

  let headerSize = map(width, 400, 1200, 18, 28);
  let questionSize = map(width, 400, 1200, 24, 36);

  // 與 drawQuizScreen 同步的垂直參數
  let questionTopMultiplier = 0.18; // <-- 與 drawQuizScreen 保持一致
  let questionY = height * questionTopMultiplier;
  let questionH = height * 0.18;
  let headerY = questionY + questionH + height * 0.04;

  let optionsStartY = headerY + headerSize * 2.0 + height * 0.04;
  let optionSpacing = height * 0.10;
  let optionH = height * 0.08;

  for (let i = 0; i < 4; i++) {
    let x = contentX - contentWidth / 2;
    let y = optionsStartY + i * optionSpacing;
    let w = contentWidth;
    let h = optionH;

    if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
      selectedOption = i;
      break;
    }
  }
}



// 處理送出按鈕點擊

function handleButtonClick() {

    let btnW = width * 0.2;

    let btnH = height * 0.08;

    let btnX = width / 2;

    let btnY = height - height * 0.1;

    

    if (selectedOption !== -1 && 

        mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 && 

        mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {

        

        checkAnswer();

        quizState = 'result';

        // 答對時，在中心點生成粒子

        if (selectedOption === questions[currentQuestion].correct) {

            for (let i = 0; i < 30; i++) {

                // 答對生成五彩紙屑

                particleSystem.push(new Particle(width / 2, height / 2, color(random(255), random(255), random(255))));

            }

        } else {

            // 答錯生成簡單的鼓勵粒子

             for (let i = 0; i < 15; i++) {

                particleSystem.push(new Particle(width / 2, height / 2, color(255, 100, 100)));

            }

        }

    }

}



// 檢查答案並更新分數

function checkAnswer() {

  if (selectedOption === questions[currentQuestion].correct) {

    score++;

  }

}





// **--- 動畫、特效及繪圖函式區塊 ---**



// 游標殘影特效

function drawMouseTrail() {

  mouseTrail.push(createVector(mouseX, mouseY));

  if (mouseTrail.length > 20) {

    mouseTrail.shift();

  }



  for (let i = 0; i < mouseTrail.length; i++) {

    let p = mouseTrail[i];

    let diameter = map(i, 0, mouseTrail.length - 1, 2, 12);

    let alpha = map(i, 0, mouseTrail.length - 1, 50, 200);



    noStroke();

    fill(0, 150, 255, alpha); // 藍色殘影

    ellipse(p.x, p.y, diameter, diameter);

  }

}



// 繪製提交按鈕

function drawSubmitButton() {

    let btnW = width * 0.2;

    let btnH = height * 0.08;

    let btnX = width / 2;

    let btnY = height - height * 0.1;

    

    let isHover = mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 && 

                  mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2;

    

    // 游標樣式

    if (isHover && selectedOption !== -1) {

         cursor('grab');

    } else if (selectedOption !== -1) {

        cursor('hand');

    } else {

        cursor('pointer'); // 恢復預設 p5.js 設定

    }

    

    // 按鈕樣式

    if (selectedOption !== -1) {

        fill(isHover ? color(100, 200, 100) : color(120, 220, 120)); // 啟用綠色

        stroke(50);

        strokeWeight(2);

    } else {

        fill(200); // 禁用灰色

        stroke(150);

        strokeWeight(1);

    }

    

    rectMode(CENTER);

    rect(btnX, btnY, btnW, btnH, 8);

    

    fill(50);

    textSize(map(width, 400, 1200, 16, 24));

    textAlign(CENTER, CENTER);

    text("送出答案", btnX, btnY);

}



// 繪製結果動畫

function drawResultAnimation() {

  let isCorrect = selectedOption === questions[currentQuestion].correct;

  let resultText;

  

  // 更新和繪製粒子

  for (let i = particleSystem.length - 1; i >= 0; i--) {

      particleSystem[i].update();

      particleSystem[i].display();

      if (particleSystem[i].isFinished()) {

          particleSystem.splice(i, 1);

      }

  }



  if (isCorrect) {

    resultText = "✅ 太棒了！答對了！";

    // 稱讚特效：讓背景以脈衝方式閃爍綠色

    let pulse = sin(frameCount * 0.1) * 30 + 30;

    noStroke();

    fill(100, 255, 100, pulse);

    rect(0, 0, width, height);

  } else {

    resultText = "❌ 沒關係，再接再厲！";

    // 鼓勵特效：簡單跳動文字

    let bounce = sin(frameCount * 0.2) * 10; 

    push();

    translate(width / 2, height / 2 + bounce);

    textSize(map(width, 400, 1200, 40, 60));

    fill(200, 50, 50);

    textAlign(CENTER, CENTER);

    text(resultText, 0, 0);

    pop();

  }

  

  // 顯示結果文字（如果不是答錯跳動文字）

  if (isCorrect) {

      textSize(map(width, 400, 1200, 36, 54));

      fill(50);

      textAlign(CENTER, CENTER);

      text(resultText, width / 2, height / 2);

  }





  // 顯示繼續提示

  textSize(map(width, 400, 1200, 16, 24));

  fill(100);

  text("點擊畫面任意處繼續", width / 2, height - height * 0.15);

}



// 最終分數畫面

function drawFinalScoreScreen() {

    let percentage = (score / questions.length) * 100;

    

    textAlign(CENTER, CENTER);

    textSize(map(width, 400, 1200, 30, 50));

    fill(50);

    text("測驗結束！", width / 2, height * 0.2);



    textSize(map(width, 400, 1200, 60, 90));

    text(`${score} / ${questions.length}`, width / 2, height / 2);

    

    textSize(map(width, 400, 1200, 24, 36));

    

    if (percentage >= 80) {

        fill(0, 150, 0);

        text("✨ 恭喜您，成績優異！✨", width / 2, height / 2 + height * 0.2);

        // 最終動畫：持續生成勝利粒子

        if (frameCount % 5 === 0) {

             particleSystem.push(new Particle(random(width), height, color(random(100, 255), 255, 100), createVector(0, -random(5))));

        }

    } else {

        fill(150, 0, 0);

        text("👏 繼續努力，下次會更好！👏", width / 2, height / 2 + height * 0.2);

    }

    

    // 更新和繪製粒子

    for (let i = particleSystem.length - 1; i >= 0; i--) {

        particleSystem[i].update();

        particleSystem[i].display();

        if (particleSystem[i].isFinished()) {

            particleSystem.splice(i, 1);

        }

    }



    textSize(map(width, 400, 1200, 16, 24));

    fill(100);

    text("點擊畫面任意處重置測驗", width / 2, height - height * 0.15);

}





// **--- 粒子系統類別 (Particle Class) ---**



class Particle {

  constructor(x, y, c, force = null) {

    this.pos = createVector(x, y);

    if (force) {

        this.vel = force;

    } else {

        this.vel = p5.Vector.random2D();

        this.vel.mult(random(2, 5));

    }



    this.acc = createVector(0, 0.1); // 受重力影響

    this.life = 255;

    this.color = c;

    this.size = random(5, 15);

  }



  update() {

    this.vel.add(this.acc);

    this.pos.add(this.vel);

    this.life -= 5;

  }



  display() {

    push();

    noStroke();

    let c = this.color;

    c.setAlpha(this.life);

    fill(c);

    ellipse(this.pos.x, this.pos.y, this.size, this.size);

    pop();

  }



  isFinished() {

    return this.life < 0;

  }

}