import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'isintumejenny@gmail.com',
        pass: 'Jen.ny18',

    }
})

const sendMail = (email: string, body: string) => {

    let mailOptions = {
        from: 'projectmanagement@gmail.com',
        to: email,
        subject: 'Successfully Signed up',
        html: body,
        cc: "chineduemordinodedev@gmail.com"
    }

    return transporter.sendMail(mailOptions, (err: any, data: any) => {
        if (err) {
            console.log('Error Occus: ', err)
        }
        console.log('Email sent!!:' + data)
    })
}

export default sendMail;