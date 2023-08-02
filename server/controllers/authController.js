const User = require("../models/User")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
} = require("../utils")
const crypto = require("crypto")
const { log } = require("console")

const register = async (req, res) => {
  const { email, name, password } = req.body

  const emailAlreadyExists = await User.findOne({ email })
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists")
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0
  const role = isFirstAccount ? "admin" : "user"

  const verificationToken = crypto.randomBytes(40).toString("hex")

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken,
  })

  const origin = "http://localhost:3000"
  // const productionOrigin = ""

  // const tempOrigin = req.get("origin")
  // console.log(`origin : ${tempOrigin}`)

  // const protocol = req.protocol
  // console.log("protocol : ", protocol)

  // const host = req.get("host")
  // console.log("host : ", host)

  // const forwardedHost = req.get("x-forwarded-host")
  // const forwardedProtocol = req.get("x-forwarded-proto")

  // console.log(`forwarded host : ${forwardedHost}`)
  // console.log(`forwarded protocol : ${forwardedProtocol}`)

  // console.log(req)

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  })

  // send verification token back only while testing in postman
  res.status(StatusCodes.CREATED).json({
    msg: "Success! Please check your email to verify the account.",
  })
}
const verifyEmail = async (req, res) => {
  // console.log(req.body)
  const { verificationToken, email } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    throw new CustomError.UnauthenticatedError("verification failed")
  }

  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError("verification failed")
  }

  user.isVerified = true
  user.verified = Date.now()
  user.verificationToken = ""

  await user.save()

  res.status(StatusCodes.OK).json({ msg: "email verified" })
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password")
  }
  const user = await User.findOne({ email })

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials")
  }
  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials")
  }

  if (!user.isVerified) {
    throw new CustomError.UnauthenticatedError("Please verify your email")
  }

  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({ res, user: tokenUser })

  res.status(StatusCodes.OK).json({ user: tokenUser })
}

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now() + 1000),
  })
  res.status(StatusCodes.OK).json({ msg: "user logged out!" })
}

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
}
