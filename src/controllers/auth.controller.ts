import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUser } from "../types/IUser";

export const register = async (payload: IUser) => {
  const { phone, email, password } = payload;
  if (!phone || !email || !password) {
    throw new Error("Phone, email, and password are required");
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });

  if (existingUser) {
    throw new Error("User with this email or phone already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, email, password: hashedPassword, approvalCode: null },
  });

  return user;
};

export const login = async (payload: IUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) throw new Error("Invalid credentials");
  if (!user.approvalCode) throw new Error("Account is not approved by admin");

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "", { expiresIn: "1d" });
  return {
    user: user,
    token: token,
  };
};
