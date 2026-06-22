import util from "util";

import chalk from "chalk";

import DB from "./db.js";

export default class Task {
    #id = 0;
    #title;
    #completed;
    constructor(title, completed = false) {
        this.title = title;
        this.completed = completed;
    }
    get id() {
        return this.#id;
    }
    get title() {
        return this.#title;
    }
    get completed() {
        return this.#completed;
    }
    set title(value) {
        if (typeof value !== "string" || value.trim().length <= 3) {
            throw new Error("value must be a strin containing more than 3 characters");
        }
        this.#title = value;
    }
    set completed(value) {
        if (typeof value !== "boolean") {
            throw new Error("Value must be a boolean");
        }
        this.#completed = value;
    }
    [util.inspect.custom]() {
        return `Task{
	id: ${chalk.red.bold(this.#id)},
	title: ${chalk.blue.bold(this.#title)},
	completed: ${chalk.white.bold(this.#completed)}
}`;
    }
    save() {
        try {
            const id = DB.saveTask(this.#title, this.#completed, this.#id);
            this.#id = id;
        } catch (e) {
            throw new Error(e.message);
        }
    }
    static getTaskById(id) {
        id = Number(id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Id must be a positive integer");
        }

        const task = DB.getTaskById(id);
        if (!task) {
            return false;
        }

        const item = new Task(task.title, task.completed);
        item.#id = task.id;
        return item;
    }
    static getTaskByTitle(title) {
        const task = DB.getTaskByTitle(title);
        if (!task) {
            return false;
        }

        const item = new Task(task.title, task.completed);
        item.#id = task.id;
        return item;
    }
    static getAllTasks(rawObject = false) {
        const tasks = DB.getAllTasks();
        if (rawObject) {
            return tasks;
        }
        let items = [];
        for (let t of tasks) {
            const item = new Task(t.title, t.completed);
            item.#id = t.id;
            items.push(item);
        }
        return items;
    }
}
