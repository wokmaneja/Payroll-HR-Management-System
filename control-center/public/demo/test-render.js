const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

let content = fs.readFileSync("index.html", "utf8");

const dom = new JSDOM(content, { runScripts: "dangerously" });

// Mock the DB
dom.window.DB = {
  findAll: function() {
    return [{_id: "1", name: "Test", empid: "EMP1", status: "Active", hourlyRate: 100}];
  }
};

dom.window.translateUI = function() {};

try {
  dom.window.renderBulkTable();
  console.log("Success:", dom.window.document.getElementById('bp-table-wrap').innerHTML.substring(0, 100));
} catch (e) {
  console.error("Error running renderBulkTable:", e);
}
