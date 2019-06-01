# Voice2TextBot

<img src="https://raw.githubusercontent.com/tommy19970714/Voice2TextBot/master/docs/example.gif" width="320px">

## Overview

基本的には、次の図のような構成になります。LINE Botを扱うAPIのことをLINE Messeging APIといい、サーバ上から呼び出します。サーバはnodejsで実装し、文字起こしには Google Cloud Speech APIを使用しました。しかし、Messeging APIから得られるのは、m4a形式のbufferで、Google Cloud Speech APIはm4a形式に対応していなかったので、サーバ上で変換を行ってから、APIに音声を投げています。

![overview](https://raw.githubusercontent.com/tommy19970714/Voice2TextBot/master/docs/overview.png)

## installation

### LINE botの作成
LINE developerのgetting startedに従い、Botを作成し、 Channel Secretとアクセストークンを取得します。
https://developers.line.biz/ja/docs/messaging-api/getting-started/

環境変数としてトークンを設定します。

```
export SECRET=xxxxxx
export TOKEN=xxxxxxxxxxxxxxxxxxx
```

### Google Speech APIの設定
以下のGoogle Cloud SDK のドキュメントに従い、GCP Console プロジェクトをセットアップします。
https://cloud.google.com/sdk/docs/

GCP Console画面でGoogle Speech APIを有効にしてください。

環境変数 GOOGLE_APPLICATION_CREDENTIALS をサービス アカウント キーが含まれる JSON ファイルのファイルパスに設定します。

```
export GOOGLE_APPLICATION_CREDENTIALS="/home/user/project-xxxxxxxxxx.json"
```


### ffmpegのインストール

サーバではLINEボイスメッセージはm4a形式のため、Google Speech APIにアップロードする際にwav形式に変換しています。その変換にffmpegを使っているため、インストールが必要です。

```
sudo apt install ffmpeg
```

### nodeの実行

まず使用しているpackageをnpm経由でインストールします。`Voice2TextBot`ディレクトリ内で次を実行します。

```
npm install
```

次を実行することで、expressサーバが立ち上がります。

```
node server_google.js
```

`/webhook`のエンドポイントができるので、LINE developerページの設定の`Webhook URL`をサーバを実行しているドメインのwebhookエンドポイント(https://exmaple.com/webhook)に設定することで、LINE Botを運用することができます。その際、SSLが必須になっています。証明書の取得をしなくても、手元のPCのlocalhostにグローバルからアクセスできるようにするトンネリングツールも存在します(https://dashboard.ngrok.com/)。
