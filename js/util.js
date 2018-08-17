/*项目独立全局js*/
mui.ready(function() {
	//openwindow打开窗口
	mui('body').on('tap', '[data-openwindow]', function() {
		if(!this.hasAttribute('data-openwindow-disabled')){
			openWindow(JSON.parse(this.getAttribute('data-openwindow')));
		}
	});
});

mui.plusReady(function() {
	loadScript('http://at.alicdn.com/t/font_585155_pknpf34nph55ewmi.js')
});
//打开新页面
function openWindow(customize){
	var _option = {
		show:{
			duration: mui.os.ios ? 200 : 400,
		},
		waiting:{
			autoShow:false
		}
	};
	//判断是否使用原生导航栏
	if(customize.styles && customize.styles.titleNView){
		_option.styles = {
			titleNView: { //详情页原生导航配置
				backgroundColor: '#336699', //导航栏背景色
				autoBackButton: true, //自动绘制返回箭头
				//titleText: '', //导航栏标题
				titleColor: '#fff', //文字颜色
				//type: 'transparent', //透明渐变样式
			}
		};
	}else{
		_option.styles = {
			statusbar:{background:'#336699'}
		};
	}
	_option = mui.extend(true,_option,customize);
	mui.openWindow(_option);
	//去除焦点
	mui('input,textarea').each(function() {
		this.blur();
	});
}
//ajax请求封装
function ajax(param) {
	param = mui.extend({
		path:'',
		data:{},
		type:'post',
		successFn:new Function(),
		errorFn:function(text,type,err){
			plus.nativeUI.closeWaiting();
			console.log('请求路径：'+_url+'   错误参数：'+JSON.stringify(param.data)+'  错误信息：'+text.responseText);
			try{
				var responseText = JSON.parse(text.responseText);
				if(responseText.StatusCode == '500'){
					mui.alert(responseText.Content);
				}else if (type === "timeout") {
					mui.toast("网络连接超时，请重新进入");
				}else if(type === "abort") {
					mui.toast("终止连接");
				}else{
					mui.toast("网络连接不可用，请调整重试");
				}
			}catch(e){
				mui.alert("服务器响应失败!");
			}
		},
		showWaiting:true,
		closeWaiting:true
	},param);
	
	param.showWaiting && plus.nativeUI.showWaiting();
	var _url = plus.storage.getItem('serverURL') + param.path;
	mui.ajax(_url, {
		data: JSON.stringify(param.data),
		headers:{
			"content-type":"application/json",
			"token":JSON.stringify(plus.storage.getItem('loginData'))
		},
		dataType: 'json',
		type: param.type,
		timeout: 20000,
		success: function(e) {
			if (e.StatusCode == 1){
				param.closeWaiting && plus.nativeUI.closeWaiting();
				try{
					e.Content = JSON.parse(e.Content);
				}catch(e){}
				typeof param.successFn === "function" && param.successFn(e.Content);
			}else{
				console.log('请求路径：'+_url+'   错误参数：'+JSON.stringify(param.data));
				plus.nativeUI.closeWaiting();
				if(e.StatusCode == 0){
					mui.alert('请求失败');
				}else{
					var tipsText = {'-1':'组织已禁用','-2':'组织不存在','-3':'帐号禁用'};
					if(!localStorage.showConfirm){
						localStorage.showConfirm = true;
						mui.confirm(tipsText[e.StatusCode],'',['重新登录'],logout);
					}
				}
			}
		},
		error: param.errorFn
	});
}
//退出登录
function logout(){
	localStorage.clear();
	openWindow({
		url:'_www/pages/account/login.html',
		id:'login',
		styles:{titleNView:{titleText:"登录",autoBackButton:false}},
		show:{aniShow:"slide-in-left"}
	});
}
//对Date的扩展，将 Date 转化为指定格式的String
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds(), //毫秒
        "w": '日一二三四五六'[this.getDay()] //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
//时间字符串处理
function timeStr(str,fmt){
	var result = '';
	if(str){
		result = str.split('.')[0].replace(/T|Z/g,' ');
		if(fmt){
			var dateObj = new Date(result.replace(/-/g,'/'));
			result =  dateObj.format(fmt);
		}
	}
	return result;
}
//
/*空字段显示无
 * @inputText 待处理文本
 * @outputText 显示文本
 */
