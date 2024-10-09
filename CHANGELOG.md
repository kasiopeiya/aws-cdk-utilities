# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.15](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.14...v0.1.15) (2024-07-21)


### CI

* deploy actionにconcurrency設定を追加 ([9116692](https://github.com/kasiopeiya/cdk-project-template/commit/91166929532d1b464e8e9917338b6fb61ee4dfa4))

### [0.1.14](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.13...v0.1.14) (2024-07-21)

### [0.1.13](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.12...v0.1.13) (2024-07-20)


### Features

* スタック削除保護設定の有効化無効化できるように実装変更 ([ccb1325](https://github.com/kasiopeiya/cdk-project-template/commit/ccb132571c9c1524ac05392a9a8fe2d88275ff24))


### CI

* **prod-deploy.yml:** cdk destroyを追加 ([571e1a4](https://github.com/kasiopeiya/cdk-project-template/commit/571e1a4c12a7086abe1b3df4835012d63a24881f))

### [0.1.12](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.11...v0.1.12) (2024-07-15)

### [0.1.11](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.9...v0.1.11) (2024-07-15)


### Bug Fixes

* **build.yml:** awsアカウントIDのセットを追加 ([d654a37](https://github.com/kasiopeiya/cdk-project-template/commit/d654a378485528cba201665c9067cc8b2bd06eab))

### [0.1.10](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.9...v0.1.10) (2024-05-06)


### Bug Fixes

* **build.yml:** awsアカウントIDのセットを追加 ([d654a37](https://github.com/kasiopeiya/cdk-project-template/commit/d654a378485528cba201665c9067cc8b2bd06eab))

### [0.1.9](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.8...v0.1.9) (2024-05-03)


### Features

* **release.yml:** アセット作成時の削除フォルダ追加 ([cede0b5](https://github.com/kasiopeiya/cdk-project-template/commit/cede0b54ba95c9f2b60f4bae24eecb1669569e08))


### Bug Fixes

* **release.yml:** type修正 ([cf28886](https://github.com/kasiopeiya/cdk-project-template/commit/cf288864bf974d07ed3d919ca0975afd2b56a5a8))


### CI

* markdownlintの設定を修正 ([00beb69](https://github.com/kasiopeiya/cdk-project-template/commit/00beb696b1d7f5118ef48babda3df52d2b813506))


### Document Changes

* readme記載 ([82f6a2f](https://github.com/kasiopeiya/cdk-project-template/commit/82f6a2fe17988f461690a47af57407d4dd93debd))

### [0.1.8](https://github.com/kasiopeiya/cdk-project-template/compare/v0.1.7...v0.1.8) (2024-05-03)


### Bug Fixes

* .mergify.ymlの重複削除 ([11a9667](https://github.com/kasiopeiya/cdk-project-template/commit/11a96671a14c8af484734f1307f0fc164f33b78d))
* **extensions.json:** ファイル名修正 ([1c7c975](https://github.com/kasiopeiya/cdk-project-template/commit/1c7c975f5ec73765d844c8641d8351df8f4008b1))
* トリガーを修正 ([c7f37da](https://github.com/kasiopeiya/cdk-project-template/commit/c7f37da37e1312be1ba18231566ca7bd3484a22b))


### CI

* **.mergify.yml:** マージルール追加 ([f0c15a4](https://github.com/kasiopeiya/cdk-project-template/commit/f0c15a454620e08c632d6be0752155b967416868))
* actionにsnapshotテスト追加 ([f68f72e](https://github.com/kasiopeiya/cdk-project-template/commit/f68f72ec5479f3cdb526545aad201967d2270e49))
* buildのみアクション追加 ([6128063](https://github.com/kasiopeiya/cdk-project-template/commit/6128063b5dcff3344a626c8bd1ae63e66c39dfa0))
* depcheck追加 ([1b97667](https://github.com/kasiopeiya/cdk-project-template/commit/1b97667b546f60fb2d7978429e9f639ebfef1551))
* mergify設定ファイル追加 ([3b537fe](https://github.com/kasiopeiya/cdk-project-template/commit/3b537fef20d3e0ca5e223137f3632b8a4fbd4717))
* **release.yml:** release作成workflow追加 ([32f4bd0](https://github.com/kasiopeiya/cdk-project-template/commit/32f4bd079d2b4f4fc9b09d178b822ad1ea33ddc5))
* ビルドにformat, lint, synthを追加 ([5dd8dd0](https://github.com/kasiopeiya/cdk-project-template/commit/5dd8dd095ccff84900d2f41702542f016587c0fc))

### [0.1.7](https://github.com/kasiopeiya/cdk-project-template-github-actions/compare/v0.1.6...v0.1.7) (2024-04-09)


### CI

* .prettierignoreと.eslintignore追加 ([3ecb66b](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/3ecb66bf591bcc388628b15e8d2d5184a902a51b))
* **.versionrc:** changlogの出力設定変更 ([b936590](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/b93659042f841cff3ce7217551ceaa7e60cd2217))

### [0.1.6](https://github.com/kasiopeiya/cdk-project-template-github-actions/compare/v0.1.5...v0.1.6) (2024-04-08)

### Bug Fixes

- **versionrc:** 記載ミス修正 ([7e7d133](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/7e7d133c40c79c332d4a6f66cfb935f9aae5a639))

### Document Changes

- hoge.md削除 ([f6ae48f](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/f6ae48f645e1f78751844c0a5080e4f6227d25d3))

### [0.1.5](https://github.com/kasiopeiya/cdk-project-template-github-actions/compare/v0.1.4...v0.1.5) (2024-04-08)

### Bug Fixes

- **.versionrc.js:** 誤記修正 ([73af5df](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/73af5df1366035545f917f64150a761ad33127d4))
- **.versionrc:** ファイル形式変更 ([6f31a9f](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/6f31a9f873cfc57cc76cfe0e8e03b361ddbc8916))

- hoge.md削除 ([b968005](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/b96800557bb79a242231c8438687c8df720b96b7))
- hoge.md追加 ([fa50788](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/fa507886635f8e15e5375a2631e412de703b0fd2))

### [0.1.4](https://github.com/kasiopeiya/cdk-project-template-github-actions/compare/v0.1.3...v0.1.4) (2024-04-08)

### Features

- testコミット ([6db6346](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/6db6346450dbbb39ffd7e32209d84d1454aa07a4))

### [0.1.3](https://github.com/kasiopeiya/cdk-project-template-github-actions/compare/v0.1.2...v0.1.3) (2024-04-08)

### Features

- testコミット ([3a73012](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/3a730127d2b5a87f4a71e5d15619f06f6ae62b87))

### [0.1.2](https://github.com/kasiopeiya/cdk-project-template-github-actions/compare/v0.1.1...v0.1.2) (2024-04-08)

### 0.1.1 (2024-04-08)

### Features

- commitllint追加 ([78de388](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/78de3885cdbf7b6d78653c21521c20862a9fc9c8))
- git diffコマンドオプション修正 ([dcb3670](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/dcb3670e6c2656971f2f16db72a57cd240431452))
- markdownのCI追加 ([239f6f1](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/239f6f145c5d5cfc8d1a63b274dc2c3b5dc78413))
- projectのsettings.json追加 ([d92e939](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/d92e9390c8e05a42ccb5dffab43ca3b789fe12ff))
- 不要リソース削除 ([942c2af](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/942c2af7622ab2e78881394a0086cc9f243afbe0))

### Bug Fixes

- Lambda Layerのimportエラー修正 ([3454f67](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/3454f679ed9f34a1a2217cf2d14029e194c000eb))
- 自作ConstructのProps設定の不具合修正 ([b0dd0f8](https://github.com/kasiopeiya/cdk-project-template-github-actions/commit/b0dd0f8ccf5d13328ac3daff34d635743960fe6a))
