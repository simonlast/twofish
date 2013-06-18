

exports.randomString = function(len){
	var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

exports.uniqueRandomString = function(len, obj){
	var str;
	while(obj[str = exports.randomString(20)]);
	return str;
}