import { Sequelize } from "sequelize";
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

import { School } from "./model/school.js";
import { Teacher } from "./model/teacher.js";
import { Course } from "./model/course.js";
import { Student } from "./model/student.js";
import { Room } from "./model/room.js";
import { readFile } from "fs/promises";
import { Connection } from "./connection.js";
import { Support } from "./model/support.js";
const __dirname = new URL(".", import.meta.url).pathname;

export const sql = new Sequelize(process.env.MYSQL_DB || "picoscratch", process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
	host: process.env.MYSQL_HOST || "localhost",
	dialect: "mariadb"
})

export const tasks = JSON.parse(await readFile("tasks.json", "utf8"))
let errored;

process.on("uncaughtException", (err) => {
	console.error(err);
	errored = true;
	console.log("ERRORED");
})

async function loadModels() {
	console.log("Loading models...");
	School(sql);
	Teacher(sql);
	Course(sql);
	Student(sql);
	Room(sql);
	Support(sql);

	// School <-> Teacher
	School.hasMany(Teacher)
	Teacher.belongsTo(School)

	// School <-> Course
	School.hasMany(Course)
	Course.belongsTo(School)

	// School <-> Student
	// School.hasMany(Student)
	// Student.belongsTo(School)

	// School <-> Room
	School.hasMany(Room);
	Room.belongsTo(School);

	// Course <-> Room
	Course.hasOne(Room);
	Room.belongsTo(Course);
	// Course.belongsToMany(Room, { through: "course_rooms" });

	// Course <-> Student
	Course.hasMany(Student);
	Student.belongsTo(Course);

	console.log("Syncing models...");
	if(process.argv.includes("sync")) await sql.sync({ alter: true })
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: process.env.SUBPATH || "/" });

app.use((req, res, next) => {
	if(req.url == "/favicon.ico") return res.sendFile("web/favicon.ico", { root: __dirname });
	next();
});

if(process.argv.includes("maintenance")) {
	app.use((req, res, next) => {
		return res.status(503).sendFile("web/maintenance.html", { root: __dirname });
	})
}

app.use((req, res, next) => {
	if(errored) return res.status(500).sendFile("web/error.html", { root: __dirname });
	next();
})

app.use(express.static("web"));
app.use(bodyParser.json());

await loadModels();

function randomCode() {
	const chars = "ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	return Array(7).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// // Create new school if it doesnt exist yet
// let school = await School.findOne({ include: [Teacher, Course] });
// if(!school) school = await School.create({
// 	name: "Demo School",
// 	adminPassword: "secret",
// 	code: randomCode()
// }, { include: [Teacher, Course] })

// // Create example course if it doesnt exist yet
// let course = await Course.findOne();

// // Add example course to school
// if(!course) await school.createCourse({name: "Example Course"})
// console.log(JSON.stringify(await school.getCourses()));
// await school.save();

app.get("/api/schoolcode/:code", async (req, res) => {
	const s = await School.findOne({ where: { code: req.params.code } });
	console.log(s);
	if(!s) return res.status(404).send({error: "School not found"});
	res.send({name: s.name, uuid: s.uuid, lang: s.lang});
})

app.post("/api/support", async (req, res) => {
	if(!req.body.data) return res.status(400).send({error: "Missing data"});
	const support = await Support.create({ data: JSON.stringify(req.body.data), id: randomCode() });
	res.send({id: support.id});
})

// app.post("/api/getSchool/:uuid", async (req, res) => {
// 	if(!req.body.username || !req.body.password) return res.status(400).send({error: "Missing username or password"});
// 	const auth = await authenticate(req.params.uuid, req.body.username, req.body.password);
// 	if(auth.error) {
// 		if(auth.error == "School not found") return res.status(404).send(auth);
// 		return res.status(401).send(auth);
// 	}
// 	const s = await School.findOne({ where: { uuid: req.params.uuid }, include: [Teacher, Course] });
// 	res.send(s);
// })

// app.post("/api/addTeacher/:uuid", async (req, res) => {
// 	if(!req.body.username || !req.body.password) return res.status(400).send({error: "Missing username or password"});
// 	const auth = await authenticate(req.params.uuid, req.body.username, req.body.password);
// 	if(auth.error) {
// 		if(auth.error == "School not found") return res.status(404).send(auth);
// 		return res.status(401).send(auth);
// 	}
// 	if(!req.body.name || !req.body.tpassword) return res.status(400).send({error: "Missing name or password"});
// 	const s = await School.findOne({ where: { uuid: req.params.uuid }, include: [Teacher, Course] });
// 	if(!s) return res.status(404).send({error: "School not found"});
// 	const t = await s.createTeacher({name: req.body.name, password: req.body.password});
// 	res.send(t);
// })

export const loggedIn = [];

wss.addListener("connection", (ws) => {
	loggedIn.push(new Connection(ws));
})

server.listen(8080, () => {
	console.log("Server listening on port 8080");
})