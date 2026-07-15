let floatingButton = null;
let selectionTimer = null;

const BUTTON_SIZE = 28;

// Material Design 的 translate 图标
const TRANSLATE_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12.87 15.07-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z"/>
  </svg>`;

// 创建悬浮按钮
function createFloatingButton() {
  const button = document.createElement('button');
  button.className = 'bob-translate-button';
  button.type = 'button';
  button.title = '使用 Bob 翻译';
  button.innerHTML = TRANSLATE_ICON;
  // 阻止默认行为，避免点击按钮时清除页面上的选区
  button.addEventListener('mousedown', (e) => e.preventDefault());
  document.body.appendChild(button);
  return button;
}

function showButton(pos) {
  floatingButton.style.top = `${pos.top}px`;
  floatingButton.style.left = `${pos.left}px`;
  floatingButton.classList.add('bob-visible');
}

function hideButton() {
  if (floatingButton) {
    floatingButton.classList.remove('bob-visible');
  }
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

  // 垂直居中对齐到最后一行，水平方向在文字右侧留出6px间距
  let top = window.scrollY + lastRect.top + lastRect.height / 2 - BUTTON_SIZE / 2;
  let left = window.scrollX + lastRect.right + 6;

  // 避免按钮超出视口右侧
  const maxLeft = window.scrollX + document.documentElement.clientWidth - BUTTON_SIZE - 8;
  if (left > maxLeft) {
    left = maxLeft;
    top = window.scrollY + lastRect.bottom + 6;
  }

  return { top, left };
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
      showButton(pos);

      // 更新按钮点击事件
      floatingButton.onclick = () => {
        // 发送消息到background script
        chrome.runtime.sendMessage({
          type: "sendSelectedText",
          text: selectedText
        });
        hideButton();
      };
    }
  } else {
    hideButton();
  }
}

// 监听选区变化（覆盖鼠标和键盘两种选择方式），防抖避免拖选过程中频繁触发
document.addEventListener('selectionchange', () => {
  clearTimeout(selectionTimer);
  selectionTimer = setTimeout(handleSelection, 200);
});

// 点击页面其他地方时隐藏按钮
document.addEventListener('mousedown', (e) => {
  if (floatingButton && !floatingButton.contains(e.target)) {
    hideButton();
  }
});
