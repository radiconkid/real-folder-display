// 統合フォルダーなどで表示中のメールについて、
// 実際に格納されているアカウント・フォルダーを取得するユーティリティ。
//
// メール本文の先頭にバナーとして常時テキスト表示する（統合フォルダー経由で
// 見ている時のみ。実フォルダーを直接開いている場合は表示しない）。

// 現在表示中のフォルダー（統合フォルダー等）と、メールの実フォルダーを比較し、
// バナーを表示すべきかどうかを判定する。
// - 統合フォルダーなど「実フォルダーと異なる場所」から見ている場合のみ表示
// - メールの実フォルダーをそのまま開いている場合は不要なので非表示
async function shouldShowBanner(tabId, message) {
  const folder = message && message.folder;
  if (!folder) return true; // フォルダー情報が取れない場合は安全側で表示

  try {
    const mailTab = await browser.mailTabs.get(tabId);
    const displayed = mailTab && mailTab.displayedFolder;
    if (!displayed) return true;

    if (displayed.isUnified) return true; // 統合フォルダーを閲覧中 -> 表示

    const sameFolder =
      displayed.accountId === folder.accountId && displayed.path === folder.path;
    return !sameFolder;
  } catch (e) {
    // 別タブ/別ウィンドウで開かれたメッセージ等、mailTabではない場合は
    // 判定できないため、安全側で表示しておく
    return true;
  }
}

async function getFolderLabel(tabId) {
  const messages = await browser.messageDisplay.getDisplayedMessages(tabId);
  const message = messages && messages[0];
  if (!message) return null;

  const folder = message.folder;
  let accountName = "";
  if (folder && folder.accountId) {
    try {
      const account = await browser.accounts.get(folder.accountId);
      if (account) accountName = account.name;
    } catch (e) {
      // アカウント情報が取得できない場合はフォルダ情報のみで表示
    }
  }

  const folderName = (folder && folder.name) || "?";
  const showBanner = await shouldShowBanner(tabId, message);
  if (!showBanner) return null;

  const label = accountName
    ? `実際のフォルダー: ${accountName} / ${folderName}`
    : `実際のフォルダー: ${folderName}`;

  // バナークリックで実フォルダーへ移動できるよう、フォルダー情報も返す
  return {
    label,
    accountId: folder ? folder.accountId : null,
    path: folder ? folder.path : null,
    messageId: message.id || null,
  };
}

// メール本文内に注入されたスクリプト(content/inject.js)からの問い合わせに応答する
browser.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "real-folder-display:get-info") return;
  const tabId = sender.tab && sender.tab.id;
  if (!tabId) return Promise.resolve(null);

  return getFolderLabel(tabId)
    .then((info) =>
      info
        ? {
            label: info.label,
            accountId: info.accountId,
            path: info.path,
            messageId: info.messageId,
          }
        : null
    )
    .catch(() => null);
});

// バナークリック時に実フォルダーへ移動し、そのメールを開くための要求に応答する
browser.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "real-folder-display:navigate") return;
  const tabId = sender.tab && sender.tab.id;
  if (!tabId || !msg.accountId || !msg.path) return Promise.resolve(false);

  return browser.mailTabs
    .update(tabId, {
      displayedFolder: { accountId: msg.accountId, path: msg.path },
    })
    .then(async () => {
      if (msg.messageId) {
        try {
          await browser.mailTabs.setSelectedMessages(tabId, [msg.messageId]);
        } catch (e) {
          console.error("実際のフォルダー表示: メッセージ選択に失敗しました", e);
        }
      }
      return true;
    })
    .catch((e) => {
      console.error("実際のフォルダー表示: フォルダー移動に失敗しました", e);
      return false;
    });
});

// メール本文の先頭にバナーを表示するためのスクリプトを登録する。
// 登録後に開かれたメールから適用される。
(async function registerDisplayScript() {
  try {
    await browser.messageDisplayScripts.register({
      js: [{ file: "content/inject.js" }],
    });
  } catch (e) {
    console.error("実際のフォルダー表示: スクリプト登録に失敗しました", e);
  }
})();
