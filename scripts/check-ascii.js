const fs = require("fs");

const BAD_CHARS = [
  { name: "LEFT SINGLE QUOTE", re: /\u2018/g, hint: "'" },
  { name: "RIGHT SINGLE QUOTE", re: /\u2019/g, hint: "'" },
  { name: "LEFT DOUBLE QUOTE", re: /\u201C/g, hint: '"' },
  { name: "RIGHT DOUBLE QUOTE", re: /\u201D/g, hint: '"' },
  { name: "EN DASH", re: /\u2013/g, hint: "-" },
  { name: "EM DASH", re: /\u2014/g, hint: "-- or -" }
];

const files = process.argv.slice(2).filter((p) => {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
});

let hasBad = false;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const { name, re, hint } of BAD_CHARS) {
    if (re.test(text)) {
      hasBad = true;
      console.error(`\n✖ Non-ASCII character (${name}) found in ${file}. Replace with ${hint}.`);
    }
  }
}

if (hasBad) {
  console.error("\nFix the characters above (use straight quotes and hyphens), then re-commit.\n");
  process.exit(1);
}
