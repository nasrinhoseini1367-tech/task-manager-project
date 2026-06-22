import fs from "fs";

import chalk from "chalk";
import inquirer from "inquirer";
import { parse, stringify } from "csv/sync";

import DB from "./db.js";
import Task from "./task.js";
import { type } from "os";
import axios from "axios";

const warn = chalk.greenBright.bold;
const error = chalk.redBright.bold;
const success = chalk.greenBright.bold;

export default class Action {
    static list() {
        const tasks = Task.getAllTasks(true);
        if (tasks.length) {
            console.table(tasks);
        } else {
            console.log(warn("There is not any task"));
        }
    }
    static async add() {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: "Enter task title ",
                validate: (value) => {
                    if (value.trim().length >= 3) {
                        return true;
                    } else {
                        return "Value must be contains more than 3 characters";
                    }
                },
            },
            {
                type: "confirm",
                name: "completed",
                message: "is this task completed",
                default: false,
            },
        ]);
        try {
            const task = new Task(answers.title, answers.completed);
            task.save();
            console.log(success("New task added successfully"));
        } catch (e) {
            console.log(error(error.message));
        }
    }
    static async delete() {
        const tasks = Task.getAllTasks();
        if (tasks.length === 0) {
            console.log(warn("There is not any task"));
            return;
        }
        const choices = tasks.map((t) => ({
            name: t.title,
            value: t.id,
        }));
        const answer = await inquirer.prompt({
            type: "rawlist",
            name: "id",
            message: "Choose a title to delete",
            choices,
        });
        try {
            DB.deleteTask(answer.id);
            console.log(success("Task deleted successfully"));
        } catch (e) {
            console.log(error(e.message));
        }
    }
    static async deleteAll() {
        const answer = await inquirer.prompt({
            type: "confirm",
            name: "result",
            message: "Are you sure for delete all tasks?",
        });
        if (answer.result) {
            try {
                DB.resetDB();
                console.log(success("All tasks deleted successfully"));
            } catch (e) {
                console.log(error(e.message));
            }
        }
    }
    static async edit() {
        const tasks = Task.getAllTasks();
        if (tasks.length === 0) {
            console.log(warn("There is not any task"));
            return;
        }
        const choices = tasks.map((t) => ({
            name: t.title,
            value: t.id,
        }));
        const answer = await inquirer.prompt({
            type: "rawlist",
            name: "taskId",
            message: "Choose a task title",
            choices,
        });
        const task = Task.getTaskById(answer.taskId);
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "newTitle",
                message: "Enter new title for the task",
                default: task.title,
                validate: (value) => {
                    if (value.trim().length < 3) {
                        return "Title must have at least 3 characters";
                    } else {
                        return true;
                    }
                },
            },
            {
                type: "confirm",
                name: "completed",
                message: "is this task completed?",
                default: task.completed,
            },
        ]);
        try {
            task.title = answers.newTitle;
            task.completed = answers.completed;
            task.save();
        } catch (e) {
            console.log(error(e.message));
        }
    }

    static async export() {
        const tasks = Task.getAllTasks(true);
        if (tasks.length === 0) {
            console.log(warn("There is not any task"));
            return;
        }
        const data = stringify(tasks, {
            header: true,
            cast: {
                boolean: (value, context) => {
                    return String(value);
                },
            },
        });
        let answer;
        while (true) {
            answer = await inquirer.prompt({
                type: "input",
                name: "fileName",
                message: "Enter a name for csv file",

                default: "test.csv",
                validate: (value) => {
                    if (value.trim().length === 0) {
                        return "File name can ot be empty";
                    }
                    return true;
                },
            });
            if (!answer.fileName.endsWith(".csv")) {
                answer.fileName = answer.fileName + ".csv";
            }
            if (fs.existsSync(answer.fileName)) {
                const confirmation = await inquirer.prompt({
                    type: "confirm",
                    name: "overwrite",
                    message: "This file already exists,overWrite it?",
                });

                if (confirmation.overwrite) {
                    break;
                }
            } else {
                break;
            }
        }

        try {
            fs.writeFileSync(answer.fileName, data, "utf-8");
            console.log(success("export done successfully"));
        } catch (e) {
            console.log(error(e.message));
        }
    }
    static parseAndImport(csvdata) {
        const data = parse(csvdata, {
            columns: true,
            skipEmptyLines: true,
            cast: (value, context) => {
                if (context.column === "id") {
                    return Number(value);
                } else if (context.column === "completed") {
                    return value.toLowerCase() === "true" ? true : false;
                }
                return value;
            },
        });

        if (data.length === 0) {
            console.log(warn("data is Empty"));
            return;
        }
        let myKeys = Object.keys(data[0]);
        if (myKeys.includes("id") && myKeys.includes("title") && myKeys.includes("completed") && myKeys.length === 3) {
            for (const [index, t] of data.entries()) {
                if (!Number.isInteger(t.id) || t.id <= 0 || typeof t.completed !== "boolean" || t.title.trim().length < 3) {
                    console.log(`Invalid task at  index: ${index + 1}`);
                    console.log(t);
                    return;
                }
            }
            try {
                DB.insertBulkData(data);
                console.log(success("file imported in database successfully"));
                console.table(data);
            } catch (e) {
                console.log(error("Error is:" + e.message));
            }
        } else {
            console.log(error("Data format is invalid"));
        }
    }
    static async importTasks() {
        const answer = await inquirer.prompt({
            type: "input",
            name: "inputFile",
            message: "Enter the addres of your csv file",
            validate: (value) => {
                if (!value.endsWith(".csv")) {
                    return "You have to enter  address of a csv file";
                } else {
                    return true;
                }
            },
        });

        if (!fs.existsSync(answer.inputFile)) {
            console.log("There is not such a file");
            return;
        }
        const stat = fs.statSync(answer.inputFile);
        if (stat.size === 0) {
            console.log("File is empty");
            return;
        }
        let inputcsv;
        try {
            inputcsv = fs.readFileSync(answer.inputFile, "utf-8");
        } catch (e) {
            console.log(error("Can not read the file" + e.message));
            return;
        }
        this.parseAndImport(inputcsv);
    }
    static async download() {
        const answer = await inquirer.prompt({
            type: "input",
            name: "urlFile",
            message: "Enter the url of your csv file",
            validate: (value) => {
                if (!value.endsWith(".csv")) {
                    return "You have to enter  url of a csv file";
                } else {
                    return true;
                }
            },
        });
        const config = {
            baseURL: process.env.BASE_URL,
            url: answer.urlFile,
            method: "get",
        };
        let response;
        try {
            response = await axios(config);
        } catch (e) {
            console.log("Error is : " + e.message);
            return;
        }
        this.parseAndImport(response.data);
    }
}
