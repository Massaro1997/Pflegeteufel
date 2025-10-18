// ==================== PDF FIELD INSPECTOR ====================
// Questo script ispeziona il PDF template e stampa tutti i nomi dei campi

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function inspectPDFFields() {
  try {
    console.log('🔍 Inizio ispezione PDF template...\n');

    // Carica il PDF
    const pdfPath = './Bestellformular_Pflegebox_senza_Vollmacht.pdf';

    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF non trovato! Assicurati di avere scaricato il file:');
      console.error('   Bestellformular_Pflegebox_senza_Vollmacht.pdf');
      console.error('\n💡 Come scaricare da R2:');
      console.error('   1. Vai a https://dash.cloudflare.com');
      console.error('   2. R2 > pflegebox-templates');
      console.error('   3. Download del file nella root del progetto');
      return;
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    console.log('✅ PDF caricato con successo\n');
    console.log('📊 Informazioni PDF:');
    console.log(`   - Numero pagine: ${pdfDoc.getPageCount()}`);

    // Ispeziona form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`   - Numero campi form: ${fields.length}\n`);

    if (fields.length === 0) {
      console.warn('⚠️ ATTENZIONE: Il PDF NON ha campi form compilabili!');
      console.warn('   Dovremo scrivere testo alle coordinate invece di compilare campi.');
      console.warn('   Questo richiede di conoscere le posizioni X,Y esatte.\n');
      return;
    }

    console.log('📝 ELENCO COMPLETO DEI CAMPI:\n');
    console.log('=' .repeat(80));

    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;

      console.log(`\n${index + 1}. Campo: "${name}"`);
      console.log(`   Tipo: ${type}`);

      // Informazioni aggiuntive in base al tipo
      try {
        if (type === 'PDFTextField') {
          const textField = form.getTextField(name);
          const maxLength = textField.getMaxLength();
          const text = textField.getText();
          console.log(`   Valore attuale: "${text || '(vuoto)'}"`);
          if (maxLength) console.log(`   Lunghezza massima: ${maxLength}`);
        } else if (type === 'PDFCheckBox') {
          const checkbox = form.getCheckBox(name);
          const isChecked = checkbox.isChecked();
          console.log(`   Stato: ${isChecked ? 'Spuntato' : 'Non spuntato'}`);
        } else if (type === 'PDFRadioGroup') {
          const radio = form.getRadioGroup(name);
          const options = radio.getOptions();
          const selected = radio.getSelected();
          console.log(`   Opzioni disponibili: ${options.join(', ')}`);
          console.log(`   Selezionato: ${selected || '(nessuno)'}`);
        } else if (type === 'PDFDropdown') {
          const dropdown = form.getDropdown(name);
          const options = dropdown.getOptions();
          const selected = dropdown.getSelected();
          console.log(`   Opzioni disponibili: ${options.join(', ')}`);
          console.log(`   Selezionato: ${selected.join(', ') || '(nessuno)'}`);
        }
      } catch (e) {
        console.log(`   ⚠️ Impossibile leggere dettagli: ${e.message}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Ispezione completata!\n');

    // Crea un file di mappatura suggerito
    console.log('💡 Creazione file di mappatura suggerito...\n');

    const mapping = {
      versicherte: {},
      angehoerige: {},
      pflegebox: {},
      checkboxes: {}
    };

    fields.forEach(field => {
      const name = field.getName();
      const type = field.constructor.name;
      const lowerName = name.toLowerCase();

      // Suggerisci mappatura in base al nome del campo
      if (type === 'PDFTextField') {
        if (lowerName.includes('vorname') || lowerName.includes('firstname')) {
          mapping.versicherte.vorname = name;
        } else if (lowerName.includes('name') || lowerName.includes('lastname')) {
          mapping.versicherte.name = name;
        } else if (lowerName.includes('strasse') || lowerName.includes('street')) {
          mapping.versicherte.strasse = name;
        } else if (lowerName.includes('plz') || lowerName.includes('zip')) {
          mapping.versicherte.plz = name;
        } else if (lowerName.includes('ort') || lowerName.includes('city')) {
          mapping.versicherte.ort = name;
        } else if (lowerName.includes('telefon') || lowerName.includes('phone')) {
          mapping.versicherte.telefon = name;
        } else if (lowerName.includes('email') || lowerName.includes('mail')) {
          mapping.versicherte.email = name;
        } else if (lowerName.includes('geburt') || lowerName.includes('birth')) {
          mapping.versicherte.geburtsdatum = name;
        } else if (lowerName.includes('versichert')) {
          mapping.versicherte.versichertennummer = name;
        } else if (lowerName.includes('pflege')) {
          if (lowerName.includes('grad')) mapping.versicherte.pflegegrad = name;
          if (lowerName.includes('kasse')) mapping.versicherte.pflegekasse = name;
        }
      } else if (type === 'PDFCheckBox') {
        mapping.checkboxes[name] = `Checkbox: ${name}`;
      }
    });

    fs.writeFileSync('pdf-field-mapping.json', JSON.stringify(mapping, null, 2));
    console.log('✅ File creato: pdf-field-mapping.json');
    console.log('   Questo file contiene suggerimenti di mappatura\n');

  } catch (error) {
    console.error('❌ Errore durante l\'ispezione:', error);
    console.error(error.stack);
  }
}

inspectPDFFields();
