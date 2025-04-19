// 기본 설정
const defaultSettings = {
  enabled: true,
  prefixEnabled: false,
  suffixEnabled: false,
  prefixText: "접두사",
  suffixText: "접미사",
  replaceRules: [
    { from: "\n", to: "", enabled: true },
    { from: "이런거", to: "저런거", enabled: false }
  ]
};

// 특수문자를 일반 문자열로 escape (정규식 방지용)
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 저장된 설정 불러오기
chrome.storage.sync.get(null, (userSettings) => {
  const settings = Object.assign({}, defaultSettings, userSettings);
  if (!settings.enabled) return;

  console.log("📦 불러온 설정:", userSettings);
  console.log("⚙️ 적용된 설정:", settings);

  document.addEventListener('paste', (event) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    let text = clipboardData.getData('text');

    console.log("📋 원본 텍스트:", text);

    // 치환 작업
    settings.replaceRules.forEach(rule => {
      if (rule.enabled) {
        const regex = new RegExp(escapeRegExp(rule.from), 'g');
        text = text.replace(regex, rule.to);
      }
    });

    if (settings.prefixEnabled) {
      text = settings.prefixText + text;
    }
    if (settings.suffixEnabled) {
      text = text + settings.suffixText;
    }

    console.log("🪄 변환된 텍스트:", text);

    // 붙여넣기 기본 동작 막기
    event.preventDefault();

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
  });
});
