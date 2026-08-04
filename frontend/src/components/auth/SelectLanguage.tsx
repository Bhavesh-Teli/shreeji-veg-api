import { Button, Card, Row, Col, message, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SelectLanguage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const setLang = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("appLanguage", lang);
        message.success(t('languageChange.message'));
        navigate("/");
    };


    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: token.colorBgLayout === "White" ? "#f5f5f5" : "#1d1d1d",
                padding: 16,
                position: "relative",
            }}
        >
            <Card style={{ maxWidth: 900, width: "100%", borderRadius: 12, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" }}>
                <Row gutter={[32, 16]} align="middle" justify="center">
                    <Col xs={24} md={12}>
                        <img
                            src="/01.png"
                            alt="Select Language"
                            style={{
                                width: "100%",
                                maxHeight: 300,
                                objectFit: "contain",
                                borderRadius: 8,
                            }}
                        />
                    </Col>

                    <Col xs={24} md={12}>
                        <h1 style={{ fontSize: "24px", marginBottom: 24, textAlign: "center" }}>Select Your Language</h1>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                alignItems: "center",
                            }}
                        >
                            <Button size="large" type="primary" style={{ width: "100%" }} onClick={() => setLang("en")}>
                                English
                            </Button>
                            <Button size="large" type="primary" style={{ width: "100%" }} onClick={() => setLang("hi")}>
                                हिन्दी
                            </Button>
                            <Button size="large" type="primary" style={{ width: "100%" }} onClick={() => setLang("gu")}>
                                ગુજરાતી
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default SelectLanguage;
