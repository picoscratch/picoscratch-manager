import { z } from "zod";

export const RegularInstruction = z.object({
	type: z.union([z.literal("regular"), z.undefined()]),
	text: z.string(),
	block: z.string(),
	previousBlock: z.string().optional(),
	blockTag: z.string().optional(),
	parentBlock: z.string().optional(),
	parentStack: z.string().optional(),
});

export const ChangeBlockInstruction = z.object({
	type: z.literal("changeblock"),
	text: z.string(),
	targetBlockTag: z.string(),
	name: z.string(),
	to: z.string().optional(),
	valueVarTag: z.string().optional()
});

export const DialogInstruction = z.object({
	title: z.string(),
	text: z.string(),
	type: z.literal("dialog"),
	closeButton: z.string(),
});

export const QuizInstruction = z.object({
	question: z.string(),
	type: z.literal("quiz"),
	answers: z.array(z.string()).nonempty().length(4),
	correct: z.number().min(0).max(3)
});

export const CommentInstruction = z.object({
	type: z.literal("comment"),
	blockTag: z.string(),
	content: z.string()
});

export const VarCreateInstruction = z.object({
	type: z.literal("varcreate"),
	text: z.string(),
	vartype: z.string(),
	varTag: z.string()
});

export const VarBlockInstruction = z.object({
	type: z.literal("varblock"),
	text: z.string(),
	varTag: z.string(),
	parentTag: z.string()
});

export const CustomBlockInstruction = z.object({
	type: z.literal("customblock"),
	text: z.string(),
	args: z.number(),
	blockTag: z.string().optional(),
});

export const DeleteInstruction = z.object({
	type: z.literal("delete"),
	text: z.string(),
	targetBlockTag: z.string(),
	bannedBlockTags: z.array(z.string()).optional()
});

export const MoveInstruction = z.object({
	type: z.literal("move"),
	text: z.string(),
	fromBlockTag: z.string(),
	toPreviousBlockTag: z.string(),
});

export const MoveEventInstruction = z.object({
	type: z.literal("moveevent"),
	input: z.string().optional(),
	parentBlockTag: z.string().optional(),
});

export const CustomBlockArgInstruction = z.object({
	type: z.literal("customblockarg"),
	text: z.string(),
	parentTag: z.string(),
});

export const CustomBlockCallInstruction = z.object({
	type: z.literal("customblockcall"),
	text: z.string(),
	previousTag: z.string(),
	targetBlockTag: z.string(),
	blockTag: z.string()
});

export const RegularTask = z.object({
	name: z.string(),
	desc: z.string(),
	type: z.union([z.undefined(), z.literal("regular")]).optional(),
	wiring: z.string().optional(),
	noclear: z.union([z.undefined(), z.boolean()]).optional(),
	startxml: z.string().optional(),
	varTags: z.object({}).optional(),
	blockTags: z.object({}).optional(),
	instructions: z.array(
		z.union([
			RegularInstruction,
			ChangeBlockInstruction,
			DialogInstruction,
			QuizInstruction,
			CommentInstruction,
			VarCreateInstruction,
			VarBlockInstruction,
			CustomBlockInstruction,
			DeleteInstruction,
			MoveInstruction,
			CustomBlockArgInstruction,
			CustomBlockCallInstruction,
			MoveEventInstruction
		])
	),
	verification: z.object({
		type: z.enum([
			"manual", // Require manual verification by a teacher
			"notneeded", // No verification needed, task is automatically completed
			"code" // Automatically verify using code
		]),
		code: z.string().optional(),
		correctOutput: z.string().optional()
	})
});

export const ReadingTask = z.object({
	name: z.string(),
	desc: z.string(),
	type: z.literal("reading")
	// TODO: types for reading tasks
});

export const Task = z.union([RegularTask, ReadingTask]);

export const Section = z.object({
	name: z.string(),
	desc: z.string(),
	img: z.string().optional(),
	tasks: z.array(Task)
});

// export const Tasks = z.array(Task);
export const Tasks = z.array(Section);
export const TasksFile = z.record(Tasks);

// TS Types
export type TasksFile = z.infer<typeof TasksFile>;
export type Task = z.infer<typeof Task>;
export type Section = z.infer<typeof Section>;
export type Tasks = z.infer<typeof Tasks>;
export type RegularTask = z.infer<typeof RegularTask>;
export type ReadingTask = z.infer<typeof ReadingTask>;
export type RegularInstruction = z.infer<typeof RegularInstruction>;
export type ChangeBlockInstruction = z.infer<typeof ChangeBlockInstruction>;
export type DialogInstruction = z.infer<typeof DialogInstruction>;
export type QuizInstruction = z.infer<typeof QuizInstruction>;
export type CommentInstruction = z.infer<typeof CommentInstruction>;
export type VarCreateInstruction = z.infer<typeof VarCreateInstruction>;
export type VarBlockInstruction = z.infer<typeof VarBlockInstruction>;
export type CustomBlockInstruction = z.infer<typeof CustomBlockInstruction>;
export type DeleteInstruction = z.infer<typeof DeleteInstruction>;
export type MoveInstruction = z.infer<typeof MoveInstruction>;
export type CustomBlockArgInstruction = z.infer<typeof CustomBlockArgInstruction>;
export type CustomBlockCallInstruction = z.infer<typeof CustomBlockCallInstruction>;