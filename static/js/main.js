
const isSupporter = localStorage.getItem("supporterToken") === "ALPHA-TOKEN-2025";

async function loadSongData(filename = 'song_conan_lite') {

  // 🎯 JSON 파일 이름 분기
 // const jsonFilename = isSupporter ? `${filename}_full.json` : `${filename}_lite.json`;
  if (filename.includes('.json')) {
    currentSongFilename = filename;
    filename = filename.replace('.json', '');
  } else {
    currentSongFilename =  `${filename}.json`;
  }
   // ✅ 이 줄 추가
  const res = await fetch(`/data/${filename}.json`);
  const song = await res.json();

  const translationRes = await fetch(`/data/${filename}_translation.json`);
  const translationJson = await translationRes.json();
  const translations = translationJson.translations || [];


   // 🔄 유튜브/로컬 영상 다시 로딩
  const container = document.getElementById("youtube");
  container.innerHTML = ""; // 기존 영상 제거

  // 유튜브 embed
  // YouTube youtube_id
    // 🔁 영상 재생 처리 (유튜브 or 비영리)
  if (song.youtube_id) {
      updateYouTubeEmbed(song.youtube_id);
  } else if (song.local_video_url) {
      renderLocalVideo(song.local_video_url);
  } else {
    container.innerHTML = "<p>🎬 영상이 없습니다</p>";
  }


  // 🎵 가사 표시
  renderLyrics(song.lyrics, translations); // 렌더링 로직은 공통

  // 표현 표시
  document.getElementById('expression-ja').textContent = song.today_expression.ja;
  document.getElementById('expression-ko').textContent = song.today_expression.ko;

    // ✅ 퀴즈 처리
  if (song.quiz) {
    renderQuiz(song.quiz);
  }

  // ✅ 후원자 인증 상태에 따른 버튼 처리
  const pdfBtn = document.getElementById("pdf-btn");
  const token = localStorage.getItem("supporterToken");
  if (token === "ALPHA-TOKEN-2025") {
    pdfBtn.disabled = true;
    pdfBtn.textContent = "📄 PDF 다운로드";
  } else {
    pdfBtn.disabled = true;
    pdfBtn.textContent = "🔒 후원자 전용 PDF";
  }

  // 단어 해석 출력
  const wordList = song.today_expression.words || [];
  const wordItems = document.getElementById("word-items");
  wordItems.innerHTML = "";
  wordList.forEach(w => {
    const li = document.createElement("li");
    li.textContent = `${w.ja} - ${w.ko}`;
    wordItems.appendChild(li);
  });



}

function playTTS() {
  const jaText = document.getElementById('expression-ja').textContent;
  const audio = new Audio(`/tts?text=${encodeURIComponent(jaText)}`);
  audio.play();
}



function renderQuiz(quizList) {
  const container = document.getElementById('quiz-box');
  container.innerHTML = "";
  quizList.forEach((quiz, idx) => {
    const q = document.createElement("div");
    q.innerHTML = `<p><strong>Q${idx + 1}. ${quiz.question}</strong></p>`;
    quiz.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => alert(opt === quiz.answer ? "⭕ 정답!" : `❌ 오답! 정답은 ${quiz.answer}`);
      q.appendChild(btn);
    });
    container.appendChild(q);
  });
}

function authenticateSupporter() {
  const key = prompt("후원자 인증 키를 입력해주세요:");
  if (!key) return;

  fetch("/api/auth", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ key })
  })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error("인증 실패");
    })
    .then(data => {
      alert("✅ 인증되었습니다!");
      localStorage.setItem("supporter", "true");
      document.getElementById("support-status").innerText = "✅ 인증됨";
      document.getElementById("supporter-download").disabled = false;
    })
    .catch(err => {
      alert("❌ 인증 실패: " + err.message);
    });
}

function downloadPDF() {
  const token = localStorage.getItem("supporterToken");
  if (token !== "ALPHA-TOKEN-2025") {
    alert("❌ 후원자 인증이 필요합니다!");
    return;
  }
  window.location.href = "/pdf";
}

async function loadSongList() {
  const res = await fetch('/data/songlist.json');
  const songs = await res.json();
  const list = document.getElementById("song-items");
  list.innerHTML = "";
  songs.forEach(song => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = song.title;
    btn.onclick = () => loadSongData(song.filename);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function createQuiz(words) {
  const quizBox = document.getElementById("quiz-box");
  quizBox.innerHTML = "<h3>🧠 단어 퀴즈</h3>";

  const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 3);
  shuffled.forEach((word, index) => {
    const question = document.createElement("div");
    question.innerHTML = `<p><b>Q${index + 1}.</b> '${word.ko}'는 일본어로?</p>`;

    const choices = [...words].sort(() => Math.random() - 0.5).slice(0, 3);
    if (!choices.find(c => c.ja === word.ja)) choices[0] = word;
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.innerText = choice.ja;
      btn.onclick = () => {
        btn.style.backgroundColor = (choice.ja === word.ja) ? "lightgreen" : "salmon";
      };
      question.appendChild(btn);
    });

    quizBox.appendChild(question);
  });
}

function updateYouTubeEmbed(youtubeId) {
  const youtubeBox = document.getElementById("youtube");
  if (!youtubeId) {
    youtubeBox.innerHTML = "<p>🎬 영상이 없습니다</p>";
    return;
  }
  youtubeBox.innerHTML = `
    <iframe width="100%" height="250"
      src="https://www.youtube.com/embed/${youtubeId}"
      frameborder="0"
      allowfullscreen>
    </iframe>`;
}

