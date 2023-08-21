import { helpers } from "termost";

import type { CommandFactory } from "../types";
import { build, checkCommit, checkLints, checkTypes } from "../helpers";

const onlyValues = ["commit", "lint", "test", "type"] as const;

type Only = (typeof onlyValues)[number];

type CommandContext = {
	only: Only | undefined;
};

export const createCheckCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "check",
			description: "Check code health",
		})
		.option({
			key: "only",
			name: "only",
			description: `Run only one specified task (accepted value: ${onlyValues.join(
				", ",
			)})`,
			defaultValue: undefined,
		})
		.task({
			label: label("Preparing the project"),
			handler() {
				return build({ hasLiveOutput: false });
			},
		})
		.task({
			label: label("Checking linters"),
			skip: ifNotAllOrOnlyNotEqualTo("lint"),
			async handler(_, argv) {
				const filenames = argv.operands;

				return checkLints(filenames);
			},
		})
		.task({
			label: label("Checking types"),
			skip(context, argv) {
				return (
					ifNotAllOrOnlyNotEqualTo("type")(context) ||
					!require.resolve("typescript") ||
					// For now, skip type-checking if some files are passed down
					// @see: https://github.com/microsoft/TypeScript/issues/27379
					argv.operands.length > 0
				);
			},
			handler(_, argv) {
				return checkTypes(argv.operands);
			},
		})
		.task({
			label: label("Checking tests"),
			skip: ifNotAllOrOnlyNotEqualTo("test"),
			handler() {
				return helpers.exec("turbo run test", { hasLiveOutput: true });
			},
		})
		.task({
			label: label("Checking commit"),
			skip({ only }) {
				return only !== "commit";
			},
			handler() {
				return checkCommit();
			},
		});
};

const label = (message: string) => `${message} 🧐`;

const ifNotAllOrOnlyNotEqualTo = (only: Only) => (context: CommandContext) => {
	return context.only !== undefined && context.only !== only;
};
