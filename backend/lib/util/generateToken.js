import jwt from "jsonwebtoken";
const generateTokenAndSetCookie = (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
  res.cookie("jwt",token,{
    maxAge :1*24*60*60*1000,
    httpOnly:true,
    sameSite:"strict",
    secure:process.env.ENV === "production",
  })
  return token;
};
export default generateTokenAndSetCookie;