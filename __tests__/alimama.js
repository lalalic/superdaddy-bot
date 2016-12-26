const {convert}=require("../lib/alimama")

const itemUrl="https://world.taobao.com/item/542225473068.htm?fromSite=main&ali_refid=a3_430620_1006:1124293071:N:%E7%94%B7t%E6%81%A4:8c63de4fa5b7a86d0481b1d169481650&ali_trackid=1_8c63de4fa5b7a86d0481b1d169481650&spm=a312a.7700714.0.0.JhWX1T"
describe("alimama service", function(){
	it(`can convert ${itemUrl}`, function(){
		return convert(itemUrl)
			.then(converted=>expect(converted).toEqual("https://s.click.taobao.com/t?e=m%3D2%26s%3D40wt4W4bUgIcQipKwQzePOeEDrYVVa64Qih%2F7PxfOKS5VBFTL4hn2RjNzjCClKKaHGUKWrwhgPnVTWkqIto4v3oWoz7Mm2I4xgB7KBWgH2FXCw9E8H0f51yL4MavYz5of79lZflCzgRQBTAHr9VzocYMXU3NNCg%2F"))
	}, 90*1000)
})