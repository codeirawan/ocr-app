"use client";// pages/index.js (or pages/index.jsx)
import { useState } from 'react';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Home() {
  const [scannedText, setScannedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleScanDocument = async () => {
    if (file) {
      setIsLoading(true);
      try {
        const result = await Tesseract.recognize(
          file,
          'ind',  // Ubah bahasa ke 'ind' jika dokumen dalam bahasa Indonesia
          {
            logger: (m) => console.log(m),
          }
        );
        setScannedText(result.data.text);
        const data = parseOCRText(result.data.text);
        setParsedData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const parseOCRText = (text) => {
    const lines = text.split('\n');
    const data = {
      NIK: extractValue(lines, /NIK\s*:\s*(.*)/),
      Nama: extractValue(lines, /Nama\s*:\s*(.*)/),
      TempatTanggalLahir: extractTempatTanggalLahir(lines), // Memanggil fungsi baru untuk Tempat/Tanggal Lahir
      JenisKelamin: extractJenisKelamin(lines),
      GolDarah: extractGolDarah(lines),
      Alamat: extractValue(lines, /Alamat\s*:\s*(.*)/),
      RTRW: extractRTRW(lines),
      KelDesa: extractKelDesa(lines), // Memanggil fungsi baru untuk Kelurahan/Desa
      Kecamatan: extractValue(lines, /Kecamatan\s*:\s*(.*)/),
      Agama: extractValue(lines, /Agama\s*:\s*(.*)/),
      StatusPerkawinan: extractValue(lines, /Status Perkawinan\s*:\s*(.*)/),
      Pekerjaan: extractValue(lines, /Pekerjaan\s*:\s*(.*)/),
      Kewarganegaraan: extractKewarganegaraan(lines),
    };
    return data;
  };

  const extractTempatTanggalLahir = (lines) => {
    const line = lines.find(line => line.includes('Tempat/Tgi Lahir'));
    if (line) {
      const match = line.match(/Tempat\/Tgi Lahir\s*:\s*([^\d]+),\s*(\d{2}-\d{2}-\d{4})/i);
      if (match) {
        return `${match[1].trim()}, ${match[2].trim()}`;
      }
    }
    return '';
  };

  const extractRTRW = (lines) => {
    const line = lines.find(line => line.includes('RTIRW'));
    if (line) {
      const match = line.match(/RTIRW\s*:\s*(.*)/i);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  };

  const extractKelDesa = (lines) => {
    const line = lines.find(line => line.includes('KellDesa'));
    if (line) {
      // Match for typical KellDesa format
      let match = line.match(/KellDesa\s*:\s*(.*)/i);
      if (match) {
        return match[1].trim();
      }

      // Handle case where KellDesa format is incomplete or missing
      const parts = line.split(':');
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
    return '';
  };

  const extractValue = (lines, regex) => {
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  };

  const extractJenisKelamin = (lines) => {
    const line = lines.find(line => line.includes('Jenis Kelamin'));
    if (line) {
      const match = line.match(/Jenis Kelamin\s*:\s*(LAKI-LAKI|PEREMPUAN)/i);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  };

  const extractGolDarah = (lines) => {
    const line = lines.find(line => line.includes('Gol. Darah'));
    if (line) {
      const match = line.match(/Gol\. Darah\s*:\s*(A|B|AB|O)/i);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  };

  const extractKewarganegaraan = (lines) => {
    const line = lines.find(line => line.includes('Kewarganegaraan'));
    if (line) {
      const match = line.match(/Kewarganegaraan\s*:\s*(WNA|WNI)/i);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  };

  const handleExportToExcel = () => {
    if (!parsedData) return;

    const worksheet = XLSX.utils.json_to_sheet([parsedData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil OCR');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'hasil_ocr.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-6 bg-white shadow-md rounded-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Aplikasi Pemindai Dokumen dengan Tesseract.js</h2>
        </div>
        <div className="mt-8">
          <div className="flex justify-center">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Pilih Dokumen untuk Dipindai</span>
              <input id="file-upload" name="file-upload" type="file" accept=".jpg,.jpeg,.png,.bmp" className="sr-only" onChange={handleFileChange} />
            </label>
          </div>
          <div className="mt-6 flex justify-center">
            <button onClick={handleScanDocument} type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Pindai Dokumen
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 flex justify-center">
            <p className="text-sm text-gray-500">Memproses...</p>
          </div>
        )}

        {scannedText && (
          <div className="mt-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Hasil OCR:</h3>
            </div>
            <pre className="mt-2 text-sm text-gray-600 overflow-auto max-h-96 p-2 bg-gray-50 border border-gray-200 rounded-md">{scannedText}</pre>
            <div className="mt-6 flex justify-center">
              <button onClick={handleExportToExcel} type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Simpan ke Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
