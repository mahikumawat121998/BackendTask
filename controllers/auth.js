const User = require("../modals/Auth.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let refreshTokens = [];
console.log(refreshTokens);
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT, {
    expiresIn: "15m",
  });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH);
};

const register = async (req, res, next) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = new User({
      ...req.body,
      password: hash,
    });
    await newUser.save();
    res.status(200).send({ newUser, message: "User Created Successfully" });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const { viaKey } = req.body;
  const authenticated = viaKey ? true : false;
  if (authenticated) {
    try {
      if (viaKey == "Aspire@123") {
        const accessToken = generateAccessToken(viaKey);
        const refreshToken = generateRefreshToken(viaKey);
        refreshTokens.push(refreshToken);
        res.status(200).json({
          message: "User Successfully Created Using Default Key",
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else {
        res.status(200).json({
          message: "Please confirm your key",
        });
      }
    } catch (err) {
      next(err);
    }
  } else {
    try {
      const user = await User.findOne({ username: req.body.username });
      if (!user) return console.log("Err has occured in login");

      const isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!isPasswordCorrect)
        return res.send({
          status: 400,
          message: "Password is not correct..!!",
        });
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      refreshTokens.push(refreshToken);

      const { password, ...otherDetails } = user._doc;
      res.status(200).json({
        details: { ...otherDetails },
        message: "Logged in Successfully",
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }
};

const refreshToken = async (req, res) => {
  const refreshToken = req.body.token;
  console.log("refreshToken1", refreshToken);
  if (!refreshToken) return res.status(401).json("You are not authenticated!");
  console.log("refreshTokens2", refreshTokens);
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid!");
  }
  jwt.verify(refreshToken, process.env.JWT_REFRESH, (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  //if everything is ok, create new access token, refresh token and send to user
};

module.exports = { register, login, refreshToken };
