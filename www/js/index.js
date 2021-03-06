document.addEventListener("deviceready", startApp, false);
$(document).ready(function(){
});
var fileTransfer;
var db;
var sql='';
var res;
var inId = -1;
var dataset=[];
var ex_sql_callback;
var ex_sqlx_callback;
var old_ad_version = -1;
var new_ad_version = -1;
var ads_url = [];
var ads_url_index = -1;
var play_list = [];
var play_list_index = 0;
var scH = 0;
var scW = 0;
var factor = 0;
var checkPeriod = 3000;
var my_media;
var continPlaying = false;
var alarmOn = false;
function consolelog(inp)
{
	alert(inp);
}
function startApp()
{
	db = window.openDatabase("toclient", "1.0", "ToClient DB", 1000000);
	db.transaction(createTable, errorCB, successCB);
	fileTransfer = new FileTransfer();
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
	$(document).ajaxError(function( event, jqxhr, settings, thrownError ) {
		alert('خطا در ارتباط با شبکه'+"\n"+jqxhr.responseText+"\n"+settings.url);
	});
	screen.lockOrientation('landscape');
	AndroidFullScreen.immersiveMode(function(ook){
	},function(error){
		alert(error);
	});
}
function playAudio()
{
    if(!alarmOn)
    {
        my_media = new Media("file:///sdcard/artan/1.mp3", function(){
            }, function(er){
            });
        my_media.play();
        alarmOn = true;
    }
}
//-----------------------------------------File Manage--------------------------------------
var fn_exists;
function playVid()
{
	$("#v1").get(0).play();
}
function startPlaying()
{
/*
	for(var i = 0; i < play_list.length;i++)
	{
		$("#v1").append('<source src="file:///sdcard/artan/'+play_list[i]+'" type="video/mp4">');
	}
	alert($("#v1").html());
*/
	if(play_list_index == play_list.length)
		play_list_index = 0;
	//alert('play_list.length = '+play_list.length+' , play_list_index = '+play_list_index+"\n"+'<source src="file:///sdcard/artan/'+play_list[play_list_index]+'" type="video/mp4">');
	//$("#v1").prop('src',"file:///sdcard/artan/"+play_list[play_list_index]);
    if(continPlaying)
    {
        $("#v1").html('<source src="file:///sdcard/artan/'+play_list[play_list_index]+'" type="video/mp4">');
        $("#v1").get(0).play();
     	alert("play_list_index:"+play_list_index+' , '+play_list.length);
        play_list_index++;
    }
}
function file_exists(file_name,fn)
{
        fn_exists = fn
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
                fs.root.getFile(mainDirectory+'/'+file_name, null, function(fileEntery){
                        fileEntery.file(function(fileObj){
                                fn_exists(true);
                        },fail3);
                }, fail2);
        }, fail1);
}
function gotFS(fileSystem) {
        fileSystem.root.getDirectory(mainDirectory, {create: true}, gotDir);
}

function fail(err)
{
        //alert("0:"+err.code);
}
function fail1(err)
{
        //alert("1:"+err.code);
}
function fail2(err)
{
        //alert("2:"+err.code);
        fn_exists(false);
}
function fail3(err)
{
        //alert("3:"+err.code);
}

