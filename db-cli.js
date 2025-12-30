const https = require('https');

const API_BASE = 'https://cqxiv74ld1.execute-api.us-east-1.amazonaws.com/Prod/api';

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cqxiv74ld1.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: `/Prod/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            const bodyStr = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    resolve({ error: 'Invalid JSON response', raw: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body && method !== 'GET') {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function showUsers() {
    console.log('🔍 Fetching users...');
    try {
        const result = await makeRequest('/brackets');
        console.log('Users data:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function showBrackets() {
    console.log('🔍 Fetching brackets...');
    try {
        const result = await makeRequest('/brackets');
        console.log('Brackets data:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function showLeaderboard() {
    console.log('🔍 Fetching leaderboard...');
    try {
        const result = await makeRequest('/leaderboard');
        console.log('Leaderboard data:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    console.log('🏈 SportSync Database CLI Tool');
    console.log('==============================');
    
    switch (command) {
        case 'users':
            await showUsers();
            break;
        case 'brackets':
            await showBrackets();
            break;
        case 'leaderboard':
            await showLeaderboard();
            break;
        default:
            console.log('Available commands:');
            console.log('  node db-cli.js users      - Show all users');
            console.log('  node db-cli.js brackets   - Show all brackets');  
            console.log('  node db-cli.js leaderboard - Show leaderboard');
            console.log('');
            console.log('Example: node db-cli.js users');
    }
}

main().catch(console.error);