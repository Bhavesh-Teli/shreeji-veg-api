import { Button, Card, Checkbox, Form, Input, message, Row, Col } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginApi } from "../../services/authAPI";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import { setUser } from "../../redux/slice/authSlice";
import { ILogin } from "../../types/ILogin";
import { useTranslation } from "react-i18next";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const lang = localStorage.getItem("appLanguage");
    if (!lang) {
      navigate("/select-language1");
      return;
    }
    i18n.changeLanguage(lang);
  }, [i18n, navigate]);

  interface APIError {
    response?: {
      data?: {
        message?: string;
      };
    };
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("rememberedUser");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      form.setFieldsValue({
        Mobile_No: parsed.Mobile_No,
        Book_Pass: parsed.Book_Pass,
        remember: true,
      });
    }
  }, [form]);

  const handleSubmit = async (values: ILogin) => {

    setLoading(true);
    try {
      const response = await LoginApi(values);
      message.success(t("login.loginSuccess"));
      Cookies.set("Shreeji_Veg", response.data.token, { expires: 15 });
      dispatch(setUser(response.data.user));

      if (values.remember) {
        localStorage.setItem("rememberedUser", JSON.stringify({
          Mobile_No: values.Mobile_No,
          Book_Pass: values.Book_Pass,
        }));
      } else {
        localStorage.removeItem("rememberedUser");
      }


      if (response.data.user.isAdmin === true) {
        navigate("/user/List");
      } else {
        navigate("/");
      }
    } catch (error) {
      const apiError = error as APIError;
      if (apiError.response?.data?.message) {
        message.error(apiError.response.data.message);
      } else {
        message.error(t("login.unexpectedError"));
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 16,
        position: "relative",
      }}
    >
      <Card style={{ maxWidth: 900, width: "100%" }}>
        <Row gutter={[32, 16]} align="middle" justify="center">
          <Col xs={24} md={12}>
            <img
              src="/01.png"
              alt="Login Visual"
              style={{
                width: "100%",
                maxHeight: 300,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </Col>

          <Col xs={24} md={12}>
            <Form
              form={form}
              name="loginForm"
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              initialValues={{ remember: true }}
            >
              <Form.Item
                label={t("login.UserPhoneNo")}
                name="Mobile_No"
                rules={[
                  { required: true, message: t("login.enterPhoneNo") },
                  {
                    pattern: /^\d{10}$/,
                    message: t('login.mobileNumberMessage'),
                  },
                ]}
              >
                <Input
                  addonBefore="+91"
                  placeholder={t("login.PhoneNoPlaceholder")}
                  size="large"
                  maxLength={10}
                  onKeyPress={(e) => {
                    if (!/^\d$/.test(e.key)) e.preventDefault(); // Allow only digits
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
              </Form.Item>

              <Form.Item
                label={t("login.password")}
                name="Book_Pass"
                rules={[{ required: true, message: t("login.enterPassword") }]}
              >
                <Input.Password
                  addonBefore={<LockOutlined />}
                  placeholder={t("login.passwordPlaceholder")}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>{t("login.rememberMe")}</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col>
                    <Button
                      type="link"
                      onClick={() => navigate("/forgot-password")}
                      style={{ padding: 0, margin: 0 }}
                    >
                      {t("login.ForgotPassword")}
                    </Button>
                  </Col>
                </Row>
              </Form.Item>


              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: "100%" }}
                  size="large"
                  loading={loading}
                >
                  {t("login.login")}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span>{t("login.noAccount")} </span>
              <span
                style={{
                  color: "#1890ff",
                  cursor: "pointer",
                  fontWeight: "bold",
                  textDecoration: "underline",
                }}
                onClick={() => navigate("/register")}
              >
                {t("login.registerNow")}
              </span>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Login;
