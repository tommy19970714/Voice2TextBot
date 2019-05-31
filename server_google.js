'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const speech = require('@google-cloud/speech');
const Fdkaac = require("node-fdkaac").Fdkaac;

const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.SECRET,
    channelAccessToken: process.env.TOKEN
};
const lineClient = new line.Client(config);
const speechClient = new speech.SpeechClient();

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result))
      .catch((error) => {
        if(error.response) {
          console.log(error.response);
        }
        console.log("Problem submitting New Post: ", error);
      });
});

function handleEvent(event) {

    // for Connection check on developr console
    const replyToken = event.replyToken;
    if (replyToken === '00000000000000000000000000000000') {
        console.log('this request is connection check.');
        return {
            statusCode: 200,
        };
    }
    
    // if message is audio type
    if (event.message.type === 'audio') {
        console.log("this is voice messege");
        const audioData = fetchAudioMessage(
            event.message.id
        ).then(function (audioData) {
            
            convert(audioData)
                .then(function (audioBytes) {
                    return describe(audioBytes);
                }).then(function (text) {
                    lineClient.replyMessage(event.replyToken, {
                        type: 'text',
                        text: text
                    });
                });
        });   
    }
}

function fetchAudioMessage(messageId) {
    console.log('[START]getVoiceMessage');
    return new Promise((resolve, reject) => {
      lineClient.getMessageContent(messageId).then((stream) => {
        const content = [];
        stream
            .on('data', (chunk) => {
              console.log(chunk);
              content.push(new Buffer(chunk));
            })
            .on('error', (err) => {
              reject(err);
            })
            .on('end', function() {
              console.log(content);
              console.log('[END  ]getVoiceMessage');
              resolve(Buffer.concat(content));
            });
        });
    });
}

function convert(audioData) {
    return new Promise((resolve, reject) => {
        const decoder = new Fdkaac({
            "output": "buffer",
            "bitrate": 192
        }).setBuffer(audioData);

        decoder.decode()
            .then(() => {
                // Encoding finished
                console.log("Encoding finished");
                const buffer = decoder.getBuffer();
                const audioBytes = buffer.toString('base64');
                resolve(audioBytes);
            })
            .catch((error) => {
                // Something went wrong
                console.log("decode error: ", error);
            });
    });
}

function describe(audioBytes) {
    return new Promise((resolve, reject) => {
        // The audio file's encoding, sample rate in hertz, and BCP-47 language code
        const audio = {
            content: audioBytes,
        };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'ja-JP',
        };
        const request = {
            audio: audio,
            config: config,
        };

        speechClient
            .recognize(request)
            .then(data => {
                const response = data[0];
                const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
                console.log(`Transcription: ${transcription}`);
                resolve(transcription);
            })
            .catch(err => {
                console.error('ERROR:', err);
            });
    });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);