let currentTab;
const version = "1.0";

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (!window.grubDict) {
    window.grubDict = {}
  }
  if (changeInfo.status == 'complete') {
    const { url } = tab
    console.log(`page url: ${url}`)
    if (url.indexOf('https://www.grubhub.com/restaurant/') === 0) {
      const managed_delivery = window.grubDict[url]
      if (managed_delivery) {
        runShowPopupScript(managed_delivery)
        return
      }
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
  console.log('event triggered')
  if (currentTab.id != debuggeeId.tabId) {
    console.log('tabId does not match')
    return;
  }
  if (message == "Network.responseReceived") {
    console.log(message)
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
        console.log('network body received')
        const { body } = res
        if (body && body.indexOf('managed_delivery') > -1) {
          console.log('managed_delivery received')
          let managed_delivery = JSON.parse(body).restaurant.managed_delivery
          managed_delivery = managed_delivery === true ? 'yes' : 'no'
          console.log(`managed_delivery: ${managed_delivery}`)
          const url = currentTab.url
          window.grubDict[url] = managed_delivery
          runShowPopupScript(managed_delivery)
          chrome.debugger.detach(debuggeeId)
        }
      });
  }
}

function runShowPopupScript(managed_delivery) {
  chrome.tabs.executeScript({
    code: `window.managed_delivery = '${managed_delivery}'`
  }, function () {
    chrome.tabs.executeScript({
      file: "showPopup.js"
    });
  });
}
