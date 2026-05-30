// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router';
import { Header } from '../components/Header/Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      <Header />
      <main className="layout-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};