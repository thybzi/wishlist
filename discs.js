// deliberate ES3 code style for maximum browsers coverage
function renderDiscs(targetElem) {
    var content = _load('wantlist');
    var data = JSON.parse(content).wants;
    var masters = [];
    var outputItems = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var info = item.basic_information;
        if (typeof info.master_url === 'string') {
            if (!!~masters.indexOf(info.master_url)) {
                continue;
            } else {
                masters.push(info.master_url);
            }
        }
        var title = info.title;
        var year = info.year;
        var artists = [];
        for (var j = 0; j < info.artists.length; j++) {
            artists.push(info.artists[j].name);
        }
        outputItems.push(artists.join(', ') + ' — ' + title + ' (' + year + ')');
    }
    targetElem.innerHTML = outputItems.sort().join('\n');

    function _load(cmd, id) {
        var scriptUrl = 'https://thybzicom.000webhostapp.com/discogs.php';
        var url = scriptUrl + '?cmd=' + encodeURIComponent(cmd);
        if (typeof id === 'number') {
            url += '&id=' + encodeURIComponent(id);
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status === 200) {
            return xhr.responseText;
        } else {
            throw new Error(xhr.status + ': ' + xhr.statusText);
        }
    }
}
