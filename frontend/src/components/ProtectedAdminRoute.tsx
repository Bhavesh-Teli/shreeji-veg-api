import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { RootState } from "../redux/store";
import { Spin } from "antd";

interface ProtectedAdminRouteProps {
    children: ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
    const { user } = useSelector((state: RootState) => state.auth) as { user: { Ac_Name?: string, isAdmin: boolean } | null };

    if (user === null) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin tip="Loading..." size="large" />
            </div>
        );
    }

    if (!user?.isAdmin) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

export default ProtectedAdminRoute;
