import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUser } from "../types/IUser";

export const register = async (payload: IUser) => {
  const { accountName, phone, password } = payload;
  if (!accountName || !phone || !password) {
    throw new Error("Phone, accountName, and password are required");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { accountName }],
    },
  });

  if (existingUser) {
    throw new Error("User with this phone or account name already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { accountName, phone, password: hashedPassword, approvalCode: null },
  });
    const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (payload: IUser) => {
  const { accountName, password } = payload;
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

  const user = await prisma.user.findFirst({
    where: { accountName },
  });
  if (!user) throw new Error("Invalid account name or password");
  if (user.approvalCode === null) throw new Error("Account is not approved by admin");
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) throw new Error("Invalid password");
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token,
  };
};
