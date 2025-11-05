/**
 * Barcode printing utility for thermal label printers
 * Supports multiple label sizes and printer types
 */

interface LabelSize {
  name: string;
  width: number;  // mm
  height: number; // mm
  gap: number;    // mm (gap between labels)
  description: string;
}

interface PrintOptions {
  productId: number;
  barcode: string;
  barcodeType: string;
  labelSize?: string; // Preset name: '3x2', '50x30', '4x6', etc.
  customSize?: { width: number; height: number; gap: number }; // Custom dimensions in mm
  copies?: number;
  dpi?: number;
  speed?: number;
  density?: number;
}

/**
 * Predefined label size presets
 */
const LABEL_PRESETS: Record<string, LabelSize> = {
  '3x2': {
    name: '3x2 inch',
    width: 76,   // 3 inches = 76.2mm
    height: 51,  // 2 inches = 50.8mm
    gap: 5,      // 0.2 inch = 5mm (tested and verified)
    description: 'Standard product label (3" x 2")'
  },
  '50x30': {
    name: '50x30mm',
    width: 50,
    height: 30,
    gap: 2,
    description: 'Small product label'
  },
  '2x1': {
    name: '2x1 inch',
    width: 51,   // 2 inches
    height: 25,  // 1 inch
    gap: 3,
    description: 'Small price label (2" x 1")'
  },
  '60x40': {
    name: '60x40mm',
    width: 60,
    height: 40,
    gap: 3,
    description: 'Medium product label'
  },
  '70x50': {
    name: '70x50mm',
    width: 70,
    height: 50,
    gap: 4,
    description: 'Large product label (max for 80mm printer)'
  }
};

/**
 * Default printer settings
 */
const DEFAULT_PRINTER_SETTINGS = {
  dpi: 203,      // dots per inch (common for thermal printers)
  speed: 4,      // print speed (1-10, where 4 is medium)
  density: 8,    // print density (1-15, where 8 is medium)
  labelSize: '3x2' as const, // Default to most common label size
};

/**
 * Get label dimensions from preset or custom size
 */
function getLabelDimensions(options: PrintOptions): LabelSize {
  if (options.customSize) {
    return {
      name: 'Custom',
      width: options.customSize.width,
      height: options.customSize.height,
      gap: options.customSize.gap || 2,
      description: `Custom ${options.customSize.width}x${options.customSize.height}mm`
    };
  }

  const presetName = options.labelSize || DEFAULT_PRINTER_SETTINGS.labelSize;
  return LABEL_PRESETS[presetName] || LABEL_PRESETS['3x2'];
}

/**
 * Converts barcode type to TSPL command format
 */
function getBarcodeCommand(barcodeType: string): string {
  switch (barcodeType) {
    case 'EAN-13':
    case 'EAN13':
      return 'EAN13';
    case 'EAN-8':
    case 'EAN8':
      return 'EAN8';
    case 'UPC-A':
    case 'UPCA':
      return 'UPCA';
    case 'UPC-E':
    case 'UPCE':
      return 'UPCE';
    case 'Code-128':
    case 'CODE128':
      return '128';
    case 'Code-39':
    case 'CODE39':
      return '39';
    case 'QR-Code':
    case 'QRCODE':
      return 'QRCODE';
    default:
      return '128'; // Default to Code-128 (most versatile)
  }
}

/**
 * Generates TSPL (Thermal Stripe Programming Language) commands
 */
