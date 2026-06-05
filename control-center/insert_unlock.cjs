const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
const insertion = `
  const handleUnlock = async (issue) => {
    if (!window.confirm('Are you sure you want to unlock the machine ID for this license?')) return;
    
    const companyMatch = issue.body?.match(/\\*\\*Company:\\*\\* (.*)/);
    const keyMatch = issue.body?.match(/\\*\\*License Key:\\*\\* (.*)/);
    const planMatch = issue.body?.match(/\\*\\*Plan:\\*\\* (.*)/);
    const expiresMatch = issue.body?.match(/\\*\\*Expires:\\*\\* (.*)/);

    const oldCompany = companyMatch ? companyMatch[1] : 'Unknown';
    const oldKey = keyMatch ? keyMatch[1] : 'Unknown';
    const oldPlan = planMatch ? planMatch[1] : 'Unknown';
    const oldExpiry = expiresMatch ? expiresMatch[1] : new Date().toISOString();

    const newBody = \`**License Key:** \${oldKey}\\n**Company:** \${oldCompany}\\n**Machine ID:** UNLOCKED\\n**Plan:** \${oldPlan}\\n**Expires:** \${oldExpiry}\`;

    try {
      const res = await fetch(\`https://api.github.com/repos/\${GITHUB_OWNER}/\${GITHUB_REPO}/issues/\${issue.number}\`, {
        method: 'PATCH',
        headers: {
          'Authorization': \`token \${token}\`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: newBody })
      });
      if (res.ok) {
        alert('Successfully unlocked machine ID!');
        setLicenses(licenses.map(lic => lic.number === issue.number ? { ...lic, body: newBody } : lic));
      } else {
        alert('Failed to unlock machine ID.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };
`;

if (!content.includes('const handleUnlock')) {
  // try \r\n
  let replaced = content.replace("      alert('Network error.');\r\n    }\r\n  };\r\n", "      alert('Network error.');\r\n    }\r\n  };\r\n" + insertion);
  if (replaced === content) {
    // try \n
    replaced = content.replace("      alert('Network error.');\n    }\n  };\n", "      alert('Network error.');\n    }\n  };\n" + insertion);
  }
  fs.writeFileSync('src/App.jsx', replaced);
}
console.log("Done");
