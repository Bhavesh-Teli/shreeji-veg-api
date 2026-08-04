import { useEffect, useRef, useState } from 'react';
import { Button, Input, message, Table, TableProps } from 'antd';
import { IColumns } from '../../types/IUserList';
import { ApproveUser, GetUsersList, getUsersToApprove } from '../../services/adminAPI';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { InputRef } from 'antd';
import { PlusOutlined } from '@ant-design/icons';


const UserList = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<IColumns[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'approved' | 'toApprove'>('toApprove');
    const inputRefs = useRef<Record<string, InputRef | null>>({});
    const location = useLocation();
    const number = location?.state?.mobile || null;
    const navigate = useNavigate();

    useEffect(() => {
        if (users.length > 0 && number) {
            const matchedUser = users.find(u => u.Mobile_No === number);
            if (matchedUser && matchedUser.Id) {
                const ref = inputRefs.current[matchedUser.Id];
                if (ref) {
                    ref.focus();
                }
            }
        }
    }, [users, number]);

    const columns: TableProps<IColumns>['columns'] = [
        {
            title: t('AproveUser.name'),
            dataIndex: 'Ac_Name',
            key: 'Ac_Name',
            width: "20vw"
        },
        {
            title: t('AproveUser.mobile'),
            dataIndex: 'Mobile_No',
            key: 'Mobile_No',
        },
        {
            title: t('AproveUser.action'),
            key: 'action',
            render: (_, record) => {
                if (activeTab === 'toApprove') {
                    return <Button
                        size='small'
                        onClick={() =>
                            navigate('/add-orders', {
                                state: {
                                    Ac_Name: record.Ac_Name,
                                    Mobile_No: record.Mobile_No,
                                    Book_Pass: record.Book_Pass,
                                    Ac_Code: record.Ac_Code,
                                    Id: record.Id,
                                    Our_Shop_Ac: record.Our_Shop_Ac,
                                },
                            })
                        }
                    >
                        <PlusOutlined />
                    </Button >
                } else if (activeTab === 'approved') {
                    return (
                        <Button
                            type="primary"
                            onClick={() => record.Id && handleStatusChange(record.Id, record.approvalCode || '')}
                        >
                            {t('AproveUser.approve')}
                        </Button>
                    )
                }
            },
        },
        ...(activeTab === 'toApprove' ? [
            {
                title: "Password",
                dataIndex: 'Book_Pass',
                key: 'Book_Pass',
            },
        ] : []),
        {
            title: t('AproveUser.code'),
            dataIndex: 'approvalCode',
            key: 'approvalCode',
            render: (_, record) => {
                if (activeTab === 'toApprove') {
                    return <span>{record.Ac_Code || '-'}</span>;
                }

                return (
                    <Input
                        defaultValue={record.approvalCode || ''}
                        style={{ width: 120 }}
                        onChange={(e) => (record.approvalCode = e.target.value)}
                        ref={(el) => {
                            if (record.Mobile_No === number && record.Id) {
                                inputRefs.current[record.Id] = el;
                            }
                        }}
                    />
                );
            },
        },

    ];

    const handleStatusChange = async (id: string, status: string) => {
        if (!status) {
            message.warning('Please fill the approval code');
            return;
        }
        try {
            const payload = {
                Ac_Id: id,
                approvalCode: status,
            };
            await ApproveUser(payload);
            message.success(t('AproveUser.statusSuccess'));
            fetchUsers('approved');
        } catch (error) {
            console.error(t('AproveUser.statusError'), error);
            message.error(t('AproveUser.statusError'));
        }
    };


    const fetchUsers = async (type: 'approved' | 'toApprove') => {
        setLoading(true);
        try {
            let response;
            if (type === 'approved') {
                response = await getUsersToApprove(); // You need to define this API
            } else {
                response = await GetUsersList();
            }
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(activeTab);
    }, [activeTab]);

    const normalizeText = (input: string = ""): string => {
        const hindiNums = "०१२३४५६७८९";
        const gujaratiNums = "૦૧૨૩૪૫૬૭૮૯";

        return input
            .split("")
            .map((char) => {
                if (hindiNums.includes(char)) return hindiNums.indexOf(char).toString();
                if (gujaratiNums.includes(char)) return gujaratiNums.indexOf(char).toString();
                return char;
            })
            .join("")
            .toLowerCase(); // also normalize case
    };

    const normalizedSearch = normalizeText(searchQuery.trim());

    const filteredUsers = users.filter((user) => {
        const normalizedMobile = normalizeText(user.Mobile_No?.toString());
        const normalizedName = normalizeText(user.Ac_Name);

        return (
            normalizedMobile.includes(normalizedSearch) ||
            normalizedName.includes(normalizedSearch)
        );
    });



    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', marginBottom: '16px' }}>
                <Button
                    type={activeTab === 'approved' ? 'primary' : 'default'}
                    onClick={() => setActiveTab('approved')}
                    style={{}}
                >
                    {t('AproveUser.ApprovedList')}
                </Button>
                <Button
                    type={activeTab === 'toApprove' ? 'primary' : 'default'}
                    style={{ marginLeft: '8px' }}
                    onClick={() => setActiveTab('toApprove')}
                >
                    {t('AproveUser.UserList')}
                </Button>
            </div>
            {activeTab === 'toApprove' && (
                <Input.Search
                    placeholder={t('AproveUser.SearchbyMobileNoorUsername')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                    enterButton
                    style={{ width: '100%', marginBottom: "7px" }}
                />
            )}

            <Table
                columns={columns}
                dataSource={activeTab === 'toApprove' ? filteredUsers : users}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 20, showSizeChanger: false }}
                bordered
                scroll={{ x: 'max-content' }}
                size='small'
            />
        </div>
    );
};

export default UserList;