function generateTSPLCommands(options: PrintOptions): string {
  const { barcode, barcodeType, copies = 1 } = options;
  const label = getLabelDimensions(options);
  const speed = options.speed || DEFAULT_PRINTER_SETTINGS.speed;
  const density = options.density || DEFAULT_PRINTER_SETTINGS.density;
  const barcodeCmd = getBarcodeCommand(barcodeType);

  let commands = [
    `SIZE ${label.width} mm, ${label.height} mm`, // Label size
    `GAP ${label.gap} mm, 0 mm`, // Gap between labels
    `SPEED ${speed}`, // Print speed
    `DENSITY ${density}`, // Print density
    'DIRECTION 1', // Print direction
    'REFERENCE 0,0', // Reference point
    'CLS', // Clear buffer
  ];

  // Calculate barcode positioning (centered)
  const barcodeX = Math.floor(label.width / 2);
  const barcodeY = Math.floor(label.height / 3);
  const textY = Math.floor(label.height * 0.7);

  // Add barcode command based on type
  if (barcodeType.includes('QR') || barcodeType.includes('QRCODE')) {
    // QR Code
    const qrSize = Math.min(Math.floor(label.height * 0.5), 6);
    commands.push(
      `QRCODE ${barcodeX},${barcodeY},H,${qrSize},A,0,"${barcode}"`
    );
  } else {
    // Linear barcode
    const barcodeHeight = Math.floor(label.height * 0.4);
    commands.push(
      `BARCODE ${barcodeX},${barcodeY},"${barcodeCmd}",${barcodeHeight},1,0,2,2,"${barcode}"`
    );
  }

  // Add human-readable text
  commands.push(
    `TEXT ${barcodeX},${textY},"3",0,1,1,"${barcode}"`
  );

  commands.push(
    `PRINT ${copies},1` // Print command: copies, sets
  );

  return commands.join('\n');
}

/**
 * Generate barcode image URL using own backend
 */
function generateBarcodeImageUrl(productId: number, format: string = 'png'): string {
  // Use own backend API instead of external service
  return `/barcodes/${productId}?format=${format}&width=3&height=80`;
}

/**
 * Sends print job to thermal printer using multiple fallback methods
 */
