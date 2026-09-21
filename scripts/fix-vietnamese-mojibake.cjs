const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const defaultTargets = [
	path.join(projectRoot, "src", "pages", "XmlGradingRulesPage.tsx"),
];

const mojibakePattern = /Ã|Ä|á»|áº|Â|\uFFFD|[\u0080-\u009F]/;
const utf8Decoder = new TextDecoder("utf-8", { fatal: false });

const windows1252ToUnicodeEntries = [
	[0x80, 0x20ac],
	[0x82, 0x201a],
	[0x83, 0x0192],
	[0x84, 0x201e],
	[0x85, 0x2026],
	[0x86, 0x2020],
	[0x87, 0x2021],
	[0x88, 0x02c6],
	[0x89, 0x2030],
	[0x8a, 0x0160],
	[0x8b, 0x2039],
	[0x8c, 0x0152],
	[0x8e, 0x017d],
	[0x91, 0x2018],
	[0x92, 0x2019],
	[0x93, 0x201c],
	[0x94, 0x201d],
	[0x95, 0x2022],
	[0x96, 0x2013],
	[0x97, 0x2014],
	[0x98, 0x02dc],
	[0x99, 0x2122],
	[0x9a, 0x0161],
	[0x9b, 0x203a],
	[0x9c, 0x0153],
	[0x9e, 0x017e],
	[0x9f, 0x0178],
];

const unicodeToWindows1252 = new Map();
for (let byte = 0; byte <= 0xff; byte += 1) {
	unicodeToWindows1252.set(byte, byte);
}
for (const [byte, codePoint] of windows1252ToUnicodeEntries) {
	unicodeToWindows1252.set(codePoint, byte);
}

const encodeAsOriginalBytes = (value) => {
	const bytes = [];

	for (const char of value) {
		const codePoint = char.codePointAt(0);
		const windows1252Byte = unicodeToWindows1252.get(codePoint);
		bytes.push(
			...(windows1252Byte === undefined
				? Buffer.from(char, "utf8")
				: [windows1252Byte]),
		);
	}

	return Uint8Array.from(bytes);
};

const fixVietnameseMojibake = (value) => {
	if (!mojibakePattern.test(value)) {
		return value;
	}

	return utf8Decoder.decode(encodeAsOriginalBytes(value)).replaceAll("�", "");
};

const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");
const targetArgs = args.filter((arg) => !arg.startsWith("--"));
const targets =
	targetArgs.length > 0
		? targetArgs.map((target) => path.resolve(target))
		: defaultTargets;

let changedCount = 0;
let remainingMojibakeCount = 0;

for (const target of targets) {
	const original = fs.readFileSync(target, "utf8");
	const fixed = fixVietnameseMojibake(original);

	if (fixed !== original) {
		changedCount += 1;
		if (shouldWrite) {
			fs.writeFileSync(target, fixed, "utf8");
		}
		console.log(
			`${shouldWrite ? "Fixed" : "Would fix"}: ${path.relative(projectRoot, target)}`,
		);
	}

	if (mojibakePattern.test(fixed)) {
		remainingMojibakeCount += 1;
		console.error(
			`Mojibake markers remain after decoding: ${path.relative(projectRoot, target)}`,
		);
	}
}

if (!shouldWrite && changedCount > 0) {
	console.error(
		`Vietnamese mojibake found in ${changedCount} file(s). Run with --write to fix.`,
	);
	process.exitCode = 1;
}

if (remainingMojibakeCount > 0) {
	process.exitCode = 1;
}

if (changedCount === 0 && remainingMojibakeCount === 0) {
	console.log("No Vietnamese mojibake markers found.");
}
