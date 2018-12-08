// deliberate ES3 code style for maximum browsers coverage
function renderDiscs(targetElem) {
    var MAX_VARIATIONS_DISPLAYED = 4;

    var content = _load('wantlist');
    var data = JSON.parse(content).wants;
    var outputData = {};
    var outputDataKeys = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var info = item.basic_information;
        var key = info.master_id || info.id;

        if (!outputData.hasOwnProperty(key)) {
            outputData[key] = {
                titleString: _getTitleString(info),
                info: info,
                variations: []
            };
            outputDataKeys.push(key);

        } else if (info.year && (info.year < outputData[key].info.year)) {
            outputData[key].info = info;
            outputData[key].titleString = _getTitleString(info);
        }

        outputData[key].variations.push(info);
    }

    var outputDataSortedKeys = outputDataKeys.sort(function (keyA, keyB) {
        if (outputData[keyA].titleString > outputData[keyB].titleString) {
            return 1;
        } else if (outputData[keyA].titleString < outputData[keyB].titleString) {
            return -1;
        } else {
            return 0;
        }
    });

    var outputItems = [];
    for (var i = 0; i < outputDataSortedKeys.length; i++) {
        var item = outputData[outputDataSortedKeys[i]];
        var variationsCount = item.variations.length;
        var tooManyVariations = (variationsCount > MAX_VARIATIONS_DISPLAYED);
        outputItems.push(
            '  <b>' + item.titleString.toUpperCase() + '</b>' +
            ' (' + _variationPhrase(variationsCount) + '):'
        );
        for (var j = 0; j < variationsCount; j++) {
            var info = item.variations[j];
            var url = info.resource_url.replace('/api.', '/www.').replace('/releases/', '/release/');
            var salesUrl = url.replace('/release/', '/sell/release/');
            var before = (j === MAX_VARIATIONS_DISPLAYED) ?
                '<span>  <button onclick="moreDiscs(this)">more</button></span><span style="display: none;">' :
                '';
            var after = (tooManyVariations && (j === (variationsCount - 1))) ? '</span>' : '';
            outputItems.push(
                before +
                '- <a href="' + url + '" target="_blank">' + _getTitleString(info) + '</a>' +
                ' <i>' + _getDetailsString(info) + '</i>' +
                ' [<a href="' + salesUrl + '" target="_blank">purchase</a>]' +
                after
            );
        }
        outputItems.push('\n');
    }
    targetElem.innerHTML = outputItems.join('\n');


    function _variationPhrase(number) {
        var isMultiple = number > 1;
        return (isMultiple ? 'any of these' : 'only') + ' ' +
            number + ' variation' + (isMultiple ? 's' : '') + ' wanted';
    }

    function _getTitleString(info) {
        var title = info.title;
        var artists = [];

        for (var i = 0; i < info.artists.length; i++) {
            artists.push(info.artists[i].name.replace(/\s+\(\d+\)$/, ''));
        }
        var titleString = artists.join(', ') + ' — ' + title;

        return titleString;
    }

    function _getDetailsString(info) {
        var detailsString = '';

        var formats = [];
        for (var i = 0; i < info.formats.length; i++) {
            var item = info.formats[i];
            var itemParts = [];
            if (item.descriptions) {
                itemParts.push(item.descriptions.join(', '));
            }
            if (item.name) {
                var qty = item.qty || 1;
                itemParts.push(((qty > 1) ? (qty + 'x') : '') + item.name);
            }
            if (item.text) {
                itemParts.push(item.text);
            }
            formats.push(itemParts.join('; '));
        }
        if (formats.length > 0) {
            detailsString += '[' + formats.join(' / ') + ']';
        }

        if (info.year) {
            detailsString += ' (' + info.year + ')';
        }

        return detailsString;
    }

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

function moreDiscs(elem) {
    var parentElem = elem.parentNode;
    parentElem.style.display = 'none';
    parentElem.nextElementSibling.style.display = '';
}
