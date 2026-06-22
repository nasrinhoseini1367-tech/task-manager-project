import fs from "fs";
import chalk from "chalk";
const filename = process.env.DB_FILE || "db.json";

const error = chalk.redBright.bold;
const warning = chalk.yellowBright.bold;
const success = chalk.greenBright.bold;
export default class DB {
    static writeonDB(data) {
        const str = JSON.stringify(data, null, "    ");
        try {
            fs.writeFileSync(filename, str, "utf-8");
        } catch {
            throw new Error("Writing in database failed");
        }
    }
    static DBExists() {
        if (fs.existsSync(filename)) {
            return true;
        } else {
            return false;
        }
    }
    static createDB() {
        try {
            if (this.DBExists()) {
                return false;
            }
            fs.writeFileSync(filename, "[]", "utf-8");
            return true;
        } catch (err) {
            throw new Error("Failed to create database" + err.message);
        }
    }
    static resetDB() {
        try {
            fs.writeFileSync(filename, "[]", "utf-8");

            return true;
        } catch (e) {
            throw new Error("Can not write in " + filename);
        }
    }

    static getAllTasks() {
        let data;
        if (!DB.DBExists()) {
            DB.createDB();
        }
        try {
            data = fs.readFileSync(filename, "utf-8");
            if (!data.trim()) {
                return [];
            }
            const tasks = JSON.parse(data);
            return tasks;
        } catch (e) {
            throw new Error(e.message);
        }
    }
    static getTaskById(id) {
        const tasks = this.getAllTasks();
        const task = tasks.find((t) => t.id === Number(id));
        if (!task) {
            throw new Error("Task not found");
        }
        return task;
    }
    static getTaskByTitle(title) {
        const tasks = this.getAllTasks();
        const task = tasks.find((t) => t.title === title);

        return task ? task : false;
    }
    static saveTask(title, completed = false, id = 0) {
        id = Number(id);
        if (id < 0 || !Number.isInteger(id)) {
            throw new Error("Id must be an integer number an greater equal than 0");
        } else if (typeof title !== "string" || title.trim().length < 3) {
            throw new Error("Title must be a string with more than 2 characters");
        } else if (typeof completed !== "boolean") {
            throw new Error("Completed must be a boolean");
        }

        const task = DB.getTaskByTitle(title);
        if (task && task.id != id) {
            throw new Error("A task exists with this title.");
        }
        if (id === 0) {
            let data = this.getAllTasks();
            if (data.length === 0) {
                id = 1;
            } else {
                id = data[data.length - 1].id + 1;
            }
            const newTask = {
                id,
                title,
                completed,
            };
            data.push(newTask);
            this.writeonDB(data);
            return id;
        } else {
            const data = this.getAllTasks();
            const task = data.find((t) => t.id === id);
            if (!task) {
                throw new Error("Task not found");
            }
            task.title = title;
            task.completed = completed;
            this.writeonDB(data);
            return id;
        }
    }
    static insertBulkData(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                throw new Error("Invalid data");
            }
        }
        if (!Array.isArray(data)) {
            throw new Error("Invalid data");
        }
        this.writeonDB(data);
    }
    static deleteTask(id) {
        id = Number(id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Id must be a positive integer");
        }
        let data = this.getAllTasks();
        // let task = data.find((t) => t.id === id);
        const taskIndex = data.findIndex((t) => t.id === id);
        if (taskIndex === -1) {
            throw new Error("Task not found");
        }
        // data = data.filter((t) => t.id !== id);
        data.splice(taskIndex, 1);
        this.writeonDB(data);
    }
}
