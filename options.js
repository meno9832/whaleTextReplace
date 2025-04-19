document.addEventListener('DOMContentLoaded', () => {
  // 저장된 설정을 불러오기
  loadSettings()
    .then(settings => {
      // 불러온 설정을 폼에 채워넣기
      document.getElementById('enabled').checked = settings.enabled;
      document.getElementById('prefixText').value = settings.prefixText;
      document.getElementById('prefixEnabled').checked = settings.prefixEnabled;
      document.getElementById('suffixText').value = settings.suffixText;
      document.getElementById('suffixEnabled').checked = settings.suffixEnabled;

      // 텍스트 변경 항목들 불러오기
      const changeTextContainer = document.getElementById('changeTextContainer');
      settings.replaceRules.forEach(rule => {
        addChangeTextItem(rule.from, rule.to, rule.enabled);
      });
    })
    .catch(err => {
      console.error('설정 불러오기 오류:', err);
    });

  // 저장 버튼 클릭 시 설정 저장
  document.getElementById('saveSettings').addEventListener('click', () => {
    const newSettings = {
      enabled: document.getElementById('enabled').checked,
      prefixText: document.getElementById('prefixText').value,
      prefixEnabled: document.getElementById('prefixEnabled').checked,
      suffixText: document.getElementById('suffixText').value,
      suffixEnabled: document.getElementById('suffixEnabled').checked,
      replaceRules: getReplaceRules() // 텍스트 변경 항목들 반환
    };

    // 설정 저장
    saveSettings(newSettings);
  });

  // 텍스트 변경 항목 추가
  document.getElementById('addChangeTextItem').addEventListener('click', () => {
    addChangeTextItem();
  });
});

// 설정을 chrome.storage.local에서 불러오는 함수
function loadSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error("저장소에서 설정을 가져오는 데 실패했습니다.", chrome.runtime.lastError);
        resolve(defaultSettings); // 오류 발생 시 기본값 반환
      } else {
        if (result.settings) {
          resolve(result.settings); // 저장된 설정 반환
        } else {
          resolve(defaultSettings); // 설정이 없다면 기본값 반환
          alert("기본값 반환");
        }
      }
    });
  });
}


// 설정을 chrome.storage.local에 저장하는 함수
function saveSettings(settings) {
  chrome.storage.sync.set({ settings: settings }, function() {
    if (chrome.runtime.lastError) {
      console.error("설정 저장 중 오류 발생:", chrome.runtime.lastError);
    } else {
      alert('설정이 성공적으로 저장되었습니다.');
    }
  });
}



// 텍스트 변경 항목을 배열로 반환하는 함수
function getReplaceRules() {
  const replaceRules = [];
  const changeTextItems = document.querySelectorAll('.change-text-item');

  changeTextItems.forEach(itemDiv => {
    const from = itemDiv.querySelector('.from-text').value;
    const to = itemDiv.querySelector('.to-text').value;
    const enabled = itemDiv.querySelector('input[type="checkbox"]').checked;
    replaceRules.push({ from, to, enabled });
  });

  return replaceRules;
}

// 텍스트 변경 항목을 추가하는 함수
function addChangeTextItem(from = '', to = '', enabled = true) {
  const changeTextContainer = document.getElementById('changeTextContainer');
  
  const itemDiv = document.createElement('div');
  itemDiv.classList.add('change-text-item');
  
  itemDiv.innerHTML = `
    <label>변경할 텍스트: <input type="text" class="from-text" value="${from}" /></label>
    <label>변경 후 텍스트: <input type="text" class="to-text" value="${to}" /></label>
    <label><input type="checkbox" class="enabled" ${enabled ? 'checked' : ''}> 적용 여부</label>
    <button class="remove">삭제</button>
  `;
  
  // 삭제 버튼 기능 추가
  itemDiv.querySelector('.remove').addEventListener('click', () => {
    changeTextContainer.removeChild(itemDiv);
  });

  changeTextContainer.appendChild(itemDiv);
}

// 기본 설정
const defaultSettings = {
  enabled: true,
  prefixText: '접두사',
  prefixEnabled: false,
  suffixText: '접미사',
  suffixEnabled: false,
  replaceRules: [
    { from: '이런거', to: '저런거', enabled: true }
  ]
};
