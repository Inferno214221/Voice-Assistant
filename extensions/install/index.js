const cwd = __dirname + "/../../";
const fs = require("fs");
const ghdownload = require("github-download");
const exec = require("exec");
const repolist = require(__dirname + "/repolist.json");
var config = require(cwd + "extensions/config.json");

function run (args) {
    if (fs.readdirSync(cwd + "extensions").filter(function (file) { return fs.statSync(cwd + "extensions/" + file).isDirectory(); }).includes(args)) {
        console.log("An extension with this name is already installed.");
        return;
    }
    if (repolist[args] == undefined) {
        console.log("Could not find an extension with that name.");
        return;
    }
    ghdownload(repolist[args], cwd + "extensions/" + args + "/").on('end', function() {
        try {
            configInject = require(cwd + "extensions/" + args + "/configInject.json");
        } catch (error) {
            console.log("An error occured. This likely means that the extension installed has no configInject.json file.");
            return;
        }
        Object.keys(configInject).forEach(key => {
            config["triggers"][key] = configInject[key];
        })
        fs.writeFileSync(cwd + "extensions/config.json", JSON.stringify(config, null, 4));
    });
}

module.exports = {run};