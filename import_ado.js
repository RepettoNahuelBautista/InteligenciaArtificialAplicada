const fs = require('fs');

const content = fs.readFileSync('EPICAS_Y_USER_STORIES.md', 'utf-8');

const epics = [];

const epicRegex = /## ÉPICA \d+: (.*?) \(EP-\d+\)/g;
let match;
while ((match = epicRegex.exec(content)) !== null) {
    epics.push({ title: match[1].trim(), stories: [], id: null, startIndex: match.index });
}

const tableRegex = /\| EP-\d+ \| (.*?) \| (.*?) \|/g;
while ((match = tableRegex.exec(content)) !== null) {
    const epicTitle = match[1];
    const epicDesc = match[2];
    const epic = epics.find(e => e.title === epicTitle.trim());
    if (epic) {
        epic.description = epicDesc.trim();
    }
}

const storyRegex = /### (US-\d+:.*?)\r?\n([\s\S]*?)(?=### US-\d+:|## ÉPICA|\r?\n## ROADMAP|$)/g;
while ((match = storyRegex.exec(content)) !== null) {
    const storyTitle = match[1].trim();
    const storyBody = match[2].trim();

    let acceptanceCriteria = '';
    const acMatch = storyBody.match(/\*\*Criterios de aceptación:\*\*\s*```gherkin\r?\n([\s\S]*?)```/);
    if (acMatch) {
        acceptanceCriteria = acMatch[1].trim().replace(/\r?\n/g, '<br>');
    }
    
    let desc = '';
    const descMatch = storyBody.match(/\*\*Como\*\*(.*)\r?\n\*\*quiero\*\*(.*)\r?\n\*\*para\*\*(.*)/i);
    if (descMatch) {
        desc = `<strong>Como</strong>${descMatch[1]}<br><strong>quiero</strong>${descMatch[2]}<br><strong>para</strong>${descMatch[3]}`;
    } else {
        desc = storyBody.split('\r?\n')[0];
    }

    let parentEpic = epics[0];
    for (let i = epics.length - 1; i >= 0; i--) {
        if (match.index > epics[i].startIndex) {
            parentEpic = epics[i];
            break;
        }
    }

    parentEpic.stories.push({
        title: storyTitle,
        description: desc,
        acceptanceCriteria: acceptanceCriteria
    });
}

const org = "BlackShark2026";
const project = "AppRecomendadoraV2";

async function createWorkItem(token, type, fields, parentId = null) {
    const url = `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/$${encodeURIComponent(type)}?api-version=7.1`;
    const ops = [];
    
    for (const [key, value] of Object.entries(fields)) {
        if (value) {
            ops.push({
                "op": "add",
                "path": `/fields/${key}`,
                "value": value
            });
        }
    }

    if (parentId) {
        ops.push({
            "op": "add",
            "path": "/relations/-",
            "value": {
                "rel": "System.LinkTypes.Hierarchy-Reverse",
                "url": `https://dev.azure.com/${org}/_apis/wit/workItems/${parentId}`
            }
        });
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json-patch+json'
        },
        body: JSON.stringify(ops)
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Error creating work item:", JSON.stringify(data, null, 2));
        return null;
    }
    return data;
}

async function run() {
    const { spawnSync } = require('child_process');
    const tokenRes = spawnSync('az.cmd', ['account', 'get-access-token', '--resource', '499b84ac-1321-427f-aa17-267ca6975798'], { encoding: 'utf-8', shell: true });
    if (tokenRes.error || tokenRes.status !== 0) {
        console.error("Could not get token:", tokenRes.stderr);
        return;
    }
    const token = JSON.parse(tokenRes.stdout).accessToken;

    let totalStories = 0;
    for (const epic of epics) {
        totalStories += epic.stories.length;
    }
    console.log(`Found ${epics.length} epics and ${totalStories} stories.`);

    for (const epic of epics) {
        console.log(`Creating Epic: ${epic.title}`);
        const createdEpic = await createWorkItem(token, 'Epic', {
            'System.Title': epic.title,
            'System.Description': epic.description
        });
        if (!createdEpic) continue;
        epic.id = createdEpic.id;
        console.log(`Created Epic ID: ${epic.id}`);

        for (const story of epic.stories) {
            console.log(`  Creating Story: ${story.title}`);
            const createdStory = await createWorkItem(token, 'User Story', {
                'System.Title': story.title,
                'System.Description': story.description,
                'Microsoft.VSTS.Common.AcceptanceCriteria': story.acceptanceCriteria
            }, epic.id);

            if (createdStory) {
                console.log(`  Created Story ID: ${createdStory.id}`);
            }
        }
    }
    console.log("Done.");
}

run().catch(console.error);
