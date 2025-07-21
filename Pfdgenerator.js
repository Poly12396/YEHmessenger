const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Génère une fiche généalogique PDF pour un membre YEHOUENOU CITY
 * @param {Object} data - Données du membre
 */
module.exports = function generatePDF(data) {
  const doc = new PDFDocument();
  const fileName = `fiche_${data.nom}_${data.prenoms}.pdf`;

  // 📁 Dossier de sortie
  const outputPath = path.join(__dirname, fileName);
  doc.pipe(fs.createWriteStream(outputPath));

  // 🖼️ Logo YEHOUENOU CITY (assure-toi que le fichier existe)
  try {
    doc.image('yehouenou_logo.jpeg', {
      fit: [100, 100],
      align: 'center',
      valign: 'top'
    });
  } catch (error) {
    console.warn('Logo non trouvé ou erreur de lecture du fichier.');
  }

  // 🌆 En-tête
  doc
    .moveDown()
    .fontSize(18)
    .text('🧬 Fiche familiale – YEHOUENOU CITY', {
      align: 'center',
      underline: true
    });

  doc.moveDown();

  // 📋 Contenu de la fiche
  doc.fontSize(12);
  Object.entries(data).forEach(([key, value]) => {
    doc.text(`${key} : ${value}`);
  });

  // 🧾 Pied de page
  doc.moveDown().fontSize(10).fillColor('gray');
  doc.text('One Family! One City! – YEHOUENOU CITY ©', { align: 'center' });

  doc.end();
  console.log(`✅ Fiche PDF créée : ${fileName}`);
};
