let port = null;

function connect() {
  port = chrome.runtime.connectNative("translate_server");
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.log(`Disconnected due to an error: ${chrome.runtime.lastError.message}`);
    } else {
      console.log("Disconnected");
    }
    // 置空以便下次发送时重连
    port = null;
  });
}

function sendToNative(text) {
  if (!port) {
    connect();
  }
  try {
    port.postMessage(text);
  } catch (e) {
    // 端口已失效但尚未触发 onDisconnect，重连后重发一次
    console.log(`postMessage failed, reconnecting: ${e.message}`);
    connect();
    port.postMessage(text);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "sendSelectedText") {
    console.log("Sending selected text: ", message.text);
    sendToNative(message.text);
  }
});
