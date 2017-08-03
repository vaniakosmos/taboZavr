# TaboZavr
Customisable Chrome extension for "new tab".


## Usage
Use `dist/` folder as extension root.


## Features

- appearance
    - tab title
    - background
        - color
        - image from file 
        (not recommended because it loads base64 image into html which will slow down the page 
        (but you may try anyway 
        (i love lisp 
        (no))))
        - image from url (image will be cached and available offline after first download)
    - visibility
        - change opacity of search and tab panels
        - option to reveal panels on hover
- search
    - default search engines: google, google-images, trakt, wiki
    - set default search engine
    - change list of search engines (add/remove/rearrange)
    - search on engine label click
- tabs
    - default tabs: favorites, top sites, recently closed tabs
    - set default tab
    - change list of tabs (available sources: bookmarks, top sites, recent tabs)
    - change grid size


## todo

- appearance
    - background
        - option for automatic matching color with chrome theme
        - random image from specified source (flickr?) changed with some period
- search
    - google search suggestions
- tabs
