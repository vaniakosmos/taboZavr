export class Logger {
    private name: string;

    constructor(name: string) {
        this.name = name.toUpperCase();
    }
    log(...message: any[]): void {
        console.log(this.name + ':', ...message);
    }
    error(...message: any[]): void {
        console.error(this.name + ':', ...message);
    }
}

export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a?: number) {
        [this.r, this.g, this.b] = [r, g, b];
        if (a) this.a = a;
    }
    static isBound(n: number): boolean {
        return n >= 0 && n <= 255;
    }
    valid(): boolean {
        const a = this.a || 0;
        const isBoundA = Color.isBound(a);
        return Color.isBound(this.r) && Color.isBound(this.g) && Color.isBound(this.b) && isBoundA;
    }
    toString(): string {
        // return "rgb(1,1,1)";
        if (this.a)
            return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
        return `rgb(${this.r}, ${this.g}, ${this.b})`
    }
}
