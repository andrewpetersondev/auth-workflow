const sendEmail = require("./sendEmail")

const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  // const verifyEmail = `${"https://auth-workflow-ky8z.onrender.com"}/user/verify-email?token=${verificationToken}&email=${email}`

  const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`

  const message = `<p>
  Please confirm your email by clicking the following link : 
  <a href="${verifyEmail}">Verify Email</a>
  </p>`

  return sendEmail({
    to: email,
    subject: "email confirmation",
    html: `<h4> Hello ${name}</h4>
    ${message} + ${origin}`,
  })
}

module.exports = sendVerificationEmail
