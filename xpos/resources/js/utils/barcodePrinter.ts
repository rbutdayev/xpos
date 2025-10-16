/**
 * Barcode printing utility for XP-350B thermal printer
 * Label size: 50mm x 30mm (5cm x 3cm)
 */

interface PrintOptions {
  barcode: string;
  barcodeType: string;
  printerName?: string;
  copies?: number;
}

const PRINTER_SETTINGS = {
  // XP-350B settings for 50mm x 30mm labels
  labelWidth: 50, // mm
  labelHeight: 30, // mm
  dpi: 203, // dots per inch for XP-350B
  speed: 4, // print speed (1-10, where 4 is medium)
  density: 8, // print density (1-15, where 8 is medium)
};

/**
 * Converts barcode type to TSPL command format
 */
function getBarcodeCommand(barcodeType: string): string {
  switch (barcodeType) {
    case 'EAN-13':
      return 'EAN13';
    case 'UPC-A':
      return 'UPCA';
    case 'Code-128':
      return '128';
    case 'QR-Code':
      return 'QRCODE';
    default:
      return 'EAN13';
  }
}

/**
 * Generates TSPL (Thermal Stripe Programming Language) commands for XP-350B
 */
function generateTSPLCommands(options: PrintOptions): string {
  const { barcode, barcodeType, copies = 1 } = options;
  const barcodeCmd = getBarcodeCommand(barcodeType);
  
  let commands = [
    'SIZE 50 mm, 30 mm', // Label size
    `SPEED ${PRINTER_SETTINGS.speed}`, // Print speed
    `DENSITY ${PRINTER_SETTINGS.density}`, // Print density
    'DIRECTION 1', // Print direction
    'REFERENCE 0,0', // Reference point
    'OFFSET 0 mm', // Offset
    'SET PEEL OFF', // Peel off mode
    'SET CUTTER OFF', // Disable cutter
    'SET PARTIAL_CUTTER OFF', // Disable partial cutter
    'SET TEAR ON', // Enable tear off
    'CLS', // Clear buffer
  ];

  // Add barcode command based on type
  if (barcodeType === 'QR-Code') {
    commands.push(
      `QRCODE 50,50,H,4,A,0,"${barcode}"` // QR code: x, y, error correction, cell width, mode, rotation, data
    );
  } else {
    commands.push(
      `BARCODE 50,50,"${barcodeCmd}",60,1,0,2,2,"${barcode}"` // Barcode: x, y, type, height, human readable, rotation, narrow, wide, data
    );
  }

  commands.push(
    'PRINT 1,1' // Print command: sets, copies
  );

  return commands.join('\n');
}

/**
 * Sends print job to thermal printer using multiple fallback methods
 */
async function sendToPrinter(tslpCommands: string, barcode: string, barcodeType: string): Promise<void> {
  try {
    // Try direct printer connection methods first
    await tryDirectPrinting(tslpCommands);
    return;
  } catch (directError) {
    console.log('Direct printing failed, trying alternative methods:', directError);
    
    try {
      // Try system print dialog with raw commands
      await printViaSystemDialog(tslpCommands, barcode, barcodeType);
      return;
    } catch (systemError) {
      console.log('System printing failed, using browser fallback:', systemError);
      
      // Final fallback - browser print dialog with formatted content
      await printViaDialog(tslpCommands, barcode, barcodeType);
    }
  }
}

/**
 * Try direct printer connection methods
 */
async function tryDirectPrinting(commands: string): Promise<void> {
  // Try WebUSB first (modern browsers with user permission)
  if ('usb' in navigator) {
    try {
      await printViaWebUSB(commands);
      return;
    } catch (usbError) {
      console.log('WebUSB failed:', usbError);
    }
  }

  // Try Web Serial API
  if ('serial' in navigator) {
    try {
      await printViaWebSerial(commands);
      return;
    } catch (serialError) {
      console.log('Web Serial failed:', serialError);
    }
  }

  throw new Error('Direct printing methods not available');
}

/**
 * Print via WebUSB (preferred method for direct printer communication)
 */
