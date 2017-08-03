import {Options} from "./types";


let options: Options = {
    theme: {
        title: 'New tab',
        header: 'hello ma dude',
        background: {
            def: 'url',
            color: '#42a4a8',
            image: '',
            url: 'http://i.imgur.com/hNmDF6p.png',
        },
        visibility: {
            opacity: 50,
            revealOnHover: true,
        }
    },
    search: {
        def: 'google',
        engines: [
            {
                name: 'google',
                url: 'http://google.com/search?q=',
            },
            {
                name: 'images',
                url: 'https://www.google.com/images?q=',
            },
            {
                name: 'trakt',
                url: 'http://trakt.tv/search?q=',
            },
            {
                name: 'wiki',
                url: 'https://en.wikipedia.org/w/index.php?search=',
            },
        ],
        labelIsUrl: false,
    },
    tabs: {
        def: 'Fav',
        grid: {
            cols: 5,
            rows: 5,
        },
        entities: [
            {
                name: 'Fav',
                src: 'bookmark:Bookmarks Bar',

            },
            {
                name: 'Top',
                src: 'top',
            },
            {
                name: 'Recent',
                src: 'recent',
            },
        ],
    }
};

export default options;
