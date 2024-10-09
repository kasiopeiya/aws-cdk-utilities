# npmライブラリ更新手順

AWS CDKを含むnpmライブラリのアップデート手順

## npm-check-updatesのインストール

- npm-check-updatesはpackege.jsonのバージョンを新しいものに書き換えてくれるライブラリ
- グローバルにインストールすること
- 初回のみ実施

```bash
npm i -g npm-check-updates
```

## 更新情報の確認

- 以下コマンドでアップデート情報を確認できる

```bash
npm outdated
```

```bash
Package                            Current    Wanted   Latest  Location                                       Depended by
@types/node                       20.11.19  20.11.19  20.12.4  node_modules/@types/node                       cdk-project-github-actions
@typescript-eslint/eslint-plugin    6.21.0    6.21.0    7.5.0  node_modules/@typescript-eslint/eslint-plugin  cdk-project-github-actions
aws-cdk                            2.128.0   2.128.0  2.135.0  node_modules/aws-cdk                           cdk-project-github-actions
aws-cdk-lib                        2.128.0   2.128.0  2.135.0  node_modules/aws-cdk-lib                       cdk-project-github-actions
cdk-nag                            2.28.69   2.28.81  2.28.81  node_modules/cdk-nag                           cdk-project-github-actions
typescript                           5.3.3     5.3.3    5.4.3  node_modules/typescript                        cdk-project-github-actions
winston                             3.12.0    3.13.0   3.13.0  node_modules/winston                           cdk-project-github-actions
```

## package.jsonの最新化

- マイナーバージョンアップだけしたい場合

```bash
ncu -u --target patch
```

```bash
[====================] 22/22 100%

 @types/node                       20.11.19  →  20.11.30
 @typescript-eslint/eslint-plugin    ^6.4.0  →    ^6.4.1
 cdk-nag                           ^2.28.69  →  ^2.28.81
 winston                            ^3.12.0  →   ^3.12.1

Run npm install to install new versions.
```

- メジャーバージョンアップもしたい場合

```bash
ncu -u
```

```bash
[====================] 22/22 100%

 @types/node                       20.11.19  →  20.11.30
 @typescript-eslint/eslint-plugin    ^6.4.0  →    ^6.4.1
 cdk-nag                           ^2.28.69  →  ^2.28.81
 winston                            ^3.12.0  →   ^3.12.1

Run npm install to install new versions.
```

## snapshotテストの実施

- ライブラリ更新によって出力されるCloudFormtionテンプレートが変わらないことを確認するため、  
  snapshotテストをライブラリの更新前後に実施する

```bash
npm run test:snap -- -u
```

## ライブラリ更新

```bash
npm i
```

## snapshotテストの実施(確認)

```bash
npm run test:snap
```
