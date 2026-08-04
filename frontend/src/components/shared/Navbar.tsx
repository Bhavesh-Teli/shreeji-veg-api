import { useEffect, useState } from 'react';
import { Layout, Menu, Button, Drawer, Grid, Popover, Avatar, Space, message, theme, Input, Badge } from 'antd';
import { BellOutlined, GlobalOutlined, LogoutOutlined, MenuOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { setUser } from '../../redux/slice/authSlice';
import Cookies from 'js-cookie';
import { LogoutApi } from '../../services/authAPI';
import dayjs from 'dayjs';
import { GetNotifaction, MarkNotificationAsSeen } from '../../services/notificationAPI';
import { useTranslation } from 'react-i18next';
import { DownloadOutlined } from '@ant-design/icons';
import { COMPANY_CONFIG, isKarnavati } from '../../utils/companyConfig';

const { Header } = Layout;
const { useBreakpoint } = Grid;

interface NavbarProps {
  onToggleTheme: () => void;
  currentTheme: 'light' | 'dark';
}



const Navbar = ({ onToggleTheme, currentTheme }: NavbarProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean } | null };
  const [currentDate, setCurrentDate] = useState('');
  const [hasNewNotification, setHasNewNotification] = useState(false);
  //pwa install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      }
      setDeferredPrompt(null);
      setShowInstallBtn(false); // Hide button after interaction
    }
  };

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        if (user && user.isAdmin) {
          const response = await GetNotifaction();
          const unseen = response.data.some((noti: { Seen: boolean }) => !noti.Seen); // Check if there's any unseen notification
          setHasNewNotification(unseen); // Set the badge visibility based on unseen notifications
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    checkNotifications();
  }, [user]);


  useEffect(() => {
    const formattedDate = dayjs().format('DD-MM-YYYY'); // Format as DD-MM-YYYY
    setCurrentDate(formattedDate);
  }, []);

  const handleNotificationClick = async () => {
    navigate('/notification');
    try {
      await MarkNotificationAsSeen();
      setHasNewNotification(false); // remove badge dot
    } catch (err) {
      console.error("Failed to mark notifications as seen", err);
    }
  };


  // Map path to key
  const pathToKey: { [key: string]: string } = {
    '/': 'orders',
    '/favourites': 'favourites',
    '/contact': 'contact',
    '/user/approve': 'admin-approve',
    '/user/list': 'admin-users',
    '/all/veges': 'admin-veges',
  };

  const selectedKey = Object.entries(pathToKey).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || '1';

  interface MenuClickEvent {
    key: string;
  }

  const handleMenuClick = (e: MenuClickEvent) => {
    const key = e.key;
    if (key === 'orders') navigate('/');
    else if (key === 'favourites') navigate('/favourites');
    else if (key === 'contact') navigate('/contact');
    else if (key === 'admin-approve') navigate('/user/approve');
    else if (key === 'admin-users') navigate('/user/list');
    else if (key === 'admin-veges') navigate('/all/veges');
    setVisible(false);
  };

  const handleLogout = async () => {
    await LogoutApi()
    dispatch(setUser(null));
    Cookies.remove(COMPANY_CONFIG.cookieName);
    navigate("/login");
    message.success(t('nav.logoutSuccess'));
  }

  const popoverContent = (
    <div>
      <Space direction="vertical">
        <Button onClick={() => navigate('/select-language')} type="text" icon={<GlobalOutlined />}>
          {t('nav.language')}
        </Button>
        <Button onClick={handleLogout} type="text" icon={<LogoutOutlined />}>
          {t('nav.logout')}
        </Button>
        {
          showInstallBtn &&
          <Button
            type="text"
            onClick={handlePWAInstall}
            icon={<DownloadOutlined />}
          >
            {t('nav.installApp') || 'Install App'}
          </Button>
        }
      </Space>
    </div>
  );



  const fullName = user?.Ac_Name;

  const getInitials = (name?: string) => {
    if (!name) return "";

    const words = name.trim().split(" ")

    if (words.length === 0) return "";
    if (words.length === 1) return words[0][0]?.toUpperCase() || "";
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName);

  const menuItems = [
    ...(user && user.isAdmin
      ? [
        { key: 'admin-approve', label: t('AproveUser.ApprovedList') },
        { key: 'admin-users', label: t('nav.users') },
        { key: 'admin-veges', label: t('nav.allVeges') || 'All Veges' },
        { key: 'orders', label: t('nav.orders') },
        {
          key: 'notification', label:
            (
              <a onClick={handleNotificationClick} style={{ border: "none", background: "transparent", marginTop: "0px" }}>
                <Badge dot={hasNewNotification} offset={[-2, 2]}>
                  <BellOutlined style={{ fontSize: "19px", color: "#fff" }} />
                </Badge>
              </a>
            )
        },
      ]
      : []),
    ...(user && !user.isAdmin
      ? [
        { key: 'orders', label: t('nav.orders') },
        { key: 'favourites', label: t('nav.favourites') },
      ]
      : []),
    {
      key: '4', label:
        (
          <a onClick={onToggleTheme} style={{ border: "none", background: "transparent", marginTop: "0px" }}>
            {currentTheme === "light" ? <MoonOutlined style={{ fontSize: "19px", color: "#fff" }} /> : <SunOutlined style={{ fontSize: "19px", color: "#fff" }} />}
          </a>
        )
    },
    {
      key: '5',
      label: (
        <Popover content={popoverContent} trigger="click">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{user?.Ac_Name}</span>
            <Avatar size="small">{initials}</Avatar>
          </div>
        </Popover>
      ),
    },
  ];

  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1000,
        background: token.colorPrimaryBg,
        borderBottom: "1px solid #fafafa",
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '56px',
      }}
    >
      {/* Logo on the left */}
      <div
        className="logo"
        onClick={() => {
          if (!user) {
            navigate('/login');
          } else if (!user.isAdmin) {
            navigate('/');
          } else {
            navigate('/user/list');
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
        }}
      >
        <img className='logo-img' src={COMPANY_CONFIG.logo} alt="logo" style={{ height: '44px' }} />
        <span className="hidden md:inline text-[20px] logo-text">
          {isKarnavati ? t('nav.KarnavatiAgro') : t('nav.ShreejiVeg')}
        </span>
        <span>
          <Input
            style={{ width: 120, height: 30, backgroundColor: "#fff", color: "#000" }}
            value={currentDate}
            disabled
          >
          </Input>
        </span>
      </div>


      {/* Menu + Profile on the right */}
      {screens.md ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexGrow: 1 }}>
          <Menu
            mode="horizontal"
            items={menuItems.slice(0, 6)} // Only nav items here
            theme="dark"
            onClick={handleMenuClick}
            selectedKeys={selectedKey ? [selectedKey] : []}
            style={{
              background: 'transparent',
              color: '#fff',
              borderBottom: 'none',
              lineHeight: '56px',
              flexGrow: 1,
              justifyContent: 'flex-end',
            }}
            className={token.colorBgLayout === "White" ? "custom-menu-light" : "custom-menu"}
          />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {user && user.isAdmin && (
              <Button onClick={handleNotificationClick} style={{ border: "none", background: "transparent" }}>
                <Badge dot={hasNewNotification} offset={[-2, 2]}>
                  <BellOutlined style={{ fontSize: "22px", color: "#fff" }} />
                </Badge>
              </Button>
            )}
            <Avatar size="small" style={{ backgroundColor: '#bbf7d0', color: '#000' }}>
              {initials}
            </Avatar>
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#fff', fontSize: '20px', marginTop: "25px" }} />}
              onClick={() => setVisible(true)}
            />
          </div>

          <Drawer
            title={
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'end' }}>
                  <span style={{ color: '' }}>{user?.Ac_Name}</span>
                  <Button onClick={onToggleTheme} style={{ border: "none", background: "transparent" }}>
                    {currentTheme === "light" ? <MoonOutlined style={{ fontSize: "22px" }} /> : <SunOutlined style={{ fontSize: "22px", color: "#fff" }} />}
                  </Button>
                </div>
              </>
            }
            placement="right"
            onClose={() => setVisible(false)}
            open={visible}
          >
            <Menu
              className={token.colorBgLayout === "White" ? "custom-menu-light" : "custom-menu"}
              mode="vertical"
              items={
                user && user.isAdmin ?
                  menuItems.slice(0, 4)
                  : menuItems.slice(0, 2)
              } // Only Home, Products, Contact
              onClick={handleMenuClick}
              selectedKeys={selectedKey ? [selectedKey] : []}
            />

            {!screens.md && (
              <Button
                onClick={() => {
                  navigate('/select-language');
                  setVisible(false);
                }}
                type="text"
                style={{ marginLeft: '7px' }}
              >
                {t('nav.language')}
              </Button>
            )}
            {/* Logout button for mobile only */}
            {!screens.md && (
              <div style={{ marginTop: 16 }}>
                <Button
                  onClick={handleLogout}
                  type="primary"
                  icon={<LogoutOutlined />}
                  block
                  danger
                >
                  {t('nav.logout')}
                </Button>
              </div>
            )}
            {showInstallBtn && !screens.md && (
              <div style={{ marginTop: 8 }}>
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  block
                  onClick={handlePWAInstall}
                >
                  {t('nav.installApp') || 'Install App'}
                </Button>
              </div>
            )}
          </Drawer>
        </>
      )}
    </Header>

  );

};

export default Navbar;
