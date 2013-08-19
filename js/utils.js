var utils = {
	/**
	 * get orientation data from image exif
	 * @param imgDataURL
	 * @returns
	 * refer from http://www.egashira.jp/2013/03/obtain-orientation-from-jpeg-exif
	 */
	getOrientation : function(imgDataURL) {
		var byteString = atob(imgDataURL.split(',')[1]);
		var orientaion = byteStringToOrientation(byteString);
		return orientaion;

		function byteStringToOrientation(img) {
			var head = 0;
			var orientation;
			while (1) {
				if (img.charCodeAt(head) == 255
						& img.charCodeAt(head + 1) == 218) {
					break;
				}
				if (img.charCodeAt(head) == 255
						& img.charCodeAt(head + 1) == 216) {
					head += 2;
				} else {
					var length = img.charCodeAt(head + 2) * 256
							+ img.charCodeAt(head + 3);
					var endPoint = head + length + 2;
					if (img.charCodeAt(head) == 255
							& img.charCodeAt(head + 1) == 225) {
						var segment = img.slice(head, endPoint);
						var bigEndian = segment.charCodeAt(10) == 77;
						if (bigEndian) {
							var count = segment.charCodeAt(18) * 256
									+ segment.charCodeAt(19);
						} else {
							var count = segment.charCodeAt(18)
									+ segment.charCodeAt(19) * 256;
						}
						for (i = 0; i < count; i++) {
							var field = segment.slice(20 + 12 * i, 32 + 12 * i);
							if ((bigEndian && field.charCodeAt(1) == 18)
									|| (!bigEndian && field.charCodeAt(0) == 18)) {
								orientation = bigEndian ? field.charCodeAt(9)
										: field.charCodeAt(8);
							}
						}
						break;
					}
					head = endPoint;
				}
				if (head > img.length) {
					break;
				}
			}
			return orientation;
		}
	},
	
	
	/**
	 * convert dataURI into Blob
	 * @param dataURI
	 * @returns {Blob}
	 * refer from http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
	 */
	dataURItoBlob : function(dataURI) {
		var binary = atob(dataURI.split(',')[1]);
		var array = [];
		for ( var i = 0; i < binary.length; i++) {
			array.push(binary.charCodeAt(i));
		}
		return new Blob([ new Uint8Array(array) ], {
			type : 'image/jpeg'
		});
	},
	
	
	/**
	 * util for jsOAuth
	 * @author s_hashimoto@pcp.co.jp
	 * @XXX: not quaranteed to work
	 */
	oauthFunc : (function(){
		var oauth;
		var options = {
				consumerKey : 'kr5OXDugCPy8TMjhBt2Khg',
				consumerSecret : 'iBgHljZo709upVOxcTBdwPStzRnGu4nscCGaEMELlBI',
	            requestTokenUrl: "https://api.twitter.com/oauth/request_token",
	            authorizationUrl: "https://api.twitter.com/oauth/authorize",
	            accessTokenUrl: "https://api.twitter.com/oauth/access_token"
			};
		var accessDataStr = localStorage.getItem("accessData")
		if(accessDataStr){
			var accessData = JSON.parse(accessDataStr);
			options.accessTokenKey = accessData.accessTokenKey;
			options.accessTokenSecret = accessData.accessTokenSecret;
			$.getScript("js/jsOAuth.js", function() {
				oauth = OAuth(options);
			})
		}
		return function(successCallback, errorCallback){
			var onerror = function(err){
				console.log(err)
				errorCallback && errorCallback(err)
			}
			if(oauth && oauth.getAccessTokenKey()){
				successCallback && successCallback(oauth);
				return;
			}
			$.getScript("js/jsOAuth.js", function() {
				oauth = OAuth(options);
				oauth.fetchRequestToken(function(url) {
					if(tizen.ApplicationControl){
						var appControl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/view", url);
						tizen.application.launchAppControl(appControl)
					}else{
						window.open(url)
					}
					var pin = window.prompt("Please enter your PIN", "");					
					oauth.setVerifier(pin);
					oauth.fetchAccessToken(function(e){
						console.log(e)
						var accessData = {
							accessTokenKey:oauth.getAccessTokenKey(),
							accessTokenSecret:oauth.getAccessTokenSecret()
						}
						localStorage.setItem("accessData", JSON.stringify(accessData)); 
						successCallback && successCallback(oauth)
					}, onerror);
				}, onerror)
			})			
		}		
	})()
}
