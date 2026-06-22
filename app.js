import "dotenv/config";
import chalk from "chalk";

import Action from "./action.js";

const error = chalk.redBright.bold;
const warn = chalk.yellowBright.bold;
const command = process.argv[2];
const commands = ["list", "add", "delete", "delete-all", "edit", "export", "import", "download"];
if (command) {
    if (command === "list") {
        Action.list();
    } else if (command === "add") {
        Action.add();
    } else if (command === "delete") {
        Action.delete();
    } else if (command === "delete-all") {
        Action.deleteAll();
    } else if (command === "edit") {
        Action.edit();
    } else if (command === "export") {
        Action.export();
    } else if (command === "import") {
        Action.importTasks();
    } else if (command === "download") {
        Action.download();
    } else {
        throw new Error(`${error("Invalid command")}
valid commanda are:
${warn(commands.join("\n"))}`);
    }
} else {
    throw new Error(`${error("you have to enter a command")}
commands are:
${warn(commands.join("\n"))}`);
}
