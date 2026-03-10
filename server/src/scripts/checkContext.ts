import { getFullContext } from '../data/accommodationContext.js';

async function main() {
  const ctx = await getFullContext();
  // Only show the department sections with estadia minima
  const lines = ctx.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('###') || lines[i].toLowerCase().includes('estadia')) {
      console.log(lines[i]);
    }
  }
}
main();
