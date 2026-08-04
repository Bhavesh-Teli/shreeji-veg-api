import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Input, Space, DatePicker, Row, Col, Form, Button, message, Modal, Select, Tooltip, TimePicker, theme, } from "antd";
import { AppDispatch, RootState } from "../../redux/store";
import dayjs, { Dayjs } from "dayjs";
import { fetchOrders } from "../../redux/actions/ordersAction";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { Deleteorder, GetAllYear, GetFreezeTime, SendFreezeTime } from "../../services/orderAPI";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import 'dayjs/locale/en';
import 'dayjs/locale/hi';
import '../../locales/dayJs-gu.ts';
import localeEn from 'antd/es/date-picker/locale/en_US';
import localeHi from 'antd/es/date-picker/locale/hi_IN';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import OrderPDF from "./OrderPDF";
import UserListToApprove from "../admin/UserListToApprove.tsx";
import { GetUsersList, getUsersToApprove } from "../../services/adminAPI.ts";
import debounce from 'lodash/debounce';

interface OrderRecord {
    Bill_No: string;
    Bill_Date: string;
}

const ViewOrders = () => {
    const { t, i18n } = useTranslation();
    const getAntdLocale = () => {
        switch (i18n.language) {
            case 'hi':
                dayjs.locale('hi');
                return localeHi;
            case 'gu':
                return {
                    ...localeEn,
                    lang: {
                        ...localeEn.lang,
                        locale: 'gu',
                        placeholder: 'તારીખ પસંદ કરો',
                        yearPlaceholder: 'વર્ષ પસંદ કરો',
                        monthPlaceholder: 'મહિનો પસંદ કરો',
                        today: 'આજ',
                    },
                };
            default:
                dayjs.locale('en');
                return localeEn;
        }
    };
    const tomorrow = dayjs().add(1, 'day');
    const currentAntdLocale = getAntdLocale();
    const dispatch = useDispatch<AppDispatch>();
    const { orders, loading } = useSelector((state: RootState) => state.orders) as { orders: any[] | null; loading: boolean };
    const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean } | null };
    const { RangePicker } = DatePicker;
    const [selectedDates, setSelectedDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>();
    const { Option } = Select;
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
    const [allYear, setAllYear] = useState<{ db_name: string; year1: string; year2: string; year_type: string }[] | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | undefined>();
    const pdfRef = useRef<HTMLDivElement>(null);
    const selectedOrderRef = useRef<any>(null);
    const location = useLocation();
    const orderId = location?.state?.billNo || null;
    const orderDate = location?.state?.orderDate || null;
    const [freezeTime, setFreezeTime] = useState(""); // State to track loading status
    const [users, setUsers] = useState<any[]>([]);
    const { token } = theme.useToken();
    interface UserSearchResult {
        Ac_Name: string;
        Ac_Code: string;
        Mobile_No: string;
    }
    const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [showUserTable, setShowUserTable] = useState(false);
    const [showOrderTable, setShowOrderTable] = useState(false);

    useEffect(() => {
        if (orders?.length === 0) {
            setFilteredOrders([]);
            setSelectedOrderItems([]);
        }
    }, [orders])


    const fetchUsers = async () => {
        try {
            const response = await getUsersToApprove();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        if (user && user.isAdmin) {
            fetchUsers();
        }
    }, [user]);

    const fetchFreezeTime = async () => {
        try {
            const response = await GetFreezeTime();
            setFreezeTime(response?.data?.freezeTime);
        } catch (error) {
            console.error("Error fetching freeze time:", error);
        }
    }

    useEffect(() => {
        fetchFreezeTime();
    }, [])

    useEffect(() => {
        if (!orders || orders.length === 0) {
            setShowOrderTable(true);
            return;
        }

        if (!orderId) return;

        const matchedOrder = orders.find(order =>
            Number(order.Bill_No) === Number(orderId)
        );

        if (matchedOrder) {
            setSearchTerm(orderId.toString());
            setFilteredOrders([matchedOrder]);
            setSelectedOrderItems(matchedOrder.Details || []);
            setShowOrderTable(true);
            setShowUserTable(false);
        }
    }, [orderId, orders]);

    useEffect(() => {
        if (selectedYear && orderDate) {
            setSelectedDates([dayjs(orderDate), dayjs(orderDate)]);
            setSelectedYear(selectedYear);
            if (user && !user.isAdmin) {
                setFilteredOrders([]);
            }
        }
    }, [orderDate, selectedYear, user]);

    useEffect(() => {
        const fetchAllYear = async () => {
            try {
                const res = await GetAllYear();
                const data = res?.data || [];
                setAllYear(data);

                const currentYear = data.find((item: { db_name: string; year1: string; year2: string; year_type: string }) => item.year_type === "C");
                if (currentYear) {
                    setSelectedYear(currentYear.db_name);
                    if (currentYear.year_type === "C") {
                        setSelectedDates([tomorrow, tomorrow]);
                    } else {
                        const startDate = dayjs(`${currentYear.year1}-04-01`).startOf("day");
                        const endDate = dayjs(`${currentYear.year2}-03-31`).endOf("day");
                        setSelectedDates([startDate, endDate]);
                    }
                }
            } catch (error) {
                console.error("Error fetching year data:", error);
            }
        }

        fetchAllYear();
    }, []);

    useEffect(() => {
        if (selectedDates && user) {
            const payload = {
                fromDate: selectedDates[0].format("YYYY-MM-DD"),
                toDate: selectedDates[1].format("YYYY-MM-DD"),
                db_name: selectedYear,
            };
            dispatch(fetchOrders(payload));
            if (user && !user.isAdmin) {
                setFilteredOrders([]);
            }
        }
    }, [selectedDates, dispatch, selectedYear, user]);


    const columns = [
        ...(user && user.isAdmin
            ? [{
                title: t('viewOrders.account_code'),
                dataIndex: "Ac_Code",
                key: "Ac_Code",
            }]
            : []),
        ...(user && user.isAdmin
            ? [{
                title: t('viewOrders.account_name'),
                dataIndex: "Ac_Name",
                key: "Ac_Name",
            }]
            : []),
        {
            title: t('viewOrders.order_number'),
            dataIndex: "Bill_No",
            key: "Bill_No",
        },
        {
            title: t('viewOrders.billType'),
            dataIndex: "Bill_Type",
            key: "Bill_Type",
        },
        {
            title: t('viewOrders.order_date'),
            dataIndex: "Bill_Date",
            key: "Bill_Date",
            render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
        },
        {
            title: t('viewOrders.action'),
            key: "action",
            render: (_: unknown, record: OrderRecord) => (
                <div className="flex items-center gap-3">
                    <Tooltip title={disablePastDates(dayjs(record.Bill_Date)) ? "You can't update past orders" : ""}>
                        <Button
                            size="small"
                            onClick={() => handleEdit(record)}
                            disabled={disablePastDates(dayjs(record.Bill_Date))}
                        >
                            <EditOutlined style={{ fontSize: "14px" }} />
                        </Button>
                    </Tooltip>
                    <Button
                        size="small"
                        onClick={() => handleDownload(record)}
                    >
                        <DownloadOutlined style={{ fontSize: "14px" }} />
                    </Button>
                    <Tooltip title={disablePastDates(dayjs(record.Bill_Date)) ? "You can't delete past orders" : ""}>
                        <Button
                            size="small"
                            danger
                            onClick={() => handleDelete(record)}
                            disabled={disablePastDates(dayjs(record.Bill_Date))}
                        >
                            <DeleteOutlined style={{ fontSize: "14px" }} />
                        </Button>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const disablePastDates = (current: Dayjs) => {
        if (!freezeTime) return false;

        const now = dayjs();
        const [freezeHour, freezeMinute, freezeSecond] = freezeTime.split(':').map(Number);
        const freezeMoment = now.clone().hour(freezeHour).minute(freezeMinute).second(freezeSecond);

        const isPast = current.isBefore(now, 'day');
        const isTodayAfterFreeze = current.isSame(now, 'day') && now.isAfter(freezeMoment);

        const shouldDisable = isPast || isTodayAfterFreeze;

        return shouldDisable;
    };

    const handleEdit = (record: any) => {
        if (record.Bill_No) {
            // Passing data via state
            navigate("/add-orders", {
                state: {
                    orderData: record
                },
            });
        } else {
            message.error(t('viewOrders.invalidBillNo'));
        }
    };

    const handleDownload = async (record: any) => {
        const hide = message.loading('Preparing download...', 0);
        try {
            const orderToDownload = orders?.find((order: any) => order.Bill_No === record.Bill_No);
            selectedOrderRef.current = orderToDownload;

            setTimeout(async () => {
                if (!pdfRef.current) {
                    hide();
                    return;
                }

                const canvas = await html2canvas(pdfRef.current, {
                    scale: 1.10,
                    useCORS: true,
                });

                // const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF("p", "pt", "a4");

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                const ratio = pageWidth / imgWidth;
                const scaledHeight = imgHeight * ratio;

                let position = 0;

                while (position < scaledHeight) {
                    const sourceY = (position / ratio);
                    const pageCanvas = document.createElement("canvas");
                    const pageContext = pageCanvas.getContext("2d");

                    pageCanvas.width = imgWidth;
                    pageCanvas.height = (pageHeight / ratio);

                    // Copy the current slice of the full canvas
                    pageContext?.drawImage(
                        canvas,
                        0, sourceY,
                        imgWidth, pageCanvas.height,
                        0, 0,
                        imgWidth, pageCanvas.height
                    );

                    const pageImgData = pageCanvas.toDataURL("image/png");

                    if (position > 0) pdf.addPage();

                    pdf.addImage(
                        pageImgData,
                        "PNG",
                        0,
                        0,
                        pageWidth,
                        pageHeight
                    );

                    position += pageHeight;
                }

                pdf.save(`${orderToDownload?.Bill_No || "invoice"}.pdf`);
                hide();
                message.success('Download successful!', 2);
            }, 0);
        } catch (error) {
            hide();
            message.error('Download failed. Please try again.', 2);
            console.error(error);
        }
    };


    const handleDelete = async (record: OrderRecord) => {
        if (!record?.Bill_No) {
            message.error(t('viewOrders.invalidBillNo'));
            return;
        }

        Modal.confirm({
            title: t('viewOrders.delete_title'),
            content: `${t('viewOrders.order_no')} : ${record.Bill_No}`,
            okText: t('viewOrders.delete'),
            okType: "danger",
            cancelText: t('viewOrders.cancel'),
            onOk: async () => {
                try {
                    await Deleteorder(record.Bill_No);
                    message.success(t('viewOrders.orderDelete'));
                    setSelectedOrderItems([]);
                    if (selectedDates) {
                        dispatch(fetchOrders({
                            fromDate: selectedDates[0].format("YYYY-MM-DD"),
                            toDate: selectedDates[1].format("YYYY-MM-DD"),
                            db_name: selectedYear,
                        }));
                    }
                } catch {
                    message.error(t('viewOrders.failDelete'));
                }
            },
        });
    };

    const handleYearChange = (value: string) => {
        // setSelectedYear(value);
        try {

            const selected = allYear?.find((item) => item.db_name === value);
            if (selected) {
                setSelectedYear(selected.db_name);
                if (selected.year_type === "C") {
                    setSelectedDates([tomorrow, tomorrow]);
                } else {
                    const startDate = dayjs(`${selected.year1}-04-01`).startOf("day");
                    const endDate = dayjs(`${selected.year2}-03-31`).endOf("day");
                    setSelectedDates([startDate, endDate]);
                }
            }
        } catch {
            message.error("Failed to fetch orders");
        }

    };

    const disableOutsideRange = (current: Dayjs) => {
        const selected = allYear?.find((item) => item.db_name === selectedYear);
        if (!selected) return true; // Disable all if no year is selected

        const start = dayjs(`${selected.year1}-04-01`).startOf("day");
        const end = dayjs(`${selected.year2}-03-31`).endOf("day");

        return current.isBefore(start) || current.isAfter(end);
    };

    const handleSendFreezeTime = async (time: string) => {
        await SendFreezeTime(time);
        message.success(t('viewOrders.Freezetimesentsuccessfully'));
    }

    const handleUserClick = (acCode: string) => {
        // Filter existing order data using Ac_Code
        const userOrders = orders?.filter(order => order.Ac_Code === acCode);

        setFilteredOrders((userOrders ?? []).slice().sort((a, b) => b.Bill_No - a.Bill_No));
        setShowUserTable(false); // Hide the user table
        setShowOrderTable(true); // Show the orders now
    };

    useEffect(() => {
        if (!orders || orders.length === 0) {
            setShowOrderTable(true);
            return;
        }

        // Only apply this when there’s no orderId
        if (!orderId) {
            setFilteredOrders((orders ?? []).slice().sort((a, b) => b.Bill_No - a.Bill_No));
            setShowUserTable(false);
            setShowOrderTable(true);
            return;
        }
    }, [orders]);

    const handleSearchInputChange = useCallback(async (value: string) => {
        setSearchTerm(value);

        if (!value.trim()) {
            setFilteredOrders((orders ?? []).slice().sort((a, b) => b.Bill_No - a.Bill_No));
            setUserSearchResults([]);
            setSelectedOrderItems([]);
            setShowOrderTable(true);
            setShowUserTable(false);
            return;
        }

        if (/^\d+$/.test(value)) {
            // Numeric - filter by Order Number
            const filteredByOrderNo = orders?.filter(order =>
                order.Bill_No.toString().includes(value)
            );
            // setFilteredOrders(filteredByOrderNo ?? []);
            setFilteredOrders(
                (filteredByOrderNo ?? []).slice().sort((a, b) => b.Bill_No - a.Bill_No)
            );
            setShowOrderTable(true);
            setShowUserTable(false);

            // Don't auto-open details here
            setSelectedOrderItems([]);
            return;
        }

        // Textual - search by Account Name
        try {
            const allUsers = await GetUsersList();
            const matchedUsers = (allUsers?.data ?? []).filter((user: any) =>
                user.Ac_Name?.toLowerCase().includes(value.toLowerCase())
            );
            setUserSearchResults(matchedUsers);
            setShowUserTable(true);
            setShowOrderTable(false);
            setFilteredOrders([]);
            setSelectedOrderItems([]);
        } catch {
            message.error("Failed to search users");
        }
    }, [orders]);

    const debouncedSearchHandler = useMemo(() => {
        return debounce((value: string) => {
            handleSearchInputChange(value);
        }, 500);
    }, [handleSearchInputChange]);

    return (
        <div className="p-4">
            <>
                <Row>
                    {user && user.isAdmin && (
                        <>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Form.Item label={t('viewOrders.FreezeTime')} colon={false} className="time-freeze">
                                    <TimePicker
                                        style={{ width: "100%" }}
                                        size="small"
                                        format="hh:mm:ss A"
                                        value={freezeTime ? dayjs(freezeTime, "HH:mm:ss") : null}
                                        use12Hours
                                        onChange={(time) => {
                                            if (time) {
                                                const timeIn24HourFormat = dayjs(time).format("HH:mm:ss");
                                                setFreezeTime(timeIn24HourFormat);
                                                handleSendFreezeTime(timeIn24HourFormat);
                                            }
                                        }}
                                        placeholder={t('viewOrders.SelectFreezeTime')}
                                        locale={currentAntdLocale}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Form.Item label={t('viewOrders.select_year')} colon={false} className="date-select">
                                    <Select
                                        value={selectedYear}
                                        onChange={handleYearChange}
                                        placeholder={t('viewOrders.select_financial_year')}
                                        style={{ width: "100%" }}
                                    >
                                        {allYear?.map((year) => (
                                            <Option key={year.db_name} value={year.db_name}>
                                                {`${year.year1}-${year.year2}`}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </>
                    )}

                    {/* User: Only show Select Year */}
                    {!user || !user.isAdmin && (
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item label={t('viewOrders.select_year')} colon={false} className="select-year">
                                <Select
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                    placeholder={t('viewOrders.select_financial_year')}
                                    style={{ width: "300px" }}
                                >
                                    {allYear?.map((year) => (
                                        <Option key={year.db_name} value={year.db_name}>
                                            {`${year.year1}-${year.year2}`}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    )}

                    <Col xs={24} sm={12} md={8} lg={8}>
                        <Form.Item
                            label={t('viewOrders.select_date')}
                            colon={false}
                            className={user && user.isAdmin ? 'date-select' : ''}
                        >
                            <div style={{ flex: 1 }}>
                                <RangePicker
                                    size="small"
                                    style={{ width: '100%' }}
                                    format="DD-MM-YYYY"
                                    value={selectedDates}
                                    onChange={(dates) => {
                                        if (dates && dates[0] && dates[1]) {
                                            setSelectedDates([dates[0], dates[1]]);
                                        } else {
                                            setSelectedDates(null);
                                        }
                                    }}
                                    locale={currentAntdLocale}
                                    disabledDate={disableOutsideRange}
                                />
                            </div>
                        </Form.Item>
                    </Col>
                    {user && user.isAdmin && users.length > 0 && (
                        <Col xs={26} sm={14} md={8} lg={24}>
                            <UserListToApprove />
                        </Col>

                    )}

                    {user && !user.isAdmin && (
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Button className="ml-0 md:ml-3" type="primary" onClick={() => navigate("/add-orders")}>
                                {t('viewOrders.add_order')}
                            </Button>
                        </Col>
                    )}
                </Row>
                <div>
                    <h2 style={{ marginTop: "8px" }} className={token.colorBgLayout === "White" ? "BgTextBefore" : "BgText"}>
                        Total Orders: {orders?.length}
                    </h2>
                </div>
                <Space direction="vertical" style={{ width: "100%" }}>
                    {user && user.isAdmin &&
                        <Input.Search
                            placeholder={t('viewOrders.SearchWithordernumberoraccountname')}
                            value={searchTerm}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchTerm(value);
                                debouncedSearchHandler(e.target.value);
                            }}
                            enterButton
                            style={{ width: '100%' }}
                            allowClear
                        />
                    }
                    {showUserTable && (
                        <Table
                            dataSource={userSearchResults}
                            rowKey="Ac_Code"
                            columns={[
                                {
                                    title: "Account Name",
                                    dataIndex: "Ac_Name",
                                    key: "Ac_Name",
                                },
                                {
                                    title: "Account Code",
                                    dataIndex: "Ac_Code",
                                    key: "Ac_Code",
                                },
                                {
                                    title: "Mobile Number",
                                    dataIndex: "Mobile_No",
                                    key: "Ac_Code",
                                },
                            ]}
                            onRow={(record) => ({
                                onClick: () => {
                                    handleUserClick(record.Ac_Code);
                                },
                            })}
                            pagination={false}
                            bordered
                        />
                    )}
                    {showOrderTable && (
                        <Table
                            columns={columns}
                            rowKey={(record) => record.Bill_No}
                            dataSource={filteredOrders}
                            onRow={(record) => ({
                                onClick: () => setSelectedOrderItems((record as any).Details || []),
                            })}
                            loading={loading}
                            scroll={{ x: true, }}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            bordered
                            size="small"
                        />
                    )}
                    {selectedOrderItems && selectedOrderItems.length > 0 && (
                        <>
                            <h2 style={{ marginTop: "3px", marginBottom: "3px" }}>{t('viewOrders.item_details')} </h2>
                            <Table
                                dataSource={[...selectedOrderItems].sort((a, b) => a.SrNo - b.SrNo)}
                                pagination={false}
                                bordered
                                rowKey={(record) => record.SrNo}
                                size="small"
                                columns={[
                                    {
                                        title: t('viewOrders.sr_no'),
                                        dataIndex: "SrNo",
                                        key: "SrNo",
                                    },
                                    {
                                        title: t('viewOrders.itemName'),
                                        dataIndex: "Itm_Name",
                                        key: "Itm_Name",
                                    },
                                    {
                                        title: t('viewOrders.groupName'),
                                        dataIndex: "IGP_NAME",
                                        key: "IGP_NAME",
                                    },
                                    {
                                        title: t('viewOrders.quantity'),
                                        dataIndex: "Qty",
                                        key: "Qty",
                                    },
                                    {
                                        title: t('viewOrders.unit'),
                                        dataIndex: "Uni_Name",
                                        key: "Uni_Name",
                                    },
                                ]}
                            />
                        </>
                    )}

                </Space>
            </>
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <div ref={pdfRef}>
                    {selectedOrderRef.current && <OrderPDF orderData={selectedOrderRef.current} />}
                </div>
            </div>
        </div>

    );

};

export default ViewOrders;
