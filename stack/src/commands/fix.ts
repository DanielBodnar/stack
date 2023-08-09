import type { CommandFactory } from "../types";
import { fixFormatting, fixLints } from "../helpers";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix all auto-fixable issues",
		})
		.task({
			label: "Fixing lints 🚑",
			handler(_, argv) {
				return fixLints(argv.operands);
			},
		})
		.task({
			label: "Fixing formatting 🚑",
			handler(_, argv) {
				return fixFormatting(argv.operands);
			},
		});
};
