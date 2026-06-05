const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

const telemetryLogic = `
            // Telemetry Heartbeat
            const githubTokenForHeartbeat = process.env.GITHUB_PAT || 'YOUR_GITHUB_PAT_HERE';
            if (githubTokenForHeartbeat !== 'YOUR_GITHUB_PAT_HERE') {
                const fetch = require('node-fetch') || global.fetch;
                
                const pingOnline = async () => {
                    try {
                        let issueNum = null;
                        
                        // Check if we already saved the issue number
                        const issueDoc = await new Promise(res => db.get("SELECT data FROM docs WHERE id = 'install_issue' AND collection = 'settings'", [], (err, row) => res(row)));
                        if (issueDoc && issueDoc.data) {
                            issueNum = JSON.parse(issueDoc.data).issueNumber;
                        }

                        if (!issueNum) {
                            // Find it via API
                            const searchRes = await fetch(\`https://api.github.com/repos/\${GITHUB_OWNER}/\${GITHUB_REPO}/issues?labels=app-install&state=all\`, {
                                headers: {
                                    'Authorization': \`token \${githubTokenForHeartbeat}\`,
                                    'User-Agent': 'WokManeja-App'
                                }
                            });
                            if (searchRes.ok) {
                                const issues = await searchRes.json();
                                const myIssue = issues.find(i => i.body && i.body.includes(MACHINE_ID));
                                if (myIssue) {
                                    issueNum = myIssue.number;
                                    db.run("INSERT OR REPLACE INTO docs (id, collection, data) VALUES (?, ?, ?)", ['install_issue', 'settings', JSON.stringify({ issueNumber: issueNum })]);
                                }
                            }
                        }

                        if (issueNum) {
                            // Fetch existing body to preserve it
                            const issueRes = await fetch(\`https://api.github.com/repos/\${GITHUB_OWNER}/\${GITHUB_REPO}/issues/\${issueNum}\`, {
                                headers: {
                                    'Authorization': \`token \${githubTokenForHeartbeat}\`,
                                    'User-Agent': 'WokManeja-App'
                                }
                            });
                            if (issueRes.ok) {
                                const issue = await issueRes.json();
                                let body = issue.body || '';
                                if (body.includes('**Last Online:**')) {
                                    body = body.replace(/\\*\\*Last Online:\\*\\* .*/, \`**Last Online:** \${new Date().toISOString()}\`);
                                } else {
                                    body += \`\\n**Last Online:** \${new Date().toISOString()}\`;
                                }
                                
                                await fetch(\`https://api.github.com/repos/\${GITHUB_OWNER}/\${GITHUB_REPO}/issues/\${issueNum}\`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': \`token \${githubTokenForHeartbeat}\`,
                                        'Accept': 'application/vnd.github.v3+json',
                                        'Content-Type': 'application/json',
                                        'User-Agent': 'WokManeja-App'
                                    },
                                    body: JSON.stringify({ body })
                                });
                            }
                        }
                    } catch (e) {
                        console.error("Heartbeat error", e);
                    }
                };
                
                // Ping immediately, then every 5 minutes
                setTimeout(pingOnline, 5000);
                setInterval(pingOnline, 5 * 60 * 1000);
            }
`;

if (!content.includes('const githubTokenForHeartbeat')) {
    // find line 470 logic
    let searchStr = "                }\r\n            });\r\n            \r\n            // Seed default admin user";
    if (content.includes(searchStr)) {
        content = content.replace(searchStr, "                }\r\n            });\r\n" + telemetryLogic + "\r\n            // Seed default admin user");
        fs.writeFileSync('server.js', content);
        console.log("Success with \\r\\n");
    } else {
        searchStr = "                }\n            });\n            \n            // Seed default admin user";
        content = content.replace(searchStr, "                }\n            });\n" + telemetryLogic + "\n            // Seed default admin user");
        fs.writeFileSync('server.js', content);
        console.log("Success with \\n");
    }
} else {
    console.log("Already inserted");
}
