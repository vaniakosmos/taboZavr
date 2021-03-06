export interface Options {
    theme: Theme,
    search: Search,
    tabs: Tabs,
}

export interface Theme {
    title: string,
    header: string,
    background: Background,
    visibility: Visibility
}

export interface Visibility {
    opacity: number,
    revealOnHover: boolean,
}

export interface Background {
    def: string,
    color: string,
    image: string,
    url: string,
}

export interface Search {
    def: string,
    engines: Engine[],
    labelIsUrl: boolean,
}

export interface Engine {
    name: string,
    url: string,
}

export interface Tabs {
    def: string,
    grid: {
        cols: number,
        rows: number,
    }
    entities: Tab[],
}

export interface Tab {
    name: string,
    src: string,  // top | recent | bookmark:folder[/folder]*
}
