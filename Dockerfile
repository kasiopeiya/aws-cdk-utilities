FROM node:20.17.0-slim

# vimやcurlなどの必要パッケージのインストール
RUN apt-get update && apt-get install -y unzip curl vim dpkg wget jq && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    export PATH="$PATH:/aws/dist" && \
    rm awscliv2.zip

# vimの設定
COPY ./.vimrc /root/.vimrc:ro

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

CMD ["bash"]
