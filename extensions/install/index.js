const cwd = __dirname + "/../../";
const fs = require("fs");
const ghdownload = require("github-download");
const exec = require("exec");
const repolist = require(__dirname + "/repolist.json");
var config = require(cwd + "extensions/config.json");

async function run (args) {
    await ghdownload(repolist[args], cwd + "extensions/" + args + "/").on('end', function() {
        configInject = require(cwd + "extensions/" + args + "/configInject.json");// TODO: add error handling
        Object.keys(configInject).forEach(key => {
            config["triggers"][key] = configInject[key];
        })
        fs.writeFileSync(cwd + "extensions/config.json", JSON.stringify(config));
    });
}

module.exports = {run};