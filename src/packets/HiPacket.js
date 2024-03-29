import z from "zod";
import School from "../model/school.js";
import Teacher from "../model/teacher.js";
import Course from "../model/course.js";
import Room from "../model/room.js";
import { authenticate } from "../utils.js";
import sequelize from "sequelize";
export const InGenericHiPacket = z.object({
    type: z.literal("hi"),
    schoolCode: z.string(),
    clientType: z.enum(["teacher", "student"]),
});
export const InTeacherHiPacket = InGenericHiPacket.extend({
    clientType: z.literal("teacher"),
    username: z.string(),
    password: z.string(),
});
export const InStudentHiPacket = InGenericHiPacket.extend({
    clientType: z.literal("student"),
});
export const InHiPacket = z.union([InTeacherHiPacket, InStudentHiPacket]);
export async function handleHiPacket(packet, con, ws) {
    const s = await School.findOne({ where: { code: packet.schoolCode }, include: [Teacher, Course, Room] });
    if (!s) {
        ws.send(JSON.stringify({
            type: "hi",
            error: "Invalid school code",
            success: false
        }));
        return;
    }
    con.school = s;
    if (packet.clientType === "teacher") {
        await handleTeacherHiPacket(packet, con, ws);
    }
    else if (packet.clientType === "student") {
        await handleStudentHiPacket(packet, con, ws);
    }
    else {
        ws.send(JSON.stringify({
            type: "conversationError",
            error: "Invalid client type",
            success: false
        }));
        ws.close();
        return;
    }
    con.clientType = packet.clientType;
}
async function handleTeacherHiPacket(packet, con, ws) {
    if (!InTeacherHiPacket.safeParse(packet).success) {
        ws.send(JSON.stringify({
            type: "conversationError",
            error: "Invalid teacher hi packet",
            success: false
        }));
        ws.close();
        return;
    }
    const auth = await authenticate(con.school.uuid, packet.username, packet.password);
    if (auth.error) {
        ws.send(JSON.stringify({
            type: "hi",
            error: auth.error,
            success: false
        }));
        return;
    }
    con.isAdmin = auth.admin;
    if (!(packet.username.toLowerCase() == "admin")) { // If the user is not admin
        // TODO: test if this even works
        const t = await Teacher.findOne({ where: {
                schoolUuid: con.school.uuid,
                name: sequelize.where(sequelize.fn("LOWER", sequelize.col("name")), "LIKE", "%" + packet.username.toLowerCase() + "%")
            } });
        if (!t) {
            ws.send(JSON.stringify({
                type: "hi",
                error: "Invalid username",
                success: false
            }));
            return;
        }
        con.thisTeacher = t;
    }
    ws.send(JSON.stringify({
        type: "hi",
        success: true,
        school: con.school,
        lang: con.school.lang // TODO: deprecate
    }));
}
async function handleStudentHiPacket(packet, con, ws) {
    const rooms = await con.school.$get("rooms");
    ws.send(JSON.stringify({
        type: "hi",
        success: true,
        schoolname: con.school.name,
        rooms,
        lang: con.school.lang // TODO: deprecate
    }));
}
