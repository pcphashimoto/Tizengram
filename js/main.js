//Initialize function
var init = function() {
	console.log("init() called");

	// add eventListener for tizenhwkey
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName == "back")
			tizen.application.getCurrentApplication().exit();
	});

	var onerrorcommon = function(err) {
		console.log("error!")
		console.log(err)
		alert(err)
	}
	
	var myTransitionOpts = {
		transition: "slidefade"
	}

	/**
	 * Step2. Cpature Camera
	 */
	$("#startCamera").click(function(e) {
		console.log("click startCamera");
		$('#inputCamera').click()
	});

	function onCaptureCamera(e) {
		console.log("camera changed");
		var f = e.target.files[0];
		console.log(f);
		var reader = new FileReader();
		reader.onload = onReadImage
		reader.onerror = onerrorcommon;
		if (f.type.match('image.*')) {
			reader.readAsDataURL(f);
		}
	}
	$("#inputCamera").change(onCaptureCamera);

	
	
	/**
	 * Step3. Draw Canvas
	 */
	function onReadImage(evt) {
		console.log("onReadImage");
		$.mobile.showPageLoadingMsg()
		
		var orientation = utils.getOrientation(evt.target.result) || 1;
		console.log(orientation)
		
		var img = $("<img>").attr("src", evt.target.result);
		img[0].onload = function() {
			var w = img[0].naturalWidth;
			var h = img[0].naturalHeight;

			var width = 400;
			var height = 400;
			var canvas = $("<canvas>").attr("width", width).attr("height", height)
			var context = canvas[0].getContext('2d');
			context.save();
	
			switch (orientation) {
			case 3:
				// 180 rotate left
				context.translate(width, height);
				context.rotate(Math.PI);
				break;
			case 6:
				// 90 rotate right
				context.rotate(0.5 * Math.PI);
				context.translate(0, -height);
				break;
			case 8:
				// 90 rotate left
				context.rotate(-0.5 * Math.PI);
				context.translate(-width, 0);
				break;
			default:
			}

			if (w > h) {
				context.drawImage(img[0], (w - h) / 2, 0, h, h, 0, 0, width,
						height)
			} else {
				context.drawImage(img[0], 0, (h - w) / 2, w, w, 0, 0, width,
						height)
			}
			context.restore();
			context.font = "32px 'Joti One'";
			context.fillStyle = "#0070c0";
			context.fillText("#TizenDevLabTokyo", 30, height - 30);
			context.strokeStyle = "#333333";
			context.strokeText("#TizenDevLabTokyo", 30, height - 30);

			var inputImg = $("#inputImg").attr("src", canvas[0].toDataURL());
			var option = {
				mime : "image/png",
				onStart : function() {
					console.log("onStart");
					$.mobile.showPageLoadingMsg()
				},
				onStop : function() {
					console.log("onStop");
					$.mobile.hidePageLoadingMsg()
				},
				onError : function() {
					$.mobile.hidePageLoadingMsg()
					alert('ERROR');
				}
			}
			inputImg.vintage(option).data('vintageJS').apply()
			
			$.mobile.hidePageLoadingMsg()
			$.mobile.changePage("#two",myTransitionOpts)
		}
	}

	
	
	/**
	 * Step4. Effect
	 */
	$("#filters button").click(function(e) {
		e.preventDefault();
		var effect = $(this).data("preset");
		var vjsAPI = $("#inputImg").data("vintageJS");

		if (vintagePresets[effect]) {
			vjsAPI.vintage(vintagePresets[effect]);
		} else {
			vjsAPI.reset();
		}
	})

	
	
	/**
	 * Step5. Save
	 */
	$("#save").click(
			function() {
				$.mobile.showPageLoadingMsg()
				var imageData = $("#inputImg").attr("src");
				save(imageData.replace(/^data:image\/(png|jpg);base64,/, ""),
						function(f) {
							$("#okimage").attr("src", f.toURI());
							$.mobile.hidePageLoadingMsg()
							alert("Save Image Succeed!")
							console.log(f)
							$.mobile.changePage("#three", myTransitionOpts)
						}, function() {
							$("#okimage").attr("src",
									$("#inputImg").attr("src"));
							$.mobile.hidePageLoadingMsg()
							$.mobile.changePage("#three", myTransitionOpts)
						});
			});
	function save(content, successCallback, errorCallback) {
		var name = "tizengram" + new Date().getTime() + ".png";

		tizen.filesystem.resolve("images", function(dir) {
			var file = dir.createFile(name);
			file && file.openStream("w", function(fs) {
				try {
					fs.writeBase64(content);
					fs.close();
					console.log(file);
					console.log("saved");
					 tizen.content.scanFile(file.toURI(), function(){
						 console.log("scan success")
					 }, function(err){
						 console.log("scan error")
						 console.log(err)
					 });
					successCallback && successCallback(file);
				} catch (ex) {
					console.log(ex)
					console.log(content);
					errorCallback && errorCallback()
				}
			}, errorCallback);
		}, errorCallback, "rw");
	}
	;

	/**
	 * Step6. Share
	 */
	$("#shareButton").click(
			function() {
				console.log("click share")
				$.mobile.showPageLoadingMsg()
				var imageData = $("#okimage").attr("src");
				share(imageData.replace(/^data:image\/(png|jpg);base64,/, ""),
						function() {
							alert("Post Succeed!")
							$.mobile.changePage("#one", {
								transition: myTransitionOpts.transition,
								reverse : true
							})
							$.mobile.hidePageLoadingMsg()
						}, function(err) {
							alert("Post Failed!")
							$.mobile.hidePageLoadingMsg()
						});
			})
	function share(image, successCallback, errorCallback) {
		console.log("start share")
		utils.oauthFunc(function(oauth) {
			console.log("callback")
			var data = {
				status : ($("#status").val() || "Hello Tizen !") + "  #TizenDevLabTokyo",
				"media[]" : utils.dataURItoBlob($("#inputImg").attr(
						"src"))
			}
			oauth.post(
				"https://api.twitter.com/1.1/statuses/update_with_media.json",
				data, function(data) {
					console.log(JSON.stringify(data))
					successCallback
							&& successCallback(data)
				}, function(err) {
					console.log(err)
					oauth.setAccessToken([ "", "" ])
					errorCallback && errorCallback(err)
				})
		})
	}

	/**
	 * omake
	 */

	var oneContet = $("#one div[data-role=content]")	
	$("#one").on("pageshow", function() {
		var setBgImages = function(list){
			if(list.length<1){
				return;
			}else if(list.length==1){
				list.push(list[0]);
			}
			list = list.slice(0,5)
			console.log("bgSwitcher start")	
			var option = {
					images: list,
					easing: "swing"
			}
			var instance = oneContet.data('bgSwitcher');			
			if(!instance){
				console.log("bgSwitcher make")	
				oneContet.bgSwitcher(option)
			}else{
				console.log("bgSwitcher reset")	
				instance.setOptions(option)
				instance.reset();
			}
		}	
		var imgList = []
		tizen.filesystem.resolve("images", function(dir) {
			dir.listFiles(function(files){
				for(var i in files){
					var f = files[i];
					if(f.name.match(/^tizengram/)){
						imgList.unshift(f.toURI());
					}
				}
				setBgImages(imgList)
			})
		});
		
	})
	$("#one").on("pagebeforehide", function() {
		console.log("bgSwitcher stop")
		var instance = oneContet.data('bgSwitcher');
		instance && instance.stop();
	})
};
$(document).ready(init);