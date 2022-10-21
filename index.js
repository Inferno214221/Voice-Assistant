#!/usr/bin/node
const cwd = __dirname + "/";
var vosk = require('vosk');
const fs = require("fs");
var mic = require("mic");
const { dir } = require('console');
const { isBoxedPrimitive } = require('util/types');
const config = require(cwd + "extensions/config.json");
const extensions = [];
fs.readdirSync(cwd + "extensions").filter(function (file) {
    return fs.statSync(cwd + "extensions/" + file).isDirectory();
}).forEach(directory => {
    extensions[directory] = require(cwd + "extensions/" + directory + "/index.js");
});

MODEL_PATH = cwd + "model"
SAMPLE_RATE = 16000

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });

var micInstance = mic({
    rate: String(SAMPLE_RATE),
    channels: '1',
    debug: false,
    device: 'default'
});

var micInputStream = micInstance.getAudioStream();

micInputStream.on('data', data => {
    if (rec.acceptWaveform(data)) {
        interpret(rec.result()["text"]);
    }
});

micInputStream.on('audioProcessExitComplete', function () {
    console.log("Cleaning up");
    console.log(rec.finalResult());
    rec.free();
    model.free();
});

process.on('SIGINT', function () {
    console.log("\nStopping");
    micInstance.stop();
})

micInstance.start();

function interpret(result) {
    console.log(result);
    var activate;
    config["activate"].forEach(i => {
        if (result.includes(i)) {
            activate = i;
        }
    });
    if (activate == undefined) {
        console.log("Not activated");
        return;
    }
    console.log("Activated");
    result = result.replace(activate + " ", "");
    console.log(result);
    
    var bestTrigger;
    Object.keys(config["triggers"]).forEach(trigger => {
        if (result.includes(trigger)) {
            bestTrigger = trigger;
            //TODO: Find the best trigger during conflicts
        }
    });
    if (bestTrigger == undefined) {
        console.log("No trigger found");
        return;
    }
    console.log("Triggered");
    if (result.includes(bestTrigger + " ")) {
        result = result.replace(bestTrigger + " ", "");
    } else { // Is it bad to run twice? If i said the name of the extension twice it should only remove it once.
        result = result.replace(" " + bestTrigger, "");
    }

    extensions[config["triggers"][bestTrigger]].run(result);
}