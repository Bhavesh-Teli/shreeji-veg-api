import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Input, Space, DatePicker, Form, Button, message, Spin, theme, Select, TimePicker } from "antd";
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { fetchAllVegetables, fetchFavoriteVegetables } from "../../redux/actions/vegesAction";
import { AppDispatch, RootState } from "../../redux/store";
import dayjs, { Dayjs } from "dayjs";
import { AddOrder, GetFreezeTime, GetLrNo, GetUnits, UpdateOrder } from "../../services/orderAPI";
import { Vegetable } from "../../redux/slice/vegesSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import 'dayjs/locale/en';
import 'dayjs/locale/hi';
import '../../locales/dayJs-gu.ts';
import localeEn from 'antd/es/date-picker/locale/en_US';
import localeHi from 'antd/es/date-picker/locale/hi_IN';


// Define Unit type if not already imported
type Unit = {
  Uni_ID: number;
  Uni_Name: string;
};

// Extended Vegetable to hold uid for cloning
export interface OrderRowData extends Vegetable {
  uid: string;
}

const AllOrders = () => {

  const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean, Id: string, Our_Shop_Ac: boolean, Ac_Code: string, Mobile_No?: string } | null };
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { favorites, loading, all } = useSelector((state: RootState) => state.vegetables);

  // Changed keys from string (Itm_Id) to string (uid)
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [unitSelections, setUnitSelections] = useState<{ [uid: string]: number }>({});
  const [addedNonFavItemsOrder, setAddedNonFavItemsOrder] = useState<string[]>([]);

  const [billDate, setBillDate] = useState(dayjs().add(1, 'day'));
  const [lrNo, setLrNo] = useState<string | null>(null);
  const [billNo, SetBillNo] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<OrderRowData[]>([]);
  const [mergedData, setMergedData] = useState<OrderRowData[]>([]);
  const [clonedItems, setClonedItems] = useState<OrderRowData[]>([]);

  const [addLoding, setAddLoding] = useState(false);
  const location = useLocation();
  const { orderData } = location.state || {};
  const userDetails = location?.state || null;
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [originalOrderItemIds, setOriginalOrderItemIds] = useState<string[]>([]);

  const [freezeTime, setFreezeTime] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [address1, setAddress1] = useState<string>("");
  const [address2, setAddress2] = useState<string>("");
  const [deliveryTime, setDeliveryTime] = useState<Dayjs | null>(null);

  const fetchUnits = async () => {
    const res = await GetUnits();
    setUnits(res.data);
  }
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
    fetchUnits();
  }, [])

  useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  const getAntdLocale = () => {
    switch (i18n.language) {
      case 'hi':
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
        return localeEn;
    }
  };

  useEffect(() => {
    const normalizedAll = all.map(item => ({
      ...item,
      Itm_Id: item.Itm_ID,
    }));

    const map = new Map<number, Vegetable>();
    favorites.forEach(item => {
      if (item.Itm_Id !== undefined) {
        map.set(item.Itm_Id, item);
      }
    });
    normalizedAll.forEach(item => {
      if (item.Itm_Id !== undefined) {
        map.set(item.Itm_Id, item);
      }
    });

    const merged = Array.from(map.values()).map(item => ({ ...item, uid: `orig_${item.Itm_Id}` } as OrderRowData));
    setMergedData(merged);

  }, [favorites, all]);

  useEffect(() => {

    const lowerSearch = searchText?.trim().toLowerCase() || "";
    // We combine original merged data with any items that the user cloned.
    const allAvailableParams = [...mergedData, ...clonedItems];

    if (isOrderMode) {
      const lowerSearch = searchText?.trim().toLowerCase() || "";

      // Get orderItems once, in fixed order using UIDs this time
      const orderItems: OrderRowData[] = [];
      originalOrderItemIds.forEach(uid => {
        const found = allAvailableParams.find(item => item.uid === uid);
        if (found) orderItems.push(found);
      });


      // Get quantity items (added after initial order), fixed once
      const quantityItems: OrderRowData[] = [];
      addedNonFavItemsOrder.forEach(uid => {
        if (!originalOrderItemIds.includes(uid)) {
          const found = allAvailableParams.find(item => item.uid === uid);
          if (found) quantityItems.push(found);
        }
      });

      let finalArr: OrderRowData[] = [];

      if (lowerSearch) {
        // Always do full search on all available
        const searchMatched = allAvailableParams.filter(item =>
          item.Itm_Name?.toLowerCase().includes(lowerSearch)
        );

        const existingUids = new Set<string>([
          ...orderItems.map(i => i.uid),
          ...quantityItems.map(i => i.uid),
        ]);

        const extraMatches = searchMatched.filter(item => !existingUids.has(item.uid));

        finalArr = [...orderItems, ...quantityItems, ...extraMatches];
      } else {
        finalArr = [...orderItems, ...quantityItems];
      }

      const finalSet = new Set(finalArr.map(i => i.uid));
      clonedItems.forEach(clone => {
        if (!finalSet.has(clone.uid)) {
          let index = -1;
          for (let j = finalArr.length - 1; j >= 0; j--) {
            if (finalArr[j].Itm_Id === clone.Itm_Id) {
              index = j;
              break;
            }
          }
          if (index > -1) {
            finalArr.splice(index + 1, 0, clone);
          } else {
            finalArr.push(clone);
          }
        }
      });

      setFilteredData([...new Map(finalArr.map(item => [item.uid, item])).values()]);
      return;
    }


    // normal search-based logic
    const searchMatched = allAvailableParams.filter(item =>
      item?.Itm_Name?.toLowerCase().includes(lowerSearch)
    );

    const quantityItems: OrderRowData[] = addedNonFavItemsOrder
      .map(uid => allAvailableParams.find(item => item.uid === uid))
      .filter((item): item is OrderRowData => item !== undefined);

    const favoriteWithQuantity = favorites.map(f => {
      const mapped = allAvailableParams.find(m => m.uid === `orig_${f.Itm_Id}`);
      return mapped || { ...f, uid: `orig_${f.Itm_Id}` } as OrderRowData;
    }).filter(item => {
      const quantity = parseFloat(quantities[item.uid] || "0");
      return quantity > 0 || item.Itm_Id !== undefined;
    });

    const nonFavoriteSearchMatched = searchMatched.filter(
      item => !favoriteWithQuantity.some(fav => fav.uid === item.uid)
    );

    let finalArr = [];

    if (lowerSearch) {
      finalArr = [
        ...favoriteWithQuantity,
        ...quantityItems.filter(
          item =>
            !favoriteWithQuantity.some(fav => fav.uid === item.uid) &&
            !nonFavoriteSearchMatched.some(match => match.uid === item.uid)
        ),
        ...nonFavoriteSearchMatched,
      ];
      setIsOrderMode(false);
    } else {
      finalArr = [
        ...favoriteWithQuantity,
        ...quantityItems.filter(item => !favoriteWithQuantity.some(i => i.uid === item.uid))
      ];
    }

    // Make sure cloned elements show up immediately after their original element if they aren't explicitly sorted by being in quantities/favorites
    const finalSet = new Set(finalArr.map(i => i.uid));
    clonedItems.forEach(clone => {
      if (!finalSet.has(clone.uid)) {
        let index = -1;
        for (let j = finalArr.length - 1; j >= 0; j--) {
          if (finalArr[j].Itm_Id === clone.Itm_Id) {
            index = j;
            break;
          }
        }
        if (index > -1) {
          finalArr.splice(index + 1, 0, clone);
        } else {
          finalArr.push(clone);
        }
      }
    });

    setFilteredData([...new Map(finalArr.map(item => [item.uid, item])).values()]);

  }, [searchText, mergedData, clonedItems, favorites, quantities, isOrderMode, originalOrderItemIds, addedNonFavItemsOrder]);

  useEffect(() => {
    if (orderData && Array.isArray(orderData.Details)) {

      const initialQuantities: Record<string, string> = {};
      const updatedData: OrderRowData[] = [];
      const initialUnits: Record<string, number> = {};

      const clonedList: OrderRowData[] = [];
      const originalIds: string[] = [];

      const seenItmIds = new Set<number>();

      orderData.Details.forEach((item: any) => {
        if (item.Itm_Id !== undefined) {

          let uid = `orig_${item.Itm_Id}`;
          let isClone = false;
          if (seenItmIds.has(item.Itm_Id)) {
            uid = `clone_${item.Itm_Id}_${Date.now()}_${Math.random()}`;
            isClone = true;
          }
          seenItmIds.add(item.Itm_Id);

          initialQuantities[uid] = item.Qty.toString();

          if (item.Uni_ID !== undefined) {
            initialUnits[uid] = item.Uni_ID;
          }

          const rowItem = {
            Itm_Id: item.Itm_Id,
            Itm_Name: item.Itm_Name,
            Uni_ID: item.Uni_ID,
            Uni_Name: item.Uni_Name,
            Sale_Rate: item.Sale_Rate || 0,
            Photo: item.Photo || null,
            uid
          } as OrderRowData;
          updatedData.push(rowItem);
          originalIds.push(uid);

          if (isClone) {
            clonedList.push(rowItem);
          }
        }
      });

      setClonedItems(clonedList);
      setQuantities(initialQuantities);
      setUnitSelections(initialUnits);
      setIsOrderMode(true);
      setOriginalOrderItemIds(originalIds);

      if (orderData.Bill_Date) {
        const formattedDate = dayjs(orderData.Bill_Date).format("DD-MM-YYYY");
        setBillDate(dayjs(formattedDate, "DD-MM-YYYY"));
      }

      SetBillNo(orderData.Bill_No || null);
      setLrNo(orderData.Order_Count || null);
      setAddress1(orderData.Address1 || "");
      setAddress2(orderData.Address2 || "");
      setDeliveryTime(orderData.DeliveryTime ? dayjs(orderData.DeliveryTime, "hh:mm A") : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);

  useEffect(() => {
    dispatch(fetchFavoriteVegetables(userDetails ? userDetails?.Id : user?.Id));
    dispatch(fetchAllVegetables());
  }, [dispatch, userDetails, user]);

  useEffect(() => {
    if (isOrderMode) {
      dispatch(fetchFavoriteVegetables(userDetails ? userDetails?.orderData?.Ac_Id : user?.Id));
      dispatch(fetchAllVegetables());
    }
  }, [dispatch, userDetails, user, isOrderMode, orderData]);

  const handleManualInput = (uid: string, value: string) => {
    if (value === "" || /^\d*\.?\d{0,3}$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [uid]: value }));

      // Track the order of non-favorite items when quantity is added
      if (
        parseFloat(value) > 0 &&
        !addedNonFavItemsOrder.includes(uid) &&
        !favorites.some(fav => `orig_${fav.Itm_Id}` === uid)
      ) {
        setAddedNonFavItemsOrder((prev) => [...prev, uid]);
      }
    }
  };

  const cloneItemRow = (record: OrderRowData) => {
    if (record.Itm_Id === undefined) return;
    const newUid = `clone_${record.Itm_Id}_${Date.now()}_${Math.random()}`;
    const newClone = { ...record, uid: newUid };
    setClonedItems(prev => [...prev, newClone]);
  }

  const removeCloneRow = (uid: string) => {
    setClonedItems(prev => prev.filter(item => item.uid !== uid));
    setQuantities(prev => {
      const newQ = { ...prev };
      delete newQ[uid];
      return newQ;
    });
  };

  const handleDateChange = async (date: dayjs.Dayjs | null) => {
    if (date) {
      const dateFormatted = date.format("YYYY-MM-DD");
      setBillDate(dayjs(dateFormatted));
      try {
        const formattedDate = date.format("YYYY-MM-DD");
        if (userDetails) {
          const res = await GetLrNo(formattedDate, userDetails.Id);
          setLrNo(res?.data?.Order_Count);
        }
        else {
          const res = await GetLrNo(formattedDate, user?.Id ?? "");
          setLrNo(res?.data?.Order_Count);
        }
      } catch {
        setLrNo(null);
      }
    }
  };

  useEffect(() => {
    if (!orderData) {
      handleDateChange(billDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);

  const handleAddOrder = async () => {
    const allAvailableParams = [...mergedData, ...clonedItems];

    const favoriteOrdered = favorites
      .map(fav => allAvailableParams.find(item => item.uid === `orig_${fav.Itm_Id}`))
      .filter((item): item is OrderRowData => item !== undefined);

    const nonFavOrdered = addedNonFavItemsOrder
      .map(uid => allAvailableParams.find(item => item.uid === uid))
      .filter((item): item is OrderRowData => item !== undefined);

    // Include cloned items of favorites that have quantity
    const favoriteClones = clonedItems.filter(clone =>
      favorites.some(fav => fav.Itm_Id === clone.Itm_Id) && parseFloat(quantities[clone.uid] || "0") > 0
    );

    const orderedItems = [...new Map([...favoriteOrdered, ...nonFavOrdered, ...favoriteClones].map(item => [item.uid, item])).values()];

    const details = orderedItems
      .map(item => {
        const qty = parseFloat(quantities[item.uid] || "0");
        const isOriginalFavorite = item.uid.startsWith("orig_") && favorites.some(fav => fav.Itm_Id === item.Itm_Id);
        if (qty > 0 || isOriginalFavorite) {
          return {
            Itm_Id: item.Itm_Id,
            Inward: qty,
            Uni_ID: unitSelections[item.uid] ?? item.Uni_ID,
            Itm_Name: item.Itm_Name,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const allQuantitiesZero = details.every(item => item.Inward === 0);

    if (details.length === 0 || allQuantitiesZero) {
      message.warning(t('allOrders.addAtlestOne'));
      return;
    }
    const payload = {
      mode: "add",
      Ac_Id: userDetails ? userDetails?.Id : user?.Id,
      details,
      Ac_Code: userDetails ? userDetails?.Ac_Code : user?.Ac_Code,
      Our_Shop_Ac: userDetails ? userDetails?.Our_Shop_Ac : user?.Our_Shop_Ac,
      Mobile_No: userDetails?.Mobile_No || user?.Mobile_No || "",
      Order_Count: lrNo,
      Bill_Date: billDate.format("YYYY-MM-DD"),
      Address1: address1,
      Address2: address2,
      DeliveryTime: deliveryTime?.format("HH:mm A") || "",
    };
    try {
      setAddLoding(true);
      await AddOrder(payload);
      setQuantities({});
      setUnitSelections({});
      setClonedItems([]);
      await handleDateChange(billDate);
      message.success(t('allOrders.orderAdded'));
      navigate("/");
    } catch (error) {
      message.error(t('allOrders.orderAddFailed'));
      console.error("Error while adding order: ", error);
    } finally {
      setAddLoding(false);
    }
  };


  const columns = [
    {
      title: t('allOrders.srNo'),
      key: "serial",
      render: (_: unknown, __: unknown, index: number) => index + 1,
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
      title: t('allOrders.itemName'),
      dataIndex: "Itm_Name",
      key: "Itm_Name",
    },
    {
      title: t('allOrders.groupName'),
      dataIndex: "IGP_NAME",
      key: "IGP_NAME",
    },
    {
      title: t('allOrders.quantity'),
      key: "quantity",
      render: (_: unknown, record: OrderRowData) => (
        <Input
          placeholder="0"
          value={quantities[record.uid] || ""}
          onChange={(e) => record.uid && handleManualInput(record.uid, e.target.value)}
          size="small"
          className="custom-input"
        />
      ),
    },
    {
      title: t('allOrders.unit'),
      key: "unit",
      render: (_: unknown, record: OrderRowData) => {
        const selectedUnitId = unitSelections[record.uid] ?? record.Uni_ID;

        return (
          <Select
            value={selectedUnitId}
            onChange={(value) => record.uid && handleUnitChange(record.uid, value)}
            size="small"
            className="w-[70px]"
          >
            {units.map((unit) => (
              <Select.Option key={unit.Uni_ID} value={unit.Uni_ID}>
                {unit.Uni_Name}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    ...(searchText.trim() === "" ? [
      {
        title: 'Action',
        key: 'action',
        render: (_: unknown, record: OrderRowData) => (
          <Space>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => cloneItemRow(record)}
              title="Add another row for this item"
            />
            {record.uid?.startsWith('clone_') && (
              <Button
                size="small"
                danger
                icon={<MinusOutlined />}
                onClick={() => removeCloneRow(record.uid)}
                title="Remove this row"
              />
            )}
          </Space>
        )
      }
    ] : [])
  ];
  const handleUnitChange = (uid: string, unitId: number) => {
    setUnitSelections((prev) => ({ ...prev, [uid]: unitId }));
  };

  const handleUpdateOrder = async (Id: string) => {
    setSearchText("");

    if (!billNo || !lrNo) {
      message.error(t('allOrders.orderUpdateFailed'));
      return;
    }
    setTimeout(async () => {
      const orderedItems = [...filteredData];

      const details = orderedItems
        .filter(item => {
          const qty = item.uid ? parseFloat(quantities[item.uid] || "0") : 0;
          const isOriginalFavorite = item.uid?.startsWith("orig_") && favorites.some(fav => {
            return Number(fav.Itm_Id) === Number(item.Itm_Id);
          });
          return qty > 0 || isOriginalFavorite;
        })
        .map(item => {
          const selectedUnitId = item.uid ? (unitSelections[item.uid] ?? item.Uni_ID) : item.Uni_ID;
          return {
            Itm_Id: item.Itm_Id,
            Inward: parseFloat(quantities[item.uid] || "0"),
            Uni_ID: selectedUnitId,
            Itm_Name: item.Itm_Name,
          };
        });

      const payload = {
        mode: "edit",
        Ac_Id: orderData ? orderData?.Ac_Id : user?.Id,
        Ac_Code: orderData ? orderData?.Ac_Code : user?.Ac_Code,
        Our_Shop_Ac: orderData ? orderData?.Our_Shop_Ac : user?.Our_Shop_Ac,
        Mobile_No: orderData?.Mobile_No || user?.Mobile_No || "",
        details,
        Id: Id,
        Order_Count: lrNo,
        Bill_Date: billDate.format("YYYY-MM-DD"),
        Address1: address1,
        Address2: address2,
        DeliveryTime: deliveryTime?.format("HH:mm A") || "",
      };

      try {
        setAddLoding(true);
        await UpdateOrder(payload);
        message.success(t('allOrders.orderUpdated'));
        navigate("/");
      } catch {
        message.error(t('allOrders.orderUpdateFailed'));
      } finally {
        setAddLoding(false);
      }
    }, 100);
  };

  const disablePastDates = (current: Dayjs) => {
    if (!freezeTime) return false;

    const now = dayjs();
    const [freezeHour, freezeMinute, freezeSecond] = freezeTime.split(':').map(Number);

    const freezeMoment = now.clone().hour(freezeHour).minute(freezeMinute).second(freezeSecond);

    const logicalToday = now.isBefore(freezeMoment) ? now.subtract(1, 'day') : now;

    return current && current < logicalToday.endOf('day');
  };

  return (
    <div className="p-4">
      {addLoding ? (
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <DatePicker
              locale={getAntdLocale()}
              value={billDate}
              onChange={handleDateChange}
              format="dddd, DD-MM-YYYY"
              size="small"
              disabledDate={disablePastDates}
            />

            <Form.Item label={t('allOrders.orderNo')} colon={false} style={{ marginBottom: 0 }}>
              <Input
                placeholder={(t('allOrders.orderNo'))}
                value={orderData ? billNo || "" : "New"}
                size="small"
                disabled
                style={{ fontWeight: "bold", color: token.colorBgLayout === "White" ? "rgba(0, 0, 0, 0.85)" : "white" }}
              />
            </Form.Item>

            <Form.Item label={t('allOrders.orderCount')} colon={false} style={{ marginBottom: 0 }}>
              <Input
                placeholder={(t('allOrders.orderCount'))}
                value={lrNo || ""}
                size="small"
                disabled
                style={{ fontWeight: "bold", color: token.colorBgLayout === "White" ? "rgba(0, 0, 0, 0.85)" : "white" }}
              />
            </Form.Item>

            <Form.Item label={t('allOrders.deliveryAddress1')} colon={false} style={{ marginBottom: 0 }}>
              <Input
                placeholder={t('allOrders.deliveryAddress1')}
                maxLength={50}
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                size="small"
                style={{ color: token.colorBgLayout === "White" ? "rgba(0, 0, 0, 0.85)" : "white" }}
              />
            </Form.Item>
            <Form.Item label={t('allOrders.deliveryAddress2')} colon={false} style={{ marginBottom: 0 }}>
              <Input
                placeholder={t('allOrders.deliveryAddress2')}
                maxLength={50}
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                size="small"
                style={{ color: token.colorBgLayout === "White" ? "rgba(0, 0, 0, 0.85)" : "white" }}
              />
            </Form.Item>
            <Form.Item label={t('allOrders.deliveryTime')} colon={false} style={{ marginBottom: 0 }}>
              <TimePicker
                value={deliveryTime}
                onChange={(time) => setDeliveryTime(time)}
                format="hh:mm A"
                use12Hours
                size="small"
                style={{ color: token.colorBgLayout === "White" ? "rgba(0, 0, 0, 0.85)" : "white" }}
              />
            </Form.Item>
            {
              user && user.isAdmin &&
              <Form.Item label={"Account Name"} colon={false} style={{ marginBottom: 0 }}>
                <Input
                  placeholder={(t('allOrders.orderCount'))}
                  value={orderData?.Ac_Name || userDetails?.Ac_Name}
                  size="small"
                  disabled
                  style={{ fontWeight: "bold", color: token.colorBgLayout === "White" ? "rgba(0, 0, 0, 0.85)" : "white" }}
                />
              </Form.Item>
            }
          </div>

          <div className="flex flex-wrap gap-3 justify-start mt-4 mb-4">
            <Button type="primary" onClick={orderData ? () => handleUpdateOrder(orderData.Id) : handleAddOrder}>
              {orderData ? t('allOrders.updateOrder') : t('allOrders.updateOrder')}
            </Button>
            {
              <Button type="default" onClick={() => navigate("/")}>
                {t('allOrders.cancel')}
              </Button>
            }
          </div>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input.Search
              placeholder={t('allOrders.searchPlaceholder')}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton
            />

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey={(record) => record.uid}
              loading={loading}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              scroll={{ x: true }}
              bordered
              size="small"
            />
          </Space>
          <div className="flex flex-wrap gap-3 justify-start mt-1 mb-4">
            <Button type="primary" onClick={orderData ? () => handleUpdateOrder(orderData.Id) : handleAddOrder}>
              {orderData ? t('allOrders.updateOrder') : t('allOrders.updateOrder')}
            </Button>
            {
              <Button type="default" onClick={() => navigate("/")}>
                {t('allOrders.cancel')}
              </Button>
            }
          </div>
        </>
      )}
    </div>
  );
};

export default AllOrders;
