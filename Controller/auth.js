const User = require("../Models/user");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../Error/index");

const register = async (req, res) => {
  const user = await User.create({
    ...req.body,
  });
  const token = user.generateJWT();
  res
    .status(StatusCodes.CREATED)
    .json({ user: { username: user.username }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide email and password" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid credentials" });
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Wrong password" });
  }
  const token = user.generateJWT();
  res.status(StatusCodes.OK).json({ user: { username: user.username }, token });
};

module.exports = {
  login,
  register,
};
