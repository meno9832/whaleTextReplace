// 기본 설정 (디폴트 설정에 replaceRules가 배열로 되어 있음)
const defaultSettings = {
  enabled: true,
  prefixEnabled: false,
  suffixEnabled: false,
  prefixText: "접두사",
  suffixText: "접미사",
  replaceRules: [
    { from: "\n", to: "", enabled: true },
    { from: "이런거", to: "저런거", enabled: true }
  ]
};
let forcePlainPaste = false;




// 저장된 설정을 가져오는 함수
function fetchSettings() {
  return new Promise((resolve, reject) => {
    // 크롬 환경에서 실행 중인 경우 chrome.storage 사용
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(null, (userSettings) => {
        if (chrome.runtime.lastError) {
          console.error("저장소에서 설정을 가져오는 데 실패했습니다. 기본값을 사용합니다.");
          resolve(defaultSettings); // 기본값 사용
        } else {
          console.log("📦 불러온 설정:", userSettings);
          
          // userSettings.settings로 접근해야 하는 경우
          const settings = userSettings.settings || defaultSettings;

          // replaceRules가 배열이 아니거나 undefined인 경우 빈 배열로 초기화
          if (!Array.isArray(settings.replaceRules)) {
            console.warn("replaceRules가 배열이 아니거나 undefined입니다. 기본값으로 빈 배열을 사용합니다.");
            settings.replaceRules = []; // 빈 배열로 초기화
          }

          // replaceRules에 항목 추가
          settings.replaceRules.push({ from: "\n", to: "", enabled: true });

          console.log("⚙️ 적용된 설정:", settings);
          resolve(settings); // 수정된 설정 반환

        }
      });
    } else {
      // 크롬 환경이 아닐 경우 localStorage를 사용
      console.warn("크롬 환경이 아니므로 localStorage에서 설정을 불러옵니다.");
      const userSettings = localStorage.getItem('settings');
      if (userSettings) {
        try {
          const settings = JSON.parse(userSettings);
          if (!Array.isArray(settings.replaceRules)) {
            console.warn("replaceRules가 배열이 아닙니다. 기본값을 사용합니다.");
            settings.replaceRules = defaultSettings.replaceRules; // replaceRules 배열이 아니면 기본값 사용
          }
          resolve(settings);
        } catch (error) {
          console.error("localStorage에서 설정을 불러오는 데 실패했습니다. 기본값을 사용합니다.");
          resolve(defaultSettings); // JSON 파싱 오류 시 기본값 사용
        }
      } else {
        console.warn("저장된 설정이 없습니다. 기본값을 사용합니다.");
        resolve(defaultSettings); // 설정이 없으면 기본값 사용
      }
    }
  });
}


// 변환 함수
function transformText(text, settings) {
  console.log("🔧 변환 전 텍스트:", text);

  // 변환 규칙을 순차적으로 적용
  settings.replaceRules.forEach(rule => {
    if (rule.enabled) {
      const regex = new RegExp(escapeRegExp(rule.from), 'g');
      console.log(`🔄 변환 규칙: ${rule.from} -> ${rule.to} (정규식: ${regex})`);
      text = text.replace(regex, rule.to);
    }
  });

  const targetWords = settings.replaceRules
    .filter(rule => rule.enabled)
    .map(rule => rule.to)
    .filter(word => !!word); // null/undefined 방지

  // 2. 조사 보정 실행
  text = fixJosaForWords(text, targetWords);

  // 줄바꿈 문자 (\n, \r\n, \r)을 모두 제거
  text = text.replace(/[\r\n]+/g, '');

  if (settings.prefixEnabled) {
    text = settings.prefixText + text;
    console.log("접두사 적용:", text);
  }
  if (settings.suffixEnabled) {
    text = text + settings.suffixText;
    console.log("접미사 적용:", text);
  }

  console.log("🪄 변환된 텍스트:", text);
  return text;
}

// 이스케이프 문자 설정
function escapeRegExp(str) {
  return str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");
}


// 클립보드에서 텍스트를 읽는 함수
function readClipboard() {
  return new Promise((resolve, reject) => {
    navigator.clipboard.readText()
      .then(text => {
        console.log("📋 클립보드에서 읽은 텍스트:", text);
        resolve(text);
      })
      .catch(err => {
        console.error("클립보드에서 텍스트를 읽는 데 실패했습니다:", err);
        reject(err);
      });
  });
}


// 텍스트를 붙여넣기 함수 (현재 활성화된 요소에 붙여넣기)
function pasteText(text) {
  const el = document.activeElement;

  if (el && typeof el.value !== 'undefined') {
    // input/textarea에 텍스트 삽입
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + text + after;

    const cursorPos = before.length + text.length;
    el.setSelectionRange(cursorPos, cursorPos);
  } else {
    // execCommand fallback (일부 에디터 등에서 사용)
    try {
      document.execCommand("insertText", false, text);
    } catch (err) {
      console.warn("insertText 실패:", err);
    }
  }
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
    forcePlainPaste = true;
  }
});

// 붙여넣기 이벤트 처리
document.addEventListener('paste', (event) => {
  event.preventDefault(); // 기본 붙여넣기 동작 방지

  // 클립보드에서 텍스트를 읽고 설정을 가져온 후 텍스트를 변환하여 붙여넣기
  readClipboard()
    .then(text => {
      fetchSettings()
        .then(settings => {
          // 설정에서 enabled가 true일 경우에만 변환 프로세스를 진행

          const shouldTransform = settings.enabled && !forcePlainPaste;

          if (shouldTransform) {
            // 텍스트 변환
            const transformedText = transformText(text, settings);
            
            // 변환된 텍스트를 붙여넣기
            pasteText(transformedText);
          } else {
            // enabled가 false이면 기본 붙여넣기 동작
            pasteText(text);
          }
          // 사용 후 플래그 초기화
          forcePlainPaste = false;
        })
        .catch(err => {
          console.error("설정을 불러오는 데 실패했습니다.", err);
        });
    })
    .catch(err => {
      console.error("클립보드에서 텍스트를 읽는 데 실패했습니다.", err);
    });
});






// 받침 있는지 확인하는 함수
function hasFinalConsonant(koreanChar) {
  const code = koreanChar.charCodeAt(0) - 44032;
  return code % 28 !== 0; //받침이 있으면 트루를 반환
}

// 조사 보정 함수
function fixJosaForWords(sentence, targetWords) {
  const josaTtoFFixMap = {  //받침 트루일 때 변환
    "를": "을",
    "가": "이",
    "는": "은",
    "와": "과",
    "로": "으로",
  };
  
  const josaFtoTFixMap = {
    "을": "를",
    "이": "가",
    "은": "는",
    "과": "와",
    "으로": "로"
  }

  for (const word of targetWords) {
    // 해당 단어 뒤에 붙은 조사들을 찾아서 변환
    const josaRegex = new RegExp(`(${word})([${Object.keys(josaTtoFFixMap).join('')}|${Object.keys(josaFtoTFixMap).join('')}])`, 'g');

    sentence = sentence.replace(josaRegex, (match, w, josa) => {
      const lastChar = w[w.length - 1];
      const hasBatchim = hasFinalConsonant(lastChar);

      const isRieul = lastChar === 'ㄹ';

      if (hasBatchim){
        return w + josaTtoFFixMap[josa] || match;
      }
      else {
        return w + josaFtoTFixMap[josa] || match;
      }

    });
  }

  return sentence;
}
