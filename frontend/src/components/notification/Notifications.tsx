import { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, message, Button, Checkbox, Modal } from 'antd';
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { DeleteAllNotifications, DeleteNotifications, GetNotifaction } from '../../services/notificationAPI';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  interface Notification {
    Id?: number;
    Ac_Id: string;
    Cat: string;
    Noti_Date_Time: string;
    Noti: string;
    extractedDates: string | null;
  }

  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [category, setCategory] = useState<string>('All');
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const deletedOrders = new Set<number>();

  // Fetch notifications when the component mounts
  const fetchNotifications = async () => {
    try {
      const response = await GetNotifaction();
      const sortedNotifications = response.data.sort((a: Notification, b: Notification) => {
        return new Date(b.Noti_Date_Time).getTime() - new Date(a.Noti_Date_Time).getTime();
      });

      setNotifications(sortedNotifications);
      setFilteredNotifications(sortedNotifications);
    } catch {
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (category === 'All') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(notification => notification.Cat === category));
    }
  }, [category, notifications]);

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  const getCardTitle = (category: string) => {
    if (category === 'New User') return t('notifications.user');
    if (category === 'Order') return t('notifications.order');
    return 'Notification'; // Default title if it's neither "New user" nor "Order"
  };

  const handleCardClick = (category: string, noti: string) => {
    if (category === 'New User') {
      const str = noti;
      const mobile = str.match(/\b\d{10}\b/);
      navigate('/user/approve', {
        state: {
          mobile: mobile ? mobile[0] : null,
        },
      });
    } else if (category === 'Order') {
      const orderIdMatch = noti.match(/order (\d+)/i);
      const orderId = orderIdMatch ? parseInt(orderIdMatch[1], 10) : null;

      const isDeleted = /delete(d)?/i.test(noti);

      if (orderId !== null) {
        if (isDeleted) {
          deletedOrders.add(orderId);
          message.info(t('notifications.DeleteNotificationsMessage'));
          return;
        }

        // Check if this order is marked as deleted
        if (deletedOrders.has(orderId)) {
          message.info(t('notifications.DeleteNotificationsMessage'));
          return;
        }

        // Extract date
        const dateMatch = noti.match(/\d{4}-\d{2}-\d{2}/);
        const orderDate = dateMatch ? dateMatch[0] : null;

        navigate('/', {
          state: {
            billNo: orderId,
            orderDate,
          },
        });
      }
    }
  };

  const handleCheckboxChange = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const updated = checked ? [...prev, id] : prev.filter(item => item !== id);
      return updated;
    });
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      message.warning(t('notifications.Please select at least one notification.'));
      return;
    }

    Modal.confirm({
      title: t('notifications.deleteConfermation'),
      content: `${t('notifications.deleteMessage')} ${selectedIds.length} ${t('notifications.notifications')}`,
      okText: t('notifications.ok'),
      okType: 'danger',
      cancelText: t('notifications.cancel'),
      onOk: async () => {
        try {
          await DeleteNotifications(selectedIds);
          message.success(t('notifications.deleteSuccess'));
          const updated = notifications.filter(n => !selectedIds.includes(n.Id ?? 0));
          setNotifications(updated);
          setFilteredNotifications(
            category === "All"
              ? updated
              : updated.filter(n => n.Cat === category)
          );
          setSelectedIds([]);
        } catch {
          message.error(t('notifications.deleteError'));
        }
      },
    });
  };

  const handleDeleteAll = async () => {

    Modal.confirm({
      title: t('notifications.DeleteNotifications'),
      content: t('notifications.deleteAllNotifications'),
      okText: t('notifications.ok'),
      okType: 'danger',
      cancelText: t('notifications.cancel'),
      onOk: async () => {
        try {
          await DeleteAllNotifications();
          message.success(t('notifications.deleteSuccess'));
          fetchNotifications();
        } catch {
          message.error(t('notifications.deleteError'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return loading ?
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}>
      <Spin /> </div> : (
      <div style={{ padding: '24px' }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          {/* Left side buttons */}
          <Col xs={24} sm={18}>
            <Row gutter={[8, 8]} wrap>
              <Col>
                <Button
                  type={category === 'All' ? 'primary' : 'default'}
                  onClick={() => setCategory('All')}
                  block={true}
                >
                  {t('notifications.all')}
                </Button>
              </Col>
              <Col>
                <Button
                  type={category === 'New User' ? 'primary' : 'default'}
                  onClick={() => setCategory('New User')}
                  block={true}
                >
                  {t('notifications.user')}
                </Button>
              </Col>
              <Col>
                <Button
                  type={category === 'Order' ? 'primary' : 'default'}
                  onClick={() => setCategory('Order')}
                  block={true}
                >
                  {t('notifications.order')}
                </Button>
              </Col>
            </Row>
          </Col>

          {/* Delete buttons on right side */}
          <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
            <Row gutter={[8, 8]} justify="end">
              <Col>
                <Button danger onClick={handleDeleteAll} block={true}>
                  {t('notifications.DeleteAll')} <DeleteOutlined />
                </Button>
              </Col>
              <Col>
                <Button danger onClick={handleDelete} icon={<DeleteOutlined />} />
              </Col>
            </Row>
          </Col>
        </Row>

        {loading ? (
          <Spin indicator={antIcon} />
        ) : (
          <div style={{ padding: "20px" }}>
            <Row gutter={[16, 16]}>
              {filteredNotifications && filteredNotifications.map((notification, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <Card
                    title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{getCardTitle(notification.Cat)}</span>
                      <Checkbox
                        checked={notification.Id ? selectedIds.includes(notification.Id) : false}
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                        onChange={(e) => handleCheckboxChange(notification.Id ?? 0, e.target.checked)}
                      />
                    </div>}
                    bordered={false}
                    hoverable
                    onClick={() => handleCardClick(notification.Cat, notification.Noti)}
                  >
                    <p><strong>{t('notifications.message')} :</strong> {notification?.Noti}</p>
                    <p><strong>{t('notifications.time')} : </strong>{new Date(notification.Noti_Date_Time).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}</p>
                  </Card>
                </Col>
              ))}
              {filteredNotifications.length === 0 && (
                <Col span={24}>
                  <Card bordered={false} style={{ textAlign: 'center' }}>
                    <p>{t('notifications.noNotifications')}</p>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        )}
      </div>
    );
};

export default Notifications;
