// Script per scaricare il PDF da R2 usando l'API del Worker

import fs from 'fs';

async function downloadPDFFromR2() {
  try {
    console.log('📥 Download PDF da Cloudflare R2...\n');

    // Crea un Worker temporaneo che restituisce il PDF
    const workerCode = `
export default {
  async fetch(request, env) {
    try {
      const templateObject = await env.PDF_TEMPLATE.get('Bestellformular_Pflegebox_senza_Vollmacht.pdf');

      if (!templateObject) {
        return new Response('PDF not found in R2', { status: 404 });
      }

      const pdfBytes = await templateObject.arrayBuffer();

      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Bestellformular_Pflegebox_senza_Vollmacht.pdf"'
        }
      });
    } catch (error) {
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
}
    `;

    fs.writeFileSync('temp-download-worker.js', workerCode);
    console.log('✅ Worker temporaneo creato');
    console.log('\n📋 ISTRUZIONI PER SCARICARE IL PDF:\n');
    console.log('1. Vai al Cloudflare Dashboard R2:');
    console.log('   https://dash.cloudflare.com > R2 > pflegebox-templates\n');
    console.log('2. Trova il file: Bestellformular_Pflegebox_senza_Vollmacht.pdf\n');
    console.log('3. Clicca sul file > Download\n');
    console.log('4. Salva il file in questa cartella:\n');
    console.log(`   ${process.cwd()}\n`);
    console.log('5. Poi esegui: node inspect-pdf-fields.js\n');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

downloadPDFFromR2();
