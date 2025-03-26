BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [phone] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_phone_key] UNIQUE NONCLUSTERED ([phone]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Vegetable] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Vegetable_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Vegetable_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserFavorites] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [vegetableId] INT NOT NULL,
    CONSTRAINT [UserFavorites_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserFavorites_userId_vegetableId_key] UNIQUE NONCLUSTERED ([userId],[vegetableId])
);

-- CreateTable
CREATE TABLE [dbo].[Order] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [totalPrice] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Order_status_df] DEFAULT 'pending',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Order_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Order_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrderItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderId] INT NOT NULL,
    [vegetableId] INT NOT NULL,
    [quantity] FLOAT(53) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    CONSTRAINT [OrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Ac_Mas] (
    [ID] INT NOT NULL IDENTITY(1,1),
    [Ac_Code] NVARCHAR(15) NOT NULL,
    [Ac_Name] NVARCHAR(100) NOT NULL,
    [Mobile_NO] NVARCHAR(15) NOT NULL,
    [City_ID] SMALLINT NOT NULL,
    [Group_ID] SMALLINT NOT NULL CONSTRAINT [Ac_Mas_Group_ID_df] DEFAULT 10,
    [Main_Group_ID] SMALLINT NOT NULL CONSTRAINT [Ac_Mas_Main_Group_ID_df] DEFAULT 7,
    [Defa] BIT NOT NULL CONSTRAINT [Ac_Mas_Defa_df] DEFAULT 0,
    [CancelBillAc] BIT NOT NULL CONSTRAINT [Ac_Mas_CancelBillAc_df] DEFAULT 0,
    [State_Name1] NVARCHAR(20) NOT NULL CONSTRAINT [Ac_Mas_State_Name1_df] DEFAULT 'Gujarat',
    [Bank_Pass] NVARCHAR(25),
    [State_Code] NVARCHAR(2) NOT NULL CONSTRAINT [Ac_Mas_State_Code_df] DEFAULT '24',
    [Party_Type] NVARCHAR(5) NOT NULL CONSTRAINT [Ac_Mas_Party_Type_df] DEFAULT 'Local',
    [Active] BIT NOT NULL CONSTRAINT [Ac_Mas_Active_df] DEFAULT 1,
    [Cash_Party] BIT NOT NULL CONSTRAINT [Ac_Mas_Cash_Party_df] DEFAULT 1,
    [Our_Shop_Ac] BIT NOT NULL CONSTRAINT [Ac_Mas_Our_Shop_Ac_df] DEFAULT 0,
    CONSTRAINT [Ac_Mas_pkey] PRIMARY KEY CLUSTERED ([ID])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationHistory] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [notification] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(20) NOT NULL,
    [notiDateTime] DATETIME2 NOT NULL,
    [seen] BIT NOT NULL CONSTRAINT [NotificationHistory_seen_df] DEFAULT 0,
    CONSTRAINT [NotificationHistory_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- AddForeignKey
ALTER TABLE [dbo].[UserFavorites] ADD CONSTRAINT [UserFavorites_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserFavorites] ADD CONSTRAINT [UserFavorites_vegetableId_fkey] FOREIGN KEY ([vegetableId]) REFERENCES [dbo].[Vegetable]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_vegetableId_fkey] FOREIGN KEY ([vegetableId]) REFERENCES [dbo].[Vegetable]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
