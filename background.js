let currentTab;
const version = "1.0";

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    const { url } = tab
    console.log(`page url: ${url}`)
    if (url.indexOf('https://www.grubhub.com/restaurant/') === 0) {
      chrome.tabs.query({
        currentWindow: true,
        active: true
      }, function (tabArray) {
        currentTab = tabArray[0];
        chrome.debugger.attach({ //debug at current tab
          tabId: currentTab.id
        }, version, onAttach.bind(null, currentTab.id));
      })
    }
  }
})

function onAttach(tabId) {
  chrome.debugger.sendCommand({
    tabId: tabId
  }, "Network.enable");
  console.log('network enabled')
  chrome.debugger.onEvent.addListener(allEventHandler);
}

function allEventHandler(debuggeeId, message, params) {
  if (currentTab.id != debuggeeId.tabId) {
    return;
  }
  if (message == "Network.responseReceived") {
    const url = params.response.url
    if (url.indexOf('https://api-gtm.grubhub.com/restaurants/') < 0) {
      return
    }
    const { requestId } = params
    chrome.debugger.sendCommand(
      { tabId: debuggeeId.tabId },
      "Network.getResponseBody",
      { requestId },
      function (res) {
        if (!res) {
          return
        }
        const { body } = res
        if (body && body.indexOf('managed_delivery') > -1) {
          let managed_delivery = JSON.parse(body).restaurant.managed_delivery
          managed_delivery = managed_delivery === true ? 'yes' : 'no'
          console.log(managed_delivery)
          chrome.tabs.executeScript({
            code: `window.managed_delivery = '${managed_delivery}'`
          }, function () {
            chrome.tabs.executeScript({
              file: "showPopup.js"
            });
          });
          chrome.debugger.detach(debuggeeId)
        }
      });
  }
}
