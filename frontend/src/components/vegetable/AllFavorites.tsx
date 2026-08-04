import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavoriteVegetables } from "../../redux/actions/vegesAction";
import { AppDispatch, RootState } from "../../redux/store";
import { Table, Input, Space, Button, message, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { RemoveFavorite, updateSortIndexAPI } from "../../services/vegesAPI";
import { DeleteOutlined } from "@ant-design/icons";
import { Vegetable } from "../../redux/slice/vegesSlice";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import type { InputRef } from "antd";


const FavoriteVeges = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { favorites, loading } = useSelector((state: RootState) => state.vegetables);
    const [searchText, setSearchText] = useState("");
    const [filteredVeges, setFilteredVeges] = useState<Vegetable[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean, Id: string, Our_Shop_Ac: boolean, Ac_Code: string } | null };
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedSortIndex, setEditedSortIndex] = useState<number | null>(null);
    const pageSize = 20;
    const inputRef = useRef<InputRef>(null);

    const favoriteVeges = favorites || [];

    useEffect(() => {
        if (editingId !== null && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    useEffect(() => {
        dispatch(fetchFavoriteVegetables(user?.Id || ""));
    }, [dispatch, user]);

    useEffect(() => {
        const search = searchText.trim().toLowerCase();

        const filtered = favoriteVeges.filter((veg: Vegetable,) => {
            const itmName = veg.Itm_Name?.toLowerCase().trim() || "";
            const itmNameEn = veg.Itm_Name_en?.toLowerCase().trim() || "";

            if (!search) {
                return true;
            }

            const match = itmName.includes(search) || itmNameEn.includes(search);
            return match;
        });

        setFilteredVeges(filtered);
    }, [searchText, favoriteVeges]);


    const columns = [
        {
            title: t('favorite.srNo'),
            key: "serial",
            render: (_: unknown, __: unknown, index: number) =>
                (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: t('Photo'),
            dataIndex: "Photo",
            key: "Photo",
            render: (photoUrl: string | null) => photoUrl ? (
                <img src={import.meta.env.VITE_REACT_APP_SOCKET_URL + photoUrl} alt="Item" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />
            ) : <span style={{ color: '#999' }}>No Photo</span>,
        },
        {
            title: t('favorite.name'),
            dataIndex: "Itm_Name",
            key: "Itm_Name",
            render: (_: string | null, record: Vegetable) => {
                if (record.Itm_Name) return record.Itm_Name;
                if (record.Itm_Name_en) return <span>{record.Itm_Name_en}</span>;
                return <span style={{ color: '#999' }}>N/A</span>;
            },
        },
        {
            title: t('favorite.groupName'),
            dataIndex: "IGP_NAME",
            key: "IGP_NAME",
            render: (text: string | null) => text ?? <span style={{ color: '#999' }}>N/A</span>,
        },
        {
            title: t('favorite.sortIndex'),
            dataIndex: "Sort_Index",
            key: "Sort_Index",
            render: (text: number, record: Vegetable) => {
                const isEditing = editingId === record.Itm_Id;
                const value = text ?? 0;
                return isEditing ? (
                    <Input
                        type="text"
                        ref={inputRef}
                        value={editedSortIndex ?? ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Allow only digits
                            if (/^\d*$/.test(value)) {
                                setEditedSortIndex(value === "" ? null : Number(value));
                            }
                        }}
                        style={{ width: 80 }}
                    />

                ) : (
                    value
                );
            },
        },
        {
            title: t('favorite.action'),
            key: "action",
            render: (_: unknown, record: Vegetable) => {
                const isEditing = editingId === record.Itm_Id;

                return (
                    <Space>
                        {isEditing ? (
                            <>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleSaveSortIndex(record)}
                                >
                                    Save
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setEditingId(null);
                                        setEditedSortIndex(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setEditingId(record.Itm_Id ?? null);
                                        setEditedSortIndex(record.Sort_Index ?? null);
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button danger size="small" onClick={() => handleRemoveFav(record)}>
                                    <DeleteOutlined />
                                </Button>
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    const handleSaveSortIndex = async (record: Vegetable) => {
        if (editedSortIndex === null || record.Itm_Id === undefined) return;
        try {
            await updateSortIndexAPI(record.Itm_Id, editedSortIndex);
            message.success(t('favorite.sortIndexMessage'));

            dispatch(fetchFavoriteVegetables(user?.Id || ""));
            setEditingId(null);
            setEditedSortIndex(null);
        } catch {
            message.error("Failed to update Sort Index");
        }
    };


    const handleRemoveFav = async (record: Vegetable) => {
        if (record.Itm_Id !== undefined) {
            await RemoveFavorite(record.Itm_Id);
        } else {
            message.error(t('favorite.removeError'));
        }
        dispatch(fetchFavoriteVegetables(user?.Id || ""));
        message.success(t('favorite.removeSuccess'));
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex justify-center items-center gap-2">
                    <h2 className={token.colorBgLayout === "White" ? "BgTextBefore" : "BgText"}>{t('favorite.title')}: {favoriteVeges.length}</h2>
                </div>
                <Button onClick={() => navigate("/all/veges")} type="primary">{t('favorite.addOrView')}</Button>
            </div>

            <Space direction="vertical" style={{ width: "100%" }}>
                <Input.Search
                    placeholder={t('favorite.searchPlaceholder')}
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    enterButton
                />

                <Table
                    columns={columns}
                    dataSource={filteredVeges}
                    rowKey={(record) => record.Itm_Id ?? ``}
                    loading={loading}
                    pagination={{
                        pageSize,
                        current: currentPage,
                        onChange: (page) => setCurrentPage(page),
                        showSizeChanger: false,
                    }}
                    scroll={{ x: true }}
                    bordered
                    size="small"
                />
            </Space>
        </div>
    );
};

export default FavoriteVeges;