async function printViaWebUSB(commands: string): Promise<void> {
  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: [
        { vendorId: 0x0483 }, // Common thermal printer vendor ID
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x04f9 }, // Brother
        { vendorId: 0x1FC9 }, // NXP/Freescale (some thermal printers)
        { vendorId: 0x0525 }, // Netchip Technology (USB-to-serial adapters)
        { vendorId: 0x067B }, // Prolific (USB-to-serial adapters)
        { vendorId: 0x10C4 }, // Silicon Labs (USB-to-serial adapters)
        {},                   // Allow any device if user selects it
      ]
    });

    await device.open();
    
    // Try to find the correct configuration and interface
    let configValue = 1;
    let interfaceNumber = 0;
    
    if (device.configurations.length > 0) {
      configValue = device.configurations[0].configurationValue;
      if (device.configurations[0].interfaces.length > 0) {
        interfaceNumber = device.configurations[0].interfaces[0].interfaceNumber;
      }
    }
    
    await device.selectConfiguration(configValue);
    await device.claimInterface(interfaceNumber);

    const encoder = new TextEncoder();
    const data = encoder.encode(commands);
    
    // Try different endpoint numbers
    const endpoints = [1, 2, 0x01, 0x02, 0x81, 0x82];
    let success = false;
    
    for (const endpoint of endpoints) {
      try {
        await device.transferOut(endpoint, data);
        success = true;
        break;
      } catch (e) {
        console.log(`Endpoint ${endpoint} failed:`, e);
      }
    }
    
    if (!success) {
      throw new Error('Could not find working endpoint');
    }
    
    await device.close();
  } catch (error) {
    console.error('WebUSB printing failed:', error);
    throw error;
  }
}

/**
 * Print via Web Serial API
 */
async function printViaWebSerial(commands: string): Promise<void> {
  try {
    const port = await (navigator as any).serial.requestPort({
      filters: [
        { usbVendorId: 0x0483 },
        { usbVendorId: 0x04b8 },
        { usbVendorId: 0x04f9 },
        { usbVendorId: 0x067B },
        { usbVendorId: 0x10C4 },
      ]
    });
    
    // Try different baud rates
    const baudRates = [9600, 115200, 38400, 19200, 57600];
    let opened = false;
    
    for (const baudRate of baudRates) {
      try {
        await port.open({ 
          baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });
        opened = true;
        break;
      } catch (e) {
        console.log(`Baud rate ${baudRate} failed:`, e);
      }
    }
    
    if (!opened) {
      throw new Error('Could not open serial port with any baud rate');
    }

    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    const data = encoder.encode(commands);
    
    await writer.write(data);
    writer.releaseLock();
    
    // Wait a bit for the data to be sent
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await port.close();
  } catch (error) {
    console.error('Web Serial printing failed:', error);
    throw error;
  }
}

/**
 * Print via system dialog with clean barcode layout for direct printing
 */
