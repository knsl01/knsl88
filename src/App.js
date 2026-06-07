import React from 'react';
// Mengambil aplikasi utama KNSLApp yang sudah dirakit oleh Claude
import MainLayout from './MainLayout.jsx';

export default function App() {
  // Menggunakan fungsi murni React agar lolos build (.js) 100% tanpa error
  return React.createElement(MainLayout);
}
