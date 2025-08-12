# GPT-5 Thinking — Interactive Media Art (noindex版 v2)
中央テキストを「中央揃えの3段表示」に変更しました。Netlify など静的ホスティングにフォルダごとアップするだけで動作します。

- `index.html` の `<head>` に検索回避用メタタグ（robots / googlebot の noindex, nofollow, noarchive）を追加済み。
- 併せて `robots.txt` も `Disallow: /` を設定済み。

## デプロイ（Netlify ドラッグ＆ドロップ）
1. このフォルダを zip 化（同梱の zip を使ってOK）
2. Netlify ダッシュボード → 対象サイト → **Deploys** → **Upload deploy**（またはドラッグ＆ドロップ）
3. 既存サイトに上書きデプロイされ、すぐに反映されます（キャッシュは Ctrl+F5 / ⌘+Shift+R）
