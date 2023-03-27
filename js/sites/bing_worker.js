/* global chrome */

(function () {
  chrome.webRequest.onCompleted.addListener(async function (details) {
    if (details.initiator === undefined || details.initiator.includes('chrome-extension://')) {
      return
    }

    // https://www.bing.com/AS/Suggestions?pt=page.home&mkt=en-us&qry=wolv&cp=4&msbqf=false&cvid=D46DA7EF2FA744CE9E0A06595233AECC

    if (details.url.includes('bing.com/AS/Suggestions')) {
      console.log('[Search Mirror / bing] Autocomplete Request: ' + details.url)

      const searchUrl = new URL(details.url)

      const query = searchUrl.searchParams.get('qry')

      if (query !== null && query !== '') {
        // console.log(details)

        fetch(details.url)
          .then(response => response.text())
          .then(function (data) {
            const payload = {
              engine: 'bing',
              query,
              initiator: details.initiator,
              search_url: details.url
            }

            console.log('DATA')
            console.log(data)
            console.log(payload)

            /*                  if (data.startsWith(')]}\'')) {
                        data = data.substring(4)

                        const dataJson = JSON.parse(data)

                        console.log(dataJson)

                        const dataPayload = []

                        const suggestions = dataJson[0]

                        suggestions.forEach(function(suggestion) {
                            let subtitle = ''

                            if (suggestion.length > 3) {
                                subtitle = suggestion[3].zi
                            }

                            dataPayload.push({
                                term: suggestion[0],
                                subtitle: subtitle,
                                data: suggestion
                            })
                        })

                        console.log('[Search Mirror / bing] Data Payload (Parsed):')
                        console.log(dataPayload)

                        payload.suggestions = dataPayload
                    } else {
                        console.log('[Search Mirror / bing] Data Payload (Raw):')
                        console.log(data)

                        payload['raw_suggestions'] = data
                    }

                    handleMessage({
                      content: 'record_data_point',
                      generator: 'search-suggestions-result',
                      payload: payload // eslint-disable-line object-shorthand
                    }, {
                        tab: {
                            'id': details.tabId
                        }
                    }, function(logResponse) {
                        // console.log('[Search Mirror / bing] Data Point Logged:')
                        // console.log(logResponse)
                    })

*/
          })
      }
    }
  }, {
    urls: ['<all_urls>']
  }, ['responseHeaders', 'extraHeaders'])
})(); // eslint-disable-line semi, no-trailing-spaces
