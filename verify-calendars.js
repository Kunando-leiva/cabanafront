// verify-calendars.js
import { readFileSync, existsSync } from 'fs';

const calendars = [
  './src/components/CalendarFull.jsx',
  './src/components/admin/AdminCalendar.jsx', 
  './src/pages/admin/CalendarioDisponibilidad.jsx'
];

console.log('🔍 COMPARANDO CONFIGURACIÓN DE CALENDARIOS:\n');

calendars.forEach(file => {
  console.log(`📄 ${file}:`);
  
  // Verificar si el archivo existe
  if (!existsSync(file)) {
    console.log('   ❌ Archivo no encontrado');
    return;
  }
  
  const content = readFileSync(file, 'utf8');
  
  // Verificar import
  if (content.includes("import Calendar from 'react-calendar'")) {
    console.log('   ✅ Import correcto: Calendar from react-calendar');
  } else if (content.includes("import { Calendar }")) {
    console.log('   ⚠️  Import diferente: { Calendar } from react-calendar');
  } else {
    console.log('   ❌ Import no encontrado');
  }
  
  // Verificar locale
  if (content.includes('locale="es"')) {
    console.log('   ✅ Locale español configurado');
  } else {
    console.log('   ⚠️  Locale no configurado o diferente');
  }
  
  // Verificar si tiene tileDisabled
  if (content.includes('tileDisabled')) {
    console.log('   ✅ Tiene tileDisabled function');
  }
  
  // Verificar si tiene tileClassName  
  if (content.includes('tileClassName')) {
    console.log('   ✅ Tiene tileClassName function');
  }
  
  console.log('');
});