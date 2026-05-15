import fs from "fs";
const p = "public/presentation.html";
let c = fs.readFileSync(p, "utf8");
const close = "</" + String.fromCharCode(100, 105, 118) + ">";
c = c.split("</motion>").join(close);
fs.writeFileSync(p, c);
