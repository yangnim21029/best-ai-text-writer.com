
import { runDirectorResearch } from '../src/services/research/directorService';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Testing Director Service (Grounding)...');
    const topic = 'Current stock price of NVIDIA and recent news';
    const context = 'Writing a finance update article.';

    const result = await runDirectorResearch(topic, context);
    console.log('--- Result ---');
    console.log(result.content);

    if (result.error) {
        console.error('Error:', result.error);
    }
}

main();
