/**
 * labels.js - Motor de Impresión Calibrado para Zebra ZQ630 (76x51 mm Portrait/Direct)
 * CoolingTrack Pro
 */

const LabelsManager = {
  // Generar código QR nítido de alta definición
  createQRCodeElement(containerId, text, size = 85) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    new QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  },

  // Generar código ZPL nativo calibrado para Zebra ZQ630 (203 DPI, 76x51mm = 608x408 dots)
  generateZPL(batch) {
    const qrPayload = `VEOLIA|${batch.week}|${batch.dosingDate}|${batch.responsible}`;
    return `^XA
^PW608
^LL408
^LH0,0
^FO30,40^BQN,2,5^FDQA,${qrPayload}^FS
^FO220,40^A0N,38,38^FDVEOLIA^FS
^FO220,88^A0N,20,20^FDEstatus: Fluido con biocida^FS
^FO220,145^A0N,32,32^FD${batch.week}^FS
^FO220,185^A0N,18,18^FDFecha de dosificacion:^FS
^FO220,210^A0N,28,28^FD${batch.dosingDate}^FS
^FO220,300^A0N,20,20^FDResponsable: ${batch.responsible}^FS
^XZ`;
  },

  downloadZPLFile() {
    const activeBatch = window.App.getActiveBatch();
    const zplContent = this.generateZPL(activeBatch);
    const blob = new Blob([zplContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Etiqueta_Veolia_${activeBatch.week.replace(/\s+/g, '')}.zpl`;
    a.click();
    window.App.showToast("📄 Archivo .ZPL descargado para Zebra ZQ630", "success");
  },

  copyZPL() {
    const activeBatch = window.App.getActiveBatch();
    const zplContent = this.generateZPL(activeBatch);
    navigator.clipboard.writeText(zplContent).then(() => {
      window.App.showToast("📋 Código ZPL copiado al portapapeles", "success");
    });
  },

  // Renderizar la vista previa interactiva en pantalla
  renderPrintSheet(type) {
    const printContainer = document.getElementById('print-labels-container');
    const zplBox = document.getElementById('zpl-code-preview');
    if (!printContainer) return;
    printContainer.innerHTML = '';

    if (type === 'veolia-bidon') {
      const activeBatch = window.App.getActiveBatch();
      const card = document.createElement('div');
      card.className = 'zebra-label-preview mx-auto';
      
      const qrPayload = `VEOLIA|${activeBatch.week}|${activeBatch.dosingDate}|${activeBatch.responsible}`;
      const qrId = `qr-zebra-veolia`;

      card.innerHTML = `
        <div style="width: 85px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; flex-shrink: 0;">
          <div id="${qrId}" style="width: 80px; height: 80px;"></div>
          <div style="width: 80px; height: 48px; border: 1px dashed #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold; text-align: center; line-height: 1.1;">
            Espacio Peca Amarilla
          </div>
        </div>

        <div style="flex: 1; padding-left: 14px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
          <div>
            <div style="font-size: 22px; font-weight: 900; line-height: 1; color: #000; font-family: Arial, sans-serif;">VEOLIA</div>
            <div style="font-size: 11.5px; font-weight: bold; white-space: nowrap; color: #000; font-family: Arial, sans-serif; margin-top: 3px;">Estatus: Fluido con biocida</div>
          </div>

          <div style="margin: 4px 0;">
            <div style="font-size: 17px; font-weight: 900; line-height: 1; color: #000; font-family: Arial, sans-serif;">${activeBatch.week}</div>
            <div style="font-size: 10.5px; font-weight: bold; color: #000; font-family: Arial, sans-serif; margin-top: 2px;">Fecha de dosificación:</div>
            <div style="font-size: 16px; font-weight: 900; line-height: 1; color: #000; font-family: Arial, sans-serif; margin-top: 1px;">${activeBatch.dosingDate}</div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: bold; white-space: nowrap; color: #000; font-family: Arial, sans-serif;">Responsable: ${activeBatch.responsible}</div>
          </div>
        </div>
      `;

      printContainer.appendChild(card);
      setTimeout(() => this.createQRCodeElement(qrId, qrPayload, 80), 50);

      if (zplBox) {
        zplBox.value = this.generateZPL(activeBatch);
      }

    } else if (type === 'cdu-labels') {
      const selectedPod = document.getElementById('label-pod-selector')?.value || 'all';
      const cdusToPrint = window.App.getCDUsForPrint(selectedPod);

      cdusToPrint.forEach((cdu, idx) => {
        const card = document.createElement('div');
        card.className = 'border border-slate-300 rounded-lg p-3 bg-white flex items-center justify-between gap-2 shadow-sm mb-2 max-w-sm mx-auto';
        const qrId = `qr-cdu-${idx}`;
        const qrPayload = `CDU:${cdu.id}`;

        card.innerHTML = `
          <div class="flex-1">
            <span class="text-[9px] font-black uppercase bg-slate-900 text-white px-1.5 py-0.5 rounded">${cdu.pod}</span>
            <h3 class="text-base font-black text-slate-900 mt-0.5">${cdu.id}</h3>
            <p class="text-[11px] text-slate-600 font-bold">${cdu.name}</p>
            <div class="mt-1 text-[9px] text-slate-500 font-mono border-t pt-1 border-slate-100">
              Bote Fijo: <b>BOTE-${cdu.id}</b>
            </div>
          </div>
          <div id="${qrId}" class="p-1 bg-white border border-slate-200 rounded flex-shrink-0"></div>
        `;
        printContainer.appendChild(card);
        setTimeout(() => this.createQRCodeElement(qrId, qrPayload, 70), 50);
      });

    } else if (type === 'bote-labels') {
      const selectedPod = document.getElementById('label-pod-selector')?.value || 'all';
      const cdusToPrint = window.App.getCDUsForPrint(selectedPod);

      cdusToPrint.forEach((cdu, idx) => {
        const card = document.createElement('div');
        card.className = 'border border-purple-200 rounded-lg p-3 bg-white flex items-center justify-between gap-2 shadow-sm mb-2 max-w-sm mx-auto';
        const qrId = `qr-bote-${idx}`;
        const qrPayload = `BOTE:${cdu.id}`;

        card.innerHTML = `
          <div class="flex-1">
            <span class="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">BOTE REUTILIZABLE</span>
            <h3 class="text-base font-black text-purple-950 mt-0.5">BOTE ${cdu.id}</h3>
            <p class="text-[11px] text-slate-600 font-bold">Uso exclusivo en ${cdu.pod}</p>
            <p class="text-[8px] text-slate-500 mt-1">⚠️ No remover del rack ni mezclar con otro CDU.</p>
          </div>
          <div id="${qrId}" class="p-1 bg-white border border-purple-200 rounded flex-shrink-0"></div>
        `;
        printContainer.appendChild(card);
        setTimeout(() => this.createQRCodeElement(qrId, qrPayload, 70), 50);
      });
    }
  },

  // Impresión térmica exacta (Bloquea la orientación para que no se gire en horizontal)
  printLabels() {
    const activeBatch = window.App.getActiveBatch();
    const qrPayload = `VEOLIA|${activeBatch.week}|${activeBatch.dosingDate}|${activeBatch.responsible}`;

    let iframe = document.getElementById('zebra-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'zebra-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @page {
            size: 76mm 51mm portrait;
            margin: 0mm !important;
          }
          *, *:before, *:after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: 76mm !important;
            height: 51mm !important;
            max-width: 76mm !important;
            max-height: 51mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
            font-family: Arial, Helvetica, sans-serif !important;
          }
          .label-container {
            width: 76mm !important;
            height: 51mm !important;
            padding: 3.5mm 4mm 3mm 4mm !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
          }
          .left-col {
            width: 22mm !important;
            height: 44mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: flex-start !important;
            flex-shrink: 0 !important;
          }
          .qr-box {
            width: 21mm !important;
            height: 21mm !important;
            margin-top: 1mm !important;
          }
          .qr-box canvas, .qr-box img {
            width: 21mm !important;
            height: 21mm !important;
            display: block !important;
          }
          .right-col {
            width: 45mm !important;
            flex: 1 !important;
            height: 44mm !important;
            padding-left: 3.5mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            text-align: left !important;
          }
          .title-veolia {
            font-size: 15pt !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            color: #000000 !important;
            letter-spacing: -0.3px !important;
          }
          .status-line {
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
            color: #000000 !important;
            margin-top: 1.5px !important;
          }
          .week-title {
            font-size: 12.5pt !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            color: #000000 !important;
          }
          .date-header {
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            line-height: 1.2 !important;
            color: #000000 !important;
            margin-top: 1.5px !important;
          }
          .date-value {
            font-size: 12.5pt !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            color: #000000 !important;
            margin-top: 1px !important;
          }
          .resp-line {
            font-size: 8.5pt !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            color: #000000 !important;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="left-col">
            <div class="qr-box">
              <div id="iframe-qr"></div>
            </div>
          </div>
          <div class="right-col">
            <div>
              <div class="title-veolia">VEOLIA</div>
              <div class="status-line">Estatus: Fluido con biocida</div>
            </div>

            <div>
              <div class="week-title">${activeBatch.week}</div>
              <div class="date-header">Fecha de dosificación:</div>
              <div class="date-value">${activeBatch.dosingDate}</div>
            </div>

            <div>
              <div class="resp-line">Responsable: ${activeBatch.responsible}</div>
            </div>
          </div>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        <script>
          new QRCode(document.getElementById('iframe-qr'), {
            text: "${qrPayload}",
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
        </script>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 280);
  }
};

window.LabelsManager = LabelsManager;
