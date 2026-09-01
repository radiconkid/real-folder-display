// メール表示ドキュメント内で実行される（messageDisplayScriptsにより注入）。
// 背景スクリプトに現在表示中メールのフォルダー情報を問い合わせ、
// メール本文の一番上にバナーとして表示する。

(function () {
  const BANNER_ID = "__real-folder-banner__";

  function createBanner(text) {
    if (document.getElementById(BANNER_ID)) return;
    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.textContent = text;
    Object.assign(banner.style, {
      display: "block",
      background: "#fff6e0",
      color: "#5b4600",
      padding: "4px 10px",
      margin: "0 0 8px 0",
      fontSize: "12px",
      fontFamily:
        "-apple-system, 'Segoe UI', 'Hiragino Kaku Gothic ProN', sans-serif",
      borderBottom: "1px solid #f0d78a",
      whiteSpace: "pre-wrap",
    });
    if (document.body) {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  function request() {
    browser.runtime
      .sendMessage({ type: "real-folder-display:get-info" })
      .then((res) => {
        if (res && res.label) {
          createBanner(res.label);
        }
      })
      .catch(() => {
        // 取得できない場合は何も表示しない
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", request);
  } else {
    request();
  }
})();
