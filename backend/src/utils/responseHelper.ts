const successResponse = (res: any, data: any, message = "Success") => {
    res.status(200).json({ success: true, message, data });
  };
  
  const errorResponse = (res: any, message = "Something went wrong", status = 400) => {
    res.status(status).json({ success: false, message });
  };
  
  export { successResponse, errorResponse };
  