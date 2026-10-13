const fs = require('fs');
const html = fs.readFileSync(process.argv[2] + '/index.html', 'utf8');
const heads = [...html.matchAll(/<(h1|h2)[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => m[2]);
const mock = [...html.matchAll(/class="mock-h1"[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => m[1]);
const text = heads.concat(mock).join(' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');
const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?()[]{}<>-/%+=&*@$#';
const cjkPunct = '，。：；、！？（）「」『』《》——…·×✓→←↑↓°©　';
const chars = new Set((text + base + cjkPunct).split(''));
chars.delete('');
chars.delete('\n');
fs.writeFileSync('/tmp/serif-chars.txt', [...chars].join(''));
console.log('unique chars:', chars.size);
console.log('headings:', heads.map(h => h.replace(/<[^>]+>/g, '')).join(' / '));
