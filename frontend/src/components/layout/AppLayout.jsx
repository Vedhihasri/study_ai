import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="app-wrapper">
      <Sidebar
        showMobile={showMobileSidebar}
        onHideMobile={() => setShowMobileSidebar(false)}
      />
      <div className="app-main">
        <Topbar
          onToggleMobileSidebar={() => setShowMobileSidebar((prev) => !prev)}
        />
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
