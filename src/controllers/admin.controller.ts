import prisma from "../prisma/client";

export const getUnapprovedUsers = async () => {
    const users = await prisma.user.findMany({
        where: { approvalCode: null },
    });
    return users;
};  

export const approveUser = async (payload: any) => {
    const { userId, approvalCode } = payload;
    await prisma.user.update({
        where: { id: Number(userId) },
        data: { approvalCode: approvalCode },
    });
};

export const rejectUser = async (payload: any) => {
    const { userId } = payload;
    await prisma.user.update({
        where: { id: Number(userId) },
        data: { approvalCode: null },
    });
};  