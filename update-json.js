import fs from 'fs';

// Read HTML
const html = fs.readFileSync('pflegebox-form-updated.html', 'utf8');

// Read JSON
const json = JSON.parse(fs.readFileSync('templates/page.pflegebox-formular.json', 'utf8'));

// Update custom_liquid field
json.sections.section_q9M443.blocks.custom_liquid_JRxKxb.settings.custom_liquid = html;

// Write JSON back
fs.writeFileSync('templates/page.pflegebox-formular.json', JSON.stringify(json));

console.log('✅ JSON updated successfully!');
console.log(`📝 HTML length: ${html.length} characters`);
