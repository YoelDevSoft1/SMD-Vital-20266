const fs = require('fs');
const path = require('path');

// Función para buscar y reemplazar en archivos
function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from, 'g'), to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Reemplazos necesarios
const replacements = [
  { from: '@/components/ui/Button', to: '@/components/ui/button' },
  { from: '@/components/ui/Card', to: '@/components/ui/card' },
  { from: '@/components/ui/Input', to: '@/components/ui/input' },
  { from: '@/components/ui/Label', to: '@/components/ui/label' },
  { from: '@/components/ui/Select', to: '@/components/ui/select' },
  { from: '@/components/ui/Switch', to: '@/components/ui/switch' },
  { from: './ui/Button', to: './ui/button' },
  { from: './ui/Card', to: './ui/card' },
  { from: './ui/Input', to: './ui/input' },
  { from: './ui/Label', to: './ui/label' },
  { from: './ui/Select', to: './ui/select' },
  { from: './ui/Switch', to: './ui/switch' },
  { from: '../components/ui/Button', to: '../components/ui/button' },
  { from: '../components/ui/Card', to: '../components/ui/card' },
  { from: '../components/ui/Input', to: '../components/ui/input' },
  { from: '../components/ui/Label', to: '../components/ui/label' },
  { from: '../components/ui/Select', to: '../components/ui/select' },
  { from: '../components/ui/Switch', to: '../components/ui/switch' }
];

// Función recursiva para procesar directorios
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      replaceInFile(filePath, replacements);
    }
  });
}

// Procesar el directorio src
processDirectory('./src');
console.log('Import fixes completed!');
