// deliberate ES3 code style for maximum browsers coverage
function renderDiscs(mainTargetElem, auxTargetElem, noncdTargetElem) {
    var MAX_VARIATIONS_DISPLAYED = 4;

    var collectedCdKeys = [];
    var collectionContent = _load('collection');
    var collectionData = JSON.parse(collectionContent).releases;
    for (var i = 0; i < collectionData.length; i++) {
        var item = collectionData[i];
        var info = item.basic_information;
        if (_isNonCd(info)) {
            continue;
        }
        var key = _getReleaseKey(info);
        if (!~collectedCdKeys.indexOf(key)) {
            collectedCdKeys.push(key);
        }
    }

    var content = _load('wantlist');
    var data = JSON.parse(content).wants;
    if (!data) {
        mainTargetElem.innerHTML = auxTargetElem.innerHTML = noncdTargetElem.innerHTML = 'temporary unavailable';
        return;
    }

    var mainOutputData = {};
    var mainOutputDataKeys = [];
    var auxOutputData = {};
    var auxOutputDataKeys = [];
    var noncdOutputData = {};
    var noncdOutputDataKeys = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var info = item.basic_information;
        var key = _getReleaseKey(info);
        var isNonCd = _isNonCd(info);
        var isPriority = _isPriorityRelease(info);
        var isAux = !isNonCd && (!isPriority || !!~collectedCdKeys.indexOf(key));

        var outputData, outputDataKeys;
        if (isNonCd) {
            outputData = noncdOutputData;
            outputDataKeys = noncdOutputDataKeys;
        } else if (isAux) {
            outputData = auxOutputData;
            outputDataKeys = auxOutputDataKeys;
        } else {
            outputData = mainOutputData;
            outputDataKeys = mainOutputDataKeys
        }

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

    mainTargetElem.innerHTML = _getReleasesMarkup(mainOutputData, mainOutputDataKeys);
    auxTargetElem.innerHTML = _getReleasesMarkup(auxOutputData, auxOutputDataKeys);
    noncdTargetElem.innerHTML = _getReleasesMarkup(noncdOutputData, noncdOutputDataKeys);


    function _getReleasesMarkup(outputData, outputDataKeys) {

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
                ' (' + _variationsPhrase(item) + '):'
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
        return outputItems.join('\n');
    }

    function _getReleaseKey(info) {
        return info.master_id || info.id;
    }

    function _variationsPhrase(item) {
        var firstArtistName = item.info.artists[0].name;
        var variationsCount = item.variations.length;
        var multipleVariations = (variationsCount > 1);
        var tooManyVariations = variationsCount > MAX_VARIATIONS_DISPLAYED;

        switch (true) {
            case (tooManyVariations && /beatles/i.test(firstArtistName)):
                return 'any <u>stereo CD</u> wanted; not Hungary!';
            case (multipleVariations):
                return 'any of these ' + variationsCount + ' variations wanted';
            default:
                return 'only one variation wanted';
        }
    }

    function _getTitleString(info) {
        return _getArtistsString(info) + ' — ' + info.title;
    }

    function _getArtistsString(info) {
        var artists = [];
        for (var i = 0; i < info.artists.length; i++) {
            artists.push(info.artists[i].name.replace(/\s+\(\d+\)$/, ''));
        }
        return artists.join(', ');
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

        var catnos = [];
        for (var i = 0; i < info.labels.length; i++) {
            var item = info.labels[i];
            if (item.catno && (item.catno !== 'none')) {
                catnos.push(item.catno);
            }
        }
        if (catnos.length > 0) {
            detailsString += ' [' + catnos.join(' | ') + ']';
        }

        if (info.year) {
            detailsString += ' (' + info.year + ')';
        }

        return detailsString;
    }

    function _isNonCd(info) {
        var hasCdFormat = false;
        for (var i = 0; i < info.formats.length; i++) {
            var item = info.formats[i];
            if ((item.name === 'CD') || (item.name === 'CDr')) {
                hasCdFormat = true;
                break;
            }
        }
        return !hasCdFormat;
    }

    function _isPriorityRelease(info) {
        var priorityArtists = [
            '1/2 Orchestra',
            'Artrosis',
            'Autumn',
            'Beseech',
            'Elf',
            'Europe',
            'Evoke Thy Lords',
            'Forces United',
            'Fort Royal',
            'J:Морс',
            'Lake of Tears',
            'Lullacry',
            'Margenta',
            'Offroad',
            'Pharaoh',
            'Rainbow',
            'Shape of Despair',
            'Silentium',
            'Stream of Passion',
            'Sunterra',
            'Symphomania',
            'Tad Morose',
            'The Equinox ov the Gods',
            'The Gathering',
            'Zodiac',
            'Август',
            'Агата Кристи',
            'Андрей Макаревич',
            'Артерия|Терентьев|Glossy Teria',
            'Буланова',
            'Бутусов|Nautilus Pompilius',
            'Вадим Самойлов',
            'Декабрь',
            'Земфира',
            'Калевала',
            'Крупнов|Крупский',
            'Легион|Булгаков',
            'Маврик|Маврин',
            'Мара',
            'Ночные Снайперы',
            'Холодне Сонце',
            'Чёрный Кофе',
            'Чиж',
        ];
        var artistsString = _getArtistsString(info);
        for (var i = 0; i < priorityArtists.length; i++) {
            if ((new RegExp(priorityArtists[i], 'i')).test(artistsString)) {
                return true;
            }
        }
        return false;
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
