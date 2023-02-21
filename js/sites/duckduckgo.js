/* global chrome, Node */

(function () {
  const searchSite = {
    isPrimarySite: false,
    resultCount: 0,
    linkCache: {}
  }

  searchSite.extractQuery = function (location) {
    const params = new URLSearchParams(location.search)

    return params.get('q')
  }

  searchSite.matchesSearchSite = function (location) {
    if (['duckduckgo.com'].includes(location.host) === false) {
      return false
    }

    if (location.href.includes('/uviewer')) {
      return false
    }

    const searchQuery = this.extractQuery(location)

    if (searchQuery === null || searchQuery === undefined || searchQuery === '') {
      return false
    }

    return true
  }

  searchSite.extractQueryType = function (location) {
    const params = new URLSearchParams(location.search)

    const ia = params.get('ia')

    if (ia === 'images') {
      return 'image'
    }

    if (ia === 'news') {
      return 'news'
    }

    if (ia === 'shopping') {
      return 'shopping'
    }

    return 'web'
  }

  searchSite.searchUrl = function (query, queryType) {
    if (queryType === 'image') {
      return 'https://duckduckgo.com/?iax=images&ia=images&q=' + encodeURIComponent(query)
    }

    if (queryType === 'news') {
      return 'https://duckduckgo.com/&iar=news&ia=news&q=' + encodeURIComponent(query)
    }

    if (queryType === 'shopping') {
      return 'https://duckduckgo.com/?ia=shopping&iax=shopping&q=' + encodeURIComponent(query)
    }

    return 'https://duckduckgo.com/?ia=web&q=' + encodeURIComponent(query)
  }

  searchSite.extractResults = function () {
    const me = searchSite

    const query = searchSite.extractQuery(window.location)
    const queryType = searchSite.extractQueryType(window.location)

    if (queryType === 'web') {
      const results = document.querySelectorAll('article[data-nrn="result"]')

      results.forEach(function (element) {
        const cites = element.querySelectorAll('[data-testid="result-extras-url-link"]')

        const titles = element.querySelectorAll('h2')

        if (titles.length > 0 && cites.length > 0) {
          let title = ''
          let href = null

          titles.forEach(function (titleElement) {
            titleElement.childNodes.forEach(function (childNode) {
              if (childNode.nodeType === Node.ELEMENT_NODE) {
                if (childNode.localName === 'a') {
                  href = childNode.getAttribute('href')

                  childNode.childNodes.forEach(function (grandChildNode) {
                    if (grandChildNode.nodeType === Node.ELEMENT_NODE) {
                      grandChildNode.childNodes.forEach(function (textNode) {
                        if (textNode.nodeType === Node.TEXT_NODE) {
                          title += textNode.nodeValue
                        }
                      })
                    }
                  })
                }
              }
            })
          })

          let citation = ''

          cites.forEach(function (citeElement) {
            citeElement.childNodes.forEach(function (childNode) {
              if (childNode.nodeType === Node.TEXT_NODE) {
                citation += childNode.nodeValue
              } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                childNode.childNodes.forEach(function (grandChildNode) {
                  if (grandChildNode.nodeType === Node.TEXT_NODE) {
                    citation += grandChildNode.nodeValue
                  }
                })
              }
            })
          })

          if (href !== null && me.linkCache[href] === undefined) {
            const content = element.outerHTML

            me.resultCount += 1

            const payload = {
              title,
              citation,
              link: href,
              search_url: window.location.href,
              content,
              query,
              type: queryType,
              foreground: me.isPrimarySite,
              engine: 'duckduckgo',
              index: me.resultCount
            }

            console.log('[Search Mirror / duckduckgo] Got result[' + me.resultCount + ']: ' + title)
            // console.log(payload)

            chrome.runtime.sendMessage({
              content: 'record_data_point',
              generator: 'search-mirror-result',
              payload: payload // eslint-disable-line object-shorthand
            })

            me.linkCache[href] = payload
          }
        }
      })
    }
  }

  window.registerSearchMirrorSite('duckduckgo', searchSite)
})()