function renderLocalVideo(videoUrl) {
  const youtubeBox = document.getElementById("youtube");
  if (!videoUrl) {
    youtubeBox.innerHTML = "<p>🎬 영상이 없습니다</p>";
    return;
  }
  youtubeBox.innerHTML = `
    <video controls width="100%" height="250">
      <source src="${videoUrl}" type="video/mp4">
      영상 재생을 지원하지 않는 브라우저입니다.
    </video>`;
}

function checkShutdownStatus() {
  fetch('/shutdown_status')
    .then(res => res.json())
    .then(data => {
      if (data.shutdown) {
        // 앱 화면 전체를 덮는 차단 화면 추가
        const blocker = document.createElement('div');
        blocker.style.position = 'fixed';
        blocker.style.top = '0';
        blocker.style.left = '0';
        blocker.style.width = '100%';
        blocker.style.height = '100%';
        blocker.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        blocker.style.color = 'white';
        blocker.style.zIndex = '9999';
        blocker.style.display = 'flex';
        blocker.style.flexDirection = 'column';
        blocker.style.alignItems = 'center';
        blocker.style.justifyContent = 'center';
        blocker.innerHTML = `
          <h1>🚫 서비스 일시 중지</h1>
          <p>관리자에 의해 잠시 닫혀 있습니다.</p>
        `;
        document.body.appendChild(blocker);
      }
    })
    .catch(err => {
      console.error('셧다운 상태 확인 실패:', err);
    });
}




function renderLyrics(lyrics, translations = []) {
  const container = document.getElementById("lyrics-box");
  if (!container) return;

  container.innerHTML = "<h3>🎶 전체 가사</h3>";

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "🇰🇷 한글 번역 보기";
  let showTranslation = false;

  toggleBtn.onclick = () => {
    showTranslation = !showTranslation;
    toggleBtn.textContent = showTranslation ? "🇯🇵 일본어만 보기" : "🇰🇷 한글 번역 보기";
    document.querySelectorAll(".ko-line").forEach(el => {
      el.style.display = showTranslation ? "block" : "none";
    });
  };
  container.appendChild(toggleBtn);

  lyrics.forEach((line, idx) => {
    const lineId = `line-${idx}`;

    const p = document.createElement("p");
    p.id = lineId;
    p.style.transition = "background-color 0.3s ease";

    const playBtn = document.createElement("button");
    playBtn.textContent = "🔊";
    playBtn.onclick = () => {
      highlightLine(lineId);
      playLineTTS(line, lineId);
    };

    p.textContent = line + " ";
    p.appendChild(playBtn);
    container.appendChild(p);

    // 🎯 한글 번역 줄
    const k = document.createElement("p");
    k.className = "ko-line";
    k.style.margin = "0 0 10px 10px";
    k.style.color = "#888";
    k.style.display = "none";
    k.textContent = translations[idx] || "";
    container.appendChild(k);
  });
}


function playLineTTS(line, lineId) {
  const audio = new Audio(`/tts?text=${encodeURIComponent(line)}`);
  audio.play();

  // 강조 유지 시간 = 오디오 길이 추정 대기 (고정값: 2.5초)
  highlightLine(lineId);
  setTimeout(() => {
    unhighlightLine(lineId);
  }, 2500);
}

function highlightLine(id) {
  document.querySelectorAll("#lyrics-box p").forEach(p => {
    p.style.backgroundColor = "";
  });
  const el = document.getElementById(id);
  if (el) el.style.backgroundColor = "#ffe082"; // 노란 강조
}

function unhighlightLine(id) {
  const el = document.getElementById(id);
  if (el) el.style.backgroundColor = "";
}

function downloadPDF() {
  const filename = currentSongFilename || "song_breeze_full.json";
  window.location.href = `/pdf?filename=${filename}`;
}

loadSongList();

document.addEventListener("DOMContentLoaded", () => {
  // 🌙 서버 깨우는 중 메시지
  const loading = document.createElement("div");
  loading.id = "server-wakeup";
  loading.style.position = "fixed";
  loading.style.top = "0";
  loading.style.left = "0";
  loading.style.width = "100%";
  loading.style.padding = "20px";
  loading.style.backgroundColor = "#fff3cd";
  loading.style.color = "#856404";
  loading.style.borderBottom = "2px solid #ffeeba";
  loading.style.textAlign = "center";
  loading.style.zIndex = "9999";
  loading.innerHTML = `
    ⚠️ 서버를 깨우는 중입니다... 최대 10초만 기다려주세요 🙏<br>
    <small>※ 후원자 모드에선 항상 깨어 있어요!</small>
  `;
  document.body.appendChild(loading);

  const isSupporter = localStorage.getItem("supporterToken") === "ALPHA-TOKEN-2025";
  const defaultSong = isSupporter ? "song_conan_full" : "song_conan_lite";

  // 🚀 초기 곡 로딩 후 메시지 제거
  loadSongData(defaultSong).then(() => {
    document.getElementById("server-wakeup").remove();
  }).catch(err => {
    loading.innerHTML = `❌ 서버 연결 실패: ${err.message}`;
  });

  // 🔌 셧다운 상태도 확인 (선택)
  checkShutdownStatus();
});

// document.addEventListener("DOMContentLoaded", function () {
//   // 앱 시작 시 Conan 곡을 기본으로 로드
//   if (isSupporter === "ALPHA-TOKEN-2025") {
//      loadSongData("song_conan_full");
//   } else {
//       loadSongData("song_conan_lite");
//   }

//   // 셧다운 상태도 확인 (옵션)
//   checkShutdownStatus();
// });
