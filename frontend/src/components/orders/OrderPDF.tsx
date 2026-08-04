import dayjs from "dayjs";
import React from "react";

interface OrderPDFProps {
    orderData: any;
}

const OrderPDF: React.FC<OrderPDFProps> = ({ orderData }) => {
    const validItems = orderData?.Details.filter((item: any) => item.Qty > 0) || [];
    // const validItems = "h"

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                margin: 0,
                padding: '10px',
                fontFamily: "Arial, sans-serif",
                fontSize: "10pt",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
            }}

        >
            <div>
                <p style={{ fontSize: "14pt", fontWeight: "bold", marginBottom: "5px" }}>
                    ORDERS <span style={{ float: "right", marginBottom: "5px" }}></span>
                </p>

                <div style={{ border: "1px solid black", padding: "10px", display: "flex", alignItems: "center" }}>
                    <div style={{ marginLeft: "10px", marginRight: "10px" }}>
                        <img src="/01.png" alt="Logo" style={{ width: "200px", height: "130px", objectFit: "contain" }} />
                    </div>

                    <div style={{ textAlign: "center", width: "100%", }}>
                        <h1 style={{ fontSize: "30px", marginLeft: "10px", marginBottom: "0" }}>
                            <strong>SHREEJI VEG. & FRUIT</strong>
                        </h1>
                        <p style={{ fontSize: "11pt", margin: "0", lineHeight: "1.6", wordSpacing: "2px" }}>
                            D-31, Vishal Nagar Society, B/s. Sardar Bridge, Adajan Road, SURAT<br />
                            Phone (O): 9924613277 , Mobile No.: 7211177000
                        </p>
                    </div>
                </div>
                {/* Customer & Invoice Section */}
                <div style={{ display: "flex", width: "100%", justifyContent: "end" }}>
                    <div style={{ border: "1px solid black", padding: "10px", width: "60%" }}>
                        <div style={{ marginBottom: "20px", textAlign: "left" }}>
                            <div style={{ justifyContent: "space-between", marginBottom: "5px" }}>
                                <p style={{ fontSize: '18px', margin: 0 }}>
                                    <strong>{orderData.Ac_Name}</strong>
                                </p>
                                <p style={{ margin: 0 }}>Mob. No: {orderData.Mobile_No}</p>
                                {/* <p style={{ margin: 0 }}>Ph. No: 0261 2894442</p> */}
                            </div>
                            <div>
                            </div>
                        </div>

                    </div>

                    {/* Invoice Details + Delivery Address */}
                    <div style={{ border: "1px solid black", padding: "10px", width: "40%" }}>
                        <div style={{ display: "flex", gap: '40px', marginBottom: "10px", textAlign: "left" }}>
                            <p><strong>Order No:</strong> {orderData && orderData?.Bill_No}</p>
                            <p><strong>Date:</strong> {orderData && dayjs(orderData?.Bill_Date).format('DD-MM-YYYY')} {" "} {orderData.DeliveryTime}</p>
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <p><strong>Delivery Address:</strong>{" "}
                                {orderData.Address1
                                    ? orderData.Address1
                                    : orderData.Address2
                                        ? orderData.Address2
                                        : "N/A"}</p>
                        </div>
                    </div>
                </div>
                <div />
            </div>

            {/* Middle Section: Invoice Table */}
            <div style={{ flexGrow: 1, marginBottom: "20px" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        borderLeft: "1px solid black",
                        borderRight: "1px solid black",
                    }}
                >
                    <thead>
                        <tr style={{ borderTop: "1px solid black", borderBottom: "1px solid black" }}>
                            <th style={verticalLineHeader}>Sr.</th>
                            <th style={verticalLineHeader}>Description of Goods</th>
                            <th style={verticalLineHeader}>Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderData && orderData?.Details.filter((item: any) => item.Qty > 0).map((item: any, index: number) => (
                            <tr key={index}>
                                <td style={verticalLineCell}>{index + 1}</td>
                                <td style={verticalLineCell}>{item.Itm_Name}</td>
                                <td style={verticalLineCell}>{item.Qty}</td>
                            </tr>
                        ))}
                        {/* Add empty rows to fill page */}
                        {Array.from({ length: 22 - validItems.length }).map((_, i, arr) => {
                            const isLastRow = i === arr.length - 1;
                            return (
                                <tr key={`empty-${i}`}>
                                    <td style={{ ...verticalLineCell, borderBottom: isLastRow ? "1px solid black" : "none" }}>&nbsp;</td>
                                    <td style={{ ...verticalLineCell, borderBottom: isLastRow ? "1px solid black" : "none" }}>&nbsp;</td>
                                    <td style={{ ...verticalLineCell, borderBottom: isLastRow ? "1px solid black" : "none" }}>&nbsp;</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

const verticalLineHeader: React.CSSProperties = {
    fontSize: "10pt",
    padding: "6px",
    borderLeft: "1px solid black",
    borderRight: "1px solid black",
};

const verticalLineCell: React.CSSProperties = {
    fontSize: "9pt",
    padding: "6px",
    borderLeft: "1px solid black",
    borderRight: "1px solid black",
    textAlign: "center",
};

export default OrderPDF;

