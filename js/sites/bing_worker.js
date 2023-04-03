/* global chrome, handleMessage */

(function () {
  const parseListItem = function (itemString) {
    if (itemString.includes('pp_title')) {
      const ppIndex = itemString.indexOf('pp_title')

      const firstDiv = itemString.indexOf('>', ppIndex + 1)
      const nextDiv = itemString.indexOf('</div>', firstDiv + 1)

      const titleString = itemString.substring(firstDiv + 1, nextDiv)

      const demoteIndex = itemString.indexOf('b_demoteText')

      const firstDemoteDiv = itemString.indexOf('>', demoteIndex + 1)
      const nextDemoteDiv = itemString.indexOf('</span>', firstDemoteDiv + 1)

      const citeString = itemString.substring(firstDemoteDiv + 1, nextDemoteDiv)

      return [titleString, citeString]
    } else if (itemString.includes('sa_tm_text')) {
      const termIndex = itemString.indexOf('sa_tm_text')

      const firstDiv = itemString.indexOf('>', termIndex + 1)
      const nextDiv = itemString.indexOf('</span>', firstDiv + 1)

      const titleString = itemString.substring(firstDiv + 1, nextDiv)

      return [titleString]
    }

    return null
  }

  const parseMatches = function (fullString) {
    const listItems = fullString.split('</li>')

    const matches = []

    for (const listItem of listItems) {
      if (listItem.includes('<li')) {
        const match = parseListItem(listItem)

        if (match !== null) {
          matches.push(match)
        }
      }
    }

    return matches
  }

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
        fetch(details.url)
          .then(response => response.text())
          .then(function (data) {
            const payload = {
              engine: 'bing',
              query,
              initiator: details.initiator,
              search_url: details.url
            }

            const matches = parseMatches(data)

            const dataPayload = []

            for (const match of matches) {
              if (match.length > 1) {
                dataPayload.push({
                  term: match[0],
                  subtitle: match[1]
                })
              } else {
                dataPayload.push({
                  term: match[0]
                })
              }
            }

            payload.suggestions = dataPayload

            payload.raw_suggestions = data

            handleMessage({
              content: 'record_data_point',
              generator: 'search-suggestions-result',
              payload: payload // eslint-disable-line object-shorthand
            }, {
              tab: {
                id: details.tabId
              }
            }, function (logResponse) {
              // console.log('[Search Mirror / bing] Data Point Logged:')
              // console.log(logResponse)
            })
          })
      }
    }
  }, {
    urls: ['<all_urls>']
  }, ['responseHeaders', 'extraHeaders'])
})(); // eslint-disable-line semi, no-trailing-spaces
