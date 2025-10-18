
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
    