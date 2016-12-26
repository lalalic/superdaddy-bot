//webdriver + phantomjs
const webdriver=require("selenium-webdriver")
const {until, By}=webdriver


const {alimama_username, alimama_password}=process.env
const timeout=10*1000

function getPhantomDriver(){
    const {Builder,Capabilities}  = webdriver
    const phantomjsExe = require('phantomjs-prebuilt').path
    if (!phantomjsExe) {
      throw new Error('phantomjs binary path not found')
    }

    const phantomjsArgs = [
      '--load-images=false'
      , '--ignore-ssl-errors=true'
      , '--web-security=false'
      , '--ssl-protocol=any'
    ]

    const customPhantom = Capabilities.phantomjs()
        .setAlertBehavior('ignore')
        .set('phantomjs.binary.path', phantomjsExe)
        .set('phantomjs.cli.args', phantomjsArgs)

    const driver = new Builder()
        .withCapabilities(customPhantom)
        .build()
    return driver
}

function getChromeDriver(){
    const {Builder,Capabilities}  = webdriver
    return new Builder()
        .forBrowser("chrome")
        .build()
}

function login(alimama_username,alimama_password, browser){
    const serviceUrl="https://login.taobao.com/member/login.jhtml?style=mini&from=alimama&redirectURL=http%3A%2F%2Flogin.taobao.com%2Fmember%2Ftaobaoke%2Flogin.htm%3Fis_login%3d1&full_redirect=true&disableQuickLogin=true"
    return browser.get(serviceUrl)
	.then(loaded=>console.log(`${serviceUrl} launched`))
        .then(loaded=>Promise.all([
            browser.findElement(By.name('TPL_username')).sendKeys(alimama_username),
            browser.findElement(By.name('TPL_password')).sendKeys(alimama_password),
            browser.findElement(By.id('J_SubmitStatic')).click()
        ]))
	.then(loaded=>console.log(`user account submitted to login`))
        .then(a=>browser.wait(until.urlContains("www.alimama.com"), timeout,"should go to alimama"))
	.then(loaded=>console.log(`alimama.com launched with login successful`))
        .then(a=>browser.findElement(By.css("a[href*='spm=']")).getAttribute("href"))
        .then(href=>require("url").parse(href,true).query.spm)
	.then(spm=>{console.log(`spm received: ${spm}`);return spm})
}

function setConvertOpt(browser, opt={"推广类型":"网站推广","导购名称":"wechat","推广位名称":"个人推荐"}){
    const gcids={"网站推广":1, "导购推广":8,"APP推广":7,"软件推广":7}
    return Promise.all([
        browser.findElement(By.css("form#J_zone_add"))
        ,browser.findElement(By.css(`input[name=gcid][value='8']`))
        //,getDropdownValues(browser,"#J_sites_dropdown li span")
        //,getDropdownValues(browser,"#J_zones_dropdown li span")
    ]).then(([form,siteids,adzoneids])=>{
        console.log("option got")
        return Promise.all([
            browser.findElement(By.css(`input[name=gcid][value='8']`)).click()
            //form.findElement(By.css(`input[name=gcid][value=${gcids[opt["推广类型"]]}]`)).click()
            //,setHiddenValue(browser, `input[name=siteid]`, siteids[opt["导购名称"]])
            ,browser.findElement(By.css(`input[name=selectact][value=sel]`)).click()
            //,setHiddenValue(browser,"input[name=adzoneid]", adzoneids[opt["推广位名称"]])
        ])
    })


}

function setHiddenValue(browser, selector, value){
    return browser.executeScript(function(_selector,_value){
        document.querySelector(_selector).value=_value
    }, selector, value)
}

function getDropdownValues(browser, selector){
    return browser.executeScript(function(_selector){
        var o={};
        document.querySelectorAll(_selector)
            .forEach(function(a){
                o[a.textContent]=a.getAttribute("value")
            })
        return o
    }, selector)
}

function convertUrl(url,spm, opt, browser){
    let serviceUrl=`http://pub.alimama.com/myunion.htm?spm=${spm}#!/promo/self/links`
    return browser.get(serviceUrl)
        .then(a=>browser.wait(until.elementLocated(By.css("textarea")), timeout, "textarea for converting url should be ready"))
    .then(a=>console.log(`－－链接转换界面`))
        .then(loaded=>Promise.all([
            browser.findElement(By.css("textarea")).sendKeys(url),
            browser.findElement(By.css(".promo button")).click()
        ]))
    .then(a=>console.log(`> 提交url`))
        .then(a=>browser.wait(until.elementLocated(By.css("form#J_zone_add")), timeout, "convertor form should be visible"))
    .then(a=>console.log("－－参数设置界面"))
        .then(a=>setConvertOpt(browser,opt))
        .then(a=>browser.findElement(By.css("#vf-dialog button")).click())
    .then(a=>console.log("> 提交转换参数"))
        .then(a=>browser.wait(until.elementLocated(By.css(".getcode-box")),timeout, "获取代码 form should be visible"))
    .then(a=>console.log(`－－获取代码界面`))
        .then(a=>browser.findElement(By.css(".getcode-box textarea")).getAttribute("value"))
}


function convert(url, opt, username=alimama_username, password=alimama_password){
    return getPhantomDriver()
	.then(browser=>{console.log("phantom driver instantiated");return browser})
		.then(browser=>{
            return login(username,password, browser)
                .then(spm=>convertUrl(url,spm,opt, browser))
                .then(converted=>{
                    browser.quit()
                    console.log(`converted url=${converted}`)
                    return converted
                },e=>{
                    console.error(e);
                    browser.quit()
                    throw e
                })
        })
}

exports.convert=convert