async function sendToPrinter(options: PrintOptions): Promise<void> {
  const tslpCommands = generateTSPLCommands(options);

  try {
    // Try direct printer connection methods first
    await tryDirectPrinting(tslpCommands);
    return;
  } catch (directError) {
    console.log('Direct printing failed, trying alternative methods:', directError);

    try {
      // Try system print dialog
      await printViaSystemDialog(options);
      return;
    } catch (systemError) {
      console.log('System printing failed, using browser fallback:', systemError);

      // Final fallback - browser print dialog
      await printViaDialog(options);
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
 * Print via system dialog with clean barcode layout
 */
async function printViaSystemDialog(options: PrintOptions): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocker aktiv. Zəhmət olmasa pop-up-ları bu sayt üçün aktivləşdirin.');
  }

  const label = getLabelDimensions(options);
  const barcodeImageUrl = generateBarcodeImageUrl(options.productId, 'png');

  printWindow.document.write(`
    <html>
      <head>
        <title>Barkod - ${options.barcode}</title>
        <style>
          @page {
            size: ${label.width}mm ${label.height}mm;
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
            min-height: ${label.height}mm;
            width: ${label.width}mm;
          }
          .barcode-container {
            width: ${label.width - 2}mm;
            height: ${label.height - 2}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            border: none;
            padding: 1mm;
          }
          .barcode-image {
            max-width: ${label.width - 10}mm;
            max-height: ${label.height * 0.6}mm;
            margin: 0;
            display: block;
          }
          .barcode-text {
            font-size: ${Math.max(8, Math.floor(label.height / 6))}pt;
            font-weight: bold;
            margin-top: 2mm;
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
          <img src="${barcodeImageUrl}" alt="${options.barcode}" class="barcode-image" onload="setTimeout(() => window.print(), 500);" />
          <div class="barcode-text">${options.barcode}</div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Fallback print via browser print dialog
 */
async function printViaDialog(options: PrintOptions): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocker aktiv. Zəhmət olmasa pop-up-ları bu sayt üçün aktivləşdirin.');
  }

  const label = getLabelDimensions(options);
  const barcodeImageUrl = generateBarcodeImageUrl(options.productId, 'png');

  printWindow.document.write(`
    <html>
      <head>
        <title>Barkod Çapı</title>
        <style>
          @page {
            size: ${label.width}mm ${label.height}mm;
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
            height: ${label.height - 4}mm;
          }
          .barcode-container {
            width: ${label.width - 4}mm;
            height: ${label.height - 4}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .barcode-image {
            max-width: ${label.width - 10}mm;
            max-height: ${label.height * 0.55}mm;
            margin: 1mm 0;
          }
          .barcode-text {
            font-size: ${Math.max(8, Math.floor(label.height / 6))}pt;
            font-weight: bold;
            margin-top: 1mm;
          }
          .fallback-text {
            display: none;
            font-size: ${Math.max(8, Math.floor(label.height / 7))}pt;
          }
        </style>
      </head>
      <body>
        <div class="barcode-container">
          <img
            src="${barcodeImageUrl}"
            alt="${options.barcode}"
            class="barcode-image"
            onload="window.print(); setTimeout(() => window.close(), 1000);"
            onerror="this.style.display='none'; document.querySelector('.fallback-text').style.display='block';"
          />
          <div class="barcode-text">${options.barcode}</div>
          <div class="fallback-text">
            <div style="border: 1px solid #000; padding: 2mm; font-family: monospace;">
              ${options.barcodeType}: ${options.barcode}
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Fetch label settings from printer configuration
 */
async function fetchLabelSettings(): Promise<{
  labelSize: string;
  customWidth?: number;
  customHeight?: number;
  customGap?: number;
}> {
  try {
    const response = await fetch('/printer-configs/label-settings', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      console.warn('Failed to fetch printer settings, using defaults');
      return { labelSize: '3x2' };
    }

    const data = await response.json();

    return {
      labelSize: data.label_size_preset || '3x2',
      customWidth: data.custom_label_width,
      customHeight: data.custom_label_height,
      customGap: data.custom_label_gap
    };
  } catch (error) {
    console.warn('Error fetching printer settings:', error);
    return { labelSize: '3x2' }; // Fallback to default
  }
}

/**
 * Main function to print barcode
 * Automatically fetches label size from printer configuration
 */
export async function printBarcode(
  productId: number,
  barcode: string,
  barcodeType: string = 'Code-128',
  labelSize?: string,  // Optional - will fetch from settings if not provided
  copies: number = 1
): Promise<void> {
  if (!barcode || barcode.trim() === '') {
    throw new Error('Barkod məlumatı tapılmadı');
  }

  if (!productId) {
    throw new Error('Məhsul ID-si tələb olunur');
  }

  try {
    // Fetch printer settings if label size not explicitly provided
    let finalLabelSize = labelSize;
    let customSize;

    if (!finalLabelSize) {
      const settings = await fetchLabelSettings();
      finalLabelSize = settings.labelSize;

      // If custom size is configured, use it
      if (finalLabelSize === 'custom' && settings.customWidth && settings.customHeight) {
        customSize = {
          width: settings.customWidth,
          height: settings.customHeight,
          gap: settings.customGap || 2
        };
      }
    }

    const options: PrintOptions = {
      productId,
      barcode: barcode.trim(),
      barcodeType,
      labelSize: finalLabelSize || '3x2',
      customSize,
      copies
    };

    await sendToPrinter(options);
  } catch (error) {
    console.error('Barcode printing error:', error);
    throw error;
  }
}

/**
 * Print barcode with custom label size
 */
export async function printBarcodeCustomSize(
  productId: number,
  barcode: string,
  barcodeType: string,
  width: number,
  height: number,
  gap: number = 2,
  copies: number = 1
): Promise<void> {
  if (!barcode || barcode.trim() === '') {
    throw new Error('Barkod məlumatı tapılmadı');
  }

  if (!productId) {
    throw new Error('Məhsul ID-si tələb olunur');
  }

  try {
    const options: PrintOptions = {
      productId,
      barcode: barcode.trim(),
      barcodeType,
      customSize: { width, height, gap },
      copies
    };

    await sendToPrinter(options);
  } catch (error) {
    console.error('Barcode printing error:', error);
    throw error;
  }
}

/**
 * Get available label size presets
 */
export function getLabelPresets(): Record<string, LabelSize> {
  return LABEL_PRESETS;
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
  // Add global functions for easy access
  (window as any).printBarcode = printBarcode;
  (window as any).printBarcodeCustomSize = printBarcodeCustomSize;
  (window as any).getLabelPresets = getLabelPresets;
  (window as any).checkPrinterCompatibility = checkPrinterCompatibility;
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  initBarcodePrinter();
}