function handleEmptyStr(inputText,outputText){
	return inputText || inputText === 0 ? inputText : outputText || '';
}
//加载js脚本
function loadScript(file) {
	if (file instanceof Array) {
		for(var i=0,len=file.length;i<len;i++){
			loadFn(file[i]);
		}
	} else if(typeof file == 'string'){
		loadFn(file);
	}

	function loadFn(src) {
		var scriptObj = document.createElement("script");
		scriptObj.src = src;
		scriptObj.type = "text/javascript";
		document.head.appendChild(scriptObj);
	}
}
//返回查询语句
function getQuery(type,customize){
	var query = {};
	if(typeof type == 'string' && customize instanceof Object){
		switch (type){
			case 'view':
				query = mui.extend(true,{queryid:'',page:1,pagesize:10,filter:{filteroperator:0,conditions:[]}},customize);
				break;
			case 'entity':
				query = mui.extend(true,{
					columnset: {},
					criteria: {conditions: []},
					entityname: '',
					filter:[],
					orders: [{attributename: "createdon",ordertype: "1"}],
					pageinfo: {pagenumber: 1,pagesize: 10}
				},customize);
				if(!query.columnset.columns) query.columnset.allcolumns = true;
				break;
			default:
				break;
		}
	}
	return query;
}
/*没有数据
 * @wrapper 容器选择器
 * @context 显示的文本
 */
function showNodata(wrapper,context){
	context = context || '什么都没有！';
	document.querySelector(wrapper).innerHTML = '<div class="nodata"><svg class="iconsvg"><use xlink:href="#icon-nodata"></use></svg>' + context + '</div>';
}
/*切换菜单项
 * @wrapper 容器选择器
 * @item 选项选择器
 * @callback 回调函数
 */
function switchMenu(wrapper,item,callback){
	mui(wrapper + ' ' + item).each(function(i,n){
		this.dataset.index = i;
	});
	mui(wrapper).on('tap',item, function() {
		document.querySelector(wrapper + ' .active') && document.querySelector(wrapper + ' .active').classList.remove('active');
		this.classList.add('active');
		typeof callback === "function" && callback.call(this,Number(this.dataset.index));
	});
}
/*筛选菜单的显示与隐藏
 * @options 参数对象：wrapper--控制器容器；item--控制选项
 */
function DropMenu(options) {
	//安全作用域
	if(this instanceof DropMenu){
		options = mui.extend({wrapper:'.mui-filter',item:'a'},options);
	}else{
		return new DropMenu(options);
	}
	
	//切换显示隐藏菜单
	var _this = this;
	mui(options.wrapper).on('tap',options.item,function(){
		_this.toggleMenu(this.dataset.index);
	});
	//隐藏菜单
	this.container.addEventListener('tap',this.hideMenu.bind(this));
	this.container.querySelector('.filter-form') && this.container.querySelector('.filter-form').addEventListener('tap',function(e){
		e.target.classList.contains('mui-btn') || e.stopPropagation();
	});
}
DropMenu.prototype = {
	constructor:DropMenu,
	busying:false,
	showMenuIndex:'',
	container:document.querySelector("#downMenuContainer"),
	showMenu:function () {
		this.container.style.display = 'block';
		this.container.querySelector(".menu-group").className = 'menu-group fade-in-down animated';
	},
	hideMenu:function () {
		this.container.querySelector(".menu-group").className = 'menu-group fade-out-up animated';
		var _this = this;
		setTimeout(function () {
			_this.container.querySelectorAll('.menu-item')[_this.showMenuIndex].style.display = 'none';
			_this.container.style.display = 'none';
			_this.showMenuIndex = '';
		}, 100);
	},
	toggleMenu:function (index) {
		if (this.busying) return;
		this.busying = true;
		var _this = this;
		setTimeout(function () {
			_this.busying = false;
		}, 500);

		if (!index || index == this.showMenuIndex) {
			this.hideMenu();
		} else {
			var itemArr = this.container.querySelectorAll('.menu-item');
			if (!this.showMenuIndex) {
				this.showMenuIndex = index;
				itemArr[this.showMenuIndex].style.display = 'block';
				this.showMenu();
			} else {
				itemArr[this.showMenuIndex].style.display = 'none';
				itemArr[index].style.display = 'block';
				this.showMenuIndex = index;
			}
		}
	}
}