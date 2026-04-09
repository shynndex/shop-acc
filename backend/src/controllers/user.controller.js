export const getUserProfile = (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.log("Lỗi khi lấy thông tin người dùng trong getUserProfile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
