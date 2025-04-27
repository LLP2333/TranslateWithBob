
let port = chrome.runtime.connectNative("translate_server");


port.onDisconnect.addListener((port) => {
  if (port.error) {
    console.log(`Disconnected due to an error: ${port.error.message}`);
  } else {
    console.log(`Disconnected`, port);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "sendSelectedText") {
    console.log("Sending selected text: ", message.text);
    port.postMessage(message.text);
  }
});

/*
When the extension's action icon is clicked, send the app a message.
*/
// chrome.action.onClicked.addListener(() => {
//   console.log("Sending:  ping");
//   port.postMessage("ping");
// });
