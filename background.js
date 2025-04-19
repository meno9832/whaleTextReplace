// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSettings') {
      // 설정을 chrome.storage.local에서 불러옵니다.
      chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings || {}; // 설정이 없으면 기본값을 반환
        console.log('불러온 설정:', settings); // 디버깅 로그 추가
        sendResponse(settings);
      });
      return true; // 비동기 응답을 위해 true 반환
    } else if (message.action === 'saveSettings') {
      const settings = message.settings;
  
      // 설정을 chrome.storage.local에 저장
      chrome.storage.local.set({ settings: settings }, () => {
        console.log('설정이 저장되었습니다:', settings); // 디버깅 로그 추가
        sendResponse({ status: 'success' });
      });
      return true; // 비동기 응답을 위해 true 반환
    }
  });
  