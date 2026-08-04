import { Outlet, useNavigate } from "react-router-dom"
import Footer from "./shared/Footer"
import Navbar from "./shared/Navbar"
import { AppDispatch, RootState } from "../redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import { setUser } from "../redux/slice/authSlice";
import { ConfigProvider, Spin, Layout as Layouts, theme, notification } from "antd";
import { GetCurrentUser } from "../services/authAPI";
import socket from "../utils/socket";

const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
        borderRadius: 16,
        fontFamily: "Rubik, sans-serif",
        colorPrimary: '#46cb4c',
        colorPrimaryBg: "#46cb4c",
        colorBgLayout: "White",
    },
};
const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
        borderRadius: 16,
        fontFamily: "Rubik, sans-serif",
        colorBgLayout: "black",
        colorPrimaryBg: "black",
    },
}

const Layout = () => {
    const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean } | null };
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => {
        return (localStorage.getItem("appTheme") as "light" | "dark") || "light";
    });
    const token = Cookies.get("Shreeji_Veg");

    useEffect(() => {
        if (user && user.isAdmin) {
            const handleNotification = (payload: { noti: string }) => {
                notification.open({
                    message: 'New Notification',
                    description: payload.noti,
                    onClick: () => {
                        navigate("/notification");
                    },
                });
            };
            socket.on('Notification', handleNotification);
            return () => {
                socket.off('Notification', handleNotification);
            };
        }
    }, [navigate, user]);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                navigate("/login");
                return;
            }
            try {
                setLoading(true);
                const userInfo = await GetCurrentUser();
                dispatch(setUser(userInfo.data));
            } catch (error) {
                console.error("Invalid token:", error);
                navigate("/login");
            }
        };
        fetchData();
        setLoading(false);
    }, [navigate, dispatch, token]);

    if (loading) {
        return <Spin />
    }

    const toggleTheme = () => {
        const newTheme = currentTheme === "light" ? "dark" : "light";
        setCurrentTheme(newTheme);
        localStorage.setItem("appTheme", newTheme);
    };


    return (
        <>
            <ConfigProvider
                theme={currentTheme === "light" ? lightTheme : darkTheme}
            >
                <Layouts >
                    <div className="min-h-screen flex flex-col pt-[56px]">
                        <Navbar onToggleTheme={toggleTheme} currentTheme={currentTheme} />
                        <div className="flex-grow">
                            <Outlet />
                        </div>
                        <Footer />
                    </div>
                </Layouts>
            </ConfigProvider>
        </>
    )
}

export default Layout
