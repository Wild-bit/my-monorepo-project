import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AppstoreOutlined, ExportOutlined, ImportOutlined, SettingOutlined } from '@ant-design/icons';

export function TeamDetailLayout() {
  const { projectSlug } = useParams();
  const location = useLocation();
  const [currentSelectedKey, setCurrentSelectedKey] = useState('projects');
  const items: MenuProps['items'] = [
    {
      key: 'projects',
      label: <Link to="">项目</Link>,
      icon: <AppstoreOutlined />,
    },
    {
      key: 'settings',
      label: <Link to="settings">设置</Link>,
      icon: <SettingOutlined />,
    },
  ];

  const projectItems: MenuProps['items'] = [
    {
      key: '',
      label: <Link to={`${projectSlug}`}>文案</Link>,
      icon: <AppstoreOutlined />,
    },
    {
      key: 'import',
      label: <Link to={`${projectSlug}/import`}>导入</Link>,
      icon: <ImportOutlined />,
    },
    {
      key: 'export',
      label: <Link to={`${projectSlug}/export`}>导出</Link>,
      icon: <ExportOutlined />,
    },
    {
      key: 'settings',
      label: <Link to={`${projectSlug}/settings`}>设置</Link>,
      icon: <SettingOutlined />,
    },
  ];

  const menuItems = useMemo(() => {
    if (projectSlug) {
      return projectItems;
    }
    return items;
  }, [projectSlug]);


  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    // URL: /:teamSlug/:projectSlug?/:subPage?                                                                                                                                                                                                                                                                                                                
    if (projectSlug) {
      // 项目子页面：取 projectSlug 之后的部分                                                                                                                                                                                                                                                                                                                
      const projectIndex = segments.indexOf(projectSlug);
      const subPage = segments[projectIndex + 1] || '';
      setCurrentSelectedKey(subPage);
    } else {
      const lastSegment = segments[segments.length - 1];
      setCurrentSelectedKey(lastSegment === 'settings' ? 'settings' : 'projects');
    }
  }, [location.pathname, projectSlug])



  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setCurrentSelectedKey(key);
  };
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] border border-slate-200/60 overflow-hidden max-w-[1400px] mx-auto min-h-[calc(100vh-120px)] flex flex-col">
      <Menu items={menuItems} selectedKeys={[currentSelectedKey]} onClick={handleMenuClick} mode='horizontal' className='!bg-slate-50/80 border-b border-slate-200/60 px-3 shrink-0' />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}