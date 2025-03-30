// import prisma from "../prisma/client";

// export const addFavorite = async (payload: any) => {
//   const { userId, vegetableId } = payload;

//   const existingFavorite = await prisma.userFavorites.findFirst({
//     where: { userId: userId, vegetableId: Number(vegetableId) },
//   });

//   if (existingFavorite) {
//     throw new Error("Vegetable already in favorites");
//   }
//   const favorite = await prisma.userFavorites.create({
//     data: {
//       userId: userId,
//       vegetableId: Number(vegetableId),
//     },
//   });
//   return favorite;
// };

// export const getFavorite = async (payload: any) => {
//   const { userId } = payload;

//   const favorites = await prisma.userFavorites.findMany({
//     where: { userId: Number(userId) },
//     include: { vegetable: true },
//   });
//   return favorites;
// };

// export const removeFavorite = async (payload: any) => {
//   const { userId, vegetableId } = payload;

//   const deleted = await prisma.userFavorites.deleteMany({
//     where: {
//         userId: Number(userId),
//         vegetableId: Number(vegetableId),
//     },
// });
//   return deleted;
// };
