// Одноразовый патч layout: кнопка остановки анимаций и ранняя установка класса no-anim.
const fs = require('fs');
let s = fs.readFileSync('app/layout.tsx', 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep("import Logo from '@/components/Logo';", "import Logo from '@/components/Logo';\nimport MotionToggle from '@/components/MotionToggle';");
rep("              <ThemeToggle />", "              <MotionToggle />\n              <ThemeToggle />");
rep("if(d)document.documentElement.classList.add('dark')}catch(e){}})()", "if(d)document.documentElement.classList.add('dark');if(localStorage.getItem('pt:motion')==='off')document.documentElement.classList.add('no-anim')}catch(e){}})()");
fs.writeFileSync('app/layout.tsx', s);
console.log('ok');
