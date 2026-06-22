import "dotenv/config";
import DB from "./db.js";
import Task from "./task.js";
// const task1 = new Task("Learn C3", true);
// console.log(Task.getTaskById(11));
// console.log(Task.getTaskByTitle("Learn C"));
console.log(Task.getAllTasks());
