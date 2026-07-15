let floatingButton = null;
let selectionTimer = null;

// 创建悬浮按钮
function createFloatingButton() {
  const button = document.createElement('button');
  button.className = 'floating-button';
  button.textContent = '↗';
  button.style.display = 'none';
  // 阻止默认行为，避免点击按钮时清除页面上的选区
  button.addEventListener('mousedown', (e) => e.preventDefault());
  document.body.appendChild(button);
  return button;
}

// 获取选中文本最后一行的位置
function getSelectionPosition() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return null;

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();

  if (rects.length === 0) return null;

  // 获取最后一行的位置信息
  const lastRect = rects[rects.length - 1];

  return {
    top: window.scrollY + lastRect.top + (lastRect.height / 2) - 12, // 垂直居中对齐到最后一行
    left: window.scrollX + lastRect.right + 5 // 在最后一行文字右侧留出5px间距
  };
}

// 处理文本选择事件
function handleSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // 页面框架可能重建了 body，按钮节点脱离 DOM 后需要重新创建
  if (!floatingButton || !document.body.contains(floatingButton)) {
    floatingButton = createFloatingButton();
  }

  if (selectedText) {
    const pos = getSelectionPosition();
    if (pos) {
      floatingButton.style.top = `${pos.top}px`;
      floatingButton.style.left = `${pos.left}px`;
      floatingButton.style.display = 'flex';

      // 更新按钮点击事件
      floatingButton.onclick = () => {
        // 发送消息到background script
        chrome.runtime.sendMessage({
          type: "sendSelectedText",
          text: selectedText
        });
        floatingButton.style.display = 'none';
      };
    }
  } else {
    floatingButton.style.display = 'none';
  }
}

// 监听选区变化（覆盖鼠标和键盘两种选择方式），防抖避免拖选过程中频繁触发
document.addEventListener('selectionchange', () => {
  clearTimeout(selectionTimer);
  selectionTimer = setTimeout(handleSelection, 200);
});

// 点击页面其他地方时隐藏按钮
document.addEventListener('mousedown', (e) => {
  if (floatingButton && e.target !== floatingButton) {
    floatingButton.style.display = 'none';
  }
});