function gotDir(dirEntry) {
        var directoryReader = dirEntry.createReader();
        directoryReader.readEntries(
        function(entries){
                var i;
                for (i=0; i<entries.length; i++) {
                        play_list.push(entries[i].name);
                }
        },
        function(error){
		alert(error);
        });
}
//------------------------------------------DB----------------------------------------------
function createTable(tx)
{
	for(var i = 0;i < intialQuery.length;i++)
		tx.executeSql(intialQuery[i]);
}
function populateDBIn(tx) {
	if(sql!='')
	{
		tx.executeSql(sql);
		if(typeof ex_sqlx_callback=='function')
	                ex_sqlx_callback();
	}
}
function populateDBInOut(tx) {
        if(sql!='')
	{
                tx.executeSql(sql,[], querySuccess, errorCB);
	}
}
function querySuccess(tx, results) {
	dataset = [];
	inId = -1;
	res = results;
	rowss = res.rows;
	for(var i = 0;i < rowss.length; i++)
	{
		var row = rowss.item(i);
		dataset.push(row);
	}
	try{
                if(res.rowsAffected>0)
                        inId = res['insertId'];
        }catch(e){
        }
	if(typeof ex_sql_callback=='function')
		ex_sql_callback(dataset,inId);
}
function ex_sqlx(sqlIn,fn)
{
	sql = sqlIn;
	ex_sqlx_callback = fn;
	db.transaction(populateDBIn, errorCB, successCB);
}
function ex_sql(sqlIn,fn)
{
	sql = sqlIn;
	ex_sql_callback = fn;
	db.transaction(populateDBInOut, errorCB, successCB);
}
function errorCB(err) {
    alert("Error processing SQL: "+err.message);
    return false;
}
function successCB() {
}
function addConf(key,value)
{
	ex_sql('select id from conf where kelid=\''+key+'\'',function(d,a){
		if(d.length > 0)
			ex_sql('update conf set meghdar = \''+value+'\' where kelid=\''+key+'\'');
		else
			ex_sql('insert into conf (kelid,meghdar) values (\''+key+'\',\''+value+'\')');
	});
}
function getConf(key,fn)
{
	ex_sql('select meghdar from conf where kelid=\''+key+'\'',function(d,a){
		var out = '';
                if(d.length > 0)
			out = d[0].meghdar;
		if(typeof fn == 'function')
			fn(out);
	});
}
function readConf()
{
	var key = $.trim($("#key").val());
	getConf(key,function(value){
		$("#value").val(value);
		alert(value);
	});
}
function addingConf()
{
	var key = $.trim($("#key").val());
	var value = $.trim($("#value").val());
	addConf(key,value);
}
//------------------------------------------------------------------------------------------
function getAddVersion()
{
	ads_url = [];
	getConf('ver',function(old_ver){
		if(old_ver=='')
			old_ver = -1;
		$.get(server_url+'main/index.php',{'version':'what'},function(ver){
			old_ad_version = old_ver;
			new_ad_version = ver;
			if(ver > old_ver)
				getAdURLs();
		});
	});
}
function getAdURLs()
{
	$.getJSON(server_url+'main/index.php',{'get_version':new_ad_version},function(ads){
		ads_url = ads;
		ads_url_index = 0;
		startDownload();
	});
}
function startDownload()
{
	if(ads_url_index > -1 && ads_url_index < ads_url.length)
	{
		download(server_url+ads_url[ads_url_index].addr,function(){
			ads_url_index++;
			if(ads_url_index < ads_url.length)
				startDownload();
			else
			{
				ads_url_index = -1;
				addConf('ver',new_ad_version);
				new_ad_version = old_ad_version;
			}
		});
	}
}
function getFactor()
{
    continPlaying = true;
	startPlaying();
	factor = parseInt($.trim($("#factor").val()),10);
	if(!isNaN(factor) && factor>0)
	{
		$.get(server_url+'main/index.php',{'factor':factor},function(res){
			if(res == 1)
			{
				$(".info").hide();
				$("span.info").html(factor).show();
				getState();
			}
			else
				alert('خطا در ثبت نوبت');
		});
	}
	else
		alert('لطفا شماره فاکتور را به صحت وارد کنید');
}
function getState()
{
	if(factor != 0)
	{
		$.get(server_url+'main/index.php',{'state':factor},function(res){
			if(res == 1)
				delivered();
			else if(res == 2)
				startOver();
			if(res != 2)
			{
				setTimeout(function(){
					getState();
				},checkPeriod);
			}
		});
	}
}
function delivered()
{
    continPlaying = false;
    alarmOn = false;
	alert('Delivered');
    playAudio();
}
function startOver()
{
    my_media.stop();
    my_media.release();
    alert('start over factor = '+factor);
	$("#v1").html('');
	$(".info").show();
    $("span.info").hide();
}
//----------------------------------------file----------------------------------------------

function download(uri,fn)
{
	var fileName = uri.split('/')[uri.split('/').length-1];
	var filePath = 'cdvfile://localhost/persistent/'+mainDirectory+'/'+fileName;
	fileTransfer.download(
	    uri,
	    filePath,
	    function(entry) {
		if(typeof fn == 'function')
			fn(fileName);
	    },
	    function(error) {
		consolelog('Downlod Error :  ' +error);
	    }
	);
	
}
//------------------------------------------------------------------------------------------

