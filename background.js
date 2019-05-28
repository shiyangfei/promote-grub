let currentTab;
const version = "1.0";

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    const { url } = tab
    console.log(url)
    if (url.indexOf('https://www.grubhub.com/restaurant/') === 0) {
      chrome.tabs.query( //get current Tab
        {
          currentWindow: true,
          active: true
        },
        function (tabArray) {
          currentTab = tabArray[0];
          chrome.debugger.attach({ //debug at current tab
            tabId: currentTab.id
          }, version, onAttach.bind(null, currentTab.id));
        }
      )
    }
  }
})

function onAttach(tabId) {
  chrome.debugger.sendCommand({ //first enable the Network
    tabId: tabId
  }, "Network.enable");
  chrome.debugger.onEvent.addListener(allEventHandler);
}

function allEventHandler(debuggeeId, message, params) {
  if (currentTab.id != debuggeeId.tabId) {
    return;
  }
  if (message == "Network.responseReceived") { //response return
    chrome.debugger.sendCommand({
      tabId: debuggeeId.tabId
    }, "Network.getResponseBody", {
        "requestId": params.requestId
      }, function (res) {
        if (!res) {
          return
        }
        const {body} = res
        if (body && body.indexOf('managed_delivery') > -1) {
          console.log(JSON.parse(body).restaurant.managed_delivery)
          chrome.debugger.detach(debuggeeId);
        }
      });
  }

}