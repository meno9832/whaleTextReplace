const rulesContainer = document.getElementById("rulesContainer");

const defaultSettings = {
  replaceRules: [
    { from: "바보", to: "천재", enabled: true },
    { from: "안녕", to: "Hello", enabled: true },
    { from: "나빠", to: "좋아", enabled: false }
  ],
  prefixEnabled: false,
  suffixEnabled: false,
  prefixText: "[PREFIX]",
  suffixText: "[SUFFIX]"
};

// 규칙 렌더링
function renderRules(rules) {
  rulesContainer.innerHTML = '';

  rules.forEach((rule, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <input type="checkbox" ${rule.enabled ? 'checked' : ''} id="check${index}">
      <input type="text" value="${rule.from}" id="from${index}" placeholder="변경 전">
      =>
      <input type="text" value="${rule.to}" id="to${index}" placeholder="변경 후">
      <button id="delete${index}">삭제</button>
    `;
    rulesContainer.appendChild(div);

    // 삭제 버튼 이벤트 연결
    div.querySelector(`#delete${index}`).addEventListener("click", () => {
      rules.splice(index, 1);
      renderRules(rules);
    });
  });
}

// 현재 DOM에서 규칙 읽기
function getRulesFromDOM() {
  const rules = [];
  const divs = rulesContainer.querySelectorAll('div');
  divs.forEach((div, i) => {
    const enabled = div.querySelector(`#check${i}`).checked;
    const from = div.querySelector(`#from${i}`).value.trim();
    const to = div.querySelector(`#to${i}`).value.trim();
    if (from && to) {
      rules.push({ from, to, enabled });
    }
  });
  return rules;
}

// 저장 버튼 클릭 시
document.getElementById("save").addEventListener("click", () => {
  const settings = {
    replaceRules: getRulesFromDOM(),
    prefixEnabled: document.getElementById("prefixToggle").checked,
    suffixEnabled: document.getElementById("suffixToggle").checked,
    prefixText: document.getElementById("prefixText").value.trim(),
    suffixText: document.getElementById("suffixText").value.trim()
  };

  chrome.storage.sync.set(settings, () => {
    alert("저장 완료!");
  });
});

// 규칙 추가 버튼 클릭 시
document.getElementById("addRule").addEventListener("click", () => {
  const current = getRulesFromDOM();
  current.push({ from: "", to: "", enabled: true });
  renderRules(current);
});

// 설정 불러오기
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(null, (data) => {
    const merged = Object.assign({}, defaultSettings, data);
    renderRules(merged.replaceRules);
    document.getElementById("prefixToggle").checked = merged.prefixEnabled;
    document.getElementById("suffixToggle").checked = merged.suffixEnabled;
    document.getElementById("prefixText").value = merged.prefixText;
    document.getElementById("suffixText").value = merged.suffixText;

    // 텍스트박스 활성화 여부 동기화
    toggleInputState();
  });

  // 체크박스 변경 시 텍스트 입력창 활성화 상태 조절
  document.getElementById("prefixToggle").addEventListener("change", toggleInputState);
  document.getElementById("suffixToggle").addEventListener("change", toggleInputState);
});

function toggleInputState() {
  document.getElementById("prefixText").disabled = !document.getElementById("prefixToggle").checked;
  document.getElementById("suffixText").disabled = !document.getElementById("suffixToggle").checked;
}
