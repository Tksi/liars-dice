## formatter, linter, type checkの実行方法

### VSCode

開いているファイルに対して、自動で動作します。

⚠️ `package.json` があるディレクトリを単体で開いてください。workspaceだとうまく動かない場合があります。

### コマンド

⚠️ Linuxで実行してください。yarnの場合は、`npm run` を `yarn` に置き換えてください。

以下を実行すると、すべてのファイルに対して実行されます(自動修正可能なものは修正されます)。

```bash
npm run fix
```

以下を実行すると、修正はせずすべてのファイルに対してチェックのみ行います(ci用)。

```bash
npm run checkall
```

## 構成

- formatter: Prettier
- linter: ESLint
- type check: tsc

## 設定ファイルの簡単な説明

### .vscode/extensions.json

推奨するVSCode拡張の定義です。推奨拡張機能がインストールされていない場合、通知がでます。  
以下の拡張機能を指定しています。

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### .vscode/settings.json

VSCodeの設定です。主に以下の設定を行っています。

- 保存時にPrettierが動くように
- 保存時にESLintの自動修正が動くように

### .editorconfig

エディタにおける文字コード、改行コードの設定です。UTF-8とLFにしています。

### .gitattributes

gitにおける改行コードの設定です。LFにしています。

### .prettierrc.json

Prettierの設定です。文字列リテラルは `'` を優先するようにしています。

### eslint.config.js

ESLintの設定です。

### nuxt.config.ts

Nuxtの設定です。以下を設定しています。

- SSRの無効化(SPAモード)
- Typed Pagesの有効化: [Nuxt 3 組み込みの新機能「Typed Pages」で型安全なルーティング](https://zenn.dev/ytr0903/articles/8444a0a2d1bf22)
- tsconfigの設定: 厳格な型チェックのためのルールを有効化
