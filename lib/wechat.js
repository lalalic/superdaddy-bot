const Wechat=require("wechat4u")
const events="login,logout,user-avatar,contacts-updated,message,error".split(",")


function start(){
    let bot=new Wechat()

    bot.on("uuid", uuid=>console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid))

    events.forEach(e=>bot.on(e,()=>console.log(`event ${e} triggered`)))

    bot.start()
}

exports.start=start
