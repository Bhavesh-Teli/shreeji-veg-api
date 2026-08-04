import { Button, Card, Form, Input, message } from "antd";
import { LockOutlined, NumberOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ForgetPassword, ResetPassword } from "../../services/authAPI";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [step, setStep] = useState<"mobile" | "otp">("mobile");
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        try {
            const { Mobile_No } = await form.validateFields(["Mobile_No"]);
            setLoading(true);
            await ForgetPassword({ Mobile_No });
            message.success(t('forgotPassword.otpSentSuccess'));
            setStep("otp");
        } catch {
            message.error(t('forgotPassword.FailedtosendOTP'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            const { Mobile_No, otp, newPassword } = await form.validateFields();
            setLoading(true);
            await ResetPassword({ Mobile_No, otp, newPassword });
            message.success(t('forgotPassword.Passwordupdatedsuccessfully'));
            navigate("/login");
        } catch {
            message.error(t('forgotPassword.Failedtoresetpassword'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
            <Card title={t('forgotPassword.ForgotPassword')} style={{ width: 400 }}>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label={t('forgotPassword.MobileNumber')}
                        name="Mobile_No"
                        rules={[
                            { required: true, message: t('forgotPassword.Pleaseenteryourmobilenumber') },
                            {
                                pattern: /^[6-9]\d{9}$/,
                                message: t('forgotPassword.Pleaseenteravalid10-digitmobilenumber'),
                            },
                        ]}
                    >
                        <Input
                            addonBefore="+91"
                            maxLength={10}
                            placeholder={t('forgotPassword.Entermobilenumber')}
                            onKeyPress={(e) => {
                                if (!/^\d$/.test(e.key)) e.preventDefault(); // block non-numeric input
                            }}
                        />
                    </Form.Item>


                    {step === "otp" && (
                        <>
                            <Form.Item
                                label={t('forgotPassword.OTP')}
                                name="otp"
                                rules={[
                                    { required: true, message: t('forgotPassword.PleaseentertheOTP') },
                                    {
                                        pattern: /^\d{6}$/,
                                        message: t('forgotPassword.OTPmustbeexactly6digits'),
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<NumberOutlined />}
                                    placeholder={t('forgotPassword.EnterOTP')}
                                    maxLength={6}
                                    onKeyPress={(e) => {
                                        if (!/^\d$/.test(e.key)) e.preventDefault(); // allow digits only
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={t('forgotPassword.NewPassword')}
                                name="newPassword"
                                rules={[
                                    { required: true, message: t('forgotPassword.Pleaseenternewpassword') },
                                    {
                                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{5,20}$/,
                                        message: t('forgotPassword.passwordmustbe'),
                                    }
                                ]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder={t('forgotPassword.Newpassword')} />
                            </Form.Item>

                            <Form.Item
                                label={t('forgotPassword.ConfirmPassword')}
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: t('forgotPassword.Pleaseconfirmyourpassword') },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error(t('forgotPassword.Passwordsdonotmatch!')));
                                        },
                                    }),
                                ]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder={t('forgotPassword.ConfirmPassword')} />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item>
                        {step === "mobile" ? (
                            <Button type="primary" block loading={loading} onClick={handleSendOtp}>
                                {t('forgotPassword.SendOTP')}
                            </Button>
                        ) : (
                            <Button type="primary" block loading={loading} onClick={handleResetPassword}>
                                {t('forgotPassword.ResetPassword')}
                            </Button>
                        )}
                    </Form.Item>

                    <Form.Item>
                        <Button type="link" block onClick={() => navigate("/login")}>
                            {t('forgotPassword.BacktoLogin')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ForgotPassword;
