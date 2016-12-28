//webdriver + phantomjs
const webdriver=require("selenium-webdriver")
const {until, By, logging}=webdriver


const {alimama_username, alimama_password}=process.env
let timeout=10*1000

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
	  , '--disk-cache=true'
	  , `--disk-cache-path=./cache`
	  , '--debug=true'
	  , '--webdriver-logfile=./cache/phantom.log'
	  , '--webdriver-loglevel=DEBUG'
	 // , '--remote-debugger-port=9082'
	 // , '--remote-debugger-autorun=yes'
    ]

    const customPhantom = Capabilities.phantomjs()
        .setAlertBehavior('ignore')
        .set('phantomjs.binary.path', phantomjsExe)
        .set('phantomjs.cli.args', phantomjsArgs)
        .set('phantomjs.page.settings.userAgent',"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36")

    const driver = new Builder()
        .withCapabilities(customPhantom)
        .build()

	driver.manage().timeouts().pageLoadTimeout(timeout)
    driver.manage().window().maximize();

    return driver.then(browser=>{
		const _get=browser.get.bind(browser)
		browser.get=function(url, condition){
            let start=Date.now()
			return _get(url).then(null,e=>{
                if(condition)
				    return browser.wait(condition,3*timeout)
                else {
                    throw e
                }
			})
            .then(loaded=>console.log(`--${start-Date.now()} > ${url}`))
            .then(loaded=>browser.sleep(100))
		}
		return browser
	})
}

function getChromeDriver(){
    const {Builder,Capabilities}  = webdriver
    return new Builder()
        .forBrowser("chrome")
        .build()
}
function ignoreClickTimeout(e){
	if(e.name=="TimeoutError")
		return
	else
		throw e
}
function login(alimama_username,alimama_password, browser){
    const serviceUrl="https://login.taobao.com/member/login.jhtml?style=mini&from=alimama&redirectURL=http%3A%2F%2Flogin.taobao.com%2Fmember%2Ftaobaoke%2Flogin.htm%3Fis_login%3d1&full_redirect=true&disableQuickLogin=true"
    return browser.get(serviceUrl,until.elementLocated(By.name('TPL_username')))
	.then(loaded=>console.log(`login url launched`))
        .then(a=>browser.findElement(By.name('TPL_username')).sendKeys(alimama_username))
        .then(a=>browser.findElement(By.name('TPL_password')).sendKeys(alimama_password))
        .then(a=>browser.findElement(By.id('J_SubmitStatic')).click()).catch(ignoreClickTimeout)//ignore sometimes timeout 
	.then(loaded=>console.log(`user account submitted to login`))
		.then(a=>browser.wait(until.urlContains("www.alimama.com"), 3*timeout,"should go to alimama"))
        .then(a=>browser.wait(until.elementLocated(By.css("a[href*='spm=']")), 2*timeout,"alimama with spm"))
	.then(loaded=>console.log(`alimama.com launched with login successful`))
        .then(a=>browser.findElement(By.css("a[href*='spm=']")).getAttribute("href"))
        .then(href=>require("url").parse(href,true).query.spm)
	.then(spm=>{console.log(`spm received: ${spm}`);return spm})
}

function setConvertOpt(browser, opt={"推广类型":"网站推广","导购名称":"wechat","推广位名称":"个人推荐"}){
    const gcids={"网站推广":0, "导购推广":8,"APP推广":7,"软件推广":7}
    return browser.findElement(By.css(`input[name='gcid'][value='${gcids[opt["推广类型"]]}']`)).click().catch(ignoreClickTimeout)

        .then(a=>getDropdownValues(browser,"#J_sites_dropdown li span"))
        .then(siteids=>setHiddenValue(browser, "input[name='siteid']", siteids[opt["导购名称"]]))

        .then(a=>browser.findElement(By.css(`input[name='selectact'][value='sel']`)).click()).catch(ignoreClickTimeout)

        .then(a=>getDropdownValues(browser,"#J_zones_dropdown li span"))
        .then(adzoneids=>setHiddenValue(browser,"input[name='adzoneid']", adzoneids[opt["推广位名称"]]))
        .then(a=>console.log("option set done"))
}

function setHiddenValue(browser, selector, value){
    return browser.executeScript(function(_selector,_value){
        var node=document.querySelector(_selector)
        if(node)
            node.value=_value
        else {
            throw new Error("can't find "+_selector)
        }
    }, selector, value)
}

function getDropdownValues(browser, selector){
    return browser.wait(until.elementLocated(By.css(selector)),timeout).then(a=>{
        return browser.executeScript(function(_selector){
            var o={};
            var nodes=document.querySelectorAll(_selector)
            for(var i=0,len=nodes.length,a;i<len;i++){
                a=nodes[i]
                o[a.textContent]=a.getAttribute("value")
            }
            return o
        }, selector)
    })
}

function convertUrl(url,spm, opt, browser){
    let serviceUrl=`http://pub.alimama.com/myunion.htm?spm=${spm}#!/promo/self/links`
    return browser.get(serviceUrl,until.elementLocated(By.css("textarea#J_originUrl")))
		.then(loaded=>browser.sleep(500))
    .then(a=>console.log(`－－链接转换界面`))
        .then(loaded=>browser.findElement(By.css("textarea#J_originUrl")).sendKeys(url))
        .then(loaded=>browser.findElement(By.css(".promo button")).click()).catch(ignoreClickTimeout)//ignore sometimes timeout 
    .then(a=>console.log(`> 提交url`))
        .then(a=>browser.wait(until.elementLocated(By.css("input[name='selectact'][value='sel']")), timeout, "convertor form should be visible"))
    .then(a=>console.log("－－参数设置界面"))
        .then(a=>setConvertOpt(browser,opt))
        .then(a=>browser.findElement(By.css("#vf-dialog button")).click()).catch(ignoreClickTimeout)//ignore sometimes timeout 
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
                    return Promise.all([browser.takeScreenshot(),browser.getPageSource(), browser.getCurrentUrl()])
                        .then(([base64,html,url])=>{
                            browser.quit()
                            let id=Date.now()
                            require("fs").writeFileSync(`./error/${id}.html`,`<!--${url}-->\r\n`+html)
                            require("fs").writeFileSync(`./error/${id}.jpg`,new Buffer(base64,"base64"))
                            throw e
                        },a=>{
                            throw e
                        })
                })
        })
}

exports.convert=convert
exports.getBrowser=getPhantomDriver
exports.setTimeout=function(a){
    timeout=a
}

//const itemUrl="https://world.taobao.com/item/542225473068.htm?fromSite=main&ali_refid=a3_430620_1006:1124293071:N:%E7%94%B7t%E6%81%A4:8c63de4fa5b7a86d0481b1d169481650&ali_trackid=1_8c63de4fa5b7a86d0481b1d169481650&spm=a312a.7700714.0.0.JhWX1T"
//convert(itemUrl,{"推广类型":"导购推广","导购名称":"wechat","推广位名称":"个人推荐"})