async function printViaSystemDialog(commands: string, barcode: string, barcodeType: string): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocker aktiv. Zəhmət olmasa pop-up-ları bu sayt üçün aktivləşdirin.');
  }

  // Generate barcode image URL
  const barcodeImageUrl = generateBarcodeImageUrl(barcode, barcodeType);

  printWindow.document.write(`
    <html>
      <head>
        <title>Barkod - ${barcode}</title>
        <style>
          @page { 
            size: 50mm 30mm; 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 30mm;
            width: 50mm;
          }
          .barcode-container {
            width: 48mm;
            height: 28mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            border: none;
            padding: 1mm;
          }
          .barcode-image {
            max-width: 44mm;
            max-height: 20mm;
            margin: 0;
            display: block;
          }
          .barcode-text {
            font-size: 8pt;
            font-weight: bold;
            margin-top: 1mm;
            line-height: 1;
            color: #000;
          }
          @media screen {
            body {
              min-height: 100vh;
              background: #f0f0f0;
            }
            .barcode-container {
              background: white;
              border: 1px solid #ccc;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
          }
        </style>
      </head>
      <body>
        <div class="barcode-container">
          <img src="${barcodeImageUrl}" alt="${barcode}" class="barcode-image" onload="setTimeout(() => window.print(), 500);" />
          <div class="barcode-text">${barcode}</div>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
}

/**
 * Fallback print via browser print dialog
 */
async function printViaDialog(commands: string, barcode: string, barcodeType: string): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocker aktiv. Zəhmət olmasa pop-up-ları bu sayt üçün aktivləşdirin.');
  }

  // Generate barcode using a free online barcode API
  const barcodeImageUrl = generateBarcodeImageUrl(barcode, barcodeType);

  printWindow.document.write(`
    <html>
      <head>
        <title>Barkod Çapı</title>
        <style>
          @page { 
            size: 50mm 30mm; 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 2mm;
            font-family: Arial, sans-serif;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 26mm;
          }
          .barcode-container {
            width: 46mm;
            height: 26mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .barcode-image {
            max-width: 40mm;
            max-height: 15mm;
            margin: 1mm 0;
          }
          .barcode-text {
            font-size: 8pt;
            font-weight: bold;
            margin-top: 1mm;
          }
          .tspl-commands {
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="barcode-container">
          <img src="${barcodeImageUrl}" alt="${barcode}" class="barcode-image" onload="window.print(); setTimeout(() => window.close(), 1000);" onerror="this.style.display='none'; document.querySelector('.fallback-text').style.display='block';" />
          <div class="barcode-text" style="font-size: 8pt; font-weight: bold; margin-top: 1mm;">${barcode}</div>
          <div class="fallback-text" style="display: none; font-size: 8pt;">
            <div style="border: 1px solid #000; padding: 2mm; font-family: monospace;">
              ${barcodeType}: ${barcode}
            </div>
          </div>
        </div>
        <div class="tspl-commands">${commands.replace(/\n/g, '<br>')}</div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
}

/**
 * Generate barcode image URL using a free barcode service
 */
function generateBarcodeImageUrl(barcode: string, barcodeType: string): string {
  const encodedBarcode = encodeURIComponent(barcode);
  
  switch (barcodeType) {
    case 'EAN-13':
      return `https://barcode.tec-it.com/barcode.ashx?data=${encodedBarcode}&code=EAN13&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0&dmsize=Default&eclevel=L&processTilde=false&hidehrt=true`;
    case 'UPC-A':
      return `https://barcode.tec-it.com/barcode.ashx?data=${encodedBarcode}&code=UPCA&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0&dmsize=Default&eclevel=L&processTilde=false&hidehrt=true`;
    case 'Code-128':
      return `https://barcode.tec-it.com/barcode.ashx?data=${encodedBarcode}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0&dmsize=Default&eclevel=L&processTilde=false&hidehrt=true`;
    case 'QR-Code':
      return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedBarcode}`;
    default:
      return `https://barcode.tec-it.com/barcode.ashx?data=${encodedBarcode}&code=EAN13&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0&dmsize=Default&eclevel=L&processTilde=false&hidehrt=true`;
  }
}

/**
 * Main function to print barcode
 */
export async function printBarcode(barcode: string, barcodeType: string = 'EAN-13', copies: number = 1): Promise<void> {
  if (!barcode || barcode.trim() === '') {
    throw new Error('Barkod məlumatı tapılmadı');
  }

  try {
    const tslpCommands = generateTSPLCommands({
      barcode: barcode.trim(),
      barcodeType,
      copies
    });

    await sendToPrinter(tslpCommands, barcode.trim(), barcodeType);
    
    // Show success message
    if (typeof window !== 'undefined') {
      // You might want to replace this with a toast notification
      console.log('Barkod çap edildi');
    }
  } catch (error) {
    console.error('Barcode printing error:', error);
    throw error;
  }
}

/**
 * Check printer compatibility and available methods
 */
export function checkPrinterCompatibility(): {
  webUSB: boolean;
  webSerial: boolean;
  methods: string[];
} {
  const webUSB = 'usb' in navigator;
  const webSerial = 'serial' in navigator;
  
  const methods = [];
  if (webUSB) methods.push('WebUSB');
  if (webSerial) methods.push('Web Serial');
  methods.push('System Dialog', 'Browser Print');
  
  return { webUSB, webSerial, methods };
}

/**
 * Initialize barcode printer functionality
 */
export function initBarcodePrinter(): void {
  // Add global function for easy access
  (window as any).printBarcode = printBarcode;
  (window as any).checkPrinterCompatibility = checkPrinterCompatibility;
  
  // Check and log printer compatibility
  const compatibility = checkPrinterCompatibility();
  console.log('Barcode printer compatibility:', compatibility);
  
  if (!compatibility.webUSB && !compatibility.webSerial) {
    console.info('Bu brauzerdə direkt printer bağlantısı dəstəklənmir. Əlavə çap metodları istifadə ediləcək.');
  } else {
    console.info('Direkt printer bağlantısı mövcuddur. İstifadə edilə bilər:', compatibility.methods);
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  initBarcodePrinter();
}