import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SecurityBanner from './SecurityBanner';
import UpdateBanner from './UpdateBanner';

export default function Layout() {
  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <SecurityBanner />
        <UpdateBanner />
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
