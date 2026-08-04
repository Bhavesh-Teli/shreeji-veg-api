import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAllVegetables,
    fetchFavoriteVegetables,
} from "../../redux/actions/vegesAction";
import { AppDispatch, RootState } from "../../redux/store";
import { Table, Input, Button, message, theme, Space } from "antd";
import { AddToFavorite, RemoveFavorite } from "../../services/vegesAPI";
import { uploadItemPhoto, deleteItemPhoto } from "../../services/adminAPI";
import { useNavigate } from "react-router-dom";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Vegetable } from "../../redux/slice/vegesSlice";
import { useTranslation } from "react-i18next";

interface APIError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

const AllVeges = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { favorites, all, loading } = useSelector((state: RootState) => state.vegetables);
    const [searchText, setSearchText] = useState<string>("");
    const [filteredVeges, setFilteredVeges] = useState<Vegetable[]>([]);
    const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean, Id: string, Our_Shop_Ac: boolean, Ac_Code: string } | null };
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const allVeges: Vegetable[] = all || [];

    useEffect(() => {
        dispatch(fetchAllVegetables());

        if (user && !user.isAdmin) {
            dispatch(fetchFavoriteVegetables(user?.Id || ""));
        }
    }, [dispatch, user]);

    useEffect(() => {
        const search = searchText.trim().toLowerCase();

        const filtered = allVeges.filter((veg: Vegetable) => {
            const itmName = veg.Itm_Name?.toLowerCase().trim() || "";
            const itmNameEn = veg.Itm_Name_en?.toLowerCase().trim() || "";

            if (!search) {
                return true;
            }

            const match = itmName.includes(search) || itmNameEn.includes(search);
            return match;
        });

        setFilteredVeges(filtered);
    }, [searchText, allVeges]);

    const favoriteIds = favorites?.map((f: Vegetable) => f.Itm_Id) || [];

    const handleAddToFav = async (vege: Vegetable) => {
        try {
            const finalSortIndex = 0;
            if (vege.Itm_ID !== undefined) {
                await AddToFavorite(vege.Itm_ID, finalSortIndex);
            } else {
                message.error(t('vegetable.addError'));
            }
            dispatch(fetchFavoriteVegetables(user?.Id || ""));
            message.success(t('vegetable.addSuccess'));
        } catch (error) {
            const apiError = error as APIError;
            if (apiError.response?.data?.message) {
                message.error(apiError.response.data.message);
            } else {
                message.error(t('vegetable.unactableError'));
            }
        }
    };

    const handleUploadPhoto = async (Itm_Id: number, file: File) => {
        try {
            await uploadItemPhoto(Itm_Id, file);
            message.success(t('Photo uploaded successfully!'));
            dispatch(fetchAllVegetables()); // Refresh list
        } catch (error) {
            message.error(t('Failed to upload photo'));
        }
        return false;
    };

    const handleDeletePhoto = async (Itm_Id: number) => {
        try {
            await deleteItemPhoto(Itm_Id);
            message.success(t('Photo deleted successfully!'));
            dispatch(fetchAllVegetables()); // Refresh list
        } catch (error) {
            message.error(t('Failed to delete photo'));
        }
    };

    const columns = [
        {
            title: t('vegetable.srNo'),
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
            title: t('vegetable.name'),
            dataIndex: "Itm_Name",
            key: "Itm_Name",
            render: (_: any, record: Vegetable) => (
                record.Itm_Name ?? record.Itm_Name_en ?? <span style={{ color: '#999' }}>N/A</span>
            ),
        },
        {
            title: t('vegetable.groupName'),
            dataIndex: "IGP_NAME",
            key: "IGP_NAME",
            render: (text: string | null) => text ?? <span style={{ color: '#999' }}>N/A</span>,
        },
        ...(user && !user.isAdmin
            ? [
                {
                    title: t('vegetable.action'),
                    key: "action",
                    render: (_: unknown, record: Vegetable) => {
                        const isFavorite = favoriteIds.includes(record.Itm_ID || 0);
                        return isFavorite ? (
                            <Button danger onClick={() => handleRemoveFav(record)}>
                                <DeleteOutlined />
                            </Button>
                        ) : (
                            <Button type="primary" onClick={() => handleAddToFav(record)}>
                                <PlusOutlined />
                            </Button>
                        );
                    },
                },
            ]
            : []),
        ...(user && user.isAdmin
            ? [
                {
                    title: t('Action'),
                    key: "adminAction",
                    render: (_: unknown, record: Vegetable) => (
                        <Space>
                            <div style={{ position: 'relative' }}>
                                <Button type="primary" size="small">
                                    {record.Photo ? 'Update' : 'Upload'}
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    title="Choose an image"
                                    style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0] && record.Itm_ID !== undefined) {
                                            handleUploadPhoto(record.Itm_ID, e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                            {record.Photo && (
                                <Button
                                    danger
                                    size="small"
                                    onClick={() => record.Itm_ID !== undefined && handleDeletePhoto(record.Itm_ID)}
                                >
                                    Delete
                                </Button>
                            )}
                        </Space>
                    ),
                },
            ]
            : []),
    ];

    const handleRemoveFav = async (vege: Vegetable) => {
        try {
            if (vege.Itm_ID !== undefined) {
                await RemoveFavorite(vege.Itm_ID);
            } else {
                message.error(t('vegetable.addError'));
            }
            dispatch(fetchFavoriteVegetables(user?.Id || ""));
            message.success(t('vegetable.removeSuccess'));
        } catch {
            message.error(t('vegetable.removeError'));
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className={token.colorBgLayout === "White" ? "BgTextBefore" : "BgText"}>{t('vegetable.title')}</h2>
                {
                    user && !user.isAdmin &&
                    <Button onClick={() => navigate("/favourites")} type="primary">{t('vegetable.viewFavorite')}</Button>
                }
            </div>
            <Space direction="vertical" style={{ width: "100%" }}>
                <Input.Search
                    placeholder={t('vegetable.searchPlaceholder')}
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    value={searchText}
                    enterButton
                />

                <Table
                    columns={columns}
                    dataSource={filteredVeges}
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        onChange: (page) => setCurrentPage(page),
                    }}
                    scroll={{ x: true }}
                    bordered
                    size="small"
                />
            </Space>
        </div>
    );
};

export default AllVeges;
